/** Paramètres de l'assistant, gardés en mémoire uniquement (jamais écrits dans le stockage local). */
import { create } from 'zustand';
import { CONFIGS_PAR_DEFAUT, type ConfigLlm, type Fournisseur } from './client';

interface EtatSession {
  config: ConfigLlm;
  choisirFournisseur: (f: Fournisseur) => void;
  majConfig: (partiel: Partial<ConfigLlm>) => void;
  oublierCle: () => void;
}

export const useSessionAssistant = create<EtatSession>((set) => ({
  config: { ...CONFIGS_PAR_DEFAUT.mistral, cle: '' },
  choisirFournisseur: (f) => set((s) => ({ config: { ...CONFIGS_PAR_DEFAUT[f], cle: s.config.cle } })),
  majConfig: (partiel) => set((s) => ({ config: { ...s.config, ...partiel } })),
  oublierCle: () => set((s) => ({ config: { ...s.config, cle: '' } })),
}));
