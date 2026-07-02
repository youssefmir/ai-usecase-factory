/**
 * Aides à l'écriture des portefeuilles de démonstration (données fictives).
 * Toutes les valeurs chiffrées sont des hypothèses : leur provenance est marquée « hypothese ».
 */
import {
  ChampsBusinessCase,
  type Bornes,
  type BusinessCase,
  type CategorieRisqueId,
  type ImplicationId,
  type Kpi,
  type ParametreIncertainId,
  type PartiePrenante,
  type Persona,
  type ProvenanceId,
  type Risque,
  type Scores,
  type SourceDonnees,
} from '../../domain/model';
import { CRITERES_IDS } from '../../domain/scoring/criteria';

export function fabriqueIds(prefixe: string) {
  let n = 0;
  return () => `${prefixe}-${(n += 1)}`;
}

export const persona = (id: string, nom: string, role: string, besoin: string): Persona => ({ id, nom, role, besoin });

export const source = (
  id: string,
  nom: string,
  description: string,
  disponibilite: SourceDonnees['disponibilite'],
  qualite: SourceDonnees['qualite'],
  personnelles: boolean,
  proprietaire: string,
): SourceDonnees => ({ id, nom, description, disponibilite, qualite, personnelles, proprietaire });

export const kpi = (id: string, nom: string, unite: string, baseline: number | null, cible: number | null, origine: string): Kpi => ({
  id,
  nom,
  unite,
  baseline,
  cible,
  source: origine,
});

export const partie = (id: string, nom: string, implication: ImplicationId, attentes: string): PartiePrenante => ({
  id,
  nom,
  implication,
  attentes,
});

export const risque = (
  id: string,
  description: string,
  categorie: CategorieRisqueId,
  probabilite: number,
  impact: number,
  mitigation: string,
): Risque => ({ id, description, categorie, probabilite, impact, mitigation });

/**
 * Notes des 12 critères dans l'ordre de la grille :
 * valeur (financier, client, stratégie, urgence), faisabilité (données, complexité, SI, compétences),
 * risque (réglementaire, éthique, opérationnel, adoption).
 */
export function notes(valeurs: readonly number[]): Scores {
  if (valeurs.length !== CRITERES_IDS.length) throw new Error('12 notes attendues');
  return Object.fromEntries(CRITERES_IDS.map((id, i) => [id, valeurs[i] ?? null])) as Scores;
}

/** Toutes les entrées du business case sont des hypothèses de démonstration. */
export function provenanceHypothese(): Partial<Record<(typeof ChampsBusinessCase)[number], ProvenanceId>> {
  return Object.fromEntries(ChampsBusinessCase.map((c) => [c, 'hypothese']));
}

/** Profil d'incertitude par défaut : les bornes reflètent les biais usuels d'estimation. */
export const INCERTITUDES_TYPE: Partial<Record<ParametreIncertainId, Bornes>> = {
  volumeAnnuel: { basPct: -10, hautPct: 10 },
  tempsUnitaireMin: { basPct: -25, hautPct: 20 },
  partAutomatisable: { basPct: -40, hautPct: 15 },
  coutHoraire: { basPct: -5, hautPct: 5 },
  adoption: { basPct: -35, hautPct: 10 },
  gainsQualite: { basPct: -60, hautPct: 30 },
  joursBuild: { basPct: -10, hautPct: 50 },
  tjm: { basPct: -5, hautPct: 10 },
  infraAnnuelle: { basPct: -10, hautPct: 30 },
  prixMillionTokens: { basPct: -50, hautPct: 50 },
};

type EntreesBusinessCase = Omit<BusinessCase, 'incertitudes' | 'monteCarlo' | 'provenance' | 'notes'> & {
  incertitudes?: Partial<Record<ParametreIncertainId, Bornes>>;
  notes?: string;
  graine?: number;
};

export function businessCase(e: EntreesBusinessCase): BusinessCase {
  const { incertitudes, notes: commentaire, graine, ...reste } = e;
  return {
    ...reste,
    incertitudes: { ...INCERTITUDES_TYPE, ...incertitudes },
    monteCarlo: { iterations: 5000, graine: graine ?? 2026 },
    provenance: provenanceHypothese(),
    notes:
      commentaire ??
      'Valeurs de démonstration : hypothèses plausibles à remplacer par des mesures et des estimations validées par le métier.',
  };
}

export const SANS_LLM = { llmActif: false, requetesParUnite: 0, tokensParRequete: 0, prixMillionTokens: 0 } as const;

export const AUCUNE_TRANSPARENCE = {
  interactionDirecte: false,
  contenuSynthetique: false,
  emotionOuBiometrie: false,
  hypertrucage: false,
  texteInteretPublic: false,
} as const;
