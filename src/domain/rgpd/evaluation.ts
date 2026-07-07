/**
 * Pré-analyse RGPD d'un cas d'usage (logique pure, testée).
 *
 * - Applicabilité : présence de données personnelles.
 * - Données sensibles (art. 9) et données d'infraction (art. 10).
 * - Décision exclusivement automatisée à effet juridique ou significatif (art. 22),
 *   avec la vigilance issue de l'arrêt CJUE SCHUFA (C-634/21, 7 décembre 2023).
 * - Nécessité d'une AIPD (art. 35) : liste CNIL, ou au moins 2 des 9 critères WP248.
 */
import { typographie } from '../format';
import type { Reponse, RgpdReponses } from '../model';
import type { CasAnnexeIIIId } from '../aiAct/catalog';
import { BASES_LEGALES, CATEGORIES_ART_9, CRITERES_AIPD, type CritereAipdId } from './catalog';

export type NiveauRgpd = 'non_applicable' | 'aipd_non_requise' | 'aipd_a_documenter' | 'aipd_requise' | 'incomplet';

export const NIVEAUX_RGPD: Record<NiveauRgpd, { libelle: string; court: string }> = {
  non_applicable: { libelle: 'RGPD non applicable (aucune donnée personnelle)', court: 'Non applicable' },
  aipd_non_requise: { libelle: 'AIPD non requise a priori', court: 'AIPD non requise' },
  aipd_a_documenter: { libelle: 'AIPD non obligatoire a priori : analyse à documenter', court: 'À documenter' },
  aipd_requise: { libelle: 'AIPD probablement requise', court: 'AIPD requise' },
  incomplet: { libelle: 'Pré-analyse à compléter', court: 'À compléter' },
};

export type StatutArt22 = 'applicable' | 'vigilance' | 'non' | 'inconnu';

export interface ResultatRgpd {
  niveau: NiveauRgpd;
  libelle: string;
  applicable: boolean | null;
  nbCriteres: number;
  criteresRetenus: { id: CritereAipdId; numero: number; libelle: string }[];
  /** Critères suggérés par les autres réponses mais non cochés. */
  criteresSuggeresNonRetenus: CritereAipdId[];
  article9: boolean;
  article22: StatutArt22;
  justification: string[];
  pointsVigilance: string[];
  articles: { ref: string; titre: string }[];
  manquants: string[];
  mention: string;
}

export const MENTION_RGPD = 'Pré-analyse indicative à valider avec le DPO ; ne constitue pas un avis juridique.';

/** Nombre minimal de critères WP248 à partir duquel une AIPD est probablement requise. */
export const SEUIL_CRITERES_AIPD = 2;

const TITRES_ARTICLES: Record<string, string> = {
  'art. 4(4)': 'Définition du profilage',
  'art. 6': 'Licéité du traitement (bases légales)',
  'art. 9': 'Catégories particulières de données',
  'art. 10': 'Données relatives aux condamnations et infractions',
  'art. 13 et 14': 'Information des personnes',
  'art. 22': 'Décision individuelle automatisée, y compris le profilage',
  'art. 35': "Analyse d'impact relative à la protection des données (AIPD)",
};

export interface ContexteRgpd {
  /** Le système est un système d'IA (réponse AI Act). */
  systemeIA?: boolean;
  profilage?: Reponse | null;
  annexeIII?: CasAnnexeIIIId | 'aucun' | null;
}

/** Critères WP248 que les autres réponses rendent probables (aide à la saisie, jamais imposée). */
export function suggererCriteres(r: RgpdReponses, contexte: ContexteRgpd = {}): CritereAipdId[] {
  if (r.donneesPersonnelles === 'non') return [];
  const s = new Set<CritereAipdId>();
  if (r.donneesSensibles === 'oui' || r.donneesInfractions) s.add('donnees_sensibles');
  if (r.decisionAutomatisee === 'oui' && r.effetJuridique === 'oui') s.add('decision_automatisee');
  if (r.scoreDeterminant || contexte.profilage === 'oui') s.add('evaluation');
  if (contexte.systemeIA) s.add('usage_innovant');
  const annexe = contexte.annexeIII;
  if (annexe === '4a' || annexe === '4b' || annexe === '5a') s.add('personnes_vulnerables');
  if (annexe === '5a' || annexe === '5b' || annexe === '5c') s.add('exclusion_droit');
  return CRITERES_AIPD.map((c) => c.id).filter((id) => s.has(id));
}

export function evaluerRgpd(r: RgpdReponses, contexte: ContexteRgpd = {}): ResultatRgpd {
  const justification: string[] = [];
  const pointsVigilance: string[] = [];
  const manquants: string[] = [];
  const refs = new Set<string>();

  const criteresRetenus = CRITERES_AIPD.filter((c) => r.criteres.includes(c.id)).map((c) => ({
    id: c.id,
    numero: c.numero,
    libelle: c.libelle,
  }));

  const resultat = (niveau: NiveauRgpd, extras: Partial<ResultatRgpd> = {}): ResultatRgpd => ({
    niveau,
    libelle: NIVEAUX_RGPD[niveau].libelle,
    applicable: extras.applicable ?? null,
    nbCriteres: extras.nbCriteres ?? 0,
    criteresRetenus: extras.criteresRetenus ?? [],
    criteresSuggeresNonRetenus: extras.criteresSuggeresNonRetenus ?? [],
    article9: extras.article9 ?? false,
    article22: extras.article22 ?? 'inconnu',
    justification: justification.map(typographie),
    pointsVigilance: pointsVigilance.map(typographie),
    articles: [...refs].map((ref) => ({ ref, titre: TITRES_ARTICLES[ref] ?? '' })),
    manquants: manquants.map(typographie),
    mention: MENTION_RGPD,
  });

  /* 1. Applicabilité */
  if (r.donneesPersonnelles === null) {
    manquants.push('Le traitement porte-t-il sur des données personnelles (y compris indirectement identifiantes) ?');
    return resultat('incomplet');
  }
  if (r.donneesPersonnelles === 'non') {
    justification.push(
      'Aucune donnée personnelle, même indirectement identifiante, n’est traitée : le RGPD ne s’applique pas à ce traitement.',
    );
    pointsVigilance.push(
      'Vérifier l’absence de réidentification possible (données agrégées : seuils minimaux, pas de croisement avec des données individuelles).',
    );
    return resultat('non_applicable', { applicable: false });
  }
  if (r.donneesPersonnelles === 'nsp') {
    pointsVigilance.push(
      'Présence de données personnelles à confirmer : par prudence, la pré-analyse considère que le RGPD s’applique.',
    );
  } else {
    justification.push(
      `Le traitement porte sur des données personnelles${r.categoriesDonnees ? ` (${r.categoriesDonnees})` : ''} : le RGPD s’applique.`,
    );
  }

  /* 2. Base légale */
  refs.add('art. 6');
  const base = BASES_LEGALES.find((b) => b.id === r.baseLegale);
  if (base) justification.push(`Base légale envisagée : ${base.libelle.charAt(0).toLowerCase()}${base.libelle.slice(1)}.`);
  else pointsVigilance.push('Base légale à déterminer et à documenter (art. 6) avant tout développement.');
  if (r.baseLegale === 'consentement' && r.criteres.includes('personnes_vulnerables')) {
    pointsVigilance.push(
      'Le consentement est difficilement libre dans une relation déséquilibrée (salariés, usagers d’un service public) : envisager une autre base légale.',
    );
  }

  /* 3. Données sensibles (art. 9) et infractions (art. 10) */
  let article9 = false;
  if (r.donneesSensibles === null) {
    manquants.push('Le traitement porte-t-il sur des données sensibles (art. 9) ?');
  } else if (r.donneesSensibles === 'oui') {
    article9 = true;
    refs.add('art. 9');
    const categories = CATEGORIES_ART_9.filter((c) => r.categoriesSensibles.includes(c.id)).map((c) =>
      c.libelle.toLowerCase(),
    );
    justification.push(
      `Données sensibles${categories.length ? ` (${categories.join(', ')})` : ''} : traitement interdit par principe, sauf exception de l’art. 9(2) à identifier et documenter (consentement explicite, droit du travail et protection sociale, intérêt public important, santé…).`,
    );
  } else if (r.donneesSensibles === 'nsp') {
    pointsVigilance.push(
      'Des données sensibles peuvent apparaître dans des champs libres ou des pièces jointes : prévoir filtrage, minimisation et consignes de saisie.',
    );
  }
  if (r.donneesInfractions) {
    refs.add('art. 10');
    justification.push(
      'Données relatives aux infractions ou à des soupçons de fraude : traitement encadré par l’art. 10 et le droit national (autorisation légale, garanties appropriées).',
    );
  }

  /* 4. Décision automatisée (art. 22) */
  let article22: StatutArt22 = 'inconnu';
  if (r.decisionAutomatisee === null) {
    manquants.push('Une décision est-elle prise exclusivement par le système, sans intervention humaine significative ?');
  } else if (r.decisionAutomatisee === 'oui') {
    if (r.effetJuridique === null) {
      manquants.push('Cette décision produit-elle des effets juridiques ou affecte-t-elle la personne de manière significative ?');
    } else if (r.effetJuridique === 'oui' || r.effetJuridique === 'nsp') {
      article22 = 'applicable';
      refs.add('art. 22');
      justification.push(
        'Décision fondée exclusivement sur un traitement automatisé produisant des effets juridiques ou significatifs : interdite par principe (art. 22(1)), sauf nécessité contractuelle, autorisation légale ou consentement explicite (art. 22(2)), avec intervention humaine, possibilité d’exprimer son point de vue et de contester (art. 22(3)).',
      );
      if (article9) {
        justification.push('Avec des données sensibles, la décision automatisée n’est possible que dans les cas de l’art. 22(4).');
      }
    } else {
      article22 = 'non';
      justification.push('La décision automatisée ne produit pas d’effet juridique ou significatif : l’art. 22 ne s’applique pas.');
    }
  } else {
    article22 = r.scoreDeterminant ? 'vigilance' : 'non';
    if (r.scoreDeterminant) {
      refs.add('art. 22');
      pointsVigilance.push(
        'Le score produit pèse de manière déterminante sur la décision : selon la CJUE (SCHUFA, C-634/21, 7 décembre 2023), cela peut constituer une décision automatisée au sens de l’art. 22. Garantir une intervention humaine réelle, outillée et tracée.',
      );
    } else {
      justification.push('Une personne prend la décision finale : pas de décision exclusivement automatisée au sens de l’art. 22.');
    }
  }

  /* 5. AIPD (art. 35) */
  refs.add('art. 35');
  const suggeres = suggererCriteres(r, contexte);
  const criteresSuggeresNonRetenus = suggeres.filter((id) => !r.criteres.includes(id));
  const nbCriteres = criteresRetenus.length;

  if (criteresSuggeresNonRetenus.length) {
    const libelles = CRITERES_AIPD.filter((c) => criteresSuggeresNonRetenus.includes(c.id)).map(
      (c) => `${c.numero}. ${c.libelle.toLowerCase()}`,
    );
    pointsVigilance.push(`Critères suggérés par vos autres réponses mais non retenus : ${libelles.join(' ; ')}. Justifier ce choix.`);
  }

  const extras = {
    applicable: true,
    nbCriteres,
    criteresRetenus,
    criteresSuggeresNonRetenus,
    article9,
    article22,
  };

  let niveau: NiveauRgpd;
  if (r.listeCnil) {
    niveau = 'aipd_requise';
    justification.push(
      'Le traitement relève de la liste CNIL des types d’opérations pour lesquels une AIPD est obligatoire : AIPD requise (art. 35(4)).',
    );
  } else if (nbCriteres >= SEUIL_CRITERES_AIPD) {
    niveau = 'aipd_requise';
    justification.push(
      `${nbCriteres} critères des lignes directrices WP248 réunis (${criteresRetenus.map((c) => c.numero).join(', ')}) : au moins deux critères, une AIPD est probablement requise (art. 35).`,
    );
  } else if (nbCriteres === 1) {
    niveau = 'aipd_a_documenter';
    justification.push(
      `Un seul critère WP248 (${criteresRetenus[0]?.libelle.toLowerCase()}) : AIPD non obligatoire a priori, mais l’analyse doit être documentée ; un seul critère peut suffire si le risque est élevé.`,
    );
  } else {
    niveau = 'aipd_non_requise';
    justification.push(
      'Aucun critère WP248 retenu : AIPD non requise a priori. Inscrire le traitement au registre (art. 30) et appliquer la protection des données dès la conception (art. 25).',
    );
  }

  if (manquants.length) return resultat('incomplet', extras);
  return resultat(niveau, extras);
}
