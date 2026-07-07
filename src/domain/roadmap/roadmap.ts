/**
 * Proposition automatique de roadmap en trois vagues (0-3, 3-9 et 9-18 mois).
 *
 * Règles (docs/methode-scoring.md, section Roadmap) :
 * 1. Hors roadmap : statut « écarté », pratique interdite, quadrant « À écarter » ou scoring incomplet.
 * 2. Vague minimale selon le quadrant : Quick win -> 1 ; Projet stratégique -> 2 (3 si faisabilité < 2,5) ;
 *    À explorer -> 3. Haut risque AI Act ou risque global élevé -> vague 2 au plus tôt.
 * 3. Un cas est planifié strictement après ses prérequis (dépendances entre cas).
 * 4. Capacité par vague : les cas éligibles sont retenus par score de priorité décroissant ;
 *    le surplus glisse à la vague suivante, puis « au-delà de 18 mois ».
 * 5. Un ajustement manuel remplace la proposition ; les incohérences sont signalées, jamais bloquées.
 */
import type { NiveauAiAct } from '../aiAct/qualification';
import { typographie } from '../format';
import type { UseCase, Vague } from '../model';
import { SEUIL_RISQUE_ELEVE, type ResultatScoring } from '../scoring/scoring';

/** 0 = hors roadmap, 1 à 3 = vagues, 4 = au-delà de 18 mois. */
export type VagueRoadmap = 0 | 1 | 2 | 3 | 4;

export const VAGUES = [
  { id: 1, libelle: 'Vague 1', fenetre: '0 à 3 mois', debutMois: 0, finMois: 3 },
  { id: 2, libelle: 'Vague 2', fenetre: '3 à 9 mois', debutMois: 3, finMois: 9 },
  { id: 3, libelle: 'Vague 3', fenetre: '9 à 18 mois', debutMois: 9, finMois: 18 },
] as const;

export const HORIZON_ROADMAP_MOIS = 18;

/** Seuil de faisabilité (sur 5) en dessous duquel un projet stratégique est repoussé en vague 3. */
export const SEUIL_FAISABILITE_TRES_FAIBLE = 2.5;

export function libelleVague(v: VagueRoadmap): string {
  if (v === 0) return 'Hors roadmap';
  if (v === 4) return 'Au-delà de 18 mois';
  return VAGUES[v - 1]?.libelle ?? `Vague ${v}`;
}

export interface CasPlanifiable {
  cas: UseCase;
  scoring: ResultatScoring;
  niveauAiAct: NiveauAiAct;
  /** Niveau provisoire (utile si la qualification est incomplète). */
  niveauAiActProvisoire: Exclude<NiveauAiAct, 'incomplet'>;
}

export interface EntreeRoadmap {
  casId: string;
  code: string;
  titre: string;
  vagueProposee: VagueRoadmap;
  vague: VagueRoadmap;
  manuelle: boolean;
  priorite: number | null;
  vagueMinimale: VagueRoadmap;
  raisons: string[];
  conflits: string[];
  debutMois: number | null;
  finMois: number | null;
}

export interface ResultatRoadmap {
  entrees: EntreeRoadmap[];
  alertes: string[];
}

function fenetre(v: VagueRoadmap): { debutMois: number | null; finMois: number | null } {
  const w = v >= 1 && v <= 3 ? VAGUES[v - 1] : undefined;
  if (w) return { debutMois: w.debutMois, finMois: w.finMois };
  return { debutMois: null, finMois: null };
}

/** Cas impliqués dans une dépendance circulaire (parcours en profondeur). */
export function casEnCycle(graphe: Map<string, string[]>): Set<string> {
  const enCycle = new Set<string>();
  const etat = new Map<string, 'en_cours' | 'fini'>();
  const pile: string[] = [];
  const visiter = (noeud: string) => {
    etat.set(noeud, 'en_cours');
    pile.push(noeud);
    for (const voisin of graphe.get(noeud) ?? []) {
      if (!graphe.has(voisin)) continue;
      const e = etat.get(voisin);
      if (e === 'en_cours') {
        const debut = pile.indexOf(voisin);
        pile.slice(debut).forEach((n) => enCycle.add(n));
      } else if (!e) {
        visiter(voisin);
      }
    }
    pile.pop();
    etat.set(noeud, 'fini');
  };
  for (const noeud of graphe.keys()) if (!etat.has(noeud)) visiter(noeud);
  return enCycle;
}

export function proposerRoadmap(
  elements: readonly CasPlanifiable[],
  capacite: readonly [number, number, number] = [3, 3, 3],
): ResultatRoadmap {
  const parId = new Map(elements.map((e) => [e.cas.id, e]));
  const libelle = (id: string) => parId.get(id)?.cas.code || parId.get(id)?.cas.titre || id;
  const raisons = new Map<string, string[]>(elements.map((e) => [e.cas.id, []]));
  const ajouterRaison = (id: string, texte: string) => raisons.get(id)?.push(texte);

  /* 1. Exclusions et vague minimale */
  const exclus = new Set<string>();
  const vagueMin = new Map<string, number>();
  for (const { cas, scoring, niveauAiAct, niveauAiActProvisoire } of elements) {
    if (cas.statut === 'ecarte') {
      exclus.add(cas.id);
      ajouterRaison(cas.id, 'Cas écarté (statut).');
      continue;
    }
    if (niveauAiAct === 'interdit') {
      exclus.add(cas.id);
      ajouterRaison(cas.id, 'Pratique interdite par l’AI Act : non planifiable.');
      continue;
    }
    if (scoring.quadrant === null) {
      exclus.add(cas.id);
      ajouterRaison(cas.id, 'Scoring incomplet : à compléter avant planification.');
      continue;
    }
    if (scoring.quadrant === 'a_ecarter') {
      exclus.add(cas.id);
      ajouterRaison(cas.id, 'Quadrant « À écarter » : non planifié en l’état.');
      continue;
    }
    let min = 1;
    if (scoring.quadrant === 'quick_win') {
      ajouterRaison(cas.id, 'Quick win : éligible dès la vague 1.');
    } else if (scoring.quadrant === 'strategique') {
      const faisabilite = scoring.faisabilite.note ?? 0;
      if (faisabilite < SEUIL_FAISABILITE_TRES_FAIBLE) {
        min = 3;
        ajouterRaison(cas.id, 'Projet stratégique à faisabilité très faible : prérequis à construire, vague 3 au plus tôt.');
      } else {
        min = 2;
        ajouterRaison(cas.id, 'Projet stratégique : préparation nécessaire, vague 2 au plus tôt.');
      }
    } else {
      min = 3;
      ajouterRaison(cas.id, 'À explorer : expérimentation planifiée en vague 3.');
    }
    if (niveauAiActProvisoire === 'haut_risque' && min < 2) {
      min = 2;
      ajouterRaison(cas.id, 'Haut risque AI Act : mise en conformité préalable (FRIA, documentation, contrôle humain), vague 2 au plus tôt.');
    } else if (niveauAiActProvisoire === 'haut_risque') {
      ajouterRaison(cas.id, 'Haut risque AI Act : prévoir les livrables de conformité dans le lot.');
    }
    if ((scoring.risque.note ?? 0) >= SEUIL_RISQUE_ELEVE && min < 2) {
      min = 2;
      ajouterRaison(cas.id, 'Risque global élevé : arbitrage et mesures de maîtrise avant lancement, vague 2 au plus tôt.');
    }
    vagueMin.set(cas.id, min);
  }

  /* 2. Graphe des dépendances (prérequis connus et non exclus) */
  const prerequis = new Map<string, string[]>();
  for (const { cas } of elements) {
    if (exclus.has(cas.id)) continue;
    const deps = cas.dependances.cas.filter((d) => d !== cas.id && parId.has(d));
    for (const d of deps) {
      if (exclus.has(d)) ajouterRaison(cas.id, `Prérequis ${libelle(d)} hors roadmap : dépendance ignorée pour la planification, à arbitrer.`);
    }
    prerequis.set(
      cas.id,
      deps.filter((d) => !exclus.has(d)),
    );
  }
  const cycles = casEnCycle(prerequis);
  for (const id of cycles) ajouterRaison(id, 'Dépendance circulaire détectée : planification impossible sans arbitrage.');

  /* 3. Ordonnancement par vagues avec capacité */
  const planifie = new Map<string, number>();
  const prioriteDe = (id: string) => parId.get(id)?.scoring.priorite ?? -1;
  for (let vague = 1; vague <= 3; vague += 1) {
    const eligibles = [...prerequis.keys()].filter((id) => {
      if (planifie.has(id) || cycles.has(id)) return false;
      if ((vagueMin.get(id) ?? 99) > vague) return false;
      return (prerequis.get(id) ?? []).every((d) => (planifie.get(d) ?? 99) < vague);
    });
    eligibles.sort((a, b) => prioriteDe(b) - prioriteDe(a) || libelle(a).localeCompare(libelle(b)));
    const places = capacite[vague - 1] ?? 0;
    eligibles.slice(0, places).forEach((id) => planifie.set(id, vague));
    eligibles.slice(places).forEach((id) => ajouterRaison(id, `Capacité de la vague ${vague} atteinte (${places} cas) : report.`));
  }

  /* 4. Raisons des reports liés aux dépendances, puis entrées finales */
  for (const [id, deps] of prerequis) {
    const v = planifie.get(id);
    for (const d of deps) {
      const vd = planifie.get(d);
      if (vd !== undefined && v !== undefined && vd < v && (vagueMin.get(id) ?? 1) < v) {
        ajouterRaison(id, `Planifié après son prérequis ${libelle(d)} (vague ${vd}).`);
      }
    }
  }

  const proposee = (id: string): VagueRoadmap => {
    if (exclus.has(id)) return 0;
    const v = planifie.get(id);
    return v === undefined ? 4 : (v as VagueRoadmap);
  };

  const entrees: EntreeRoadmap[] = elements.map(({ cas, scoring }) => {
    const vagueProposee = proposee(cas.id);
    const manuelle = cas.roadmap.vagueManuelle !== null;
    const vague: VagueRoadmap = manuelle ? (cas.roadmap.vagueManuelle as Vague) : vagueProposee;
    const r = [...(raisons.get(cas.id) ?? [])];
    if (vagueProposee === 4 && !cycles.has(cas.id)) r.push('Non planifiable dans les 18 mois (capacité ou prérequis).');
    if (manuelle) r.push(`Ajustement manuel : ${libelleVague(vague)} (proposition : ${libelleVague(vagueProposee)}).`);
    return {
      casId: cas.id,
      code: cas.code,
      titre: cas.titre,
      vagueProposee,
      vague,
      manuelle,
      priorite: scoring.priorite,
      vagueMinimale: (vagueMin.get(cas.id) ?? 0) as VagueRoadmap,
      raisons: r.map(typographie),
      conflits: [],
      ...fenetre(vague),
    };
  });

  /* 5. Contrôles de cohérence sur la planification retenue */
  const vagueRetenue = new Map(entrees.map((e) => [e.casId, e.vague]));
  const alertes: string[] = [];
  for (const e of entrees) {
    if (e.vague < 1 || e.vague > 3) continue;
    const element = parId.get(e.casId);
    for (const d of element?.cas.dependances.cas ?? []) {
      if (!parId.has(d) || d === e.casId) continue;
      const vd = vagueRetenue.get(d) ?? 0;
      if (vd === 0 || vd === 4) e.conflits.push(`Prérequis ${libelle(d)} non planifié.`);
      else if (vd >= e.vague) e.conflits.push(`Planifié avant la fin de son prérequis ${libelle(d)} (${libelleVague(vd)}).`);
    }
    if (e.manuelle && e.vague === 1 && element?.niveauAiActProvisoire === 'haut_risque') {
      e.conflits.push('Haut risque en vague 1 : délai de mise en conformité très court.');
    }
  }
  for (let v = 1; v <= 3; v += 1) {
    const nb = entrees.filter((e) => e.vague === v).length;
    const cap = capacite[v - 1] ?? 0;
    if (nb > cap) alertes.push(`${libelleVague(v as VagueRoadmap)} : ${nb} cas pour une capacité de ${cap}.`);
  }

  return { entrees, alertes };
}

/** Ajoute un nombre de mois à une date ISO (jour forcé au 1er du mois). */
export function ajouterMois(dateIso: string, mois: number): string {
  const [annee = 2026, m = 1] = dateIso.split('-').map(Number);
  const total = annee * 12 + (m - 1) + mois;
  const a = Math.floor(total / 12);
  const mm = (total % 12) + 1;
  return `${a}-${String(mm).padStart(2, '0')}-01`;
}

/** Position (en mois depuis le début de la roadmap) d'une date ISO, éventuellement fractionnaire. */
export function moisDepuis(debutIso: string, dateIso: string): number {
  const [a1 = 0, m1 = 1, j1 = 1] = debutIso.split('-').map(Number);
  const [a2 = 0, m2 = 1, j2 = 1] = dateIso.split('-').map(Number);
  return (a2 - a1) * 12 + (m2 - m1) + (j2 - j1) / 30.4;
}
