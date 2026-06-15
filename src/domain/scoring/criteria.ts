/**
 * Grilles de scoring multicritère : 3 axes, 12 critères, notes de 1 à 5.
 * Chaque niveau porte un descripteur explicite pour que deux évaluateurs
 * notent de la même façon (voir docs/methode-scoring.md).
 *
 * Convention : pour les axes Valeur et Faisabilité, 5 est le plus favorable ;
 * pour l'axe Risque, 5 est le plus risqué (le score de risque pénalise la priorité).
 */

export type AxeId = 'valeur' | 'faisabilite' | 'risque';

export interface Critere {
  id: string;
  axe: AxeId;
  libelle: string;
  question: string;
  /** Descripteurs des niveaux 1 à 5 (index 0 = niveau 1). */
  niveaux: readonly [string, string, string, string, string];
  poidsDefaut: number;
}

export const AXES: readonly { id: AxeId; libelle: string; sens: string; poidsDefaut: number }[] = [
  { id: 'valeur', libelle: 'Valeur', sens: '5 = valeur la plus forte', poidsDefaut: 45 },
  { id: 'faisabilite', libelle: 'Faisabilité', sens: '5 = le plus facile à réaliser', poidsDefaut: 35 },
  { id: 'risque', libelle: 'Risque', sens: '5 = le plus risqué', poidsDefaut: 20 },
];

export const CRITERES = [
  {
    id: 'impactFinancier',
    axe: 'valeur',
    libelle: 'Impact financier',
    question: 'Quel gain financier le cas d’usage peut-il produire (productivité, coûts évités, revenus) ?',
    niveaux: [
      'Gain négligeable ou impossible à démontrer',
      'Gain limité, local à une équipe',
      'Gain significatif sur un processus, mesurable',
      'Gain important à l’échelle d’une direction ou d’un métier',
      'Gain majeur, visible dans les comptes de l’organisation',
    ],
    poidsDefaut: 30,
  },
  {
    id: 'impactClient',
    axe: 'valeur',
    libelle: 'Impact client / usager',
    question: 'Le client ou l’usager perçoit-il une amélioration (délai, qualité, accessibilité) ?',
    niveaux: [
      'Aucun effet perceptible pour le client ou l’usager',
      'Effet indirect et limité (qualité interne)',
      'Amélioration perceptible d’un parcours',
      'Amélioration nette et mesurable d’un parcours clé',
      'Transformation de l’expérience sur un parcours majeur',
    ],
    poidsDefaut: 25,
  },
  {
    id: 'alignementStrategique',
    axe: 'valeur',
    libelle: 'Alignement stratégique',
    question: 'Le cas d’usage sert-il une priorité stratégique explicite ?',
    niveaux: [
      'Hors des priorités affichées',
      'Lien faible ou indirect avec la stratégie',
      'Contribue à un objectif stratégique identifié',
      'Contribue directement à une priorité de l’année',
      'Porté par la direction générale, condition de réussite de la stratégie',
    ],
    poidsDefaut: 25,
  },
  {
    id: 'urgence',
    axe: 'valeur',
    libelle: 'Urgence',
    question: 'Existe-t-il une échéance ou une douleur qui impose d’agir vite ?',
    niveaux: [
      'Aucune échéance, peut attendre',
      'Souhaitable dans les 18 mois',
      'Attendu sous 12 mois (pression métier)',
      'Échéance externe ou réglementaire sous 6 à 12 mois',
      'Problème critique en cours (pertes, saturation, non-conformité)',
    ],
    poidsDefaut: 20,
  },
  {
    id: 'maturiteDonnees',
    axe: 'faisabilite',
    libelle: 'Maturité des données',
    question: 'Les données nécessaires existent-elles, sont-elles accessibles et de qualité ?',
    niveaux: [
      'Données inexistantes ou inaccessibles',
      'Données dispersées, qualité inconnue, à constituer',
      'Données disponibles mais à nettoyer ou à annoter',
      'Données disponibles, historisées, de qualité correcte',
      'Données prêtes, documentées et gouvernées',
    ],
    poidsDefaut: 35,
  },
  {
    id: 'complexiteTechnique',
    axe: 'faisabilite',
    libelle: 'Complexité technique',
    question: 'La solution repose-t-elle sur des techniques éprouvées ? (5 = faible complexité)',
    niveaux: [
      'Recherche : aucun précédent, performance incertaine',
      'Complexe : modèle sur mesure, exigence de performance élevée',
      'Modérée : techniques éprouvées à adapter au contexte',
      'Faible : solution standard à paramétrer',
      'Très faible : solution sur étagère, déjà éprouvée en interne',
    ],
    poidsDefaut: 25,
  },
  {
    id: 'integrationSI',
    axe: 'faisabilite',
    libelle: 'Intégration SI',
    question: 'L’intégration au système d’information est-elle simple ? (5 = simple)',
    niveaux: [
      'Refonte de systèmes cœur nécessaire',
      'Intégration lourde à plusieurs systèmes, API inexistantes',
      'Intégration à un système, API à développer',
      'API existantes, intégration simple',
      'Fonctionne de manière autonome ou intégration native',
    ],
    poidsDefaut: 20,
  },
  {
    id: 'competences',
    axe: 'faisabilite',
    libelle: 'Compétences',
    question: 'Les compétences nécessaires sont-elles disponibles ? (5 = disponibles en interne)',
    niveaux: [
      'Aucune compétence interne, marché tendu',
      'Compétences à recruter ou à acheter en totalité',
      'Compétences partielles, accompagnement externe requis',
      'Équipe interne compétente, appui ponctuel',
      'Équipe interne expérimentée et disponible',
    ],
    poidsDefaut: 20,
  },
  {
    id: 'risqueReglementaire',
    axe: 'risque',
    libelle: 'Risque réglementaire',
    question: 'Quel est le niveau d’exposition réglementaire (AI Act, RGPD, réglementation sectorielle) ?',
    niveaux: [
      'Aucun enjeu réglementaire spécifique',
      'Obligations générales (RGPD standard, maîtrise de l’IA)',
      'Obligations de transparence ou AIPD probable',
      'Système à haut risque ou décision automatisée encadrée (art. 22 RGPD)',
      'Pratique potentiellement interdite ou incertitude juridique majeure',
    ],
    poidsDefaut: 30,
  },
  {
    id: 'risqueEthique',
    axe: 'risque',
    libelle: 'Risque éthique et biais',
    question: 'Le système peut-il produire des effets injustes ou discriminatoires sur des personnes ?',
    niveaux: [
      'Aucun impact sur des personnes',
      'Impact indirect, biais peu probable',
      'Décisions concernant des personnes, biais possible mais contrôlable',
      'Décisions significatives, risque de discrimination à surveiller',
      'Effets lourds sur des personnes vulnérables, risque de discrimination élevé',
    ],
    poidsDefaut: 25,
  },
  {
    id: 'risqueOperationnel',
    axe: 'risque',
    libelle: 'Risque opérationnel',
    question: 'Quelle est la gravité d’une erreur du système en production ?',
    niveaux: [
      'Erreur sans conséquence, facilement corrigée',
      'Erreur gênante, détectée par le processus',
      'Erreur coûteuse, contrôle humain nécessaire',
      'Erreur grave (financière, juridique), difficile à détecter',
      'Erreur critique : continuité d’activité ou sécurité en jeu',
    ],
    poidsDefaut: 25,
  },
  {
    id: 'risqueAdoption',
    axe: 'risque',
    libelle: 'Risque d’adoption',
    question: 'Les utilisateurs vont-ils s’approprier l’outil ?',
    niveaux: [
      'Utilisateurs demandeurs, pratiques peu modifiées',
      'Accueil favorable, formation légère',
      'Changement de pratiques modéré, accompagnement nécessaire',
      'Changement important, résistances attendues',
      'Rejet probable sans transformation profonde de l’organisation',
    ],
    poidsDefaut: 20,
  },
] as const satisfies readonly Critere[];

export type CritereId = (typeof CRITERES)[number]['id'];
export const CRITERES_IDS = CRITERES.map((c) => c.id) as [CritereId, ...CritereId[]];

export function criteresDeLAxe(axe: AxeId): readonly Critere[] {
  return CRITERES.filter((c) => c.axe === axe);
}

export function trouverCritere(id: CritereId): Critere {
  const critere = CRITERES.find((c) => c.id === id);
  if (!critere) throw new Error(`Critère inconnu : ${id}`);
  return critere;
}

export const QUADRANTS = [
  {
    id: 'quick_win',
    libelle: 'Quick win',
    description: 'Valeur et faisabilité élevées : à lancer rapidement.',
  },
  {
    id: 'strategique',
    libelle: 'Projet stratégique',
    description: 'Valeur élevée mais faisabilité plus faible : à préparer (données, intégration, compétences).',
  },
  {
    id: 'a_explorer',
    libelle: 'À explorer',
    description: 'Faisable mais valeur modérée : expérimentation opportuniste quand la capacité le permet.',
  },
  {
    id: 'a_ecarter',
    libelle: 'À écarter',
    description: 'Valeur et faisabilité faibles (ou pratique interdite) : ne pas engager en l’état.',
  },
] as const;

export type QuadrantId = (typeof QUADRANTS)[number]['id'];

export function libelleQuadrant(id: QuadrantId | null): string {
  if (!id) return 'Non évalué';
  return QUADRANTS.find((q) => q.id === id)?.libelle ?? id;
}
