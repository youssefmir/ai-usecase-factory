/**
 * Import et export JSON des portefeuilles. Tout fichier importé est validé par les schémas zod :
 * un fichier invalide est refusé avec la liste des erreurs, jamais chargé partiellement.
 */
import { z } from 'zod';
import {
  EnveloppeExportSchema,
  FORMAT_EXPORT,
  PortfolioSchema,
  VERSION_EXPORT,
  type EnveloppeExport,
  type Portfolio,
} from './model';

z.config(z.locales.fr());

export function exporterPortefeuilles(portefeuilles: readonly Portfolio[], maintenant: Date = new Date()): string {
  const enveloppe: EnveloppeExport = {
    format: FORMAT_EXPORT,
    version: VERSION_EXPORT,
    exporteLe: maintenant.toISOString(),
    portefeuilles: [...portefeuilles],
  };
  return JSON.stringify(enveloppe, null, 2);
}

export type ResultatImport = { ok: true; portefeuilles: Portfolio[] } | { ok: false; erreurs: string[] };

function cheminLisible(chemin: readonly PropertyKey[]): string {
  if (chemin.length === 0) return 'racine';
  return chemin.map((p) => (typeof p === 'number' ? `[${p}]` : String(p))).join('.').replace(/\.\[/g, '[');
}

function erreursZod(erreur: z.ZodError, limite = 8): string[] {
  const lignes = erreur.issues.slice(0, limite).map((i) => `${cheminLisible(i.path)} : ${i.message}`);
  if (erreur.issues.length > limite) lignes.push(`… et ${erreur.issues.length - limite} autre(s) erreur(s).`);
  return lignes;
}

/** Accepte un export de l'application, un portefeuille seul ou une liste de portefeuilles. */
export function analyserImport(texte: string): ResultatImport {
  let donnees: unknown;
  try {
    donnees = JSON.parse(texte);
  } catch (e) {
    return { ok: false, erreurs: [`Fichier JSON illisible : ${(e as Error).message}`] };
  }

  if (Array.isArray(donnees)) {
    const r = z.array(PortfolioSchema).min(1).safeParse(donnees);
    return r.success ? { ok: true, portefeuilles: r.data } : { ok: false, erreurs: erreursZod(r.error) };
  }
  if (donnees && typeof donnees === 'object') {
    const objet = donnees as Record<string, unknown>;
    if ('format' in objet) {
      if (objet.format !== FORMAT_EXPORT) {
        return { ok: false, erreurs: [`Format inconnu : « ${String(objet.format)} » (attendu : « ${FORMAT_EXPORT} »).`] };
      }
      const r = EnveloppeExportSchema.safeParse(objet);
      return r.success ? { ok: true, portefeuilles: r.data.portefeuilles } : { ok: false, erreurs: erreursZod(r.error) };
    }
    const r = PortfolioSchema.safeParse(objet);
    return r.success ? { ok: true, portefeuilles: [r.data] } : { ok: false, erreurs: erreursZod(r.error) };
  }
  return { ok: false, erreurs: ['Le fichier ne contient ni portefeuille ni export de l’application.'] };
}

export function slug(texte: string): string {
  return (
    texte
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'portefeuille'
  );
}

export function nomFichierExport(nom: string, extension: 'json' | 'md', maintenant: Date = new Date()): string {
  return `${slug(nom)}-${maintenant.toISOString().slice(0, 10)}.${extension}`;
}
