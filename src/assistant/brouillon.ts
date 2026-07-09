/**
 * Brouillon de fiche produit par l'assistant : schéma de validation (zod) et conversion
 * vers un cas d'usage. Toute réponse non conforme est refusée, jamais enregistrée telle quelle.
 */
import { z } from 'zod';
import { nouvelId } from '../domain/factory';
import { TypologieSchema, type UseCaseInput } from '../domain/model';

const court = (max: number) => z.string().trim().max(max);
const texte = (max = 1200) => court(max).default('');

export const BrouillonSchema = z.object({
  titre: court(140).min(3),
  resume: texte(400),
  probleme: texte(),
  processus: texte(300),
  objectifs: texte(600),
  typologie: TypologieSchema.nullable().default(null),
  descriptionSolution: texte(),
  personas: z
    .array(z.object({ nom: court(120), role: texte(200), besoin: texte(300) }))
    .max(6)
    .default([]),
  irritants: z.array(court(240)).max(8).default([]),
  sourcesDonnees: z
    .array(z.object({ nom: court(160), description: texte(300), personnelles: z.boolean().default(false) }))
    .max(8)
    .default([]),
  systemes: z.array(court(120)).max(8).default([]),
  kpis: z
    .array(
      z.object({
        nom: court(160),
        unite: texte(40),
        baseline: z.coerce.number().nullable().default(null),
        cible: z.coerce.number().nullable().default(null),
      }),
    )
    .max(6)
    .default([]),
  partiesPrenantes: z
    .array(z.object({ nom: court(160), attentes: texte(300) }))
    .max(8)
    .default([]),
  risques: z
    .array(z.object({ description: court(300), mitigation: texte(300) }))
    .max(8)
    .default([]),
  volumeAnnuel: z.coerce.number().min(0).nullable().default(null),
  tempsUnitaireMin: z.coerce.number().min(0).nullable().default(null),
  questionsOuvertes: z.array(court(300)).max(10).default([]),
});

export type Brouillon = z.infer<typeof BrouillonSchema>;

/** Extrait l'objet JSON d'une réponse (tolère les blocs de code Markdown et le texte autour). */
export function extraireJson(texte: string): unknown {
  const sansClotures = texte.replace(/```(?:json)?/gi, '').trim();
  const debut = sansClotures.indexOf('{');
  const fin = sansClotures.lastIndexOf('}');
  if (debut === -1 || fin <= debut) throw new Error('Aucun objet JSON dans la réponse.');
  return JSON.parse(sansClotures.slice(debut, fin + 1));
}

/** Convertit un brouillon validé en champs de cas d'usage (identifiants neufs, valeurs marquées hypothèse). */
export function brouillonVersCas(b: Brouillon): Partial<UseCaseInput> & { titre: string } {
  return {
    titre: b.titre,
    resume: b.resume,
    statut: 'idee',
    probleme: b.probleme,
    processus: b.processus,
    objectifs: b.objectifs,
    personas: b.personas.map((p) => ({ id: nouvelId('persona'), nom: p.nom, role: p.role, besoin: p.besoin })),
    situationActuelle: { description: '', irritants: b.irritants },
    solution: {
      typologie: b.typologie,
      description: b.descriptionSolution,
      niveauAutonomie: null,
      supervisionHumaine: '',
      alternatives: '',
    },
    donnees: {
      sources: b.sourcesDonnees.map((s) => ({
        id: nouvelId('source'),
        nom: s.nom,
        description: s.description,
        disponibilite: 'partielle',
        qualite: 'inconnue',
        personnelles: s.personnelles,
        proprietaire: '',
      })),
      commentaire: '',
    },
    integration: { systemes: b.systemes, mode: null, description: '', contraintes: '' },
    kpis: b.kpis.map((k) => ({ id: nouvelId('kpi'), nom: k.nom, unite: k.unite, baseline: k.baseline, cible: k.cible, source: '' })),
    partiesPrenantes: b.partiesPrenantes.map((p) => ({ id: nouvelId('pp'), nom: p.nom, implication: 'contributeur', attentes: p.attentes })),
    risques: b.risques.map((r) => ({
      id: nouvelId('risque'),
      description: r.description,
      categorie: 'operationnel',
      probabilite: 2,
      impact: 2,
      mitigation: r.mitigation,
    })),
    businessCase: {
      volumeAnnuel: b.volumeAnnuel ?? 0,
      tempsUnitaireMin: b.tempsUnitaireMin ?? 0,
      provenance: { volumeAnnuel: 'hypothese', tempsUnitaireMin: 'hypothese' },
    },
    roadmap: { vagueManuelle: null, commentaire: b.questionsOuvertes.length ? `Questions ouvertes : ${b.questionsOuvertes.join(' ; ')}` : '' },
  };
}
