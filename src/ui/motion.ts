/**
 * Conventions d'animation : 150 à 600 ms, courbe « ease-out », uniquement transform et opacity.
 * Si l'utilisateur demande moins d'animations (prefers-reduced-motion), l'état final s'affiche directement.
 */
import { useReducedMotion, type Transition } from 'motion/react';

export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const DUREES = { rapide: 0.16, moyen: 0.32, lent: 0.52 } as const;

export function useMouvementReduit(): boolean {
  return useReducedMotion() ?? false;
}

export function transition(duree: number = DUREES.moyen, delai = 0, reduit = false): Transition {
  return reduit ? { duration: 0 } : { duration: duree, delay: delai, ease: EASE_OUT };
}
