/**
 * Moteur de scoring multicritère.
 *
 * - Note d'axe = moyenne pondérée des notes de ses critères (échelle 1 à 5).
 * - Conversion sur 100 : (note - 1) / 4 x 100.
 * - Score de priorité = moyenne pondérée de Valeur, Faisabilité et (100 - Risque).
 * - Quadrant = position Valeur x Faisabilité par rapport aux seuils (bornes incluses).
 *
 * Toutes les fonctions sont pures : mêmes entrées, mêmes sorties (testées dans scoring.test.ts).
 */
import { fmtNombre } from '../format';
import type { ConfigScoring, Scores } from '../model';
import type { NiveauAiAct } from '../aiAct/qualification';
import { AXES, CRITERES, type AxeId, type CritereId, type QuadrantId, libelleQuadrant } from './criteria';

export interface Contribution {
  critere: CritereId;
  libelle: string;
  note: number | null;
  poids: number;
  /** Poids rapporté à la somme des poids de l'axe (0 à 1). */
  poidsNormalise: number;
  /** Part de la note d'axe apportée par ce critère (note x poids normalisé). */
  contribution: number | null;
  descripteur: string | null;
}

export interface ResultatAxe {
  axe: AxeId;
  libelle: string;
  /** Note de 1 à 5 (null si au moins un critère n'est pas noté). */
  note: number | null;
  /** Même note ramenée sur 100. */
  note100: number | null;
  complet: boolean;
  manquants: CritereId[];
  contributions: Contribution[];
}

export interface ResultatScoring {
  valeur: ResultatAxe;
  faisabilite: ResultatAxe;
  risque: ResultatAxe;
  /** Score de priorité de 0 à 100 (null si incomplet). */
  priorite: number | null;
  quadrant: QuadrantId | null;
  complet: boolean;
  alertes: string[];
  explication: string[];
}

/** Seuil de risque (sur 5) au-delà duquel une alerte d'arbitrage est levée. */
export const SEUIL_RISQUE_ELEVE = 3.5;

const arrondi = (x: number, decimales = 2) => {
  const f = 10 ** decimales;
  return Math.round(x * f) / f;
};

export function versCent(note: number): number {
  return arrondi(((note - 1) / 4) * 100, 1);
}

/** Poids effectif d'un critère : poids personnalisé du portefeuille, sinon poids par défaut. */
export function poidsCritere(config: ConfigScoring, critere: CritereId): number {
  const personnalise = config.poids[critere];
  if (typeof personnalise === 'number' && Number.isFinite(personnalise)) return Math.max(0, personnalise);
  return CRITERES.find((c) => c.id === critere)?.poidsDefaut ?? 0;
}

export function calculerAxe(axe: AxeId, scores: Scores, config: ConfigScoring): ResultatAxe {
  const criteres = CRITERES.filter((c) => c.axe === axe);
  const poidsBruts = criteres.map((c) => poidsCritere(config, c.id));
  const somme = poidsBruts.reduce((s, p) => s + p, 0);
  // Si tous les poids sont nuls, on retombe sur une pondération égale.
  const poids = somme > 0 ? poidsBruts : criteres.map(() => 1);
  const total = poids.reduce((s, p) => s + p, 0);

  const contributions: Contribution[] = criteres.map((c, i) => {
    const note = scores[c.id];
    const p = poids[i] ?? 0;
    const poidsNormalise = total > 0 ? p / total : 0;
    return {
      critere: c.id,
      libelle: c.libelle,
      note,
      poids: p,
      poidsNormalise,
      contribution: note === null ? null : note * poidsNormalise,
      descripteur: note === null ? null : (c.niveaux[note - 1] ?? null),
    };
  });

  const manquants = contributions.filter((c) => c.note === null).map((c) => c.critere);
  const complet = manquants.length === 0;
  const note = complet ? arrondi(contributions.reduce((s, c) => s + (c.contribution ?? 0), 0)) : null;

  return {
    axe,
    libelle: AXES.find((a) => a.id === axe)?.libelle ?? axe,
    note,
    note100: note === null ? null : versCent(note),
    complet,
    manquants,
    contributions,
  };
}

/** Quadrant de la matrice Valeur x Faisabilité (les seuils sont inclus côté « élevé »). */
export function determinerQuadrant(
  valeur: number,
  faisabilite: number,
  seuilValeur: number,
  seuilFaisabilite: number,
): QuadrantId {
  const valeurHaute = valeur >= seuilValeur;
  const faisable = faisabilite >= seuilFaisabilite;
  if (valeurHaute && faisable) return 'quick_win';
  if (valeurHaute) return 'strategique';
  if (faisable) return 'a_explorer';
  return 'a_ecarter';
}

/** Parts des trois axes dans le score de priorité (somme = 1 ; pondération égale si tous les poids sont nuls). */
export function partsAxes(poidsAxes: ConfigScoring['poidsAxes']): ConfigScoring['poidsAxes'] {
  const { valeur, faisabilite, risque } = poidsAxes;
  const total = valeur + faisabilite + risque;
  if (total <= 0) return { valeur: 1 / 3, faisabilite: 1 / 3, risque: 1 / 3 };
  return { valeur: valeur / total, faisabilite: faisabilite / total, risque: risque / total };
}

/** Score de priorité (0 à 100) : la faisabilité et la valeur augmentent la priorité, le risque la diminue. */
export function calculerPriorite(
  valeur100: number,
  faisabilite100: number,
  risque100: number,
  poidsAxes: ConfigScoring['poidsAxes'],
): number {
  const parts = partsAxes(poidsAxes);
  return arrondi(parts.valeur * valeur100 + parts.faisabilite * faisabilite100 + parts.risque * (100 - risque100), 1);
}

/** Première lettre en minuscule (conserve les sigles : « intégration SI »). */
const minuscule = (texte: string) => texte.charAt(0).toLowerCase() + texte.slice(1);

function phraseAxe(resultat: ResultatAxe): string {
  if (resultat.note === null) {
    return `${resultat.libelle} : ${resultat.manquants.length} critère(s) à noter.`;
  }
  const notes = resultat.contributions.filter((c) => c.note !== null);
  const parNote = [...notes].sort((a, b) => (b.note ?? 0) - (a.note ?? 0) || b.poids - a.poids);
  const entete = `${resultat.libelle} ${fmtNombre(resultat.note, 1)}/5 (${fmtNombre(resultat.note100 ?? 0, 0)}/100)`;

  if (resultat.axe === 'risque') {
    const principaux = parNote.filter((c) => (c.note ?? 0) >= 3).slice(0, 2);
    if (principaux.length === 0) return `${entete} : aucun facteur de risque marqué.`;
    return `${entete} : principaux facteurs ${principaux.map((c) => `${minuscule(c.libelle)} (${c.note}/5)`).join(' et ')}.`;
  }

  const forts = parNote.filter((c) => (c.note ?? 0) >= 4).slice(0, 2);
  const faibles = [...parNote].reverse().filter((c) => (c.note ?? 0) <= 2).slice(0, 2);
  const morceaux: string[] = [];
  if (forts.length) morceaux.push(`portée par ${forts.map((c) => `${minuscule(c.libelle)} (${c.note}/5)`).join(' et ')}`);
  if (faibles.length) morceaux.push(`freinée par ${faibles.map((c) => `${minuscule(c.libelle)} (${c.note}/5)`).join(' et ')}`);
  return morceaux.length ? `${entete} : ${morceaux.join(', ')}.` : `${entete} : profil homogène.`;
}

export interface OptionsScoring {
  /** Niveau AI Act déjà calculé : une pratique interdite force le quadrant « À écarter ». */
  niveauAiAct?: NiveauAiAct | null;
}

export function calculerScoring(scores: Scores, config: ConfigScoring, options: OptionsScoring = {}): ResultatScoring {
  const valeur = calculerAxe('valeur', scores, config);
  const faisabilite = calculerAxe('faisabilite', scores, config);
  const risque = calculerAxe('risque', scores, config);
  const complet = valeur.complet && faisabilite.complet && risque.complet;
  const alertes: string[] = [];
  const explication: string[] = [phraseAxe(valeur), phraseAxe(faisabilite), phraseAxe(risque)];

  let quadrant: QuadrantId | null = null;
  let priorite: number | null = null;

  if (valeur.note !== null && faisabilite.note !== null) {
    quadrant = determinerQuadrant(valeur.note, faisabilite.note, config.seuilValeur, config.seuilFaisabilite);
    const comparaisonV = valeur.note >= config.seuilValeur ? '≥' : '<';
    const comparaisonF = faisabilite.note >= config.seuilFaisabilite ? '≥' : '<';
    explication.push(
      `Valeur ${comparaisonV} ${fmtNombre(config.seuilValeur, 1)} et faisabilité ${comparaisonF} ${fmtNombre(
        config.seuilFaisabilite,
        1,
      )} : quadrant « ${libelleQuadrant(quadrant)} ».`,
    );
  }

  if (complet && valeur.note100 !== null && faisabilite.note100 !== null && risque.note100 !== null) {
    priorite = calculerPriorite(valeur.note100, faisabilite.note100, risque.note100, config.poidsAxes);
    const parts = partsAxes(config.poidsAxes);
    const pct = (p: number) => fmtNombre(p * 100, 0);
    explication.push(
      `Priorité ${fmtNombre(priorite, 0)}/100 = ${pct(parts.valeur)} % × valeur ${fmtNombre(valeur.note100, 0)} + ${pct(
        parts.faisabilite,
      )} % × faisabilité ${fmtNombre(faisabilite.note100, 0)} + ${pct(parts.risque)} % × (100 − risque ${fmtNombre(
        risque.note100,
        0,
      )}).`,
    );
  }

  if (risque.note !== null && risque.note >= SEUIL_RISQUE_ELEVE) {
    alertes.push(
      `Risque élevé (${fmtNombre(risque.note, 1)}/5) : arbitrage du comité et mesures de maîtrise requis avant engagement.`,
    );
  }

  if (options.niveauAiAct === 'interdit') {
    quadrant = 'a_ecarter';
    alertes.unshift('Pratique interdite par l’AI Act (art. 5) : cas à écarter, quel que soit son score.');
    explication.push('Qualification AI Act « pratique interdite » : le quadrant est forcé à « À écarter ».');
  }

  if (!complet) {
    const nb = valeur.manquants.length + faisabilite.manquants.length + risque.manquants.length;
    alertes.push(`${nb} critère(s) non noté(s) : le score de priorité sera calculé une fois la grille complète.`);
  }

  return { valeur, faisabilite, risque, priorite, quadrant, complet, alertes, explication };
}
