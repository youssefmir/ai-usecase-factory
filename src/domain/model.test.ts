import { describe, expect, it } from 'vitest';
import { creerCasUsage, creerPortefeuille, dupliquerPortefeuille, prefixeCode, prochainCode } from './factory';
import { fmtDateLongue, fmtEuro, fmtEuroCompact, fmtMois, fmtPct } from './format';
import { BusinessCaseSchema, PortfolioSchema, UseCaseSchema } from './model';

describe('schémas du modèle', () => {
  it('complète un cas d’usage minimal avec des valeurs par défaut cohérentes', () => {
    const cas = UseCaseSchema.parse({ id: 'c1', titre: 'Tri du courrier' });
    expect(cas.statut).toBe('idee');
    expect(cas.scores.impactFinancier).toBeNull();
    expect(cas.aiAct.transparence.interactionDirecte).toBe(false);
    expect(cas.businessCase.adoption).toEqual([0.5, 0.8, 1]);
    expect(cas.businessCase.monteCarlo).toEqual({ iterations: 5000, graine: 42 });
    expect(cas.roadmap.vagueManuelle).toBeNull();
  });

  it('refuse des valeurs hors bornes', () => {
    expect(BusinessCaseSchema.safeParse({ partAutomatisable: 1.4 }).success).toBe(false);
    expect(UseCaseSchema.safeParse({ id: 'c1', titre: 'x', scores: { urgence: 7 } }).success).toBe(false);
    expect(PortfolioSchema.safeParse({ id: 'p', nom: '' }).success).toBe(false);
  });
});

describe('fabriques', () => {
  it('génère des codes et des préfixes lisibles', () => {
    const pf = creerPortefeuille({ nom: 'Test', cas: [{ id: 'a', titre: 'A', code: 'UC-BL-001' }, { id: 'b', titre: 'B', code: 'UC-BL-004' }] });
    expect(prochainCode(pf, 'UC-BL')).toBe('UC-BL-005');
    expect(prefixeCode('Banque Lumen')).toBe('BL');
    expect(prefixeCode('Ville de Port-Aurèle')).toBe('VPA');
  });

  it('duplique un portefeuille en réécrivant les dépendances vers les nouveaux identifiants', () => {
    const a = creerCasUsage({ titre: 'A' });
    const b = creerCasUsage({ titre: 'B', dependances: { cas: [a.id], externes: [] } });
    const source = creerPortefeuille({ nom: 'Source', demo: true, cas: [a, b] });
    const copie = dupliquerPortefeuille(source);
    expect(copie.id).not.toBe(source.id);
    expect(copie.demo).toBe(false);
    expect(copie.nom).toBe('Source (copie)');
    const [ca, cb] = copie.cas;
    expect(ca?.id).not.toBe(a.id);
    expect(cb?.dependances.cas).toEqual([ca?.id]);
    // La source n'est pas modifiée.
    expect(source.cas[1]?.dependances.cas).toEqual([a.id]);
  });
});

describe('formatage fr-FR', () => {
  it('formate montants, pourcentages, dates et durées', () => {
    const nbsp = String.fromCharCode(0xa0);
    expect(fmtEuro(1234567)).toBe(`1${nbsp}234${nbsp}567${nbsp}€`);
    expect(fmtEuroCompact(1_250_000)).toBe(`1,3${nbsp}M€`);
    expect(fmtEuroCompact(48_200)).toBe(`48${nbsp}k€`);
    expect(fmtPct(0.354)).toBe(`35${nbsp}%`);
    expect(fmtDateLongue('2027-12-02')).toBe('2 décembre 2027');
    expect(fmtDateLongue('2024-08-01')).toBe('1er août 2024');
    expect(fmtMois(null)).toBe('Non atteint sur 3 ans');
  });
});
