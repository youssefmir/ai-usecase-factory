import { describe, expect, it } from 'vitest';
import { ConfigScoringSchema, ScoresSchema, type Scores } from '../model';
import {
  calculerAxe,
  calculerPriorite,
  calculerScoring,
  determinerQuadrant,
  partsAxes,
  poidsCritere,
  versCent,
} from './scoring';
import { CRITERES, CRITERES_IDS } from './criteria';

const configDefaut = ConfigScoringSchema.parse({});

function notes(partiel: Partial<Scores>): Scores {
  return { ...ScoresSchema.parse({}), ...partiel };
}

const complet = notes({
  impactFinancier: 5,
  impactClient: 3,
  alignementStrategique: 4,
  urgence: 2,
  maturiteDonnees: 4,
  complexiteTechnique: 3,
  integrationSI: 2,
  competences: 3,
  risqueReglementaire: 4,
  risqueEthique: 2,
  risqueOperationnel: 2,
  risqueAdoption: 1,
});

describe('grilles de scoring', () => {
  it('définit 12 critères, chacun avec 5 descripteurs non vides', () => {
    expect(CRITERES).toHaveLength(12);
    for (const c of CRITERES) {
      expect(c.niveaux).toHaveLength(5);
      c.niveaux.forEach((n) => expect(n.length).toBeGreaterThan(10));
    }
  });

  it('a des poids par défaut qui totalisent 100 sur chaque axe', () => {
    for (const axe of ['valeur', 'faisabilite', 'risque'] as const) {
      const total = CRITERES.filter((c) => c.axe === axe).reduce((s, c) => s + c.poidsDefaut, 0);
      expect(total).toBe(100);
    }
  });
});

describe('calculerAxe', () => {
  it('calcule la moyenne pondérée avec les poids par défaut', () => {
    // Valeur : (5 x 30 + 3 x 25 + 4 x 25 + 2 x 20) / 100 = 3,65
    const valeur = calculerAxe('valeur', complet, configDefaut);
    expect(valeur.note).toBe(3.65);
    expect(valeur.note100).toBe(66.3);
    expect(valeur.complet).toBe(true);
    // Faisabilité : (4 x 35 + 3 x 25 + 2 x 20 + 3 x 20) / 100 = 3,15
    expect(calculerAxe('faisabilite', complet, configDefaut).note).toBe(3.15);
    // Risque : (4 x 30 + 2 x 25 + 2 x 25 + 1 x 20) / 100 = 2,4
    expect(calculerAxe('risque', complet, configDefaut).note).toBe(2.4);
  });

  it('expose la contribution et le descripteur de chaque critère', () => {
    const valeur = calculerAxe('valeur', complet, configDefaut);
    const financier = valeur.contributions.find((c) => c.critere === 'impactFinancier');
    expect(financier?.poidsNormalise).toBeCloseTo(0.3);
    expect(financier?.contribution).toBeCloseTo(1.5);
    expect(financier?.descripteur).toBe('Gain majeur, visible dans les comptes de l’organisation');
  });

  it('applique les poids personnalisés du portefeuille', () => {
    const config = ConfigScoringSchema.parse({ poids: { impactFinancier: 100, impactClient: 0, alignementStrategique: 0, urgence: 0 } });
    expect(poidsCritere(config, 'impactFinancier')).toBe(100);
    expect(calculerAxe('valeur', complet, config).note).toBe(5);
  });

  it('revient à une pondération égale si tous les poids de l’axe sont nuls', () => {
    const config = ConfigScoringSchema.parse({ poids: { impactFinancier: 0, impactClient: 0, alignementStrategique: 0, urgence: 0 } });
    expect(calculerAxe('valeur', complet, config).note).toBe(3.5);
  });

  it('signale les critères manquants et ne calcule pas de note partielle', () => {
    const partiel = notes({ impactFinancier: 4, impactClient: 4 });
    const valeur = calculerAxe('valeur', partiel, configDefaut);
    expect(valeur.note).toBeNull();
    expect(valeur.manquants).toEqual(['alignementStrategique', 'urgence']);
  });
});

describe('quadrants et priorité', () => {
  it.each([
    [3, 3, 'quick_win'],
    [4.2, 3.8, 'quick_win'],
    [3, 2.99, 'strategique'],
    [2.99, 3, 'a_explorer'],
    [2, 2, 'a_ecarter'],
  ] as const)('valeur %s / faisabilité %s -> %s (seuils inclus)', (v, f, attendu) => {
    expect(determinerQuadrant(v, f, 3, 3)).toBe(attendu);
  });

  it('respecte des seuils personnalisés', () => {
    expect(determinerQuadrant(3.4, 3.4, 3.5, 3.5)).toBe('a_ecarter');
  });

  it('calcule le score de priorité 45/35/20 avec le risque inversé', () => {
    // 0,45 x 75 + 0,35 x 50 + 0,20 x (100 - 25) = 66,25 -> 66,3
    expect(calculerPriorite(75, 50, 25, { valeur: 45, faisabilite: 35, risque: 20 })).toBe(66.3);
    expect(partsAxes({ valeur: 0, faisabilite: 0, risque: 0 }).valeur).toBeCloseTo(1 / 3);
  });

  it('convertit les notes sur 100', () => {
    expect(versCent(1)).toBe(0);
    expect(versCent(3)).toBe(50);
    expect(versCent(5)).toBe(100);
  });
});

describe('calculerScoring', () => {
  it('produit quadrant, priorité et explication pour une grille complète', () => {
    const r = calculerScoring(complet, configDefaut);
    expect(r.complet).toBe(true);
    expect(r.quadrant).toBe('quick_win');
    // valeur 66,3 ; faisabilité 53,8 ; risque 35 -> 0,45 x 66,3 + 0,35 x 53,8 + 0,2 x 65 = 61,7
    expect(r.priorite).toBeCloseTo(61.7, 1);
    expect(r.explication[0]).toContain('portée par impact financier (5/5)');
    expect(r.explication[1]).toContain('freinée par intégration SI (2/5)');
    expect(r.explication.some((e) => e.includes('Quick win'))).toBe(true);
    expect(r.alertes).toEqual([]);
  });

  it('lève une alerte de risque élevé à partir de 3,5/5', () => {
    const risque = notes({ ...complet, risqueReglementaire: 5, risqueEthique: 4, risqueOperationnel: 3, risqueAdoption: 2 });
    const r = calculerScoring(risque, configDefaut);
    expect(r.risque.note).toBe(3.65);
    expect(r.alertes[0]).toMatch(/Risque élevé/);
  });

  it('force « À écarter » pour une pratique interdite, quel que soit le score', () => {
    const r = calculerScoring(complet, configDefaut, { niveauAiAct: 'interdit' });
    expect(r.quadrant).toBe('a_ecarter');
    expect(r.alertes[0]).toMatch(/interdite/);
  });

  it('ne calcule pas de priorité tant que la grille est incomplète', () => {
    const r = calculerScoring(ScoresSchema.parse({}), configDefaut);
    expect(r.priorite).toBeNull();
    expect(r.quadrant).toBeNull();
    expect(r.alertes.at(-1)).toContain(`${CRITERES_IDS.length} critère(s) non noté(s)`);
  });
});
