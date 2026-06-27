/**
 * Formules du business case (horizon de 3 ans, flux annuels, investissement en année 0).
 * Les formules sont détaillées dans docs/modele-business-case.md et vérifiées par des
 * valeurs de référence calculées à la main (finance.test.ts).
 *
 *   Gains productivité (année a) = V x (t / 60) x p x c x adoption(a)
 *   Gains qualité (année a)      = Q x adoption(a)
 *   Build (année 0)              = jours x TJM + autres coûts ponctuels
 *   Run (année a)                = infra + maintenance% x Build + coût LLM(a) + autres coûts récurrents
 *   Coût LLM (année a)           = V x adoption(a) x requêtes/unité x tokens/requête x prix / 1 000 000
 *   VAN                          = -Build + somme des flux nets(a) / (1 + i)^a
 *   ROI                          = (gains cumulés - coûts cumulés) / coûts cumulés   (non actualisé)
 */
import type { BusinessCase } from '../model';

export const HORIZON_ANNEES = 3;

export interface FluxAnnuel {
  annee: number;
  adoption: number;
  heuresEconomisees: number;
  gainProductivite: number;
  gainQualite: number;
  gainsTotaux: number;
  coutInfra: number;
  coutMaintenance: number;
  coutLlm: number;
  autresCoutsRun: number;
  coutsRun: number;
  fluxNet: number;
  facteurActualisation: number;
  fluxActualise: number;
  cumul: number;
  cumulActualise: number;
}

export interface ResultatBusinessCase {
  build: number;
  coutDeveloppement: number;
  annees: FluxAnnuel[];
  /** Gains annuels à pleine adoption (100 %). */
  gainsAnnuelsPleineAdoption: number;
  heuresEconomiseesPleineAdoption: number;
  /** Coût LLM annuel à pleine adoption. */
  coutLlmPleineAdoption: number;
  totalGains: number;
  totalCouts: number;
  van: number;
  /** ROI non actualisé sur l'horizon (0,35 = 35 %) ; null si aucun coût. */
  roi: number | null;
  /** Délai de retour sur investissement en mois (null si non atteint sur l'horizon). */
  delaiRetourMois: number | null;
  /** Taux de rentabilité interne (null si non défini). */
  tri: number | null;
}

const borne01 = (x: number) => Math.min(1, Math.max(0, x));

/** Coût LLM annuel pour un volume traité donné. */
export function coutLlmAnnuel(bc: BusinessCase, volumeTraite: number): number {
  if (!bc.llmActif) return 0;
  const tokens = volumeTraite * bc.requetesParUnite * bc.tokensParRequete;
  return (tokens / 1_000_000) * bc.prixMillionTokens;
}

export function coutBuild(bc: BusinessCase): number {
  return bc.joursBuild * bc.tjm + bc.autresCoutsBuild;
}

/** VAN d'une série de flux (index 0 = année 0, non actualisée). */
export function vanDeFlux(flux: readonly number[], taux: number): number {
  return flux.reduce((s, f, annee) => s + f / (1 + taux) ** annee, 0);
}

/**
 * Taux de rentabilité interne par dichotomie sur [-99 % ; 1 000 %].
 * Renvoie null s'il n'y a pas de changement de signe de la VAN sur l'intervalle.
 */
export function triDeFlux(flux: readonly number[]): number | null {
  let bas = -0.99;
  let haut = 10;
  let vBas = vanDeFlux(flux, bas);
  const vHaut = vanDeFlux(flux, haut);
  if (!Number.isFinite(vBas) || !Number.isFinite(vHaut) || vBas * vHaut > 0) return null;
  for (let i = 0; i < 200; i += 1) {
    const milieu = (bas + haut) / 2;
    const vMilieu = vanDeFlux(flux, milieu);
    if (Math.abs(vMilieu) < 1e-7 || haut - bas < 1e-10) return milieu;
    if (vBas * vMilieu < 0) {
      haut = milieu;
    } else {
      bas = milieu;
      vBas = vMilieu;
    }
  }
  return (bas + haut) / 2;
}

/**
 * Délai de retour (mois) : premier instant où le flux cumulé non actualisé devient positif,
 * en supposant des flux répartis uniformément dans l'année (interpolation linéaire).
 */
export function delaiRetourMois(flux: readonly number[]): number | null {
  let cumul = flux[0] ?? 0;
  if (cumul >= 0) return 0;
  for (let annee = 1; annee < flux.length; annee += 1) {
    const f = flux[annee] ?? 0;
    const suivant = cumul + f;
    if (suivant >= 0 && f > 0) {
      return (annee - 1 + -cumul / f) * 12;
    }
    cumul = suivant;
  }
  return null;
}

export function calculerBusinessCase(bc: BusinessCase): ResultatBusinessCase {
  const coutDeveloppement = bc.joursBuild * bc.tjm;
  const build = coutBuild(bc);
  const heuresParUnite = (bc.tempsUnitaireMin / 60) * borne01(bc.partAutomatisable);
  const heuresEconomiseesPleineAdoption = bc.volumeAnnuel * heuresParUnite;
  const gainsAnnuelsPleineAdoption = heuresEconomiseesPleineAdoption * bc.coutHoraire + bc.gainsQualite;
  const coutLlmPleineAdoption = coutLlmAnnuel(bc, bc.volumeAnnuel);

  const annees: FluxAnnuel[] = [];
  let cumul = -build;
  let cumulActualise = -build;
  for (let annee = 1; annee <= HORIZON_ANNEES; annee += 1) {
    const adoption = borne01(bc.adoption[annee - 1] ?? 0);
    const heuresEconomisees = heuresEconomiseesPleineAdoption * adoption;
    const gainProductivite = heuresEconomisees * bc.coutHoraire;
    const gainQualite = bc.gainsQualite * adoption;
    const gainsTotaux = gainProductivite + gainQualite;
    const coutInfra = bc.infraAnnuelle;
    const coutMaintenance = bc.maintenancePct * build;
    const coutLlm = coutLlmAnnuel(bc, bc.volumeAnnuel * adoption);
    const autresCoutsRun = bc.autresCoutsRun;
    const coutsRun = coutInfra + coutMaintenance + coutLlm + autresCoutsRun;
    const fluxNet = gainsTotaux - coutsRun;
    const facteurActualisation = 1 / (1 + bc.tauxActualisation) ** annee;
    const fluxActualise = fluxNet * facteurActualisation;
    cumul += fluxNet;
    cumulActualise += fluxActualise;
    annees.push({
      annee,
      adoption,
      heuresEconomisees,
      gainProductivite,
      gainQualite,
      gainsTotaux,
      coutInfra,
      coutMaintenance,
      coutLlm,
      autresCoutsRun,
      coutsRun,
      fluxNet,
      facteurActualisation,
      fluxActualise,
      cumul,
      cumulActualise,
    });
  }

  const flux = [-build, ...annees.map((a) => a.fluxNet)];
  const totalGains = annees.reduce((s, a) => s + a.gainsTotaux, 0);
  const totalCouts = build + annees.reduce((s, a) => s + a.coutsRun, 0);

  return {
    build,
    coutDeveloppement,
    annees,
    gainsAnnuelsPleineAdoption,
    heuresEconomiseesPleineAdoption,
    coutLlmPleineAdoption,
    totalGains,
    totalCouts,
    van: vanDeFlux(flux, bc.tauxActualisation),
    roi: totalCouts > 0 ? (totalGains - totalCouts) / totalCouts : null,
    delaiRetourMois: delaiRetourMois(flux),
    tri: triDeFlux(flux),
  };
}

/** VAN seule (utilisée en boucle par la sensibilité et le Monte Carlo). */
export function calculerVan(bc: BusinessCase): number {
  const build = coutBuild(bc);
  const heuresParUnite = (bc.tempsUnitaireMin / 60) * borne01(bc.partAutomatisable);
  let van = -build;
  for (let annee = 1; annee <= HORIZON_ANNEES; annee += 1) {
    const adoption = borne01(bc.adoption[annee - 1] ?? 0);
    const gains = bc.volumeAnnuel * heuresParUnite * bc.coutHoraire * adoption + bc.gainsQualite * adoption;
    const run = bc.infraAnnuelle + bc.maintenancePct * build + coutLlmAnnuel(bc, bc.volumeAnnuel * adoption) + bc.autresCoutsRun;
    van += (gains - run) / (1 + bc.tauxActualisation) ** annee;
  }
  return van;
}
