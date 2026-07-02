import { afterEach, describe, expect, it, vi } from 'vitest';
import { ecrireLocal, lireLocal, persistanceAssuree, reinitialiserDiagnosticStockage, stockageDisponible } from './storage';

afterEach(() => {
  vi.restoreAllMocks();
  reinitialiserDiagnosticStockage();
  window.localStorage.clear();
});

describe('stockage tolérant', () => {
  it('lit et écrit dans le stockage local quand il est disponible', () => {
    ecrireLocal('cle', 'valeur');
    expect(window.localStorage.getItem('cle')).toBe('valeur');
    expect(lireLocal('cle')).toBe('valeur');
    expect(persistanceAssuree()).toBe(true);
  });

  it('se replie en mémoire si le stockage lève une exception', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('bloqué', 'SecurityError');
    });
    expect(stockageDisponible()).toBe(false);
    ecrireLocal('cle', 'en mémoire');
    expect(lireLocal('cle')).toBe('en mémoire');
    expect(persistanceAssuree()).toBe(false);
  });

  it('signale un quota dépassé sans perdre la valeur en cours de session', () => {
    expect(stockageDisponible()).toBe(true);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('plein', 'QuotaExceededError');
    });
    ecrireLocal('gros', 'x');
    expect(persistanceAssuree()).toBe(false);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('bloqué', 'SecurityError');
    });
    expect(lireLocal('gros')).toBe('x');
  });
});
