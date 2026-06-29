/**
 * Analyses d'incertitude du business case :
 * - sensibilité « tornado » : chaque paramètre varie de -20 % et +20 %, les autres restent fixes ;
 * - Monte Carlo : tirages simultanés selon des lois triangulaires (bas / mode / haut).
 */
import { PARAMETRES_INCERTAINS, type BusinessCase, type ParametreIncertainId } from '../model';
import { calculerVan } from './finance';
import { centile, mulberry32, quantileTriangulaire } from './random';

const borne01 = (x: number) => Math.min(1, Math.max(0, x));

/** Valeur de référence d'un paramètre (pour l'adoption : moyenne des trois années). */
export function valeurParametre(bc: BusinessCase, parametre: ParametreIncertainId): number {
  if (parametre === 'adoption') return (bc.adoption[0] + bc.adoption[1] + bc.adoption[2]) / 3;
  return bc[parametre];
}

/** Paramètres pertinents pour ce business case (le prix des tokens n'a de sens que si un LLM est utilisé). */
export function parametresActifs(bc: BusinessCase): ParametreIncertainId[] {
  return PARAMETRES_INCERTAINS.map((p) => p.id).filter((id) => {
    if (id === 'prixMillionTokens') return bc.llmActif && bc.prixMillionTokens > 0;
    return valeurParametre(bc, id) > 0;
  });
}

/**
 * Applique un facteur multiplicatif à un paramètre. Les parts (part automatisable, adoption)
 * sont plafonnées à 100 %.
 */
export function appliquerFacteur(bc: BusinessCase, parametre: ParametreIncertainId, facteur: number): BusinessCase {
  switch (parametre) {
    case 'adoption':
      return {
        ...bc,
        adoption: [borne01(bc.adoption[0] * facteur), borne01(bc.adoption[1] * facteur), borne01(bc.adoption[2] * facteur)],
      };
    case 'partAutomatisable':
      return { ...bc, partAutomatisable: borne01(bc.partAutomatisable * facteur) };
    default:
      return { ...bc, [parametre]: Math.max(0, bc[parametre] * facteur) };
  }
}

export interface LigneSensibilite {
  parametre: ParametreIncertainId;
  libelle: string;
  vanBasse: number;
  vanHaute: number;
  /** Écart à la VAN centrale pour -X % et +X %. */
  ecartBas: number;
  ecartHaut: number;
  amplitude: number;
}

export interface ResultatSensibilite {
  variation: number;
  vanCentrale: number;
  lignes: LigneSensibilite[];
}

/** Sensibilité « tornado » (variation par défaut : ±20 %), triée par amplitude décroissante. */
export function analyserSensibilite(bc: BusinessCase, variation = 0.2): ResultatSensibilite {
  const vanCentrale = calculerVan(bc);
  const lignes = parametresActifs(bc)
    .map((parametre) => {
      const vanBasse = calculerVan(appliquerFacteur(bc, parametre, 1 - variation));
      const vanHaute = calculerVan(appliquerFacteur(bc, parametre, 1 + variation));
      return {
        parametre,
        libelle: PARAMETRES_INCERTAINS.find((p) => p.id === parametre)?.libelle ?? parametre,
        vanBasse,
        vanHaute,
        ecartBas: vanBasse - vanCentrale,
        ecartHaut: vanHaute - vanCentrale,
        amplitude: Math.abs(vanHaute - vanBasse),
      };
    })
    .sort((a, b) => b.amplitude - a.amplitude || a.parametre.localeCompare(b.parametre));
  return { variation, vanCentrale, lignes };
}

export const BORNES_PAR_DEFAUT = { basPct: -20, hautPct: 20 } as const;

export function bornesParametre(bc: BusinessCase, parametre: ParametreIncertainId): { basPct: number; hautPct: number } {
  return bc.incertitudes[parametre] ?? BORNES_PAR_DEFAUT;
}

export interface ClasseHistogramme {
  debut: number;
  fin: number;
  effectif: number;
}

export interface ResultatMonteCarlo {
  iterations: number;
  graine: number;
  p10: number;
  p50: number;
  p90: number;
  moyenne: number;
  min: number;
  max: number;
  /** Part des tirages dont la VAN est strictement positive. */
  probaVanPositive: number;
  histogramme: ClasseHistogramme[];
  /** VAN de chaque tirage, dans l'ordre d'échantillonnage (sert à l'animation progressive). */
  tirages: Float64Array;
}

/** Pas « rond » (1, 2, 2,5 ou 5 x 10^k) proche du pas brut demandé. */
export function pasArrondi(brut: number): number {
  if (!(brut > 0) || !Number.isFinite(brut)) return 1;
  const puissance = 10 ** Math.floor(Math.log10(brut));
  const normalise = brut / puissance;
  const candidat = [1, 2, 2.5, 5, 10].find((c) => normalise <= c) ?? 10;
  return candidat * puissance;
}

/** Histogramme à pas rond ; 0 tombe sur une borne de classe pour séparer VAN négatives et positives. */
export function construireHistogramme(trie: ArrayLike<number>, classesVisees = 24): ClasseHistogramme[] {
  const n = trie.length;
  if (n === 0) return [];
  const min = trie[0] ?? 0;
  const max = trie[n - 1] ?? 0;
  if (max - min < 1e-9) return [{ debut: min, fin: max, effectif: n }];
  const pas = pasArrondi((max - min) / classesVisees);
  const debut = Math.floor(min / pas) * pas;
  const nbClasses = Math.max(1, Math.ceil((max - debut) / pas + 1e-9));
  const classes: ClasseHistogramme[] = Array.from({ length: nbClasses }, (_, i) => ({
    debut: debut + i * pas,
    fin: debut + (i + 1) * pas,
    effectif: 0,
  }));
  for (let i = 0; i < n; i += 1) {
    const v = trie[i] ?? 0;
    const indice = Math.min(nbClasses - 1, Math.floor((v - debut) / pas));
    const classe = classes[indice];
    if (classe) classe.effectif += 1;
  }
  return classes;
}

/**
 * Simulation de Monte Carlo de la VAN. À chaque tirage, chaque paramètre actif reçoit un facteur
 * multiplicatif tiré selon une loi triangulaire (1 + bas %, 1, 1 + haut %). Graine fixe = résultat reproductible.
 */
export function simulerMonteCarlo(bc: BusinessCase, options?: { iterations?: number; graine?: number }): ResultatMonteCarlo {
  const iterations = Math.max(1, Math.round(options?.iterations ?? bc.monteCarlo.iterations));
  const graine = options?.graine ?? bc.monteCarlo.graine;
  const aleatoire = mulberry32(graine);
  const parametres = parametresActifs(bc).map((id) => {
    const { basPct, hautPct } = bornesParametre(bc, id);
    return { id, bas: 1 + Math.min(0, basPct) / 100, haut: 1 + Math.max(0, hautPct) / 100 };
  });

  const tirages = new Float64Array(iterations);
  for (let i = 0; i < iterations; i += 1) {
    let tirage = bc;
    for (const p of parametres) {
      const facteur = quantileTriangulaire(aleatoire(), p.bas, 1, p.haut);
      tirage = appliquerFacteur(tirage, p.id, facteur);
    }
    tirages[i] = calculerVan(tirage);
  }
  const trie = Float64Array.from(tirages).sort();
  return { ...statistiques(trie, iterations, graine), histogramme: construireHistogramme(trie), tirages };
}

/** Statistiques descriptives d'un échantillon trié de VAN. */
export function statistiques(
  trie: Float64Array,
  iterations: number,
  graine: number,
): Omit<ResultatMonteCarlo, 'histogramme' | 'tirages'> {
  const n = trie.length;
  let somme = 0;
  let positifs = 0;
  for (let i = 0; i < n; i += 1) {
    const v = trie[i] ?? 0;
    somme += v;
    if (v > 0) positifs += 1;
  }
  return {
    iterations,
    graine,
    p10: centile(trie, 0.1),
    p50: centile(trie, 0.5),
    p90: centile(trie, 0.9),
    moyenne: n ? somme / n : Number.NaN,
    min: trie[0] ?? 0,
    max: trie[n - 1] ?? 0,
    probaVanPositive: n ? positifs / n : 0,
  };
}

/**
 * Effectifs des classes (fixées sur l'échantillon complet) pour les k premiers tirages :
 * l'histogramme se construit au fil de l'échantillonnage sans que ses classes ne bougent.
 */
export function compterDansClasses(tirages: ArrayLike<number>, classes: readonly ClasseHistogramme[], k: number): number[] {
  const effectifs = classes.map(() => 0);
  const premiere = classes[0];
  const derniere = classes[classes.length - 1];
  if (!premiere || !derniere) return effectifs;
  const pas = premiere.fin - premiere.debut;
  const n = Math.min(k, tirages.length);
  for (let i = 0; i < n; i += 1) {
    const v = tirages[i] ?? 0;
    const indice = pas > 0 ? Math.min(classes.length - 1, Math.max(0, Math.floor((v - premiere.debut) / pas))) : 0;
    effectifs[indice] = (effectifs[indice] ?? 0) + 1;
  }
  return effectifs;
}
