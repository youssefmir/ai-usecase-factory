import { describe, expect, it } from 'vitest';
import { echelleLineaire, graduations, pasRond } from './scales';

describe('échelles des graphiques', () => {
  it('projette linéairement un domaine sur une plage', () => {
    const x = echelleLineaire([0, 10], [0, 200]);
    expect(x(5)).toBe(100);
    const y = echelleLineaire([0, 100], [300, 0]);
    expect(y(25)).toBe(225);
  });

  it('produit des graduations rondes qui incluent 0', () => {
    const { ticks, domaine } = graduations(-40_000, 256_810, 5);
    expect(ticks).toContain(0);
    expect(domaine[0]).toBeLessThanOrEqual(-40_000);
    expect(domaine[1]).toBeGreaterThanOrEqual(256_810);
    expect(pasRond(57_000)).toBe(100_000);
    expect(pasRond(42)).toBe(50);
  });
});
