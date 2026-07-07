import type { UseCase } from '../../domain/model';

/** Mise à jour du cas courant par une recette immer. */
export type MajCas = (recette: (c: UseCase) => void) => void;
