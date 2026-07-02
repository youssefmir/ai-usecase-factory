import { describe, expect, it } from 'vitest';
import { portefeuillesDemo } from '../data/demo';
import { analyserImport, exporterPortefeuilles, nomFichierExport, slug } from './io';

describe('import / export JSON', () => {
  const demo = portefeuillesDemo();

  it('réimporte à l’identique un export de l’application', () => {
    const json = exporterPortefeuilles(demo, new Date('2026-11-01T10:00:00Z'));
    const r = analyserImport(json);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.portefeuilles).toEqual(demo);
  });

  it('accepte un portefeuille seul ou une liste', () => {
    const seul = analyserImport(JSON.stringify(demo[0]));
    const liste = analyserImport(JSON.stringify(demo.slice(1)));
    expect(seul.ok && seul.portefeuilles.length).toBe(1);
    expect(liste.ok && liste.portefeuilles.length).toBe(2);
  });

  it('complète les champs absents avec les valeurs par défaut', () => {
    const r = analyserImport(JSON.stringify({ id: 'p1', nom: 'Nouveau', cas: [{ id: 'c1', titre: 'Idée' }] }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.portefeuilles[0]?.cas[0]?.businessCase.tauxActualisation).toBe(0.08);
  });

  it('refuse un JSON illisible, un format inconnu ou des valeurs invalides, avec des erreurs en français', () => {
    const illisible = analyserImport('{ pas du json');
    expect(illisible.ok).toBe(false);
    if (!illisible.ok) expect(illisible.erreurs[0]).toMatch(/^Fichier JSON illisible/);

    const format = analyserImport(JSON.stringify({ format: 'autre', version: 1 }));
    expect(!format.ok && format.erreurs[0]).toMatch(/Format inconnu/);

    const invalide = analyserImport(JSON.stringify({ id: 'p1', nom: 'X', cas: [{ id: 'c1', titre: 'Y', scores: { urgence: 9 } }] }));
    expect(invalide.ok).toBe(false);
    if (!invalide.ok) expect(invalide.erreurs[0]).toBe('cas[0].scores.urgence : Trop grand : nombre doit être <=5');
  });

  it('produit des noms de fichiers sûrs', () => {
    expect(slug('Ville de Port-Aurèle')).toBe('ville-de-port-aurele');
    expect(nomFichierExport('Banque Lumen', 'json', new Date('2026-11-01T10:00:00Z'))).toBe('banque-lumen-2026-11-01.json');
  });
});
