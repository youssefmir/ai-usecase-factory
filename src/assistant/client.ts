/**
 * Client minimal pour API de complétion de type « chat » : Mistral ou tout point d'accès
 * compatible OpenAI (ex. Ollama en local). La clé n'est jamais stockée : elle reste en mémoire.
 */
import { z } from 'zod';
import { BrouillonSchema, extraireJson, type Brouillon } from './brouillon';
import { CONSIGNES_SYSTEME, messageUtilisateur } from './prompt';

export type Fournisseur = 'mistral' | 'openai_compatible';

export interface ConfigLlm {
  fournisseur: Fournisseur;
  urlBase: string;
  modele: string;
  cle: string;
  modeJson: boolean;
}

export const CONFIGS_PAR_DEFAUT: Record<Fournisseur, Omit<ConfigLlm, 'cle'>> = {
  mistral: { fournisseur: 'mistral', urlBase: 'https://api.mistral.ai/v1', modele: 'mistral-small-latest', modeJson: true },
  openai_compatible: { fournisseur: 'openai_compatible', urlBase: 'http://localhost:11434/v1', modele: 'llama3.1', modeJson: true },
};

export type ResultatGeneration = { ok: true; brouillon: Brouillon; brut: string } | { ok: false; erreurs: string[] };

const ReponseChatSchema = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string() }) })).min(1),
});

function messageHttp(statut: number): string {
  if (statut === 401 || statut === 403) return 'Clé d’API refusée par le fournisseur.';
  if (statut === 404) return 'Adresse ou modèle introuvable : vérifiez l’URL de base et le nom du modèle.';
  if (statut === 429) return 'Quota ou limite de débit atteint chez le fournisseur.';
  if (statut >= 500) return 'Le fournisseur rencontre une erreur ; réessayez plus tard.';
  return `Requête refusée (statut HTTP ${statut}).`;
}

export function construireRequete(notes: string, config: ConfigLlm): { url: string; init: RequestInit } {
  const corps: Record<string, unknown> = {
    model: config.modele,
    temperature: 0.2,
    messages: [
      { role: 'system', content: CONSIGNES_SYSTEME },
      { role: 'user', content: messageUtilisateur(notes) },
    ],
  };
  if (config.modeJson) corps.response_format = { type: 'json_object' };
  const entetes: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.cle.trim()) entetes.Authorization = `Bearer ${config.cle.trim()}`;
  return {
    url: `${config.urlBase.replace(/\/+$/, '')}/chat/completions`,
    init: { method: 'POST', headers: entetes, body: JSON.stringify(corps) },
  };
}

/** Analyse le contenu texte renvoyé par le modèle et le valide. */
export function analyserContenu(contenu: string): ResultatGeneration {
  let donnees: unknown;
  try {
    donnees = extraireJson(contenu);
  } catch (e) {
    return { ok: false, erreurs: [`Réponse inexploitable : ${(e as Error).message}`] };
  }
  const r = BrouillonSchema.safeParse(donnees);
  if (!r.success) {
    return {
      ok: false,
      erreurs: ['La réponse ne respecte pas le format attendu :', ...r.error.issues.slice(0, 6).map((i) => `${i.path.join('.') || 'racine'} : ${i.message}`)],
    };
  }
  return { ok: true, brouillon: r.data, brut: contenu };
}

export async function genererBrouillon(
  notes: string,
  config: ConfigLlm,
  options: { fetch?: typeof fetch; signal?: AbortSignal } = {},
): Promise<ResultatGeneration> {
  if (!notes.trim()) return { ok: false, erreurs: ['Collez d’abord des notes d’atelier.'] };
  if (config.fournisseur === 'mistral' && !config.cle.trim()) return { ok: false, erreurs: ['Une clé d’API est nécessaire pour Mistral.'] };
  const { url, init } = construireRequete(notes, config);
  const f = options.fetch ?? fetch;
  let reponse: Response;
  try {
    reponse = await f(url, { ...init, signal: options.signal });
  } catch (e) {
    if ((e as Error).name === 'AbortError') return { ok: false, erreurs: ['Génération annulée.'] };
    return {
      ok: false,
      erreurs: ['Échec de la requête : vérifiez l’URL, la connexion et l’autorisation des appels depuis le navigateur (CORS).'],
    };
  }
  if (!reponse.ok) return { ok: false, erreurs: [messageHttp(reponse.status)] };
  let json: unknown;
  try {
    json = await reponse.json();
  } catch {
    return { ok: false, erreurs: ['Réponse du fournisseur illisible (JSON attendu).'] };
  }
  const chat = ReponseChatSchema.safeParse(json);
  if (!chat.success) return { ok: false, erreurs: ['Réponse du fournisseur inattendue : aucun message de complétion.'] };
  return analyserContenu(chat.data.choices[0]?.message.content ?? '');
}
