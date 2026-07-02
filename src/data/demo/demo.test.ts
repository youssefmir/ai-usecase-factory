import { describe, expect, it } from 'vitest';
import { analyserPortefeuille } from '../../domain/analysis';
import { ChampsBusinessCase } from '../../domain/model';
import { portefeuillesDemo } from './index';

const REFERENCE = '2026-11-01';
const portefeuilles = portefeuillesDemo();
const analyses = portefeuilles.map((p) => ({ p, a: analyserPortefeuille(p, REFERENCE) }));
const parCode = new Map(
  analyses.flatMap(({ a }) => a.cas.map((c) => [c.cas.code, c] as const)),
);

describe('portefeuilles de démonstration', () => {
  it('contient trois organisations fictives et seize cas entièrement renseignés', () => {
    expect(portefeuilles.map((p) => p.nom)).toEqual(['Banque Lumen', 'Ardoise Bâtiment', 'Ville de Port-Aurèle']);
    expect(portefeuilles.every((p) => p.demo && p.organisation.fictive)).toBe(true);
    expect(parCode.size).toBe(16);
    for (const { cas, scoring } of parCode.values()) {
      expect(scoring.complet, cas.code).toBe(true);
      expect(cas.personas.length, cas.code).toBeGreaterThanOrEqual(1);
      expect(cas.kpis.length, cas.code).toBeGreaterThanOrEqual(1);
      expect(cas.risques.length, cas.code).toBeGreaterThanOrEqual(1);
      expect(cas.donnees.sources.length, cas.code).toBeGreaterThanOrEqual(1);
      expect(cas.businessCase.volumeAnnuel, cas.code).toBeGreaterThan(0);
    }
  });

  it('étiquette toutes les valeurs du business case comme hypothèses', () => {
    for (const { cas } of parCode.values()) {
      for (const champ of ChampsBusinessCase) expect(cas.businessCase.provenance[champ], `${cas.code} ${champ}`).toBe('hypothese');
    }
  });

  it('relie les dépendances à des cas existants du même portefeuille', () => {
    for (const p of portefeuilles) {
      const ids = new Set(p.cas.map((c) => c.id));
      p.cas.forEach((c) => c.dependances.cas.forEach((d) => expect(ids.has(d), `${c.code} -> ${d}`).toBe(true)));
    }
  });
});

describe('qualification AI Act attendue pour chaque cas de démonstration', () => {
  it.each([
    ['UC-BL-001', 'minimal', 'dérogation 6(3)(a) : tâche procédurale étroite, sans profilage'],
    ['UC-BL-002', 'minimal', 'hors annexe III : relance commerciale'],
    ['UC-BL-003', 'haut_risque', '5 b avec profilage : dérogation 6(3)(d) écartée'],
    ['UC-BL-004', 'haut_risque', 'évaluation de solvabilité (annexe III, 5 b)'],
    ['UC-BL-005', 'minimal', 'détection de fraude financière, exclue du 5 b'],
    ['UC-BL-006', 'transparence', 'chatbot : art. 50(1)'],
    ['UC-AB-001', 'minimal', 'veille sans enjeu particulier'],
    ['UC-AB-002', 'minimal', 'extraction structurée'],
    ['UC-AB-003', 'transparence', 'contenu génératif : art. 50(2)'],
    ['UC-AB-004', 'minimal', 'prévision de prix'],
    ['UC-AB-005', 'haut_risque', 'attribution des tâches selon les caractéristiques personnelles (4 b)'],
    ['UC-PA-001', 'transparence', 'agent conversationnel : art. 50(1)'],
    ['UC-PA-002', 'minimal', 'routage du courrier'],
    ['UC-PA-003', 'haut_risque', 'prestations sociales (annexe III, 5 a)'],
    ['UC-PA-004', 'minimal', 'prévision sur données agrégées'],
    ['UC-PA-005', 'minimal', 'contrôle de factures'],
  ] as const)('%s -> %s (%s)', (code, niveau, _motif) => {
    expect(parCode.get(code)?.aiAct.niveau).toBe(niveau);
  });

  it('exige une FRIA pour le score de crédit, la pré-analyse et l’aide sociale uniquement', () => {
    const avecFria = [...parCode.values()].filter((c) => c.aiAct.fria).map((c) => c.cas.code);
    expect(avecFria).toEqual(['UC-BL-003', 'UC-BL-004', 'UC-PA-003']);
  });

  it('applique la dérogation 6(3) au seul contrôle de complétude', () => {
    expect(parCode.get('UC-BL-001')?.aiAct.derogationAppliquee).toBe('a');
    expect(parCode.get('UC-BL-003')?.aiAct.derogationAppliquee).toBeNull();
    expect(parCode.get('UC-BL-003')?.aiAct.transparence).toBe(true);
  });
});

describe('pré-analyse RGPD attendue', () => {
  it.each([
    ['UC-BL-001', 'aipd_requise'],
    ['UC-BL-004', 'aipd_requise'],
    ['UC-AB-001', 'aipd_non_requise'],
    ['UC-AB-003', 'aipd_a_documenter'],
    ['UC-AB-005', 'aipd_requise'],
    ['UC-PA-003', 'aipd_requise'],
    ['UC-PA-004', 'non_applicable'],
    ['UC-PA-005', 'non_applicable'],
  ] as const)('%s -> %s', (code, niveau) => {
    expect(parCode.get(code)?.rgpd.niveau).toBe(niveau);
  });

  it('met en vigilance l’art. 22 pour les scores déterminants', () => {
    expect(parCode.get('UC-BL-004')?.rgpd.article22).toBe('vigilance');
    expect(parCode.get('UC-PA-003')?.rgpd.article22).toBe('vigilance');
  });
});

describe('scoring, business case et roadmap des démonstrations', () => {
  it.each([
    ['UC-BL-001', 'quick_win'],
    ['UC-BL-002', 'a_explorer'],
    ['UC-BL-003', 'strategique'],
    ['UC-BL-004', 'strategique'],
    ['UC-BL-005', 'quick_win'],
    ['UC-BL-006', 'quick_win'],
    ['UC-AB-001', 'quick_win'],
    ['UC-AB-002', 'quick_win'],
    ['UC-AB-003', 'quick_win'],
    ['UC-AB-004', 'strategique'],
    ['UC-AB-005', 'a_ecarter'],
    ['UC-PA-001', 'quick_win'],
    ['UC-PA-002', 'quick_win'],
    ['UC-PA-003', 'strategique'],
    ['UC-PA-004', 'a_explorer'],
    ['UC-PA-005', 'a_explorer'],
  ] as const)('%s -> quadrant %s', (code, quadrant) => {
    expect(parCode.get(code)?.scoring.quadrant).toBe(quadrant);
  });

  it('montre des business cases contrastés, dont des VAN négatives', () => {
    const negatives = [...parCode.values()].filter((c) => c.businessCase.van < 0).map((c) => c.cas.code);
    expect(negatives).toEqual(['UC-BL-003', 'UC-AB-005', 'UC-PA-001', 'UC-PA-003']);
  });

  it('propose les vagues attendues, y compris l’ajustement manuel', () => {
    const vagues = Object.fromEntries(analyses.flatMap(({ a }) => a.roadmap.entrees.map((e) => [e.code, e.vague])));
    expect(vagues).toEqual({
      'UC-BL-001': 1,
      'UC-BL-002': 3,
      'UC-BL-003': 2,
      'UC-BL-004': 3,
      'UC-BL-005': 2,
      'UC-BL-006': 1,
      'UC-AB-001': 1,
      'UC-AB-002': 1,
      'UC-AB-003': 2,
      'UC-AB-004': 2,
      'UC-AB-005': 0,
      'UC-PA-001': 1,
      'UC-PA-002': 1,
      'UC-PA-003': 3,
      'UC-PA-004': 3,
      'UC-PA-005': 1,
    });
    const energie = analyses[2]?.a.roadmap.entrees.find((e) => e.code === 'UC-PA-005');
    expect(energie?.manuelle).toBe(true);
    expect(energie?.vagueProposee).toBe(3);
  });
});
