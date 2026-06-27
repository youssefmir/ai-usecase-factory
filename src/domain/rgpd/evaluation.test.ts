import { describe, expect, it } from 'vitest';
import { RgpdReponsesSchema, type RgpdReponses } from '../model';
import { evaluerRgpd, suggererCriteres } from './evaluation';

function reponses(partiel: Partial<RgpdReponses> = {}): RgpdReponses {
  return {
    ...RgpdReponsesSchema.parse({}),
    donneesPersonnelles: 'oui',
    donneesSensibles: 'non',
    decisionAutomatisee: 'non',
    baseLegale: 'interet_legitime',
    ...partiel,
  };
}

describe('evaluerRgpd', () => {
  it('demande de compléter tant que la présence de données personnelles est inconnue', () => {
    const r = evaluerRgpd(RgpdReponsesSchema.parse({}));
    expect(r.niveau).toBe('incomplet');
    expect(r.manquants).toHaveLength(1);
  });

  it('conclut à la non-application sans données personnelles', () => {
    const r = evaluerRgpd(reponses({ donneesPersonnelles: 'non' }));
    expect(r.niveau).toBe('non_applicable');
    expect(r.applicable).toBe(false);
  });

  it.each([
    [[], 'aipd_non_requise'],
    [['grande_echelle'], 'aipd_a_documenter'],
    [['grande_echelle', 'usage_innovant'], 'aipd_requise'],
    [['evaluation', 'croisement', 'exclusion_droit'], 'aipd_requise'],
  ] as const)('critères %j -> %s (seuil de 2 critères WP248)', (criteres, niveau) => {
    const r = evaluerRgpd(reponses({ criteres: [...criteres] }));
    expect(r.niveau).toBe(niveau);
    expect(r.nbCriteres).toBe(criteres.length);
  });

  it('impose l’AIPD si le traitement figure sur la liste CNIL, même sans critère coché', () => {
    const r = evaluerRgpd(reponses({ listeCnil: true }));
    expect(r.niveau).toBe('aipd_requise');
    expect(r.justification.join(' ')).toMatch(/liste CNIL/);
  });

  it('signale les données sensibles de l’art. 9 et les catégories concernées', () => {
    const r = evaluerRgpd(reponses({ donneesSensibles: 'oui', categoriesSensibles: ['sante'] }));
    expect(r.article9).toBe(true);
    expect(r.justification.join(' ')).toMatch(/données concernant la santé/);
    expect(r.articles.map((a) => a.ref)).toContain('art. 9');
  });

  it('applique l’art. 22 à une décision exclusivement automatisée à effet juridique', () => {
    const r = evaluerRgpd(reponses({ decisionAutomatisee: 'oui', effetJuridique: 'oui', donneesSensibles: 'oui' }));
    expect(r.article22).toBe('applicable');
    expect(r.justification.join(' ')).toMatch(/art\. 22\(4\)/);
  });

  it('écarte l’art. 22 sans effet juridique ou significatif', () => {
    expect(evaluerRgpd(reponses({ decisionAutomatisee: 'oui', effetJuridique: 'non' })).article22).toBe('non');
  });

  it('met en vigilance un score déterminant malgré une validation humaine (CJUE SCHUFA)', () => {
    const r = evaluerRgpd(reponses({ scoreDeterminant: true }));
    expect(r.article22).toBe('vigilance');
    expect(r.pointsVigilance.join(' ')).toMatch(/C-634\/21/);
  });

  it('reste incomplet si l’effet de la décision automatisée n’est pas précisé', () => {
    const r = evaluerRgpd(reponses({ decisionAutomatisee: 'oui', effetJuridique: null, criteres: ['evaluation', 'grande_echelle'] }));
    expect(r.niveau).toBe('incomplet');
  });

  it('alerte sur le consentement de personnes en situation de dépendance', () => {
    const r = evaluerRgpd(reponses({ baseLegale: 'consentement', criteres: ['personnes_vulnerables'] }));
    expect(r.pointsVigilance.join(' ')).toMatch(/consentement/);
  });
});

describe('suggererCriteres', () => {
  it('déduit les critères probables des autres réponses', () => {
    const s = suggererCriteres(reponses({ donneesSensibles: 'oui' }), { systemeIA: true, profilage: 'oui', annexeIII: '5a' });
    expect(s).toEqual(['evaluation', 'donnees_sensibles', 'personnes_vulnerables', 'usage_innovant', 'exclusion_droit']);
  });

  it('signale les critères suggérés mais non retenus', () => {
    const r = evaluerRgpd(reponses({ criteres: ['grande_echelle'] }), { profilage: 'oui' });
    expect(r.criteresSuggeresNonRetenus).toEqual(['evaluation']);
    expect(r.pointsVigilance.join(' ')).toMatch(/non retenus/);
  });

  it('ne suggère rien sans données personnelles', () => {
    expect(suggererCriteres(reponses({ donneesPersonnelles: 'non' }), { systemeIA: true })).toEqual([]);
  });
});
