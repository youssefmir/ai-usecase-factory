import { describe, expect, it } from 'vitest';
import { BusinessCaseSchema } from '../model';
import { calculerBusinessCase, calculerVan, coutLlmAnnuel, delaiRetourMois, triDeFlux, vanDeFlux } from './finance';
import { REFERENCE } from './fixtures';


describe('business case : valeurs de référence calculées à la main', () => {
  const r = calculerBusinessCase(REFERENCE);

  it('calcule le build et les gains annuels à pleine adoption', () => {
    expect(r.build).toBe(40_000); // 60 x 600 + 4 000
    expect(r.heuresEconomiseesPleineAdoption).toBe(2_500); // 10 000 x 0,5 h x 50 %
    expect(r.gainsAnnuelsPleineAdoption).toBe(145_000); // 2 500 h x 50 € + 20 000 €
    expect(r.coutLlmPleineAdoption).toBe(300); // 60 M tokens x 5 €
  });

  it('calcule les flux annuels', () => {
    const [a1, a2, a3] = r.annees;
    expect(a1?.gainsTotaux).toBe(72_500);
    expect(a1?.coutsRun).toBe(12_150); // 6 000 + 6 000 + 150
    expect(a1?.fluxNet).toBe(60_350);
    expect(a2?.fluxNet).toBe(103_760); // 116 000 - 12 240
    expect(a3?.fluxNet).toBe(132_700); // 145 000 - 12 300
    expect(a3?.cumul).toBe(256_810);
  });

  it('calcule VAN, ROI, délai de retour et TRI', () => {
    // -40 000 + 60 350 / 1,1 + 103 760 / 1,21 + 132 700 / 1,331 = 200 315,18
    expect(r.van).toBeCloseTo(200_315.18, 2);
    // (333 500 - 76 690) / 76 690
    expect(r.roi).toBeCloseTo(3.348676, 5);
    // 40 000 / 60 350 x 12 mois
    expect(r.delaiRetourMois).toBeCloseTo(7.9536, 3);
    expect(r.tri).not.toBeNull();
    expect(vanDeFlux([-40_000, 60_350, 103_760, 132_700], r.tri ?? 0)).toBeCloseTo(0, 3);
    expect(calculerVan(REFERENCE)).toBeCloseTo(r.van, 6);
  });
});

describe('fonctions financières élémentaires', () => {
  it('actualise les flux', () => {
    expect(vanDeFlux([-100, 110], 0.1)).toBeCloseTo(0, 10);
    expect(vanDeFlux([-1000, 500, 500, 500], 0)).toBe(500);
  });

  it('calcule le TRI ou renvoie null sans changement de signe', () => {
    expect(triDeFlux([-100, 110])).toBeCloseTo(0.1, 6);
    expect(triDeFlux([-100, -10, -10])).toBeNull();
  });

  it('interpole le délai de retour dans l’année', () => {
    // Cumul : -150 000 ; -89 650 ; +14 110 -> 1 + 89 650 / 103 760 années
    expect(delaiRetourMois([-150_000, 60_350, 103_760, 132_700])).toBeCloseTo(22.368, 2);
    expect(delaiRetourMois([-100, 10, 10, 10])).toBeNull();
    expect(delaiRetourMois([0, 10])).toBe(0);
  });

  it('ignore le coût LLM si aucun modèle n’est utilisé', () => {
    expect(coutLlmAnnuel({ ...REFERENCE, llmActif: false }, 10_000)).toBe(0);
    expect(coutLlmAnnuel(REFERENCE, 1_000)).toBe(30);
  });

  it('renvoie un ROI nul (null) sans aucun coût', () => {
    expect(calculerBusinessCase(BusinessCaseSchema.parse({})).roi).toBeNull();
  });
});
