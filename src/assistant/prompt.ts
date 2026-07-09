/** Consignes envoyées au modèle : format JSON attendu et règles de rédaction. */
import { TYPOLOGIES } from '../domain/model';

export const CONSIGNES_SYSTEME = `Tu aides un Business Analyst à transformer des notes d'atelier en fiche de cas d'usage d'intelligence artificielle.
Réponds uniquement par un objet JSON valide, sans texte autour, avec exactement ces clés :
{
  "titre": "intitulé court du cas d'usage",
  "resume": "une phrase",
  "probleme": "problème métier et son effet mesurable",
  "processus": "processus concerné",
  "objectifs": "objectifs du cas d'usage",
  "typologie": une valeur parmi ${TYPOLOGIES.map((t) => `"${t.id}"`).join(', ')} ou null,
  "descriptionSolution": "solution IA envisagée",
  "personas": [{ "nom": "...", "role": "...", "besoin": "..." }],
  "irritants": ["..."],
  "sourcesDonnees": [{ "nom": "...", "description": "...", "personnelles": true ou false }],
  "systemes": ["systèmes d'information concernés"],
  "kpis": [{ "nom": "...", "unite": "...", "baseline": nombre ou null, "cible": nombre ou null }],
  "partiesPrenantes": [{ "nom": "...", "attentes": "..." }],
  "risques": [{ "description": "...", "mitigation": "..." }],
  "volumeAnnuel": nombre ou null,
  "tempsUnitaireMin": nombre ou null,
  "questionsOuvertes": ["informations manquantes à demander au métier"]
}
Règles : écris en français ; n'invente aucun chiffre absent des notes (utilise null) ; signale dans "questionsOuvertes" ce qu'il faut confirmer ; reste factuel.`;

export function messageUtilisateur(notes: string): string {
  return `Notes d'atelier :\n"""\n${notes.trim()}\n"""`;
}

/** Notes d'atelier fictives pour essayer l'assistant. */
export const NOTES_EXEMPLE = `Atelier du 14 octobre (organisation fictive) — direction des travaux et QSE.
Contexte : le tri des déchets de chantier est déclaré à la main sur des bons papier, puis ressaisi dans un tableur pour le registre réglementaire.
Environ 1 800 bons par an, 10 minutes de ressaisie par bon d'après la responsable QSE.
Irritants : bons illisibles, oublis de tonnage, registre jamais à jour avant les contrôles.
Idée : photographier le bon et extraire automatiquement le type de déchet, le tonnage, la filière et le chantier.
Utilisateurs : chefs de chantier (prise de photo), responsable QSE (contrôle et registre).
Données : photos des bons, référentiel des chantiers, liste des filières agréées.
Indicateur souhaité : taux de bons complets, aujourd'hui inconnu.
Risque évoqué : mauvaise lecture du tonnage.`;
