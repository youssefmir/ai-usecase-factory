/**
 * Accès tolérant au stockage local : chaque lecture et écriture est protégée par try/catch,
 * avec un repli en mémoire (navigation privée, stockage bloqué ou quota dépassé).
 * L'application reste utilisable ; seule la persistance entre deux sessions est perdue.
 */
import type { StateStorage } from 'zustand/middleware';

const memoire = new Map<string, string>();
let disponible: boolean | null = null;
let ecritureEchouee = false;
const abonnes = new Set<() => void>();

function notifier() {
  abonnes.forEach((f) => f());
}

function stockageNatif(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

/** Teste (une fois) que le stockage local accepte lecture et écriture. */
export function stockageDisponible(): boolean {
  if (disponible !== null) return disponible;
  try {
    const s = stockageNatif();
    if (!s) throw new Error('indisponible');
    const cle = '__aiucf_test__';
    s.setItem(cle, '1');
    s.removeItem(cle);
    disponible = true;
  } catch {
    disponible = false;
  }
  return disponible;
}

/** true si la persistance est assurée (stockage disponible et aucune écriture refusée). */
export function persistanceAssuree(): boolean {
  return stockageDisponible() && !ecritureEchouee;
}

export function abonnerEtatStockage(f: () => void): () => void {
  abonnes.add(f);
  return () => abonnes.delete(f);
}

export function lireLocal(cle: string): string | null {
  if (stockageDisponible()) {
    try {
      return stockageNatif()?.getItem(cle) ?? null;
    } catch {
      /* repli en mémoire */
    }
  }
  return memoire.get(cle) ?? null;
}

export function ecrireLocal(cle: string, valeur: string): void {
  memoire.set(cle, valeur);
  if (!stockageDisponible()) return;
  try {
    stockageNatif()?.setItem(cle, valeur);
    if (ecritureEchouee) {
      ecritureEchouee = false;
      notifier();
    }
  } catch {
    // Quota dépassé ou stockage révoqué : on garde la valeur en mémoire et on prévient l'interface.
    if (!ecritureEchouee) {
      ecritureEchouee = true;
      notifier();
    }
  }
}

export function supprimerLocal(cle: string): void {
  memoire.delete(cle);
  try {
    if (stockageDisponible()) stockageNatif()?.removeItem(cle);
  } catch {
    /* sans effet */
  }
}

/** Adaptateur pour le middleware persist de zustand. */
export const stockageSur: StateStorage = {
  getItem: (nom) => lireLocal(nom),
  setItem: (nom, valeur) => ecrireLocal(nom, valeur),
  removeItem: (nom) => supprimerLocal(nom),
};

/** Réservé aux tests : réinitialise le diagnostic du stockage. */
export function reinitialiserDiagnosticStockage(): void {
  disponible = null;
  ecritureEchouee = false;
  memoire.clear();
}
