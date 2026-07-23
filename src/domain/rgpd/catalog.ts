/**
 * Référentiel RGPD utilisé pour la pré-analyse : catégories particulières (art. 9),
 * bases légales (art. 6) et les neuf critères d'analyse d'impact (AIPD) des lignes
 * directrices WP248 rév.01, approuvées par le CEPD et reprises par la CNIL.
 */

export const CATEGORIES_ART_9 = [
  { id: 'origine', libelle: 'Origine raciale ou ethnique' },
  { id: 'opinions_politiques', libelle: 'Opinions politiques' },
  { id: 'convictions', libelle: 'Convictions religieuses ou philosophiques' },
  { id: 'syndicat', libelle: 'Appartenance syndicale' },
  { id: 'genetique', libelle: 'Données génétiques' },
  { id: 'biometrie', libelle: "Données biométriques aux fins d’identifier une personne de manière unique" },
  { id: 'sante', libelle: 'Données concernant la santé' },
  { id: 'vie_sexuelle', libelle: 'Vie sexuelle ou orientation sexuelle' },
] as const;

export type CategorieArt9Id = (typeof CATEGORIES_ART_9)[number]['id'];
export const CATEGORIES_ART_9_IDS = CATEGORIES_ART_9.map((c) => c.id) as [CategorieArt9Id, ...CategorieArt9Id[]];

export const BASES_LEGALES = [
  { id: 'consentement', libelle: 'Consentement (art. 6(1)(a))' },
  { id: 'contrat', libelle: 'Exécution d’un contrat ou mesures précontractuelles (art. 6(1)(b))' },
  { id: 'obligation_legale', libelle: 'Obligation légale (art. 6(1)(c))' },
  { id: 'interets_vitaux', libelle: 'Sauvegarde des intérêts vitaux (art. 6(1)(d))' },
  { id: 'mission_interet_public', libelle: 'Mission d’intérêt public ou exercice de l’autorité publique (art. 6(1)(e))' },
  { id: 'interet_legitime', libelle: 'Intérêt légitime (art. 6(1)(f))' },
] as const;

export type BaseLegaleId = (typeof BASES_LEGALES)[number]['id'];
export const BASES_LEGALES_IDS = BASES_LEGALES.map((b) => b.id) as [BaseLegaleId, ...BaseLegaleId[]];

/** Les 9 critères WP248 : au moins deux critères remplis => AIPD probablement requise. */
export const CRITERES_AIPD = [
  {
    id: 'evaluation',
    numero: 1,
    libelle: 'Évaluation ou notation',
    description: 'Évaluation ou notation de personnes, y compris le profilage et la prédiction (solvabilité, comportement, performance…).',
  },
  {
    id: 'decision_automatisee',
    numero: 2,
    libelle: 'Décision automatisée avec effet juridique ou similaire',
    description: 'Prise de décision automatisée produisant des effets juridiques ou affectant la personne de manière significative.',
  },
  {
    id: 'surveillance',
    numero: 3,
    libelle: 'Surveillance systématique',
    description: 'Observation, surveillance ou contrôle systématique des personnes.',
  },
  {
    id: 'donnees_sensibles',
    numero: 4,
    libelle: 'Données sensibles ou hautement personnelles',
    description: "Catégories particulières (art. 9), données d’infraction, données financières, de communication ou de localisation.",
  },
  {
    id: 'grande_echelle',
    numero: 5,
    libelle: 'Traitement à grande échelle',
    description: 'Nombre de personnes, volume de données, durée ou étendue géographique importants.',
  },
  {
    id: 'croisement',
    numero: 6,
    libelle: 'Croisement ou combinaison de jeux de données',
    description: 'Combinaison de données issues de traitements distincts, au-delà des attentes raisonnables des personnes.',
  },
  {
    id: 'personnes_vulnerables',
    numero: 7,
    libelle: 'Personnes vulnérables',
    description: 'Mineurs, salariés (déséquilibre du rapport de force), patients, personnes âgées, demandeurs d’aide…',
  },
  {
    id: 'usage_innovant',
    numero: 8,
    libelle: 'Usage innovant ou nouvelle solution technologique',
    description: 'Application de nouvelles solutions technologiques ou organisationnelles, dont certains usages de l’IA.',
  },
  {
    id: 'exclusion_droit',
    numero: 9,
    libelle: "Exclusion du bénéfice d’un droit, d’un service ou d’un contrat",
    description: "Le traitement peut empêcher une personne d’exercer un droit ou de bénéficier d’un service ou d’un contrat.",
  },
] as const;

export type CritereAipdId = (typeof CRITERES_AIPD)[number]['id'];
export const CRITERES_AIPD_IDS = CRITERES_AIPD.map((c) => c.id) as [CritereAipdId, ...CritereAipdId[]];
