/**
 * Référentiel du règlement (UE) 2024/1689 sur l'intelligence artificielle (« AI Act »),
 * tel que modifié par le règlement omnibus (UE) 2026/1744.
 *
 * Les libellés sont des reformulations courtes destinées à guider la qualification ;
 * ils ne remplacent pas le texte officiel (voir docs/qualification-ai-act.md).
 */

/** Pratiques interdites (art. 5). Les deux dernières ont été ajoutées par l'omnibus. */
export const PRATIQUES_INTERDITES = [
  {
    id: 'manipulation',
    article: 'art. 5(1)(a)',
    libelle: 'Techniques subliminales, manipulatrices ou trompeuses',
    description:
      "Altérer substantiellement le comportement d’une personne en portant atteinte à sa capacité de décision éclairée, en causant ou en étant susceptible de causer un préjudice important.",
    applicableDes: '2025-02-02',
  },
  {
    id: 'vulnerabilites',
    article: 'art. 5(1)(b)',
    libelle: 'Exploitation des vulnérabilités',
    description:
      "Exploiter les vulnérabilités liées à l’âge, au handicap ou à la situation sociale ou économique pour altérer substantiellement le comportement, avec un préjudice important.",
    applicableDes: '2025-02-02',
  },
  {
    id: 'notation_sociale',
    article: 'art. 5(1)(c)',
    libelle: 'Notation sociale',
    description:
      'Évaluer ou classer des personnes selon leur comportement social ou leurs caractéristiques personnelles, conduisant à un traitement préjudiciable dans un contexte sans rapport ou disproportionné.',
    applicableDes: '2025-02-02',
  },
  {
    id: 'prediction_infraction',
    article: 'art. 5(1)(d)',
    libelle: "Prédiction d’infraction fondée uniquement sur le profilage",
    description:
      "Évaluer le risque qu’une personne commette une infraction pénale uniquement sur la base de son profilage ou de ses traits de personnalité.",
    applicableDes: '2025-02-02',
  },
  {
    id: 'moissonnage_facial',
    article: 'art. 5(1)(e)',
    libelle: 'Bases de reconnaissance faciale par moissonnage non ciblé',
    description:
      "Créer ou développer des bases de données de reconnaissance faciale par moissonnage non ciblé d’images faciales (internet, vidéosurveillance).",
    applicableDes: '2025-02-02',
  },
  {
    id: 'emotions_travail',
    article: 'art. 5(1)(f)',
    libelle: 'Reconnaissance des émotions au travail ou dans l’enseignement',
    description:
      "Inférer les émotions d’une personne sur le lieu de travail ou dans un établissement d’enseignement, sauf pour des raisons médicales ou de sécurité.",
    applicableDes: '2025-02-02',
  },
  {
    id: 'categorisation_biometrique',
    article: 'art. 5(1)(g)',
    libelle: 'Catégorisation biométrique sur des attributs sensibles',
    description:
      "Déduire la race, les opinions politiques, l’affiliation syndicale, les convictions religieuses ou philosophiques, la vie sexuelle ou l’orientation sexuelle à partir de données biométriques.",
    applicableDes: '2025-02-02',
  },
  {
    id: 'identification_temps_reel',
    article: 'art. 5(1)(h)',
    libelle: 'Identification biométrique à distance en temps réel à des fins répressives',
    description:
      "Identification biométrique à distance « en temps réel » dans des espaces accessibles au public à des fins répressives, hors exceptions strictement encadrées.",
    applicableDes: '2025-02-02',
  },
  {
    id: 'nudification',
    article: 'art. 5, ajout du règlement (UE) 2026/1744',
    libelle: 'Images intimes non consenties (« nudification »)',
    description:
      "Systèmes conçus pour générer des images ou vidéos à caractère sexuel de personnes réelles identifiables sans leur consentement. Interdiction ajoutée par l’omnibus.",
    applicableDes: '2026-12-02',
  },
  {
    id: 'contenus_pedocriminels',
    article: 'art. 5, ajout du règlement (UE) 2026/1744',
    libelle: 'Contenus pédocriminels générés par IA',
    description:
      "Systèmes générant ou manipulant des contenus à caractère pédocriminel. Interdiction ajoutée par l’omnibus.",
    applicableDes: '2026-12-02',
  },
] as const;

export type PratiqueInterditeId = (typeof PRATIQUES_INTERDITES)[number]['id'];
export const PRATIQUES_INTERDITES_IDS = PRATIQUES_INTERDITES.map((p) => p.id) as [
  PratiqueInterditeId,
  ...PratiqueInterditeId[],
];

/** Domaines de l'annexe III (cas d'usage à haut risque visés à l'art. 6(2)). */
export const DOMAINES_ANNEXE_III = [
  { numero: 1, libelle: 'Biométrie' },
  { numero: 2, libelle: 'Infrastructures critiques' },
  { numero: 3, libelle: 'Éducation et formation professionnelle' },
  { numero: 4, libelle: 'Emploi, gestion de la main-d’œuvre, accès à l’emploi indépendant' },
  { numero: 5, libelle: 'Accès aux services privés essentiels, aux services publics et prestations sociales' },
  { numero: 6, libelle: 'Répression (autorités répressives)' },
  { numero: 7, libelle: 'Migration, asile et contrôle aux frontières' },
  { numero: 8, libelle: 'Administration de la justice et processus démocratiques' },
] as const;

export interface CasAnnexeIII {
  id: string;
  domaine: number;
  point: string;
  libelle: string;
  /** false pour l'exception explicite (détection de fraude financière, exclue du point 5 b). */
  hautRisque: boolean;
  /** Déployeurs privés soumis à la FRIA (art. 27) : points 5 b et 5 c. */
  friaDeployeurPrive?: boolean;
  /** Utilisation sur le lieu de travail : information des représentants du personnel (art. 26(7)). */
  lieuDeTravail?: boolean;
  /** Point 2 : exclu de la FRIA (art. 27(1)) et enregistré au niveau national. */
  infrastructureCritique?: boolean;
}

export const CAS_ANNEXE_III = [
  { id: '1a', domaine: 1, point: '1 a)', libelle: 'Identification biométrique à distance (hors simple vérification d’identité)', hautRisque: true },
  { id: '1b', domaine: 1, point: '1 b)', libelle: 'Catégorisation biométrique selon des attributs sensibles ou protégés', hautRisque: true },
  { id: '1c', domaine: 1, point: '1 c)', libelle: 'Reconnaissance des émotions', hautRisque: true },
  {
    id: '2',
    domaine: 2,
    point: '2',
    libelle: 'Composant de sécurité d’infrastructures numériques critiques, du trafic routier ou de la fourniture d’eau, de gaz, de chauffage ou d’électricité',
    hautRisque: true,
    infrastructureCritique: true,
  },
  { id: '3a', domaine: 3, point: '3 a)', libelle: 'Déterminer l’accès, l’admission ou l’affectation à un établissement d’enseignement', hautRisque: true },
  { id: '3b', domaine: 3, point: '3 b)', libelle: 'Évaluer les acquis d’apprentissage', hautRisque: true },
  { id: '3c', domaine: 3, point: '3 c)', libelle: 'Évaluer le niveau d’enseignement approprié pour une personne', hautRisque: true },
  { id: '3d', domaine: 3, point: '3 d)', libelle: 'Surveiller et détecter les comportements interdits lors d’examens', hautRisque: true },
  {
    id: '4a',
    domaine: 4,
    point: '4 a)',
    libelle: 'Recrutement ou sélection : annonces ciblées, tri des candidatures, évaluation des candidats',
    hautRisque: true,
    lieuDeTravail: true,
  },
  {
    id: '4b',
    domaine: 4,
    point: '4 b)',
    libelle:
      'Décisions sur les conditions de travail, la promotion ou le licenciement ; attribution des tâches selon le comportement ou les caractéristiques personnelles ; suivi et évaluation des performances',
    hautRisque: true,
    lieuDeTravail: true,
  },
  {
    id: '5a',
    domaine: 5,
    point: '5 a)',
    libelle:
      'Évaluer l’éligibilité aux prestations et services d’aide sociale essentiels, ou les octroyer, réduire, révoquer ou récupérer (autorités publiques ou pour leur compte)',
    hautRisque: true,
  },
  {
    id: '5b',
    domaine: 5,
    point: '5 b)',
    libelle: 'Évaluer la solvabilité d’une personne physique ou établir sa note de crédit',
    hautRisque: true,
    friaDeployeurPrive: true,
  },
  {
    id: '5b_fraude',
    domaine: 5,
    point: '5 b) – exception',
    libelle: 'Détection de fraudes financières (explicitement exclue du point 5 b)',
    hautRisque: false,
  },
  {
    id: '5c',
    domaine: 5,
    point: '5 c)',
    libelle: 'Évaluation des risques et tarification en assurance vie et santé',
    hautRisque: true,
    friaDeployeurPrive: true,
  },
  {
    id: '5d',
    domaine: 5,
    point: '5 d)',
    libelle: 'Évaluer et hiérarchiser les appels d’urgence, répartir les secours, trier les patients en urgence',
    hautRisque: true,
  },
  { id: '6a', domaine: 6, point: '6 a)', libelle: 'Évaluer le risque qu’une personne devienne victime d’infractions', hautRisque: true },
  { id: '6b', domaine: 6, point: '6 b)', libelle: 'Polygraphes et outils similaires', hautRisque: true },
  { id: '6c', domaine: 6, point: '6 c)', libelle: 'Évaluer la fiabilité des preuves', hautRisque: true },
  { id: '6d', domaine: 6, point: '6 d)', libelle: 'Évaluer le risque de (ré)infraction, au-delà du seul profilage', hautRisque: true },
  { id: '6e', domaine: 6, point: '6 e)', libelle: 'Profilage dans le cadre de la détection, de l’enquête ou des poursuites', hautRisque: true },
  { id: '7a', domaine: 7, point: '7 a)', libelle: 'Polygraphes et outils similaires (migration, frontières)', hautRisque: true },
  { id: '7b', domaine: 7, point: '7 b)', libelle: 'Évaluer un risque (sécurité, migration irrégulière, santé) posé par une personne', hautRisque: true },
  { id: '7c', domaine: 7, point: '7 c)', libelle: 'Examiner les demandes d’asile, de visa ou de titre de séjour', hautRisque: true },
  {
    id: '7d',
    domaine: 7,
    point: '7 d)',
    libelle: 'Détecter, reconnaître ou identifier des personnes (hors vérification des documents de voyage)',
    hautRisque: true,
  },
  {
    id: '8a',
    domaine: 8,
    point: '8 a)',
    libelle: 'Aider une autorité judiciaire à rechercher et interpréter les faits et le droit, ou dans un mode alternatif de règlement des litiges',
    hautRisque: true,
  },
  {
    id: '8b',
    domaine: 8,
    point: '8 b)',
    libelle: 'Influencer le résultat d’une élection ou d’un référendum, ou le comportement électoral (hors outils logistiques)',
    hautRisque: true,
  },
] as const satisfies readonly CasAnnexeIII[];

export type CasAnnexeIIIId = (typeof CAS_ANNEXE_III)[number]['id'];
export const CAS_ANNEXE_III_IDS = CAS_ANNEXE_III.map((c) => c.id) as [CasAnnexeIIIId, ...CasAnnexeIIIId[]];

export function trouverCasAnnexeIII(id: string | null | undefined): CasAnnexeIII | undefined {
  return CAS_ANNEXE_III.find((c) => c.id === id);
}

/** Conditions de la dérogation de l'art. 6(3) (une seule suffit, jamais en cas de profilage). */
export const DEROGATIONS_6_3 = [
  { id: 'a', article: 'art. 6(3)(a)', libelle: 'Accomplir une tâche procédurale étroite' },
  { id: 'b', article: 'art. 6(3)(b)', libelle: 'Améliorer le résultat d’une activité humaine préalablement réalisée' },
  {
    id: 'c',
    article: 'art. 6(3)(c)',
    libelle:
      'Détecter des schémas de décision ou des écarts, sans remplacer ni influencer l’évaluation humaine préalable sans examen humain approprié',
  },
  {
    id: 'd',
    article: 'art. 6(3)(d)',
    libelle: 'Exécuter une tâche préparatoire à une évaluation pertinente pour un cas d’usage de l’annexe III',
  },
] as const;

export type DerogationId = (typeof DEROGATIONS_6_3)[number]['id'];
export const DEROGATIONS_IDS = DEROGATIONS_6_3.map((d) => d.id) as [DerogationId, ...DerogationId[]];

/** Exclusions du champ d'application (art. 2) proposées dans le questionnaire. */
export const EXCLUSIONS_ART_2 = [
  { id: 'aucune', libelle: 'Aucune exclusion' },
  { id: 'defense', libelle: 'Fins exclusivement militaires, de défense ou de sécurité nationale (art. 2(3))' },
  { id: 'recherche', libelle: 'Recherche et développement scientifiques uniquement (art. 2(6))' },
  { id: 'personnel', libelle: 'Activité strictement personnelle et non professionnelle (art. 2(10))' },
] as const;

export type ExclusionId = (typeof EXCLUSIONS_ART_2)[number]['id'];
export const EXCLUSIONS_IDS = EXCLUSIONS_ART_2.map((e) => e.id) as [ExclusionId, ...ExclusionId[]];

export const ROLES = [
  { id: 'fournisseur', libelle: 'Fournisseur', description: 'Développe le système (ou le fait développer) et le met sur le marché ou en service sous son nom (art. 3(3)).' },
  { id: 'deployeur', libelle: 'Déployeur', description: 'Utilise le système sous sa propre autorité dans un cadre professionnel (art. 3(4)).' },
  {
    id: 'fournisseur_deployeur',
    libelle: 'Fournisseur et déployeur',
    description: 'Développement interne pour son propre usage : les deux séries d’obligations s’appliquent.',
  },
] as const;

export type RoleId = (typeof ROLES)[number]['id'];
export const ROLES_IDS = ROLES.map((r) => r.id) as [RoleId, ...RoleId[]];

export const OPTIONS_GPAI = [
  { id: 'aucun', libelle: 'Aucun modèle d’IA à usage général' },
  { id: 'integre_modele_tiers', libelle: 'Intègre un modèle à usage général fourni par un tiers (API, open source…)' },
  { id: 'fournit_modele', libelle: 'Fournit lui-même un modèle à usage général' },
  { id: 'fournit_modele_systemique', libelle: 'Fournit un modèle à usage général présentant un risque systémique' },
] as const;

export type OptionGpaiId = (typeof OPTIONS_GPAI)[number]['id'];
export const OPTIONS_GPAI_IDS = OPTIONS_GPAI.map((o) => o.id) as [OptionGpaiId, ...OptionGpaiId[]];

/** Titres courts des articles cités dans les résultats. */
export const ARTICLES: Record<string, string> = {
  'art. 2': "Champ d’application",
  'art. 3(1)': "Définition d’un système d’IA",
  'art. 4': "Maîtrise de l’IA",
  'art. 5': 'Pratiques interdites',
  'art. 6(1)': "Haut risque : produits couverts par l’annexe I",
  'art. 6(2)': "Haut risque : cas d’usage de l’annexe III",
  'art. 6(3)': "Dérogation pour certains systèmes de l’annexe III",
  'art. 6(4)': "Documentation de l’évaluation de non-haut risque",
  'art. 8 à 15': 'Exigences applicables aux systèmes à haut risque',
  'art. 16': 'Obligations des fournisseurs de systèmes à haut risque',
  'art. 25': 'Responsabilités tout au long de la chaîne de valeur',
  'art. 26': 'Obligations des déployeurs de systèmes à haut risque',
  'art. 27': "Analyse d’impact sur les droits fondamentaux (FRIA)",
  'art. 43': 'Évaluation de la conformité',
  'art. 49': "Enregistrement dans la base de données de l’UE",
  'art. 50': 'Obligations de transparence',
  'art. 53': "Obligations des fournisseurs de modèles d’IA à usage général",
  'art. 55': 'Modèles à usage général présentant un risque systémique',
  'art. 72': 'Surveillance après commercialisation',
  'art. 73': 'Signalement des incidents graves',
  'art. 86': "Droit à l’explication des décisions individuelles",
  'annexe I': "Législation d’harmonisation de l’Union (produits)",
  'annexe III': 'Systèmes à haut risque visés à l’art. 6(2)',
};
