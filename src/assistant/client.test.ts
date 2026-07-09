import { describe, expect, it, vi } from 'vitest';
import { brouillonVersCas, extraireJson } from './brouillon';
import { analyserContenu, construireRequete, CONFIGS_PAR_DEFAUT, genererBrouillon, type ConfigLlm } from './client';

const config: ConfigLlm = { ...CONFIGS_PAR_DEFAUT.mistral, cle: 'cle-de-test' };

const brouillonValide = {
  titre: 'Lecture automatique des bons de déchets',
  resume: 'Extraire les informations des bons photographiés.',
  probleme: 'Ressaisie manuelle des bons.',
  processus: 'Gestion des déchets de chantier',
  objectifs: 'Registre à jour',
  typologie: 'extraction_documentaire',
  descriptionSolution: 'OCR et extraction',
  personas: [{ nom: 'Responsable QSE', role: 'Contrôle', besoin: 'Registre fiable' }],
  irritants: ['Bons illisibles'],
  sourcesDonnees: [{ nom: 'Photos des bons', description: '', personnelles: false }],
  systemes: ['Tableur'],
  kpis: [{ nom: 'Bons complets', unite: '%', baseline: null, cible: '90' }],
  partiesPrenantes: [{ nom: 'Direction des travaux', attentes: '' }],
  risques: [{ description: 'Mauvaise lecture du tonnage', mitigation: 'Validation humaine' }],
  volumeAnnuel: 1800,
  tempsUnitaireMin: 10,
  questionsOuvertes: ['Taux actuel de bons complets ?'],
};

function reponseChat(contenu: string, statut = 200): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content: contenu } }] }), { status: statut, headers: { 'Content-Type': 'application/json' } });
}

describe('assistant de saisie (réponses simulées)', () => {
  it('construit une requête de complétion au format chat avec mode JSON et clé', () => {
    const { url, init } = construireRequete('notes', config);
    expect(url).toBe('https://api.mistral.ai/v1/chat/completions');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer cle-de-test');
    const corps = JSON.parse(String(init.body));
    expect(corps.model).toBe('mistral-small-latest');
    expect(corps.response_format).toEqual({ type: 'json_object' });
    expect(corps.messages[0].role).toBe('system');
    expect(corps.messages[1].content).toContain('notes');
  });

  it('n’envoie pas d’en-tête d’autorisation sans clé (ex. Ollama local)', () => {
    const { url, init } = construireRequete('notes', { ...CONFIGS_PAR_DEFAUT.openai_compatible, cle: '' });
    expect(url).toBe('http://localhost:11434/v1/chat/completions');
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('valide un brouillon renvoyé dans un bloc de code Markdown', async () => {
    const fetchSimule = vi.fn().mockResolvedValue(reponseChat('Voici la fiche :\n```json\n' + JSON.stringify(brouillonValide) + '\n```'));
    const r = await genererBrouillon('Atelier du 14 octobre…', config, { fetch: fetchSimule });
    expect(fetchSimule).toHaveBeenCalledOnce();
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.brouillon.kpis[0]?.cible).toBe(90);
      expect(r.brouillon.typologie).toBe('extraction_documentaire');
    }
  });

  it('refuse une réponse hors schéma (typologie inconnue, titre manquant)', () => {
    const r = analyserContenu(JSON.stringify({ ...brouillonValide, titre: '', typologie: 'magie' }));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.erreurs[0]).toMatch(/format attendu/);
      expect(r.erreurs.join(' ')).toMatch(/titre/);
      expect(r.erreurs.join(' ')).toMatch(/typologie/);
    }
  });

  it('refuse un texte sans JSON', () => {
    const r = analyserContenu('Je ne peux pas répondre.');
    expect(r.ok).toBe(false);
  });

  it.each([
    [401, /Clé d’API refusée/],
    [404, /introuvable/],
    [429, /Quota/],
    [503, /erreur/],
  ])('traduit le statut HTTP %i en message clair', async (statut, attendu) => {
    const fetchSimule = vi.fn().mockResolvedValue(new Response('{}', { status: statut }));
    const r = await genererBrouillon('notes', config, { fetch: fetchSimule });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erreurs[0]).toMatch(attendu);
  });

  it('explique un échec réseau (CORS, hors ligne)', async () => {
    const fetchSimule = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    const r = await genererBrouillon('notes', config, { fetch: fetchSimule });
    expect(!r.ok && r.erreurs[0]).toMatch(/CORS/);
  });

  it('exige une clé pour Mistral et des notes non vides', async () => {
    const fetchSimule = vi.fn();
    expect((await genererBrouillon('notes', { ...config, cle: '' }, { fetch: fetchSimule })).ok).toBe(false);
    expect((await genererBrouillon('   ', config, { fetch: fetchSimule })).ok).toBe(false);
    expect(fetchSimule).not.toHaveBeenCalled();
  });

  it('convertit le brouillon en cas d’usage avec des identifiants neufs', () => {
    const r = analyserContenu(JSON.stringify(brouillonValide));
    if (!r.ok) throw new Error('brouillon invalide');
    const cas = brouillonVersCas(r.brouillon);
    expect(cas.titre).toBe('Lecture automatique des bons de déchets');
    expect(cas.statut).toBe('idee');
    expect(cas.personas?.[0]?.id).toMatch(/^persona-/);
    expect(cas.businessCase?.volumeAnnuel).toBe(1800);
    expect(cas.roadmap?.commentaire).toMatch(/Questions ouvertes/);
  });

  it('extrait le JSON entouré de texte', () => {
    expect(extraireJson('Réponse : {"a": 1} merci')).toEqual({ a: 1 });
  });
});
