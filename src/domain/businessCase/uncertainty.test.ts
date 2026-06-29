import { describe, expect, it } from 'vitest';
import { calculerVan } from './finance';
import { REFERENCE } from './fixtures';
import { centile, mulberry32, quantileTriangulaire } from './random';
import {
  analyserSensibilite,
  appliquerFacteur,
  compterDansClasses,
  construireHistogramme,
  pasArrondi,
  parametresActifs,
  simulerMonteCarlo,
} from './uncertainty';

describe('générateur et lois', () => {
  it('produit une suite reproductible dans [0, 1[', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const suiteA = Array.from({ length: 5 }, () => a());
    const suiteB = Array.from({ length: 5 }, () => b());
    expect(suiteA).toEqual(suiteB);
    suiteA.forEach((x) => expect(x >= 0 && x < 1).toBe(true));
    expect(mulberry32(43)()).not.toBe(suiteA[0]);
  });

  it('inverse la loi triangulaire aux bornes et au mode', () => {
    expect(quantileTriangulaire(0, 0.8, 1, 1.3)).toBeCloseTo(0.8);
    expect(quantileTriangulaire(1, 0.8, 1, 1.3)).toBeCloseTo(1.3);
    expect(quantileTriangulaire(0.4, 0.8, 1, 1.3)).toBeCloseTo(1); // F(mode) = 0,2 / 0,5
    expect(quantileTriangulaire(0.5, 1, 1, 1)).toBe(1);
  });

  it('a une moyenne empirique proche de (bas + mode + haut) / 3', () => {
    const alea = mulberry32(7);
    let somme = 0;
    const n = 20_000;
    for (let i = 0; i < n; i += 1) somme += quantileTriangulaire(alea(), 0.5, 1, 2);
    expect(somme / n).toBeCloseTo(3.5 / 3, 2);
  });

  it('calcule les centiles par interpolation linéaire', () => {
    expect(centile([1, 2, 3, 4], 0.5)).toBe(2.5);
    expect(centile([1, 2, 3, 4], 0.1)).toBeCloseTo(1.3);
    expect(centile([5], 0.9)).toBe(5);
  });
});

describe('sensibilité ±20 %', () => {
  const s = analyserSensibilite(REFERENCE);

  it('part de la VAN centrale et trie les paramètres par amplitude', () => {
    expect(s.vanCentrale).toBeCloseTo(calculerVan(REFERENCE), 6);
    for (let i = 1; i < s.lignes.length; i += 1) {
      expect((s.lignes[i - 1]?.amplitude ?? 0) >= (s.lignes[i]?.amplitude ?? 0)).toBe(true);
    }
  });

  it('donne des écarts symétriques pour un paramètre linéaire (volume)', () => {
    const volume = s.lignes.find((l) => l.parametre === 'volumeAnnuel');
    expect(volume?.ecartHaut).toBeGreaterThan(0);
    expect(volume?.ecartBas).toBeCloseTo(-(volume?.ecartHaut ?? 0), 6);
  });

  it('fait baisser la VAN quand un coût augmente', () => {
    const tjm = s.lignes.find((l) => l.parametre === 'tjm');
    expect(tjm?.ecartHaut).toBeLessThan(0);
    // +20 % de TJM : build +7 200 € et maintenance +1 080 €/an actualisée
    expect(tjm?.ecartHaut).toBeCloseTo(-(7_200 + 1_080 * (1 / 1.1 + 1 / 1.21 + 1 / 1.331)), 4);
  });

  it('plafonne les parts à 100 % et ignore les paramètres sans objet', () => {
    expect(appliquerFacteur(REFERENCE, 'adoption', 1.2).adoption).toEqual([0.6, 0.96, 1]);
    expect(appliquerFacteur({ ...REFERENCE, partAutomatisable: 0.9 }, 'partAutomatisable', 1.2).partAutomatisable).toBe(1);
    expect(parametresActifs({ ...REFERENCE, llmActif: false, autresCoutsBuild: 0 })).not.toContain('prixMillionTokens');
    expect(parametresActifs({ ...REFERENCE, gainsQualite: 0 })).not.toContain('gainsQualite');
  });
});

describe('Monte Carlo', () => {
  it('est reproductible à graine égale', () => {
    const a = simulerMonteCarlo(REFERENCE, { iterations: 3_000, graine: 2026 });
    const b = simulerMonteCarlo(REFERENCE, { iterations: 3_000, graine: 2026 });
    expect(a.p10).toBe(b.p10);
    expect(a.p50).toBe(b.p50);
    expect(a.p90).toBe(b.p90);
    expect(a.probaVanPositive).toBe(b.probaVanPositive);
    expect(a.histogramme).toEqual(b.histogramme);
  });

  it('varie avec la graine mais reste stable statistiquement', () => {
    const a = simulerMonteCarlo(REFERENCE, { iterations: 5_000, graine: 1 });
    const b = simulerMonteCarlo(REFERENCE, { iterations: 5_000, graine: 2 });
    expect(a.p50).not.toBe(b.p50);
    expect(Math.abs(a.p50 - b.p50) / Math.abs(a.p50)).toBeLessThan(0.03);
  });

  it('ordonne les centiles et centre la médiane près de la VAN déterministe', () => {
    const r = simulerMonteCarlo(REFERENCE, { iterations: 5_000, graine: 42 });
    expect(r.p10).toBeLessThan(r.p50);
    expect(r.p50).toBeLessThan(r.p90);
    expect(Math.abs(r.p50 - calculerVan(REFERENCE)) / calculerVan(REFERENCE)).toBeLessThan(0.1);
    expect(r.probaVanPositive).toBe(1);
    expect(r.histogramme.reduce((s, c) => s + c.effectif, 0)).toBe(5_000);
  });

  it('dégénère vers la VAN déterministe si toutes les bornes sont nulles', () => {
    const sansIncertitude = {
      ...REFERENCE,
      incertitudes: Object.fromEntries(parametresActifs(REFERENCE).map((p) => [p, { basPct: 0, hautPct: 0 }])),
    };
    const r = simulerMonteCarlo(sansIncertitude, { iterations: 200, graine: 3 });
    expect(r.p10).toBeCloseTo(calculerVan(REFERENCE), 6);
    expect(r.p90).toBeCloseTo(calculerVan(REFERENCE), 6);
  });

  it('reconstitue l’histogramme final en comptant progressivement les tirages', () => {
    const r = simulerMonteCarlo(REFERENCE, { iterations: 1_000, graine: 9 });
    expect(compterDansClasses(r.tirages, r.histogramme, r.iterations)).toEqual(r.histogramme.map((c) => c.effectif));
    expect(compterDansClasses(r.tirages, r.histogramme, 100).reduce((s, n) => s + n, 0)).toBe(100);
  });

  it('place 0 sur une borne de classe quand la VAN change de signe', () => {
    const classes = construireHistogramme([-35, -12, -1, 4, 18, 40, 52]);
    expect(classes.some((c) => c.debut === 0 || Object.is(c.debut, -0))).toBe(true);
    expect(pasArrondi(3.7)).toBe(5);
    expect(pasArrondi(0.12)).toBeCloseTo(0.2);
  });
});
