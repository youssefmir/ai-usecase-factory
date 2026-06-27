import { BusinessCaseSchema, type BusinessCase } from '../model';

/**
 * Cas de référence calculé à la main (voir docs/modele-business-case.md) :
 * 10 000 dossiers/an, 30 min/dossier, 50 % automatisable, 50 €/h, adoption 50/80/100 %,
 * gains qualité 20 000 €/an, build 60 j x 600 € + 4 000 €, infra 6 000 €/an,
 * maintenance 15 %, LLM 2 requêtes x 3 000 tokens à 5 € le million, actualisation 10 %.
 */
export const REFERENCE: BusinessCase = BusinessCaseSchema.parse({
  volumeAnnuel: 10_000,
  tempsUnitaireMin: 30,
  partAutomatisable: 0.5,
  coutHoraire: 50,
  adoption: [0.5, 0.8, 1],
  gainsQualite: 20_000,
  joursBuild: 60,
  tjm: 600,
  autresCoutsBuild: 4_000,
  infraAnnuelle: 6_000,
  maintenancePct: 0.15,
  llmActif: true,
  requetesParUnite: 2,
  tokensParRequete: 3_000,
  prixMillionTokens: 5,
  tauxActualisation: 0.1,
});
