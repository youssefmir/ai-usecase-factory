/**
 * Note de cadrage d'un cas d'usage : un même modèle structuré alimente la vue imprimable (A4)
 * et l'export Markdown, pour que les deux restent identiques.
 */
import { DEROGATIONS_6_3, trouverCasAnnexeIII } from '../aiAct/catalog';
import { LIBELLES_ACTEURS, NIVEAUX_AI_ACT } from '../aiAct/qualification';
import type { AnalyseCas } from '../analysis';
import { analyserSensibilite, simulerMonteCarlo } from '../businessCase/uncertainty';
import { fmtDateLongue, fmtEuro, fmtMois, fmtNombre, fmtPct, minusculeInitiale } from '../format';
import {
  CATEGORIES_RISQUE,
  DISPONIBILITES,
  IMPLICATIONS,
  MODES_INTEGRATION,
  NIVEAUX_AUTONOMIE,
  PROVENANCES,
  QUALITES,
  STATUTS,
  libelleTypologie,
  type ChampBusinessCase,
  type Portfolio,
} from '../model';
import { NIVEAUX_RGPD } from '../rgpd/evaluation';
import { libelleVague, type EntreeRoadmap } from '../roadmap/roadmap';
import { CRITERES, libelleQuadrant } from '../scoring/criteria';

export type Bloc =
  | { type: 'paragraphe'; texte: string }
  | { type: 'liste'; elements: string[]; ordonnee?: boolean }
  | { type: 'tableau'; entetes: string[]; lignes: string[][]; droite?: number[] }
  | { type: 'definitions'; elements: { terme: string; definition: string }[] }
  | { type: 'encadre'; texte: string };

export interface SectionNote {
  numero: string;
  titre: string;
  blocs: Bloc[];
}

export interface NoteCadrage {
  code: string;
  titre: string;
  organisation: string;
  fictive: boolean;
  porteur: string;
  statut: string;
  date: string;
  cartouche: { terme: string; definition: string }[];
  sections: SectionNote[];
  mentions: string[];
}

const LIBELLES_CHAMPS: Record<ChampBusinessCase, string> = {
  volumeAnnuel: 'Volume annuel',
  tempsUnitaireMin: 'Temps unitaire (min)',
  partAutomatisable: 'Part du temps économisée',
  coutHoraire: 'Coût horaire chargé',
  adoption: 'Adoption années 1 / 2 / 3',
  gainsQualite: 'Gains qualité annuels',
  joursBuild: 'Charge de build (jours)',
  tjm: 'TJM',
  autresCoutsBuild: 'Autres coûts ponctuels',
  infraAnnuelle: 'Infrastructure et licences',
  maintenancePct: 'Maintenance (% du build)',
  autresCoutsRun: 'Autres coûts récurrents',
  requetesParUnite: 'Requêtes LLM par unité',
  tokensParRequete: 'Tokens par requête',
  prixMillionTokens: 'Prix par million de tokens',
  tauxActualisation: 'Taux d’actualisation',
};

const libelle = <T extends { id: string; libelle: string }>(liste: readonly T[], id: string | null | undefined, defaut = 'Non renseigné') =>
  liste.find((x) => x.id === id)?.libelle ?? defaut;

const texteOuDefaut = (t: string, defaut = 'Non renseigné') => (t.trim() ? t.trim() : defaut);

function valeurChamp(analyse: AnalyseCas, champ: ChampBusinessCase): string {
  const bc = analyse.cas.businessCase;
  switch (champ) {
    case 'volumeAnnuel':
      return `${fmtNombre(bc.volumeAnnuel)} ${bc.uniteVolume}`;
    case 'tempsUnitaireMin':
      return fmtNombre(bc.tempsUnitaireMin, 1);
    case 'partAutomatisable':
    case 'maintenancePct':
    case 'tauxActualisation':
      return fmtPct(bc[champ], 1);
    case 'adoption':
      return bc.adoption.map((a) => fmtPct(a)).join(' / ');
    case 'coutHoraire':
    case 'tjm':
    case 'gainsQualite':
    case 'autresCoutsBuild':
    case 'infraAnnuelle':
    case 'autresCoutsRun':
      return fmtEuro(bc[champ]);
    case 'prixMillionTokens':
      return fmtEuro(bc.prixMillionTokens, 2);
    default:
      return fmtNombre(bc[champ]);
  }
}

/** Prochaines étapes et décisions attendues, déduites des analyses. */
export function prochainesEtapes(analyse: AnalyseCas, entree?: EntreeRoadmap): string[] {
  const { cas, aiAct, rgpd, scoring, businessCase } = analyse;
  const etapes: string[] = [];
  const hypotheses = Object.values(cas.businessCase.provenance).filter((p) => p === 'hypothese').length;
  if (aiAct.niveau === 'interdit') etapes.push('Décision proposée : ne pas engager le cas (pratique interdite par l’AI Act).');
  if (scoring.quadrant === 'a_ecarter' && aiAct.niveau !== 'interdit') etapes.push('Décision proposée : ne pas engager en l’état ; reconcevoir le périmètre ou abandonner.');
  if (aiAct.manquants.length) etapes.push(`Compléter la qualification AI Act (${aiAct.manquants.length} question(s) ouverte(s)).`);
  if (aiAct.niveauProvisoire === 'haut_risque') {
    etapes.push(
      `Planifier les livrables de conformité haut risque (documentation, contrôle humain, journalisation) avant le ${fmtDateLongue(
        aiAct.echeanceCle?.date ?? '2027-12-02',
      )}.`,
    );
  }
  if (aiAct.fria) etapes.push('Réaliser l’analyse d’impact sur les droits fondamentaux (FRIA, art. 27) avec la conformité.');
  if (aiAct.transparence) etapes.push('Spécifier les mentions de transparence et le marquage des contenus (art. 50).');
  if (rgpd.niveau === 'aipd_requise') etapes.push('Conduire l’AIPD avec le DPO avant le développement (art. 35 RGPD).');
  if (rgpd.article22 !== 'non' && rgpd.article22 !== 'inconnu') etapes.push('Concevoir une intervention humaine réelle et tracée sur les décisions (art. 22 RGPD).');
  if (hypotheses > 0) etapes.push(`Valider avec le métier les ${hypotheses} hypothèses chiffrées du business case.`);
  if (businessCase.van < 0) etapes.push('Revoir les coûts ou le périmètre : la VAN à 3 ans est négative avec les hypothèses actuelles.');
  if (entree && entree.vague >= 1 && entree.vague <= 3) etapes.push(`Soumettre le cas au comité pour une décision de lancement en ${libelleVague(entree.vague).toLowerCase()}.`);
  return etapes;
}

export function construireNote(analyse: AnalyseCas, portefeuille: Portfolio, entree?: EntreeRoadmap, date: string = new Date().toISOString()): NoteCadrage {
  const { cas, scoring, aiAct, rgpd, businessCase } = analyse;
  const bc = cas.businessCase;
  const sensibilite = analyserSensibilite(bc);
  const mc = simulerMonteCarlo(bc);
  const annexe = trouverCasAnnexeIII(cas.aiAct.annexeIII);
  const derogation = DEROGATIONS_6_3.find((d) => d.id === aiAct.derogationAppliquee);

  const sections: SectionNote[] = [
    {
      numero: '1',
      titre: 'Synthèse',
      blocs: [
        {
          type: 'definitions',
          elements: [
            { terme: 'Problème', definition: texteOuDefaut(cas.probleme) },
            { terme: 'Solution envisagée', definition: `${libelleTypologie(cas.solution.typologie)} : ${texteOuDefaut(cas.solution.description)}` },
            {
              terme: 'Priorisation',
              definition: `${libelleQuadrant(scoring.quadrant)} · priorité ${scoring.priorite === null ? 'non calculée' : `${fmtNombre(scoring.priorite)}/100`}`,
            },
            {
              terme: 'AI Act',
              definition: `${NIVEAUX_AI_ACT[aiAct.niveau].libelle}${annexe ? ` · annexe III, ${annexe.point}` : ''}${aiAct.fria ? ' · FRIA requise' : ''}`,
            },
            { terme: 'RGPD', definition: NIVEAUX_RGPD[rgpd.niveau].libelle },
            {
              terme: 'Business case (3 ans)',
              definition: `VAN ${fmtEuro(businessCase.van)} · ROI ${businessCase.roi === null ? '–' : fmtPct(businessCase.roi)} · retour ${
                businessCase.delaiRetourMois === null ? 'au-delà de 3 ans' : fmtMois(businessCase.delaiRetourMois)
              } · P(VAN > 0) ${fmtPct(mc.probaVanPositive)}`,
            },
            { terme: 'Planification', definition: entree ? libelleVague(entree.vague) : 'Non planifié' },
          ],
        },
      ],
    },
    {
      numero: '2',
      titre: 'Contexte et problème métier',
      blocs: [
        { type: 'paragraphe', texte: texteOuDefaut(cas.probleme) },
        {
          type: 'definitions',
          elements: [
            { terme: 'Processus concerné', definition: texteOuDefaut(cas.processus) },
            { terme: 'Objectifs', definition: texteOuDefaut(cas.objectifs) },
            { terme: 'Porteur métier', definition: texteOuDefaut(cas.porteur) },
          ],
        },
      ],
    },
    {
      numero: '3',
      titre: 'Utilisateurs et situation actuelle',
      blocs: [
        cas.personas.length
          ? { type: 'tableau', entetes: ['Persona', 'Rôle', 'Besoin'], lignes: cas.personas.map((p) => [p.nom, p.role, p.besoin]) }
          : { type: 'paragraphe', texte: 'Aucun persona décrit.' },
        { type: 'paragraphe', texte: texteOuDefaut(cas.situationActuelle.description) },
        {
          type: 'definitions',
          elements: [
            { terme: 'Volume annuel', definition: `${fmtNombre(bc.volumeAnnuel)} ${bc.uniteVolume} (${libelle(PROVENANCES, bc.provenance.volumeAnnuel, 'hypothèse').toLowerCase()})` },
            { terme: 'Temps unitaire', definition: `${fmtNombre(bc.tempsUnitaireMin, 1)} min (${libelle(PROVENANCES, bc.provenance.tempsUnitaireMin, 'hypothèse').toLowerCase()})` },
          ],
        },
        ...(cas.situationActuelle.irritants.length ? [{ type: 'liste' as const, elements: cas.situationActuelle.irritants }] : []),
      ],
    },
    {
      numero: '4',
      titre: 'Solution envisagée',
      blocs: [
        {
          type: 'definitions',
          elements: [
            { terme: 'Typologie', definition: libelleTypologie(cas.solution.typologie) },
            { terme: 'Description', definition: texteOuDefaut(cas.solution.description) },
            { terme: 'Niveau d’autonomie', definition: libelle(NIVEAUX_AUTONOMIE, cas.solution.niveauAutonomie) },
            { terme: 'Supervision humaine', definition: texteOuDefaut(cas.solution.supervisionHumaine) },
            { terme: 'Alternatives étudiées', definition: texteOuDefaut(cas.solution.alternatives) },
          ],
        },
      ],
    },
    {
      numero: '5',
      titre: 'Données et intégration au SI',
      blocs: [
        cas.donnees.sources.length
          ? {
              type: 'tableau',
              entetes: ['Source', 'Disponibilité', 'Qualité', 'Données perso.'],
              lignes: cas.donnees.sources.map((s) => [s.nom, libelle(DISPONIBILITES, s.disponibilite), libelle(QUALITES, s.qualite), s.personnelles ? 'Oui' : 'Non']),
            }
          : { type: 'paragraphe', texte: 'Aucune source décrite.' },
        {
          type: 'definitions',
          elements: [
            { terme: 'Systèmes concernés', definition: cas.integration.systemes.join(', ') || 'Non renseigné' },
            { terme: 'Mode d’intégration', definition: libelle(MODES_INTEGRATION, cas.integration.mode) },
            { terme: 'Principe', definition: texteOuDefaut(cas.integration.description) },
            { terme: 'Contraintes', definition: texteOuDefaut(cas.integration.contraintes) },
          ],
        },
      ],
    },
    {
      numero: '6',
      titre: 'Indicateurs de succès',
      blocs: [
        cas.kpis.length
          ? {
              type: 'tableau',
              entetes: ['Indicateur', 'Référence', 'Cible', 'Source'],
              lignes: cas.kpis.map((k) => [
                `${k.nom}${k.unite ? ` (${k.unite})` : ''}`,
                k.baseline === null ? '–' : fmtNombre(k.baseline, 1),
                k.cible === null ? '–' : fmtNombre(k.cible, 1),
                k.source,
              ]),
              droite: [1, 2],
            }
          : { type: 'paragraphe', texte: 'Aucun indicateur défini.' },
      ],
    },
    {
      numero: '7',
      titre: 'Priorisation (scoring multicritère)',
      blocs: [
        {
          type: 'tableau',
          entetes: ['Critère', 'Note', 'Niveau retenu', 'Justification'],
          lignes: CRITERES.map((c) => {
            const note = cas.scores[c.id];
            return [c.libelle, note === null ? '–' : `${note}/5`, note === null ? 'Non noté' : (c.niveaux[note - 1] ?? ''), cas.justificationsScores[c.id] ?? ''];
          }),
          droite: [1],
        },
        { type: 'liste', elements: scoring.explication },
      ],
    },
    {
      numero: '8',
      titre: 'Qualification AI Act',
      blocs: [
        {
          type: 'paragraphe',
          texte: `${NIVEAUX_AI_ACT[aiAct.niveau].libelle}${derogation ? ` (dérogation ${derogation.article})` : ''}${
            aiAct.echeanceCle ? ` · échéance clé : ${fmtDateLongue(aiAct.echeanceCle.date)}` : ''
          }.`,
        },
        { type: 'liste', elements: aiAct.justification, ordonnee: true },
        ...(aiAct.obligations.length
          ? [
              {
                type: 'tableau' as const,
                entetes: ['Obligation', 'Acteur', 'Vous concerne', 'Dès le'],
                lignes: aiAct.obligations.map((o) => [
                  o.texte,
                  LIBELLES_ACTEURS[o.acteur],
                  o.vousConcerne === null ? 'À préciser' : o.vousConcerne ? 'Oui' : 'Non',
                  fmtDateLongue(o.echeance),
                ]),
              },
            ]
          : []),
        ...(aiAct.avertissements.length ? [{ type: 'encadre' as const, texte: aiAct.avertissements.join(' ') }] : []),
      ],
    },
    {
      numero: '9',
      titre: 'Protection des données (RGPD)',
      blocs: [
        { type: 'paragraphe', texte: `${NIVEAUX_RGPD[rgpd.niveau].libelle} · ${rgpd.nbCriteres} critère(s) WP248 retenu(s).` },
        { type: 'liste', elements: rgpd.justification, ordonnee: true },
        ...(rgpd.pointsVigilance.length ? [{ type: 'encadre' as const, texte: rgpd.pointsVigilance.join(' ') }] : []),
      ],
    },
    {
      numero: '10',
      titre: 'Business case',
      blocs: [
        {
          type: 'tableau',
          entetes: ['Hypothèse', 'Valeur', 'Provenance'],
          lignes: (Object.keys(LIBELLES_CHAMPS) as ChampBusinessCase[])
            .filter((c) => bc.llmActif || !['requetesParUnite', 'tokensParRequete', 'prixMillionTokens'].includes(c))
            .map((c) => [LIBELLES_CHAMPS[c], valeurChamp(analyse, c), libelle(PROVENANCES, bc.provenance[c], 'Hypothèse')]),
          droite: [1],
        },
        {
          type: 'tableau',
          entetes: ['Résultat (calculé)', 'Valeur'],
          lignes: [
            ['Investissement (build)', fmtEuro(businessCase.build)],
            ['Gains annuels à pleine adoption', fmtEuro(businessCase.gainsAnnuelsPleineAdoption)],
            ['VAN sur 3 ans', fmtEuro(businessCase.van)],
            ['ROI sur 3 ans (non actualisé)', businessCase.roi === null ? '–' : fmtPct(businessCase.roi)],
            ['Délai de retour', businessCase.delaiRetourMois === null ? 'Au-delà de 3 ans' : fmtMois(businessCase.delaiRetourMois)],
            ['TRI', businessCase.tri === null ? '–' : fmtPct(businessCase.tri)],
            [`Monte Carlo (${fmtNombre(mc.iterations)} tirages) : P10 / P50 / P90`, `${fmtEuro(mc.p10)} / ${fmtEuro(mc.p50)} / ${fmtEuro(mc.p90)}`],
            ['Probabilité que la VAN soit positive', fmtPct(mc.probaVanPositive)],
          ],
          droite: [1],
        },
        {
          type: 'paragraphe',
          texte: `Paramètres les plus influents (±${fmtNombre(sensibilite.variation * 100)} %) : ${sensibilite.lignes
            .slice(0, 3)
            .map((l) => `${minusculeInitiale(l.libelle)} (amplitude ${fmtEuro(l.amplitude)})`)
            .join(', ')}.`,
        },
      ],
    },
    {
      numero: '11',
      titre: 'Parties prenantes, dépendances et risques',
      blocs: [
        cas.partiesPrenantes.length
          ? { type: 'tableau', entetes: ['Partie prenante', 'Implication', 'Attentes'], lignes: cas.partiesPrenantes.map((p) => [p.nom, libelle(IMPLICATIONS, p.implication), p.attentes]) }
          : { type: 'paragraphe', texte: 'Aucune partie prenante décrite.' },
        {
          type: 'definitions',
          elements: [
            {
              terme: 'Prérequis (portefeuille)',
              definition:
                cas.dependances.cas
                  .map((id) => portefeuille.cas.find((c) => c.id === id))
                  .filter((c) => c !== undefined)
                  .map((c) => `${c.code} ${c.titre}`)
                  .join(' ; ') || 'Aucun',
            },
            { terme: 'Dépendances externes', definition: cas.dependances.externes.join(' ; ') || 'Aucune' },
          ],
        },
        cas.risques.length
          ? {
              type: 'tableau',
              entetes: ['Risque', 'Catégorie', 'Criticité', 'Mesure de maîtrise'],
              lignes: cas.risques.map((r) => [r.description, libelle(CATEGORIES_RISQUE, r.categorie), `${r.probabilite * r.impact}/9`, r.mitigation]),
              droite: [2],
            }
          : { type: 'paragraphe', texte: 'Aucun risque identifié.' },
      ],
    },
    {
      numero: '12',
      titre: 'Planification et décisions attendues',
      blocs: [
        {
          type: 'paragraphe',
          texte: entree ? `${libelleVague(entree.vague)}${entree.manuelle ? ' (ajustement manuel)' : ''}.` : 'Non planifié.',
        },
        ...(entree?.raisons.length ? [{ type: 'liste' as const, elements: entree.raisons }] : []),
        ...(entree?.conflits.length ? [{ type: 'encadre' as const, texte: entree.conflits.join(' ') }] : []),
        { type: 'liste', elements: prochainesEtapes(analyse, entree), ordonnee: true },
      ],
    },
  ];

  const mentions = [
    'Qualification AI Act et pré-analyse RGPD : aide à la qualification, ne constitue pas un avis juridique.',
    'Les valeurs marquées « hypothèse » sont des estimations à confirmer ; les résultats financiers sont calculés à partir de ces hypothèses.',
  ];
  if (portefeuille.organisation.fictive) mentions.unshift('Organisation fictive : données de démonstration.');

  return {
    code: cas.code,
    titre: cas.titre,
    organisation: portefeuille.organisation.nom || portefeuille.nom,
    fictive: portefeuille.organisation.fictive,
    porteur: cas.porteur,
    statut: libelle(STATUTS, cas.statut),
    date: date.slice(0, 10),
    cartouche: [
      { terme: 'Référence', definition: cas.code || '—' },
      { terme: 'Organisation', definition: `${portefeuille.organisation.nom || portefeuille.nom}${portefeuille.organisation.fictive ? ' (fictive)' : ''}` },
      { terme: 'Porteur', definition: texteOuDefaut(cas.porteur) },
      { terme: 'Statut', definition: libelle(STATUTS, cas.statut) },
      { terme: 'Date', definition: fmtDateLongue(date.slice(0, 10)) },
      { terme: 'Version', definition: '1.0' },
      { terme: 'Planification', definition: entree ? libelleVague(entree.vague) : 'Non planifié' },
    ],
    sections,
    mentions,
  };
}

/* ------------------------------------------------------------------ */
/* Export Markdown                                                       */
/* ------------------------------------------------------------------ */

const cellule = (t: string) => t.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');

function blocVersMarkdown(b: Bloc): string {
  switch (b.type) {
    case 'paragraphe':
      return b.texte;
    case 'liste':
      return b.elements.map((e, i) => (b.ordonnee ? `${i + 1}. ${e}` : `- ${e}`)).join('\n');
    case 'definitions':
      return b.elements.map((e) => `- **${e.terme}** : ${e.definition}`).join('\n');
    case 'encadre':
      return `> ${b.texte}`;
    case 'tableau': {
      const entete = `| ${b.entetes.map(cellule).join(' | ')} |`;
      const separateur = `| ${b.entetes.map((_, i) => (b.droite?.includes(i) ? '---:' : '---')).join(' | ')} |`;
      const lignes = b.lignes.map((l) => `| ${l.map(cellule).join(' | ')} |`);
      return [entete, separateur, ...lignes].join('\n');
    }
  }
}

export function noteVersMarkdown(note: NoteCadrage): string {
  const parties: string[] = [
    `# Note de cadrage — ${note.code ? `${note.code} ` : ''}${note.titre}`,
    note.cartouche.map((c) => `- **${c.terme}** : ${c.definition}`).join('\n'),
  ];
  for (const s of note.sections) {
    parties.push(`## ${s.numero}. ${s.titre}`);
    for (const b of s.blocs) parties.push(blocVersMarkdown(b));
  }
  parties.push('---');
  parties.push(note.mentions.map((m) => `*${m}*`).join('\n\n'));
  parties.push('*Document généré par AI Use Case Factory.*');
  return `${parties.join('\n\n')}\n`;
}
