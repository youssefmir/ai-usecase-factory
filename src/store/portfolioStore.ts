/**
 * État global des portefeuilles (zustand + immer), persisté dans le stockage local
 * via un adaptateur tolérant aux erreurs. Au premier lancement, les trois portefeuilles
 * de démonstration sont chargés.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { z } from 'zod';
import { IDS_DEMO, portefeuillesDemo } from '../data/demo';
import {
  creerCasUsage,
  creerPortefeuille,
  dupliquerCasUsage,
  dupliquerPortefeuille,
  nouvelId,
  prefixeCode,
  prochainCode,
} from '../domain/factory';
import { PortfolioSchema, type Portfolio, type UseCase, type UseCaseInput } from '../domain/model';
import { stockageSur } from './storage';

export const CLE_STOCKAGE = 'aiucf-portefeuilles';

export interface EtatPortefeuilles {
  portefeuilles: Portfolio[];
  /** Message affiché si les données sauvegardées étaient illisibles et ont été remplacées. */
  alerteChargement: string | null;
  creerPortefeuille: (nom: string, organisation?: Partial<Portfolio['organisation']>) => string;
  dupliquerPortefeuille: (id: string) => string | null;
  supprimerPortefeuille: (id: string) => void;
  importerPortefeuilles: (portefeuilles: Portfolio[]) => string[];
  majPortefeuille: (id: string, recette: (p: Portfolio) => void) => void;
  ajouterCas: (portefeuilleId: string, partiel?: Partial<UseCaseInput>) => string | null;
  dupliquerCas: (portefeuilleId: string, casId: string) => string | null;
  supprimerCas: (portefeuilleId: string, casId: string) => void;
  majCas: (portefeuilleId: string, casId: string, recette: (c: UseCase) => void) => void;
  reinitialiserDemo: () => void;
  effacerAlerteChargement: () => void;
}

const maintenant = () => new Date().toISOString();

export const usePortefeuilles = create<EtatPortefeuilles>()(
  persist(
    immer((set, get) => ({
      portefeuilles: portefeuillesDemo(),
      alerteChargement: null,

      creerPortefeuille: (nom, organisation) => {
        const p = creerPortefeuille({
          nom,
          organisation: { nom, fictive: false, ...organisation },
        });
        set((s) => {
          s.portefeuilles.push(p);
        });
        return p.id;
      },

      dupliquerPortefeuille: (id) => {
        const source = get().portefeuilles.find((p) => p.id === id);
        if (!source) return null;
        const copie = dupliquerPortefeuille(source);
        set((s) => {
          s.portefeuilles.push(copie);
        });
        return copie.id;
      },

      supprimerPortefeuille: (id) =>
        set((s) => {
          s.portefeuilles = s.portefeuilles.filter((p) => p.id !== id);
        }),

      importerPortefeuilles: (portefeuilles) => {
        const ids: string[] = [];
        set((s) => {
          for (const p of portefeuilles) {
            const existe = s.portefeuilles.some((x) => x.id === p.id);
            const copie: Portfolio = { ...structuredClone(p), id: existe ? nouvelId('pf') : p.id, demo: false };
            s.portefeuilles.push(copie);
            ids.push(copie.id);
          }
        });
        return ids;
      },

      majPortefeuille: (id, recette) =>
        set((s) => {
          const p = s.portefeuilles.find((x) => x.id === id);
          if (!p) return;
          recette(p);
          p.modifieLe = maintenant();
        }),

      ajouterCas: (portefeuilleId, partiel) => {
        const p = get().portefeuilles.find((x) => x.id === portefeuilleId);
        if (!p) return null;
        const code = prochainCode(p, `UC-${prefixeCode(p.organisation.nom || p.nom)}`);
        const cas = creerCasUsage({ titre: 'Nouveau cas d’usage', code, ...partiel });
        set((s) => {
          const cible = s.portefeuilles.find((x) => x.id === portefeuilleId);
          if (!cible) return;
          cible.cas.push(cas);
          cible.modifieLe = maintenant();
        });
        return cas.id;
      },

      dupliquerCas: (portefeuilleId, casId) => {
        const p = get().portefeuilles.find((x) => x.id === portefeuilleId);
        const source = p?.cas.find((c) => c.id === casId);
        if (!p || !source) return null;
        const copie = dupliquerCasUsage(source, prochainCode(p, `UC-${prefixeCode(p.organisation.nom || p.nom)}`));
        set((s) => {
          const cible = s.portefeuilles.find((x) => x.id === portefeuilleId);
          if (!cible) return;
          const index = cible.cas.findIndex((c) => c.id === casId);
          cible.cas.splice(index + 1, 0, copie);
          cible.modifieLe = maintenant();
        });
        return copie.id;
      },

      supprimerCas: (portefeuilleId, casId) =>
        set((s) => {
          const p = s.portefeuilles.find((x) => x.id === portefeuilleId);
          if (!p) return;
          p.cas = p.cas.filter((c) => c.id !== casId);
          for (const c of p.cas) c.dependances.cas = c.dependances.cas.filter((d) => d !== casId);
          p.modifieLe = maintenant();
        }),

      majCas: (portefeuilleId, casId, recette) =>
        set((s) => {
          const p = s.portefeuilles.find((x) => x.id === portefeuilleId);
          const c = p?.cas.find((x) => x.id === casId);
          if (!p || !c) return;
          recette(c);
          c.modifieLe = maintenant();
          p.modifieLe = c.modifieLe;
        }),

      reinitialiserDemo: () =>
        set((s) => {
          const autres = s.portefeuilles.filter((p) => !IDS_DEMO.includes(p.id));
          s.portefeuilles = [...portefeuillesDemo(), ...autres];
        }),

      effacerAlerteChargement: () =>
        set((s) => {
          s.alerteChargement = null;
        }),
    })),
    {
      name: CLE_STOCKAGE,
      version: 1,
      storage: createJSONStorage(() => stockageSur),
      partialize: (s) => ({ portefeuilles: s.portefeuilles }),
      merge: (persiste, actuel) => {
        const donnees = (persiste as { portefeuilles?: unknown } | undefined)?.portefeuilles;
        if (donnees === undefined) return actuel;
        const r = z.array(PortfolioSchema).safeParse(donnees);
        if (r.success) return { ...actuel, portefeuilles: r.data };
        return {
          ...actuel,
          alerteChargement:
            'Les données sauvegardées dans ce navigateur étaient illisibles : les portefeuilles de démonstration ont été rechargés.',
        };
      },
    },
  ),
);

/** Sélecteur : un portefeuille par identifiant. */
export function usePortefeuille(id: string | undefined): Portfolio | undefined {
  return usePortefeuilles((s) => s.portefeuilles.find((p) => p.id === id));
}
