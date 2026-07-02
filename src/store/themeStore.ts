/** Thème clair / sombre : suit le système par défaut, bascule manuelle mémorisée. */
import { create } from 'zustand';
import { lireLocal, ecrireLocal } from './storage';

export type PreferenceTheme = 'clair' | 'sombre' | 'systeme';
export const CLE_THEME = 'aiucf-theme';

function systemeSombre(): boolean {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

function preferenceInitiale(): PreferenceTheme {
  const v = lireLocal(CLE_THEME);
  if (v === 'light') return 'clair';
  if (v === 'dark') return 'sombre';
  return 'systeme';
}

function appliquer(preference: PreferenceTheme) {
  const racine = document.documentElement;
  if (preference === 'systeme') racine.removeAttribute('data-theme');
  else racine.setAttribute('data-theme', preference === 'sombre' ? 'dark' : 'light');
}

interface EtatTheme {
  preference: PreferenceTheme;
  sombre: boolean;
  basculer: () => void;
  synchroniserSysteme: () => void;
}

export const useTheme = create<EtatTheme>((set, get) => {
  const preference = typeof window === 'undefined' ? 'systeme' : preferenceInitiale();
  return {
    preference,
    sombre: preference === 'systeme' ? typeof window !== 'undefined' && systemeSombre() : preference === 'sombre',
    basculer: () => {
      const sombre = !get().sombre;
      const nouvelle: PreferenceTheme = sombre ? 'sombre' : 'clair';
      ecrireLocal(CLE_THEME, sombre ? 'dark' : 'light');
      appliquer(nouvelle);
      set({ preference: nouvelle, sombre });
    },
    synchroniserSysteme: () => {
      if (get().preference === 'systeme') set({ sombre: systemeSombre() });
    },
  };
});
