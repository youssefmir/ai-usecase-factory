/**
 * Modèle de données de l'application, défini par des schémas zod.
 * Les schémas servent à la fois de source des types TypeScript et de garde-fou
 * à l'import JSON (fichiers produits par l'export ou par l'assistant de saisie).
 */
import { z } from 'zod';
import {
  CAS_ANNEXE_III_IDS,
  DEROGATIONS_IDS,
  EXCLUSIONS_IDS,
  OPTIONS_GPAI_IDS,
  PRATIQUES_INTERDITES_IDS,
  ROLES_IDS,
} from './aiAct/catalog';
import { BASES_LEGALES_IDS, CATEGORIES_ART_9_IDS, CRITERES_AIPD_IDS } from './rgpd/catalog';
import { CRITERES_IDS, type CritereId } from './scoring/criteria';

/* ------------------------------------------------------------------ */
/* Valeurs de base                                                     */
/* ------------------------------------------------------------------ */

export const ReponseSchema = z.enum(['oui', 'non', 'nsp']);
export type Reponse = z.infer<typeof ReponseSchema>;

export const TYPOLOGIES = [
  { id: 'assistant_generatif', libelle: 'Assistant génératif' },
  { id: 'rag', libelle: 'RAG (recherche augmentée)' },
  { id: 'extraction_documentaire', libelle: 'Extraction documentaire' },
  { id: 'classification', libelle: 'Classification / scoring' },
  { id: 'prevision', libelle: 'Prévision' },
  { id: 'detection_anomalies', libelle: "Détection d'anomalies" },
  { id: 'optimisation', libelle: 'Optimisation' },
  { id: 'agent', libelle: 'Agent' },
] as const;
export type TypologieId = (typeof TYPOLOGIES)[number]['id'];
export const TypologieSchema = z.enum(TYPOLOGIES.map((t) => t.id) as [TypologieId, ...TypologieId[]]);

export function libelleTypologie(id: TypologieId | null | undefined): string {
  return TYPOLOGIES.find((t) => t.id === id)?.libelle ?? 'Non renseignée';
}

export const STATUTS = [
  { id: 'idee', libelle: 'Idée' },
  { id: 'en_cadrage', libelle: 'En cadrage' },
  { id: 'pret_decision', libelle: 'Prêt pour décision' },
  { id: 'valide', libelle: 'Validé' },
  { id: 'ecarte', libelle: 'Écarté' },
] as const;
export type StatutId = (typeof STATUTS)[number]['id'];
export const StatutSchema = z.enum(STATUTS.map((s) => s.id) as [StatutId, ...StatutId[]]);

export const PROVENANCES = [
  { id: 'hypothese', libelle: 'Hypothèse' },
  { id: 'estimation_metier', libelle: 'Estimation métier' },
  { id: 'mesure', libelle: 'Mesure' },
] as const;
export type ProvenanceId = (typeof PROVENANCES)[number]['id'];
export const ProvenanceSchema = z.enum(PROVENANCES.map((p) => p.id) as [ProvenanceId, ...ProvenanceId[]]);

const texte = () => z.string().default('');
const id = () => z.string().min(1);

/* ------------------------------------------------------------------ */
/* Fiche cas d'usage                                                   */
/* ------------------------------------------------------------------ */

export const PersonaSchema = z.object({
  id: id(),
  nom: z.string().default(''),
  role: texte(),
  besoin: texte(),
});
export type Persona = z.infer<typeof PersonaSchema>;

export const DISPONIBILITES = [
  { id: 'disponible', libelle: 'Disponible' },
  { id: 'partielle', libelle: 'Partielle' },
  { id: 'a_constituer', libelle: 'À constituer' },
] as const;
export const QUALITES = [
  { id: 'bonne', libelle: 'Bonne' },
  { id: 'moyenne', libelle: 'Moyenne' },
  { id: 'faible', libelle: 'Faible' },
  { id: 'inconnue', libelle: 'Inconnue' },
] as const;

export const SourceDonneesSchema = z.object({
  id: id(),
  nom: z.string().default(''),
  description: texte(),
  disponibilite: z.enum(['disponible', 'partielle', 'a_constituer']).default('partielle'),
  qualite: z.enum(['bonne', 'moyenne', 'faible', 'inconnue']).default('inconnue'),
  personnelles: z.boolean().default(false),
  proprietaire: texte(),
});
export type SourceDonnees = z.infer<typeof SourceDonneesSchema>;

export const KpiSchema = z.object({
  id: id(),
  nom: z.string().default(''),
  unite: texte(),
  baseline: z.number().nullable().default(null),
  cible: z.number().nullable().default(null),
  source: texte(),
});
export type Kpi = z.infer<typeof KpiSchema>;

export const IMPLICATIONS = [
  { id: 'sponsor', libelle: 'Sponsor' },
  { id: 'decideur', libelle: 'Décideur' },
  { id: 'utilisateur', libelle: 'Utilisateur' },
  { id: 'contributeur', libelle: 'Contributeur' },
  { id: 'expert', libelle: 'Expert / validation' },
  { id: 'informe', libelle: 'Informé' },
] as const;
export type ImplicationId = (typeof IMPLICATIONS)[number]['id'];

export const PartiePrenanteSchema = z.object({
  id: id(),
  nom: z.string().default(''),
  implication: z
    .enum(IMPLICATIONS.map((i) => i.id) as [ImplicationId, ...ImplicationId[]])
    .default('contributeur'),
  attentes: texte(),
});
export type PartiePrenante = z.infer<typeof PartiePrenanteSchema>;

export const CATEGORIES_RISQUE = [
  { id: 'donnees', libelle: 'Données' },
  { id: 'technique', libelle: 'Technique' },
  { id: 'conformite', libelle: 'Conformité' },
  { id: 'adoption', libelle: 'Adoption' },
  { id: 'operationnel', libelle: 'Opérationnel' },
  { id: 'ethique', libelle: 'Éthique' },
] as const;
export type CategorieRisqueId = (typeof CATEGORIES_RISQUE)[number]['id'];

export const RisqueSchema = z.object({
  id: id(),
  description: z.string().default(''),
  categorie: z
    .enum(CATEGORIES_RISQUE.map((c) => c.id) as [CategorieRisqueId, ...CategorieRisqueId[]])
    .default('operationnel'),
  probabilite: z.number().int().min(1).max(3).default(2),
  impact: z.number().int().min(1).max(3).default(2),
  mitigation: texte(),
});
export type Risque = z.infer<typeof RisqueSchema>;

const NoteSchema = z.number().int().min(1).max(5).nullable();
export const ScoresSchema = z.object(
  Object.fromEntries(CRITERES_IDS.map((c) => [c, NoteSchema.default(null)])) as Record<
    CritereId,
    z.ZodDefault<typeof NoteSchema>
  >,
);
export type Scores = z.infer<typeof ScoresSchema>;

/* ------------------------------------------------------------------ */
/* Qualification AI Act et RGPD (réponses au questionnaire)            */
/* ------------------------------------------------------------------ */

export const TransparenceSchema = z.object({
  interactionDirecte: z.boolean().default(false),
  contenuSynthetique: z.boolean().default(false),
  emotionOuBiometrie: z.boolean().default(false),
  hypertrucage: z.boolean().default(false),
  texteInteretPublic: z.boolean().default(false),
});

export const AiActReponsesSchema = z.object({
  inference: ReponseSchema.nullable().default(null),
  autonomie: ReponseSchema.nullable().default(null),
  exclusion: z.enum(EXCLUSIONS_IDS).nullable().default(null),
  role: z.enum(ROLES_IDS).nullable().default(null),
  modificationSubstantielle: ReponseSchema.nullable().default(null),
  pratiquesInterdites: z.array(z.enum(PRATIQUES_INTERDITES_IDS)).default([]),
  pratiquesVerifiees: z.boolean().default(false),
  annexeI: ReponseSchema.nullable().default(null),
  annexeIII: z.enum([...CAS_ANNEXE_III_IDS, 'aucun']).nullable().default(null),
  profilage: ReponseSchema.nullable().default(null),
  derogation: z.enum([...DEROGATIONS_IDS, 'aucune']).nullable().default(null),
  transparence: TransparenceSchema.prefault({}),
  gpai: z.enum(OPTIONS_GPAI_IDS).nullable().default(null),
  organismePublic: ReponseSchema.nullable().default(null),
  notes: texte(),
});
export type AiActReponses = z.infer<typeof AiActReponsesSchema>;

export const RgpdReponsesSchema = z.object({
  donneesPersonnelles: ReponseSchema.nullable().default(null),
  categoriesDonnees: texte(),
  donneesSensibles: ReponseSchema.nullable().default(null),
  categoriesSensibles: z.array(z.enum(CATEGORIES_ART_9_IDS)).default([]),
  donneesInfractions: z.boolean().default(false),
  decisionAutomatisee: ReponseSchema.nullable().default(null),
  effetJuridique: ReponseSchema.nullable().default(null),
  scoreDeterminant: z.boolean().default(false),
  baseLegale: z.enum(BASES_LEGALES_IDS).nullable().default(null),
  listeCnil: z.boolean().default(false),
  criteres: z.array(z.enum(CRITERES_AIPD_IDS)).default([]),
  notes: texte(),
});
export type RgpdReponses = z.infer<typeof RgpdReponsesSchema>;

/* ------------------------------------------------------------------ */
/* Business case                                                       */
/* ------------------------------------------------------------------ */

/** Paramètres soumis à la sensibilité (tornado) et au Monte Carlo. */
export const PARAMETRES_INCERTAINS = [
  { id: 'volumeAnnuel', libelle: 'Volume annuel' },
  { id: 'tempsUnitaireMin', libelle: 'Temps unitaire' },
  { id: 'partAutomatisable', libelle: 'Part automatisable' },
  { id: 'coutHoraire', libelle: 'Coût horaire chargé' },
  { id: 'adoption', libelle: "Taux d'adoption" },
  { id: 'gainsQualite', libelle: 'Gains qualité' },
  { id: 'joursBuild', libelle: 'Charge de build (jours)' },
  { id: 'tjm', libelle: 'TJM' },
  { id: 'infraAnnuelle', libelle: 'Infrastructure / licences' },
  { id: 'prixMillionTokens', libelle: 'Prix par million de tokens' },
] as const;
export type ParametreIncertainId = (typeof PARAMETRES_INCERTAINS)[number]['id'];
export const PARAMETRES_INCERTAINS_IDS = PARAMETRES_INCERTAINS.map((p) => p.id) as [
  ParametreIncertainId,
  ...ParametreIncertainId[],
];

export const ChampsBusinessCase = [
  'volumeAnnuel',
  'tempsUnitaireMin',
  'partAutomatisable',
  'coutHoraire',
  'adoption',
  'gainsQualite',
  'joursBuild',
  'tjm',
  'autresCoutsBuild',
  'infraAnnuelle',
  'maintenancePct',
  'autresCoutsRun',
  'requetesParUnite',
  'tokensParRequete',
  'prixMillionTokens',
  'tauxActualisation',
] as const;
export type ChampBusinessCase = (typeof ChampsBusinessCase)[number];

export const BornesSchema = z.object({
  basPct: z.number().max(0).default(-20),
  hautPct: z.number().min(0).default(20),
});
export type Bornes = z.infer<typeof BornesSchema>;

const montant = () => z.number().min(0).default(0);
const part = (defaut: number) => z.number().min(0).max(1).default(defaut);

export const BusinessCaseSchema = z.object({
  uniteVolume: z.string().default('dossiers'),
  volumeAnnuel: montant(),
  tempsUnitaireMin: montant(),
  partAutomatisable: part(0),
  coutHoraire: montant(),
  adoption: z.tuple([part(0.5), part(0.8), part(1)]).default([0.5, 0.8, 1]),
  gainsQualite: montant(),
  libelleGainsQualite: texte(),
  joursBuild: montant(),
  tjm: montant(),
  autresCoutsBuild: montant(),
  libelleAutresCoutsBuild: texte(),
  infraAnnuelle: montant(),
  maintenancePct: part(0.15),
  autresCoutsRun: montant(),
  libelleAutresCoutsRun: texte(),
  llmActif: z.boolean().default(false),
  requetesParUnite: montant(),
  tokensParRequete: montant(),
  prixMillionTokens: montant(),
  tauxActualisation: z.number().min(0).max(0.5).default(0.08),
  incertitudes: z.partialRecord(z.enum(PARAMETRES_INCERTAINS_IDS), BornesSchema).default({}),
  monteCarlo: z
    .object({
      iterations: z.number().int().min(100).max(50000).default(5000),
      graine: z.number().int().min(0).default(42),
    })
    .prefault({}),
  provenance: z.partialRecord(z.enum(ChampsBusinessCase), ProvenanceSchema).default({}),
  notes: texte(),
});
export type BusinessCase = z.infer<typeof BusinessCaseSchema>;

/* ------------------------------------------------------------------ */
/* Cas d'usage                                                          */
/* ------------------------------------------------------------------ */

export const VagueSchema = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]);
/** 1 à 3 = vagues de la roadmap ; 0 = hors roadmap. */
export type Vague = z.infer<typeof VagueSchema>;

export const UseCaseSchema = z.object({
  id: id(),
  code: texte(),
  titre: z.string().min(1),
  resume: texte(),
  statut: StatutSchema.default('idee'),
  porteur: texte(),
  probleme: texte(),
  processus: texte(),
  objectifs: texte(),
  personas: z.array(PersonaSchema).default([]),
  situationActuelle: z
    .object({
      description: texte(),
      irritants: z.array(z.string()).default([]),
    })
    .prefault({}),
  solution: z
    .object({
      typologie: TypologieSchema.nullable().default(null),
      description: texte(),
      niveauAutonomie: z.enum(['suggestion', 'validation_humaine', 'automatique']).nullable().default(null),
      supervisionHumaine: texte(),
      alternatives: texte(),
    })
    .prefault({}),
  donnees: z
    .object({
      sources: z.array(SourceDonneesSchema).default([]),
      commentaire: texte(),
    })
    .prefault({}),
  integration: z
    .object({
      systemes: z.array(z.string()).default([]),
      mode: z.enum(['api', 'batch', 'manuel', 'embarque', 'autonome']).nullable().default(null),
      description: texte(),
      contraintes: texte(),
    })
    .prefault({}),
  kpis: z.array(KpiSchema).default([]),
  partiesPrenantes: z.array(PartiePrenanteSchema).default([]),
  dependances: z
    .object({
      cas: z.array(z.string()).default([]),
      externes: z.array(z.string()).default([]),
    })
    .prefault({}),
  risques: z.array(RisqueSchema).default([]),
  scores: ScoresSchema.prefault({}),
  justificationsScores: z.partialRecord(z.enum(CRITERES_IDS), z.string()).default({}),
  aiAct: AiActReponsesSchema.prefault({}),
  rgpd: RgpdReponsesSchema.prefault({}),
  businessCase: BusinessCaseSchema.prefault({}),
  roadmap: z
    .object({
      vagueManuelle: VagueSchema.nullable().default(null),
      commentaire: texte(),
    })
    .prefault({}),
  creeLe: z.string().default(() => new Date().toISOString()),
  modifieLe: z.string().default(() => new Date().toISOString()),
});
export type UseCase = z.infer<typeof UseCaseSchema>;

export const NIVEAUX_AUTONOMIE = [
  { id: 'suggestion', libelle: 'Suggestion (l’humain décide)' },
  { id: 'validation_humaine', libelle: 'Proposition validée par un humain' },
  { id: 'automatique', libelle: 'Traitement automatique' },
] as const;

export const MODES_INTEGRATION = [
  { id: 'api', libelle: 'API temps réel' },
  { id: 'batch', libelle: 'Traitement par lots' },
  { id: 'manuel', libelle: 'Import / export manuel' },
  { id: 'embarque', libelle: 'Intégré à un progiciel existant' },
  { id: 'autonome', libelle: 'Outil autonome' },
] as const;

/* ------------------------------------------------------------------ */
/* Portefeuille                                                         */
/* ------------------------------------------------------------------ */

export const ConfigScoringSchema = z.object({
  poids: z
    .object(
      Object.fromEntries(CRITERES_IDS.map((c) => [c, z.number().min(0).max(100).optional()])) as Record<
        CritereId,
        z.ZodOptional<z.ZodNumber>
      >,
    )
    .default({}),
  poidsAxes: z
    .object({
      valeur: z.number().min(0).max(100).default(45),
      faisabilite: z.number().min(0).max(100).default(35),
      risque: z.number().min(0).max(100).default(20),
    })
    .prefault({}),
  seuilValeur: z.number().min(1).max(5).default(3),
  seuilFaisabilite: z.number().min(1).max(5).default(3),
});
export type ConfigScoring = z.infer<typeof ConfigScoringSchema>;

function premierJourDuMoisSuivant(): string {
  const d = new Date();
  const suivant = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
  return suivant.toISOString().slice(0, 10);
}

export const ConfigRoadmapSchema = z.object({
  dateDebut: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .default(premierJourDuMoisSuivant),
  capacite: z.tuple([z.number().int().min(1).max(20), z.number().int().min(1).max(20), z.number().int().min(1).max(20)]).default([3, 3, 3]),
});
export type ConfigRoadmap = z.infer<typeof ConfigRoadmapSchema>;

export const OrganisationSchema = z.object({
  nom: z.string().default(''),
  secteur: texte(),
  taille: texte(),
  localisation: texte(),
  presentation: texte(),
  fictive: z.boolean().default(false),
});
export type Organisation = z.infer<typeof OrganisationSchema>;

export const PortfolioSchema = z.object({
  id: id(),
  nom: z.string().min(1),
  description: texte(),
  organisation: OrganisationSchema.prefault({}),
  demo: z.boolean().default(false),
  config: ConfigScoringSchema.prefault({}),
  roadmap: ConfigRoadmapSchema.prefault({}),
  cas: z.array(UseCaseSchema).default([]),
  creeLe: z.string().default(() => new Date().toISOString()),
  modifieLe: z.string().default(() => new Date().toISOString()),
});
export type Portfolio = z.infer<typeof PortfolioSchema>;
export type PortfolioInput = z.input<typeof PortfolioSchema>;
export type UseCaseInput = z.input<typeof UseCaseSchema>;

export const FORMAT_EXPORT = 'ai-usecase-factory';
export const VERSION_EXPORT = 1;

export const EnveloppeExportSchema = z.object({
  format: z.literal(FORMAT_EXPORT),
  version: z.literal(VERSION_EXPORT),
  exporteLe: z.string(),
  portefeuilles: z.array(PortfolioSchema).min(1),
});
export type EnveloppeExport = z.infer<typeof EnveloppeExportSchema>;
