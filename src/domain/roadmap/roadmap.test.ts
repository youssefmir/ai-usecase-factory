import { describe, expect, it } from 'vitest';
import { creerCasUsage } from '../factory';
import type { UseCase } from '../model';
import type { NiveauAiAct } from '../aiAct/qualification';
import type { QuadrantId } from '../scoring/criteria';
import type { ResultatScoring } from '../scoring/scoring';
import { ajouterMois, casEnCycle, moisDepuis, proposerRoadmap, type CasPlanifiable } from './roadmap';

function scoring(quadrant: QuadrantId | null, priorite: number, faisabilite = 3.5, risque = 2): ResultatScoring {
  const axe = (note: number | null) => ({ axe: 'valeur' as const, libelle: '', note, note100: null, complet: true, manquants: [], contributions: [] });
  return {
    valeur: axe(3.5),
    faisabilite: axe(faisabilite),
    risque: axe(risque),
    priorite,
    quadrant,
    complet: quadrant !== null,
    alertes: [],
    explication: [],
  };
}

function element(
  code: string,
  quadrant: QuadrantId | null,
  priorite: number,
  options: { deps?: UseCase[]; niveau?: NiveauAiAct; faisabilite?: number; risque?: number; manuelle?: 0 | 1 | 2 | 3 } = {},
): CasPlanifiable {
  const cas = creerCasUsage({
    titre: code,
    code,
    dependances: { cas: (options.deps ?? []).map((d) => d.id), externes: [] },
    roadmap: { vagueManuelle: options.manuelle ?? null, commentaire: '' },
  });
  const niveau = options.niveau ?? 'minimal';
  return {
    cas,
    scoring: scoring(quadrant, priorite, options.faisabilite, options.risque),
    niveauAiAct: niveau,
    niveauAiActProvisoire: niveau === 'incomplet' ? 'minimal' : niveau,
  };
}

const vagueDe = (r: ReturnType<typeof proposerRoadmap>, code: string) => r.entrees.find((e) => e.code === code)?.vague;

describe('proposerRoadmap', () => {
  it('place les quick wins en vague 1, les projets stratégiques en 2 et les cas à explorer en 3', () => {
    const r = proposerRoadmap([element('QW', 'quick_win', 70), element('ST', 'strategique', 60), element('EX', 'a_explorer', 50)]);
    expect(vagueDe(r, 'QW')).toBe(1);
    expect(vagueDe(r, 'ST')).toBe(2);
    expect(vagueDe(r, 'EX')).toBe(3);
    expect(r.entrees.find((e) => e.code === 'QW')?.debutMois).toBe(0);
    expect(r.entrees.find((e) => e.code === 'EX')?.finMois).toBe(18);
  });

  it('exclut les cas à écarter, interdits ou au scoring incomplet', () => {
    const r = proposerRoadmap([
      element('EC', 'a_ecarter', 30),
      element('INT', 'quick_win', 90, { niveau: 'interdit' }),
      element('INC', null, 0),
    ]);
    expect(r.entrees.map((e) => e.vague)).toEqual([0, 0, 0]);
    expect(r.entrees[1]?.raisons[0]).toMatch(/interdite/);
  });

  it('repousse en vague 2 un quick win à haut risque et en vague 3 un projet stratégique peu faisable', () => {
    const r = proposerRoadmap([
      element('HR', 'quick_win', 80, { niveau: 'haut_risque' }),
      element('PF', 'strategique', 75, { faisabilite: 2.2 }),
      element('RG', 'quick_win', 70, { risque: 3.8 }),
    ]);
    expect(vagueDe(r, 'HR')).toBe(2);
    expect(vagueDe(r, 'PF')).toBe(3);
    expect(vagueDe(r, 'RG')).toBe(2);
  });

  it('planifie un cas strictement après ses prérequis', () => {
    const socle = element('SOCLE', 'quick_win', 60);
    const suite = element('SUITE', 'quick_win', 95, { deps: [socle.cas] });
    const r = proposerRoadmap([suite, socle]);
    expect(vagueDe(r, 'SOCLE')).toBe(1);
    expect(vagueDe(r, 'SUITE')).toBe(2);
    expect(r.entrees.find((e) => e.code === 'SUITE')?.raisons.join(' ')).toMatch(/après son prérequis SOCLE/);
  });

  it('respecte la capacité par vague en retenant les priorités les plus fortes', () => {
    const elements = [element('A', 'quick_win', 50), element('B', 'quick_win', 90), element('C', 'quick_win', 70)];
    const r = proposerRoadmap(elements, [2, 1, 1]);
    expect(vagueDe(r, 'B')).toBe(1);
    expect(vagueDe(r, 'C')).toBe(1);
    expect(vagueDe(r, 'A')).toBe(2);
    expect(r.entrees.find((e) => e.code === 'A')?.raisons.join(' ')).toMatch(/Capacité de la vague 1/);
  });

  it('renvoie au-delà de 18 mois ce qui ne tient pas dans les trois vagues', () => {
    const r = proposerRoadmap([element('A', 'a_explorer', 50), element('B', 'a_explorer', 40)], [1, 1, 1]);
    expect(vagueDe(r, 'A')).toBe(3);
    expect(vagueDe(r, 'B')).toBe(4);
  });

  it('détecte les dépendances circulaires', () => {
    const a = element('A', 'quick_win', 50);
    const b = element('B', 'quick_win', 50, { deps: [a.cas] });
    a.cas.dependances.cas.push(b.cas.id);
    const r = proposerRoadmap([a, b]);
    expect(r.entrees.map((e) => e.vague)).toEqual([4, 4]);
    expect(r.entrees[0]?.raisons.join(' ')).toMatch(/circulaire/);
    expect(casEnCycle(new Map([['x', ['y']], ['y', ['x']], ['z', ['x']]]))).toEqual(new Set(['x', 'y']));
  });

  it('applique un ajustement manuel et signale les incohérences sans les bloquer', () => {
    const socle = element('SOCLE', 'quick_win', 60);
    const suite = element('SUITE', 'strategique', 80, { deps: [socle.cas], manuelle: 1, niveau: 'haut_risque' });
    const r = proposerRoadmap([socle, suite]);
    const entree = r.entrees.find((e) => e.code === 'SUITE');
    expect(entree?.vague).toBe(1);
    expect(entree?.vagueProposee).toBe(2);
    expect(entree?.manuelle).toBe(true);
    expect(entree?.conflits.join(' ')).toMatch(/prérequis SOCLE/);
    expect(entree?.conflits.join(' ')).toMatch(/Haut risque en vague 1/);
  });

  it('signale une vague en surcapacité après ajustement manuel', () => {
    const r = proposerRoadmap([element('A', 'quick_win', 50), element('B', 'a_explorer', 40, { manuelle: 1 })], [1, 3, 3]);
    expect(r.alertes[0]).toMatch(/Vague 1 : 2 cas pour une capacité de 1/);
  });
});

describe('calendrier de la roadmap', () => {
  it('additionne des mois et positionne une date', () => {
    expect(ajouterMois('2027-01-01', 3)).toBe('2027-04-01');
    expect(ajouterMois('2027-11-01', 3)).toBe('2028-02-01');
    expect(moisDepuis('2027-01-01', '2027-12-02')).toBeCloseTo(11.03, 2);
  });
});
