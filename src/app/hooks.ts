import { useMemo } from 'react';
import { useOutletContext } from 'react-router';
import { dateDuJour } from '../domain/aiAct/calendar';
import { analyserPortefeuille, type AnalysePortefeuille } from '../domain/analysis';
import type { Portfolio } from '../domain/model';

/** Portefeuille courant, transmis par la mise en page des routes /atelier/:pid. */
export function usePortefeuilleCourant(): Portfolio {
  return useOutletContext<Portfolio>();
}

/** Analyse complète, recalculée seulement quand le portefeuille change (immuabilité garantie par immer). */
export function useAnalysePortefeuille(portefeuille: Portfolio): AnalysePortefeuille {
  return useMemo(() => analyserPortefeuille(portefeuille, dateDuJour()), [portefeuille]);
}
