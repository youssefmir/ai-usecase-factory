/**
 * Analyse complète d'un cas d'usage et d'un portefeuille : point d'entrée unique utilisé
 * par l'interface, l'export de la note de cadrage et la roadmap.
 */
import { qualifierAiAct, type ResultatAiAct } from './aiAct/qualification';
import { dateDuJour } from './aiAct/calendar';
import { calculerBusinessCase, type ResultatBusinessCase } from './businessCase/finance';
import type { Portfolio, UseCase } from './model';
import { evaluerRgpd, type ResultatRgpd } from './rgpd/evaluation';
import { proposerRoadmap, type ResultatRoadmap } from './roadmap/roadmap';
import { calculerScoring, type ResultatScoring } from './scoring/scoring';

export interface AnalyseCas {
  cas: UseCase;
  scoring: ResultatScoring;
  aiAct: ResultatAiAct;
  rgpd: ResultatRgpd;
  businessCase: ResultatBusinessCase;
}

export function analyserCas(cas: UseCase, portefeuille: Portfolio, reference: string = dateDuJour()): AnalyseCas {
  const aiAct = qualifierAiAct(cas.aiAct, reference);
  const scoring = calculerScoring(cas.scores, portefeuille.config, { niveauAiAct: aiAct.niveau });
  const rgpd = evaluerRgpd(cas.rgpd, {
    systemeIA: cas.aiAct.inference === 'oui',
    profilage: cas.aiAct.profilage,
    annexeIII: cas.aiAct.annexeIII,
  });
  const businessCase = calculerBusinessCase(cas.businessCase);
  return { cas, scoring, aiAct, rgpd, businessCase };
}

export interface AnalysePortefeuille {
  cas: AnalyseCas[];
  roadmap: ResultatRoadmap;
  synthese: {
    nbCas: number;
    vanTotale: number;
    vanPositive: number;
    gainsAnnuels: number;
    nbQuickWins: number;
    nbHautRisque: number;
    nbInterdits: number;
    nbAipd: number;
    nbIncomplets: number;
  };
}

export function analyserPortefeuille(portefeuille: Portfolio, reference: string = dateDuJour()): AnalysePortefeuille {
  const cas = portefeuille.cas.map((c) => analyserCas(c, portefeuille, reference));
  const roadmap = proposerRoadmap(
    cas.map((a) => ({
      cas: a.cas,
      scoring: a.scoring,
      niveauAiAct: a.aiAct.niveau,
      niveauAiActProvisoire: a.aiAct.niveauProvisoire,
    })),
    portefeuille.roadmap.capacite,
  );
  const synthese = {
    nbCas: cas.length,
    vanTotale: cas.reduce((s, a) => s + a.businessCase.van, 0),
    vanPositive: cas.reduce((s, a) => s + Math.max(0, a.businessCase.van), 0),
    gainsAnnuels: cas.reduce((s, a) => s + a.businessCase.gainsAnnuelsPleineAdoption, 0),
    nbQuickWins: cas.filter((a) => a.scoring.quadrant === 'quick_win').length,
    nbHautRisque: cas.filter((a) => a.aiAct.niveauProvisoire === 'haut_risque').length,
    nbInterdits: cas.filter((a) => a.aiAct.niveau === 'interdit').length,
    nbAipd: cas.filter((a) => a.rgpd.niveau === 'aipd_requise').length,
    nbIncomplets: cas.filter((a) => a.aiAct.niveau === 'incomplet' || !a.scoring.complet).length,
  };
  return { cas, roadmap, synthese };
}
