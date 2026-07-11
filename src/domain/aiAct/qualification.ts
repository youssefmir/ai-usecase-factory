/**
 * Qualification d'un cas d'usage au regard de l'AI Act (logique pure, testée).
 *
 * Ordre d'analyse : exclusions (art. 2) -> définition (art. 3(1)) -> rôle (art. 3, 25)
 * -> pratiques interdites (art. 5) -> haut risque (art. 6 : annexe I, annexe III, dérogation 6(3))
 * -> transparence (art. 50) -> modèles à usage général (chapitre V) -> obligations et calendrier.
 *
 * Résultat : aide à la qualification, qui ne constitue pas un avis juridique.
 */
import { minusculeInitiale, typographie } from '../format';
import type { AiActReponses } from '../model';
import { dateDuJour, jalonsPourPortees, type JalonDate, type PorteeJalon } from './calendar';
import {
  ARTICLES,
  DEROGATIONS_6_3,
  EXCLUSIONS_ART_2,
  PRATIQUES_INTERDITES,
  ROLES,
  trouverCasAnnexeIII,
  type DerogationId,
} from './catalog';

export type NiveauAiAct = 'interdit' | 'haut_risque' | 'transparence' | 'minimal' | 'hors_champ' | 'incomplet';

export const NIVEAUX_AI_ACT: Record<NiveauAiAct, { libelle: string; court: string; description: string; rang: number }> = {
  interdit: {
    libelle: 'Pratique interdite',
    court: 'Interdit',
    description: 'Pratique prohibée par l’art. 5 : le système ne peut être ni mis sur le marché ni utilisé.',
    rang: 5,
  },
  haut_risque: {
    libelle: 'Haut risque',
    court: 'Haut risque',
    description: 'Système à haut risque (art. 6) : exigences de conformité et obligations du déployeur.',
    rang: 4,
  },
  transparence: {
    libelle: 'Risque limité (transparence)',
    court: 'Transparence',
    description: 'Obligations d’information et de marquage de l’art. 50.',
    rang: 3,
  },
  minimal: {
    libelle: 'Risque minimal',
    court: 'Minimal',
    description: 'Pas d’obligation spécifique au-delà de la maîtrise de l’IA (art. 4) et des autres règles applicables.',
    rang: 2,
  },
  hors_champ: {
    libelle: 'Hors champ de l’AI Act',
    court: 'Hors champ',
    description: 'Pas un système d’IA au sens de l’art. 3(1), ou exclusion de l’art. 2.',
    rang: 1,
  },
  incomplet: {
    libelle: 'Qualification à compléter',
    court: 'À compléter',
    description: 'Des réponses manquent pour conclure.',
    rang: 0,
  },
};

export type Acteur = 'fournisseur' | 'deployeur' | 'tous' | 'fournisseur_modele';

export const LIBELLES_ACTEURS: Record<Acteur, string> = {
  fournisseur: 'Fournisseur du système',
  deployeur: 'Déployeur',
  tous: 'Fournisseur et déployeur',
  fournisseur_modele: 'Fournisseur du modèle à usage général',
};

export interface Obligation {
  id: string;
  acteur: Acteur;
  texte: string;
  articles: string[];
  /** Date d'application (ISO). */
  echeance: string;
  /** true si l'obligation pèse sur le rôle déclaré ; null si le rôle n'est pas renseigné. */
  vousConcerne: boolean | null;
}

export interface ResultatAiAct {
  niveau: NiveauAiAct;
  /** Niveau calculé avec les réponses disponibles (utile quand le niveau est « incomplet »). */
  niveauProvisoire: Exclude<NiveauAiAct, 'incomplet'>;
  libelle: string;
  justification: string[];
  articles: { ref: string; titre: string }[];
  obligations: Obligation[];
  calendrier: JalonDate[];
  echeanceCle: JalonDate | null;
  /** Des obligations de l'art. 50 s'appliquent (y compris en complément du haut risque). */
  transparence: boolean;
  /** Analyse d'impact sur les droits fondamentaux requise (art. 27). */
  fria: boolean;
  derogationAppliquee: DerogationId | null;
  voieHautRisque: 'annexe_I' | 'annexe_III' | null;
  avertissements: string[];
  manquants: string[];
  mention: string;
}

export const MENTION_AI_ACT = 'Aide à la qualification, ne constitue pas un avis juridique.';

const DATE_INTERDICTIONS = '2025-02-02';
const DATE_MAITRISE = '2025-02-02';
const DATE_GPAI = '2025-08-02';
const DATE_TRANSPARENCE = '2026-08-02';
const DATE_ANNEXE_III = '2027-12-02';
const DATE_ANNEXE_I = '2028-08-02';

/** Réponses vides : point de départ d'un nouveau questionnaire. */
export function reponsesAiActVides(): AiActReponses {
  return {
    inference: null,
    autonomie: null,
    exclusion: null,
    role: null,
    modificationSubstantielle: null,
    pratiquesInterdites: [],
    pratiquesVerifiees: false,
    annexeI: null,
    annexeIII: null,
    profilage: null,
    derogation: null,
    transparence: {
      interactionDirecte: false,
      contenuSynthetique: false,
      emotionOuBiometrie: false,
      hypertrucage: false,
      texteInteretPublic: false,
    },
    gpai: null,
    organismePublic: null,
    notes: '',
  };
}

export function qualifierAiAct(r: AiActReponses, reference: string = dateDuJour()): ResultatAiAct {
  const justification: string[] = [];
  const avertissements: string[] = [];
  const manquants: string[] = [];
  const refsArticles = new Set<string>();
  const obligations: Obligation[] = [];
  const portees = new Set<PorteeJalon>(['general']);

  const estFournisseur =
    r.role === 'fournisseur' || r.role === 'fournisseur_deployeur' || r.modificationSubstantielle === 'oui';
  const estDeployeur = r.role === 'deployeur' || r.role === 'fournisseur_deployeur';
  const fournitModele = r.gpai === 'fournit_modele' || r.gpai === 'fournit_modele_systemique';

  const concerne = (acteur: Acteur): boolean | null => {
    if (acteur === 'fournisseur_modele') return fournitModele;
    if (r.role === null) return null;
    if (acteur === 'tous') return true;
    return acteur === 'fournisseur' ? estFournisseur : estDeployeur;
  };
  const ajouterObligation = (o: Omit<Obligation, 'vousConcerne'>) => {
    obligations.push({ ...o, vousConcerne: concerne(o.acteur) });
    o.articles.forEach((a) => refsArticles.add(a));
  };

  const fabriquer = (
    niveauProvisoire: Exclude<NiveauAiAct, 'incomplet'>,
    extras: Partial<Pick<ResultatAiAct, 'transparence' | 'fria' | 'derogationAppliquee' | 'voieHautRisque'>> & {
      echeanceId?: string | null;
    } = {},
  ): ResultatAiAct => {
    const niveau: NiveauAiAct =
      manquants.length > 0 && niveauProvisoire !== 'interdit' && niveauProvisoire !== 'hors_champ'
        ? 'incomplet'
        : niveauProvisoire;
    const calendrier = niveauProvisoire === 'hors_champ' ? [] : jalonsPourPortees([...portees], reference);
    const echeanceCle = extras.echeanceId ? (calendrier.find((j) => j.id === extras.echeanceId) ?? null) : null;
    return {
      niveau,
      niveauProvisoire,
      libelle: NIVEAUX_AI_ACT[niveau].libelle,
      justification: justification.map(typographie),
      articles: [...refsArticles]
        .sort(comparerRefs)
        .map((ref) => ({ ref, titre: ARTICLES[ref] ?? '' })),
      obligations: obligations.map((o) => ({ ...o, texte: typographie(o.texte) })),
      calendrier,
      echeanceCle,
      transparence: extras.transparence ?? false,
      fria: extras.fria ?? false,
      derogationAppliquee: extras.derogationAppliquee ?? null,
      voieHautRisque: extras.voieHautRisque ?? null,
      avertissements: avertissements.map(typographie),
      manquants: manquants.map(typographie),
      mention: MENTION_AI_ACT,
    };
  };

  /* 1. Exclusions du champ d'application (art. 2) */
  if (r.exclusion && r.exclusion !== 'aucune') {
    const exclusion = EXCLUSIONS_ART_2.find((e) => e.id === r.exclusion);
    refsArticles.add('art. 2');
    justification.push(`Exclusion du champ d'application : ${exclusion?.libelle ?? r.exclusion}. L'AI Act ne s'applique pas.`);
    avertissements.push('Les autres réglementations (RGPD, droit sectoriel) restent applicables.');
    return fabriquer('hors_champ');
  }

  /* 2. Définition d'un système d'IA (art. 3(1)) */
  refsArticles.add('art. 3(1)');
  if (r.inference === 'non' || r.autonomie === 'non') {
    justification.push(
      "Le système applique des règles définies uniquement par des humains ou un calcul simple, sans inférer lui-même ses sorties : il ne constitue pas un système d'IA au sens de l'art. 3(1).",
    );
    avertissements.push(
      'À réexaminer si la solution évolue (ajout d’un modèle appris, d’un composant génératif ou d’une logique d’inférence).',
    );
    return fabriquer('hors_champ');
  }
  if (r.inference === null) manquants.push("Le système infère-t-il ses sorties à partir des données reçues (art. 3(1)) ?");
  if (r.autonomie === null) manquants.push('Le système fonctionne-t-il avec un certain degré d’autonomie ?');
  if (r.inference === 'nsp' || r.autonomie === 'nsp') {
    avertissements.push(
      "Définition de système d'IA à confirmer avec l'équipe technique ; par prudence, l'analyse se poursuit comme s'il s'agissait d'un système d'IA.",
    );
  } else if (r.inference === 'oui' && r.autonomie === 'oui') {
    justification.push(
      "Le système infère, à partir des données qu'il reçoit, comment générer des sorties (prédictions, contenus, recommandations ou décisions) avec un certain degré d'autonomie : c'est un système d'IA au sens de l'art. 3(1).",
    );
  }
  if (r.exclusion === null) manquants.push("Une exclusion de l'art. 2 s'applique-t-elle (défense, recherche, usage personnel) ?");
  else justification.push("Aucune exclusion de l'art. 2 n'est invoquée.");

  /* 3. Rôle de l'organisation */
  if (r.role === null) {
    manquants.push("Rôle de l'organisation : fournisseur, déployeur ou les deux ?");
  } else {
    const role = ROLES.find((x) => x.id === r.role);
    justification.push(`Rôle déclaré : ${minusculeInitiale(role?.libelle ?? '')}.`);
    if (r.role === 'deployeur' && r.modificationSubstantielle === 'oui') {
      refsArticles.add('art. 25');
      justification.push(
        "L'organisation modifie substantiellement le système ou sa destination, ou le commercialise sous son nom : elle devient fournisseur (art. 25(1)).",
      );
    }
  }

  /* 4. Pratiques interdites (art. 5) */
  if (r.pratiquesInterdites.length > 0) {
    refsArticles.add('art. 5');
    const pratiques = PRATIQUES_INTERDITES.filter((p) => r.pratiquesInterdites.includes(p.id));
    for (const p of pratiques) {
      justification.push(`Pratique interdite identifiée (${p.article}) : ${minusculeInitiale(p.libelle)}.`);
      portees.add(p.applicableDes === DATE_INTERDICTIONS ? 'interdictions' : 'interdictions_omnibus');
    }
    const premiere = pratiques.map((p) => p.applicableDes).sort()[0] ?? DATE_INTERDICTIONS;
    ajouterObligation({
      id: 'interdiction',
      acteur: 'tous',
      texte:
        "Ne pas mettre sur le marché, mettre en service ni utiliser le système : abandonner le cas d'usage ou le reconcevoir pour sortir de la pratique interdite.",
      articles: ['art. 5'],
      echeance: premiere,
    });
    const echeanceId = premiere === DATE_INTERDICTIONS ? 'interdictions' : 'interdictions_omnibus';
    return fabriquer('interdit', { echeanceId });
  }
  if (!r.pratiquesVerifiees) {
    manquants.push("Vérification des pratiques interdites de l'art. 5 (cocher « aucune pratique interdite » après revue).");
  } else {
    justification.push(
      "Aucune pratique interdite de l'art. 5 n'a été identifiée, y compris les interdictions ajoutées par l'omnibus (nudification, contenus pédocriminels).",
    );
  }

  /* 5. Haut risque (art. 6) */
  let hautRisque = false;
  let voieHautRisque: 'annexe_I' | 'annexe_III' | null = null;
  let derogationAppliquee: DerogationId | null = null;
  const cas = trouverCasAnnexeIII(r.annexeIII);

  if (r.annexeI === null) {
    manquants.push("Le système est-il un composant de sécurité d'un produit couvert par l'annexe I (ou ce produit lui-même) ?");
  } else if (r.annexeI === 'oui') {
    hautRisque = true;
    voieHautRisque = 'annexe_I';
    refsArticles.add('art. 6(1)');
    refsArticles.add('annexe I');
    portees.add('haut_risque_annexe_I');
    justification.push(
      "Le système est un composant de sécurité d'un produit (ou un produit) couvert par la législation d'harmonisation de l'annexe I et soumis à une évaluation de conformité par un tiers : haut risque (art. 6(1)).",
    );
  } else if (r.annexeI === 'nsp') {
    avertissements.push(
      "Rattachement à l'annexe I à vérifier : un composant de sécurité d'un produit réglementé (machines, dispositifs médicaux, jouets…) soumis à évaluation par un tiers serait à haut risque (art. 6(1)).",
    );
  }

  if (r.annexeIII === null) {
    manquants.push("Le cas d'usage relève-t-il d'un domaine de l'annexe III ?");
  } else if (r.annexeIII === 'aucun') {
    justification.push("Le cas d'usage ne relève d'aucun domaine de l'annexe III.");
  } else if (cas && !cas.hautRisque) {
    refsArticles.add('annexe III');
    justification.push(
      `Le cas relève de l'exception prévue au point ${cas.point} de l'annexe III (${minusculeInitiale(cas.libelle)}) : il n'est pas à haut risque à ce titre.`,
    );
    avertissements.push(
      "L'exception ne couvre que la détection de fraude : si le même système sert aussi à évaluer la solvabilité ou à orienter la décision d'octroi, il redevient à haut risque (point 5 b).",
    );
  } else if (cas) {
    refsArticles.add('art. 6(2)');
    refsArticles.add('annexe III');
    justification.push(`Le cas d'usage relève de l'annexe III, point ${cas.point} : ${minusculeInitiale(cas.libelle)}.`);

    const derogation = DEROGATIONS_6_3.find((d) => d.id === r.derogation);
    if (r.profilage === null) {
      manquants.push('Le système effectue-t-il un profilage de personnes physiques ?');
    } else if (r.profilage === 'oui' || r.profilage === 'nsp') {
      hautRisque = true;
      if (r.profilage === 'oui') {
        justification.push(
          "Le système effectue un profilage de personnes physiques : il est toujours considéré comme à haut risque, la dérogation de l'art. 6(3) est exclue (art. 6(3), dernier alinéa).",
        );
      } else {
        avertissements.push(
          "Profilage non exclu : par prudence, la dérogation de l'art. 6(3) n'est pas retenue et le système est traité comme à haut risque.",
        );
      }
      if (derogation) {
        refsArticles.add('art. 6(3)');
        justification.push(
          `La dérogation ${derogation.article} (${minusculeInitiale(derogation.libelle)}) a été envisagée mais ne peut pas s'appliquer en cas de profilage.`,
        );
      }
    } else if (r.derogation === null) {
      manquants.push("Une condition de dérogation de l'art. 6(3) est-elle remplie ?");
    } else if (r.derogation === 'aucune' || !derogation) {
      hautRisque = true;
      justification.push("Aucune condition de dérogation de l'art. 6(3) n'est remplie : le système est à haut risque (art. 6(2)).");
    } else {
      derogationAppliquee = derogation.id;
      refsArticles.add('art. 6(3)');
      portees.add('haut_risque_annexe_III');
      justification.push(
        `Sans profilage, la condition ${derogation.article} est remplie (${minusculeInitiale(derogation.libelle)}) : le système n'est pas considéré comme à haut risque, à condition qu'il ne présente pas de risque important pour la santé, la sécurité ou les droits fondamentaux.`,
      );
      ajouterObligation({
        id: 'documenter_6_4',
        acteur: 'fournisseur',
        texte:
          "Documenter l'évaluation concluant à l'absence de haut risque avant la mise sur le marché ou la mise en service, et la tenir à disposition des autorités (art. 6(4)).",
        articles: ['art. 6(4)'],
        echeance: DATE_ANNEXE_III,
      });
      ajouterObligation({
        id: 'enregistrer_6_3',
        acteur: 'fournisseur',
        texte:
          "Enregistrer le système dans la base de données de l'UE malgré la dérogation (art. 49(2)), avec le contenu simplifié prévu après l'omnibus.",
        articles: ['art. 49'],
        echeance: DATE_ANNEXE_III,
      });
      avertissements.push(
        'La dérogation est à réévaluer si l’usage évolue (ajout d’un score, d’une recommandation de décision ou d’un profilage).',
      );
    }
    if (hautRisque && voieHautRisque === null) voieHautRisque = 'annexe_III';
    if (hautRisque) portees.add('haut_risque_annexe_III');
  }

  /* 6. Transparence (art. 50) */
  const t = r.transparence;
  const transparence = t.interactionDirecte || t.contenuSynthetique || t.emotionOuBiometrie || t.hypertrucage || t.texteInteretPublic;
  if (transparence) {
    portees.add('transparence');
    if (t.interactionDirecte) {
      justification.push("Le système interagit directement avec des personnes physiques : obligation d'information (art. 50(1)).");
      ajouterObligation({
        id: 'transparence_interaction',
        acteur: 'fournisseur',
        texte:
          "Concevoir le système pour que les personnes soient informées qu'elles interagissent avec une IA, sauf si c'est évident (art. 50(1)).",
        articles: ['art. 50'],
        echeance: DATE_TRANSPARENCE,
      });
    }
    if (t.contenuSynthetique) {
      portees.add('marquage_transitoire');
      justification.push('Le système génère des contenus de synthèse (texte, image, audio ou vidéo) : obligation de marquage (art. 50(2)).');
      ajouterObligation({
        id: 'transparence_marquage',
        acteur: 'fournisseur',
        texte:
          'Marquer les contenus générés dans un format lisible par machine et détectable comme artificiel (art. 50(2)) ; délai jusqu’au 2 décembre 2026 pour les systèmes déjà sur le marché avant le 2 août 2026.',
        articles: ['art. 50'],
        echeance: DATE_TRANSPARENCE,
      });
    }
    if (t.emotionOuBiometrie) {
      justification.push(
        'Le système reconnaît des émotions ou réalise une catégorisation biométrique : information des personnes exposées (art. 50(3)).',
      );
      ajouterObligation({
        id: 'transparence_emotions',
        acteur: 'deployeur',
        texte:
          'Informer les personnes exposées du fonctionnement du système de reconnaissance des émotions ou de catégorisation biométrique (art. 50(3)).',
        articles: ['art. 50'],
        echeance: DATE_TRANSPARENCE,
      });
    }
    if (t.hypertrucage) {
      justification.push('Le système produit des hypertrucages (« deepfakes ») : obligation de divulgation (art. 50(4)).');
      ajouterObligation({
        id: 'transparence_hypertrucage',
        acteur: 'deployeur',
        texte: "Indiquer que le contenu (image, audio, vidéo) a été généré ou manipulé artificiellement (art. 50(4)).",
        articles: ['art. 50'],
        echeance: DATE_TRANSPARENCE,
      });
    }
    if (t.texteInteretPublic) {
      justification.push(
        "Le système génère des textes publiés pour informer le public sur des questions d'intérêt public : obligation de divulgation (art. 50(4)).",
      );
      ajouterObligation({
        id: 'transparence_texte_public',
        acteur: 'deployeur',
        texte:
          "Indiquer que le texte publié a été généré par IA, sauf relecture humaine avec responsabilité éditoriale (art. 50(4)).",
        articles: ['art. 50'],
        echeance: DATE_TRANSPARENCE,
      });
    }
  } else {
    justification.push("Aucune obligation de transparence de l'art. 50 n'est déclenchée.");
  }

  /* 7. Modèles d'IA à usage général (chapitre V) */
  if (r.gpai === null) {
    manquants.push("Le système repose-t-il sur un modèle d'IA à usage général (ex. grand modèle de langage) ?");
  } else if (r.gpai === 'integre_modele_tiers') {
    justification.push(
      "Le système intègre un modèle d'IA à usage général fourni par un tiers : les obligations du chapitre V pèsent sur le fournisseur du modèle.",
    );
    ajouterObligation({
      id: 'gpai_aval',
      acteur: 'fournisseur',
      texte:
        "En tant que fournisseur en aval, obtenir et exploiter la documentation du fournisseur du modèle (art. 53(1)(b)) pour documenter et maîtriser son propre système.",
      articles: ['art. 53'],
      echeance: DATE_GPAI,
    });
  } else if (fournitModele) {
    portees.add('gpai');
    justification.push("L'organisation fournit un modèle d'IA à usage général : obligations du chapitre V (art. 53).");
    ajouterObligation({
      id: 'gpai_fournisseur',
      acteur: 'fournisseur_modele',
      texte:
        'Documentation technique, informations aux fournisseurs en aval, politique de respect du droit d’auteur et résumé public des contenus d’entraînement (art. 53).',
      articles: ['art. 53'],
      echeance: DATE_GPAI,
    });
    if (r.gpai === 'fournit_modele_systemique') {
      ajouterObligation({
        id: 'gpai_systemique',
        acteur: 'fournisseur_modele',
        texte:
          'Modèle à risque systémique : évaluation du modèle, atténuation des risques, signalement des incidents graves et cybersécurité (art. 55).',
        articles: ['art. 55'],
        echeance: DATE_GPAI,
      });
    }
  } else {
    justification.push("Le système ne repose pas sur un modèle d'IA à usage général.");
  }

  /* 8. Obligations liées au haut risque */
  let fria = false;
  if (hautRisque) {
    const echeance = voieHautRisque === 'annexe_I' ? DATE_ANNEXE_I : DATE_ANNEXE_III;
    ajouterObligation({
      id: 'hr_gestion_risques',
      acteur: 'fournisseur',
      texte: 'Système de gestion des risques et gouvernance des données d’entraînement, de validation et de test (art. 9 et 10).',
      articles: ['art. 8 à 15'],
      echeance,
    });
    ajouterObligation({
      id: 'hr_documentation',
      acteur: 'fournisseur',
      texte:
        'Documentation technique, journalisation automatique, notice d’utilisation et conception du contrôle humain (art. 11 à 14) ; exactitude, robustesse et cybersécurité (art. 15).',
      articles: ['art. 8 à 15'],
      echeance,
    });
    ajouterObligation({
      id: 'hr_conformite',
      acteur: 'fournisseur',
      texte:
        'Système de gestion de la qualité, évaluation de la conformité, déclaration UE et marquage CE, enregistrement dans la base de l’UE (art. 16, 17, 43, 47 à 49).',
      articles: ['art. 16', 'art. 43', 'art. 49'],
      echeance,
    });
    ajouterObligation({
      id: 'hr_surveillance',
      acteur: 'fournisseur',
      texte: 'Surveillance après commercialisation et signalement des incidents graves (art. 72 et 73).',
      articles: ['art. 72', 'art. 73'],
      echeance,
    });
    ajouterObligation({
      id: 'dep_usage_controle',
      acteur: 'deployeur',
      texte:
        'Utiliser le système conformément à la notice et confier le contrôle humain à des personnes compétentes, formées et dotées de l’autorité nécessaire (art. 26(1) et (2)).',
      articles: ['art. 26'],
      echeance,
    });
    ajouterObligation({
      id: 'dep_donnees_surveillance',
      acteur: 'deployeur',
      texte:
        'Veiller à la pertinence des données d’entrée sous son contrôle, surveiller le fonctionnement, signaler risques et incidents graves, conserver les journaux au moins six mois (art. 26(4) à (6)).',
      articles: ['art. 26'],
      echeance,
    });
    ajouterObligation({
      id: 'dep_aipd',
      acteur: 'deployeur',
      texte: 'Utiliser les informations fournies par le fournisseur pour réaliser l’AIPD prévue par le RGPD (art. 26(9)).',
      articles: ['art. 26'],
      echeance,
    });
    if (cas?.lieuDeTravail) {
      ajouterObligation({
        id: 'dep_representants',
        acteur: 'deployeur',
        texte:
          'Informer les représentants du personnel et les salariés concernés avant la mise en service sur le lieu de travail (art. 26(7)).',
        articles: ['art. 26'],
        echeance,
      });
    }
    if (voieHautRisque === 'annexe_III') {
      ajouterObligation({
        id: 'dep_information_personnes',
        acteur: 'deployeur',
        texte:
          'Informer les personnes concernées qu’une décision les concernant est prise avec l’aide du système (art. 26(11)) et répondre aux demandes d’explication (art. 86).',
        articles: ['art. 26', 'art. 86'],
        echeance,
      });
    }
    if (r.organismePublic === 'oui') {
      portees.add('autorites_publiques');
      ajouterObligation({
        id: 'dep_enregistrement_public',
        acteur: 'deployeur',
        texte:
          "Autorité publique : vérifier l'enregistrement du système et enregistrer son utilisation dans la base de données de l'UE (art. 26(8) et 49(3)).",
        articles: ['art. 26', 'art. 49'],
        echeance,
      });
    }

    // Analyse d'impact sur les droits fondamentaux (art. 27)
    const friaPossible = voieHautRisque === 'annexe_III' && cas && !cas.infrastructureCritique;
    if (friaPossible && (r.organismePublic === 'oui' || cas.friaDeployeurPrive)) {
      fria = true;
      justification.push(
        r.organismePublic === 'oui'
          ? "Le déployeur est un organisme de droit public ou fournit un service public : une analyse d'impact sur les droits fondamentaux (FRIA) est requise (art. 27)."
          : `Le cas relève du point ${cas.point} de l'annexe III : le déployeur doit réaliser une analyse d'impact sur les droits fondamentaux (FRIA, art. 27).`,
      );
      ajouterObligation({
        id: 'dep_fria',
        acteur: 'deployeur',
        texte:
          "Réaliser une analyse d'impact sur les droits fondamentaux (FRIA) avant la première utilisation et notifier ses résultats à l'autorité de surveillance (art. 27).",
        articles: ['art. 27'],
        echeance,
      });
    } else if (friaPossible && r.organismePublic === 'nsp') {
      avertissements.push(
        "Si l'organisation est un organisme de droit public ou une entité privée fournissant un service public, une FRIA est requise (art. 27).",
      );
    } else if (friaPossible && r.organismePublic === null) {
      manquants.push('Le déployeur est-il un organisme public ou une entité fournissant un service public (FRIA, art. 27) ?');
    }
    justification.push(
      voieHautRisque === 'annexe_I'
        ? "Échéance : les obligations des systèmes de l'annexe I s'appliquent à partir du 2 août 2028 (report par l'omnibus)."
        : "Échéance : les obligations des systèmes de l'annexe III s'appliquent à partir du 2 décembre 2027 (report par l'omnibus).",
    );
  }

  /* 9. Maîtrise de l'IA (art. 4) : tous les fournisseurs et déployeurs */
  portees.add('maitrise');
  ajouterObligation({
    id: 'maitrise_ia',
    acteur: 'tous',
    texte:
      "Prendre des mesures pour développer la maîtrise de l'IA du personnel et des personnes qui utilisent le système (art. 4 ; obligation recalibrée par l'omnibus en obligation de moyens).",
    articles: ['art. 4'],
    echeance: DATE_MAITRISE,
  });

  if (hautRisque) {
    return fabriquer('haut_risque', {
      transparence,
      fria,
      derogationAppliquee,
      voieHautRisque,
      echeanceId: voieHautRisque === 'annexe_I' ? 'haut_risque_annexe_I' : 'haut_risque_annexe_III',
    });
  }
  if (transparence) {
    return fabriquer('transparence', { transparence, derogationAppliquee, echeanceId: 'application_generale' });
  }
  return fabriquer('minimal', {
    derogationAppliquee,
    echeanceId: derogationAppliquee ? 'haut_risque_annexe_III' : 'interdictions',
  });
}

/* ------------------------------------------------------------------ */

/** Tri naturel des références (« art. 4 » avant « art. 26 », annexes à la fin). */
function comparerRefs(a: string, b: string): number {
  const cle = (ref: string): [number, number, string] => {
    if (ref.startsWith('annexe')) return [1, ref === 'annexe I' ? 1 : 3, ref];
    const n = Number(/\d+/.exec(ref)?.[0] ?? 0);
    return [0, n, ref];
  };
  const [ga, na, sa] = cle(a);
  const [gb, nb, sb] = cle(b);
  return ga - gb || na - nb || sa.localeCompare(sb);
}
