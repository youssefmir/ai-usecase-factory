import { describe, expect, it } from 'vitest';
import type { AiActReponses } from '../model';
import { daterJalon, JALONS, joursEntre, trouverJalon } from './calendar';
import { qualifierAiAct, reponsesAiActVides, type NiveauAiAct } from './qualification';

const REFERENCE = '2026-11-01';

/** Système d'IA sans enjeu particulier : base à laquelle chaque test ajoute ses spécificités. */
function base(partiel: Partial<AiActReponses> = {}): AiActReponses {
  return {
    ...reponsesAiActVides(),
    inference: 'oui',
    autonomie: 'oui',
    exclusion: 'aucune',
    role: 'deployeur',
    pratiquesVerifiees: true,
    annexeI: 'non',
    annexeIII: 'aucun',
    gpai: 'aucun',
    organismePublic: 'non',
    ...partiel,
  };
}

const transparence = (t: Partial<AiActReponses['transparence']>) => ({ ...reponsesAiActVides().transparence, ...t });

describe('qualifierAiAct : cas limites', () => {
  const cas: { nom: string; reponses: AiActReponses; niveau: NiveauAiAct; fria?: boolean; echeance?: string }[] = [
    { nom: 'système sans enjeu', reponses: base(), niveau: 'minimal', echeance: '2025-02-02' },
    { nom: 'règles métier sans inférence', reponses: base({ inference: 'non' }), niveau: 'hors_champ' },
    { nom: 'exclusion défense (art. 2)', reponses: { ...reponsesAiActVides(), exclusion: 'defense' }, niveau: 'hors_champ' },
    {
      nom: 'notation sociale',
      reponses: base({ pratiquesInterdites: ['notation_sociale'] }),
      niveau: 'interdit',
      echeance: '2025-02-02',
    },
    {
      nom: 'nudification (interdiction ajoutée par l’omnibus)',
      reponses: base({ pratiquesInterdites: ['nudification'] }),
      niveau: 'interdit',
      echeance: '2026-12-02',
    },
    {
      nom: 'score de solvabilité avec profilage (5 b)',
      reponses: base({ annexeIII: '5b', profilage: 'oui' }),
      niveau: 'haut_risque',
      fria: true,
      echeance: '2027-12-02',
    },
    {
      nom: 'détection de fraude financière (exclue du 5 b)',
      reponses: base({ annexeIII: '5b_fraude', profilage: 'oui' }),
      niveau: 'minimal',
    },
    {
      nom: 'dérogation 6(3)(a) sans profilage',
      reponses: base({ role: 'fournisseur_deployeur', annexeIII: '5b', profilage: 'non', derogation: 'a' }),
      niveau: 'minimal',
      fria: false,
      echeance: '2027-12-02',
    },
    {
      nom: 'dérogation 6(3)(d) avec profilage',
      reponses: base({ annexeIII: '5b', profilage: 'oui', derogation: 'd' }),
      niveau: 'haut_risque',
      fria: true,
    },
    {
      nom: 'annexe III sans dérogation possible',
      reponses: base({ annexeIII: '4a', profilage: 'non', derogation: 'aucune' }),
      niveau: 'haut_risque',
      fria: false,
    },
    {
      nom: 'aide sociale par une autorité publique (5 a)',
      reponses: base({ annexeIII: '5a', profilage: 'oui', organismePublic: 'oui' }),
      niveau: 'haut_risque',
      fria: true,
    },
    {
      nom: 'infrastructure critique (point 2, exclu de la FRIA)',
      reponses: base({ annexeIII: '2', profilage: 'non', derogation: 'aucune', organismePublic: 'oui' }),
      niveau: 'haut_risque',
      fria: false,
    },
    {
      nom: 'composant de sécurité d’un produit (annexe I)',
      reponses: base({ annexeI: 'oui' }),
      niveau: 'haut_risque',
      echeance: '2028-08-02',
    },
    {
      nom: 'chatbot client (art. 50(1))',
      reponses: base({ transparence: transparence({ interactionDirecte: true }), gpai: 'integre_modele_tiers' }),
      niveau: 'transparence',
      echeance: '2026-08-02',
    },
    { nom: 'questionnaire vide', reponses: reponsesAiActVides(), niveau: 'incomplet' },
  ];

  it.each(cas)('$nom -> $niveau', ({ reponses, niveau, fria, echeance }) => {
    const r = qualifierAiAct(reponses, REFERENCE);
    expect(r.niveau).toBe(niveau);
    expect(r.mention).toBe('Aide à la qualification, ne constitue pas un avis juridique.');
    if (fria !== undefined) expect(r.fria).toBe(fria);
    if (echeance) expect(r.echeanceCle?.date).toBe(echeance);
    expect(r.justification.length).toBeGreaterThan(0);
  });
});

describe('qualifierAiAct : justification et obligations', () => {
  it('écarte explicitement la dérogation 6(3) en cas de profilage', () => {
    const r = qualifierAiAct(base({ annexeIII: '5b', profilage: 'oui', derogation: 'd' }), REFERENCE);
    expect(r.derogationAppliquee).toBeNull();
    expect(r.justification.join(' ')).toMatch(/profilage/);
    expect(r.justification.join(' ')).toMatch(/art\. 6\(3\)\(d\).*ne peut pas s'appliquer/);
    expect(r.articles.map((a) => a.ref)).toEqual(expect.arrayContaining(['art. 6(2)', 'art. 6(3)', 'art. 27', 'annexe III']));
  });

  it('impose documentation et enregistrement au fournisseur qui invoque la dérogation', () => {
    const r = qualifierAiAct(base({ role: 'fournisseur_deployeur', annexeIII: '5b', profilage: 'non', derogation: 'a' }), REFERENCE);
    expect(r.derogationAppliquee).toBe('a');
    const ids = r.obligations.map((o) => o.id);
    expect(ids).toEqual(expect.arrayContaining(['documenter_6_4', 'enregistrer_6_3', 'maitrise_ia']));
    expect(r.obligations.find((o) => o.id === 'documenter_6_4')?.vousConcerne).toBe(true);
  });

  it('distingue fraude et solvabilité : l’exception est assortie d’un avertissement', () => {
    const fraude = qualifierAiAct(base({ annexeIII: '5b_fraude' }), REFERENCE);
    const solvabilite = qualifierAiAct(base({ annexeIII: '5b', profilage: 'oui' }), REFERENCE);
    expect(fraude.niveau).toBe('minimal');
    expect(fraude.avertissements.join(' ')).toMatch(/redevient à haut risque/);
    expect(solvabilite.niveau).toBe('haut_risque');
  });

  it('attribue les obligations au bon acteur selon le rôle déclaré', () => {
    const deployeur = qualifierAiAct(base({ annexeIII: '5b', profilage: 'oui' }), REFERENCE);
    expect(deployeur.obligations.find((o) => o.id === 'hr_documentation')?.vousConcerne).toBe(false);
    expect(deployeur.obligations.find((o) => o.id === 'dep_fria')?.vousConcerne).toBe(true);

    const devient = qualifierAiAct(base({ annexeIII: '5b', profilage: 'oui', modificationSubstantielle: 'oui' }), REFERENCE);
    expect(devient.obligations.find((o) => o.id === 'hr_documentation')?.vousConcerne).toBe(true);
    expect(devient.articles.map((a) => a.ref)).toContain('art. 25');
  });

  it('ajoute l’information des représentants du personnel pour l’emploi (art. 26(7))', () => {
    const r = qualifierAiAct(base({ annexeIII: '4b', profilage: 'non', derogation: 'aucune' }), REFERENCE);
    expect(r.obligations.map((o) => o.id)).toContain('dep_representants');
  });

  it('prévoit l’enregistrement de l’utilisation par une autorité publique et le jalon 2030', () => {
    const r = qualifierAiAct(base({ annexeIII: '5a', profilage: 'oui', organismePublic: 'oui' }), REFERENCE);
    expect(r.obligations.map((o) => o.id)).toContain('dep_enregistrement_public');
    expect(r.calendrier.map((j) => j.id)).toContain('autorites_publiques');
  });

  it('cumule haut risque et transparence pour un assistant génératif à haut risque', () => {
    const r = qualifierAiAct(
      base({
        role: 'fournisseur_deployeur',
        annexeIII: '5b',
        profilage: 'oui',
        transparence: transparence({ contenuSynthetique: true }),
        gpai: 'integre_modele_tiers',
      }),
      REFERENCE,
    );
    expect(r.niveau).toBe('haut_risque');
    expect(r.transparence).toBe(true);
    expect(r.obligations.map((o) => o.id)).toEqual(expect.arrayContaining(['transparence_marquage', 'gpai_aval']));
    expect(r.calendrier.map((j) => j.id)).toEqual(expect.arrayContaining(['marquage_transitoire', 'haut_risque_annexe_III']));
  });

  it('liste les obligations du fournisseur de modèle à risque systémique', () => {
    const r = qualifierAiAct(base({ gpai: 'fournit_modele_systemique' }), REFERENCE);
    expect(r.obligations.filter((o) => o.acteur === 'fournisseur_modele').map((o) => o.id)).toEqual(['gpai_fournisseur', 'gpai_systemique']);
    expect(r.calendrier.map((j) => j.id)).toEqual(expect.arrayContaining(['gpai', 'gpai_existants']));
  });

  it('traite le profilage incertain par prudence comme un profilage', () => {
    const r = qualifierAiAct(base({ annexeIII: '5b', profilage: 'nsp', derogation: 'a' }), REFERENCE);
    expect(r.niveau).toBe('haut_risque');
    expect(r.avertissements.join(' ')).toMatch(/par prudence/);
  });

  it('donne un niveau provisoire et la liste des questions manquantes', () => {
    const r = qualifierAiAct({ ...reponsesAiActVides(), inference: 'oui', autonomie: 'oui', annexeIII: '5b', profilage: 'oui' }, REFERENCE);
    expect(r.niveau).toBe('incomplet');
    expect(r.niveauProvisoire).toBe('haut_risque');
    expect(r.manquants.length).toBeGreaterThanOrEqual(4);
  });

  it('ne produit ni calendrier ni obligation hors champ', () => {
    const r = qualifierAiAct(base({ autonomie: 'non' }), REFERENCE);
    expect(r.calendrier).toEqual([]);
    expect(r.obligations).toEqual([]);
  });
});

describe('calendrier AI Act (à jour au 1er novembre 2026)', () => {
  it('contient les dates clés du règlement et de l’omnibus', () => {
    const dates = Object.fromEntries(JALONS.map((j) => [j.id, j.date]));
    expect(dates).toMatchObject({
      entree_vigueur: '2024-08-01',
      interdictions: '2025-02-02',
      gpai: '2025-08-02',
      omnibus: '2026-07-27',
      application_generale: '2026-08-02',
      interdictions_omnibus: '2026-12-02',
      haut_risque_annexe_III: '2027-12-02',
      haut_risque_annexe_I: '2028-08-02',
    });
  });

  it('calcule le statut et le délai restant par rapport à la date de référence', () => {
    expect(joursEntre('2026-11-01', '2027-12-02')).toBe(396);
    expect(daterJalon(trouverJalon('application_generale'), REFERENCE).statut).toBe('en_vigueur');
    const annexe3 = daterJalon(trouverJalon('haut_risque_annexe_III'), REFERENCE);
    expect(annexe3.statut).toBe('a_venir');
    expect(annexe3.joursRestants).toBe(396);
  });
});
