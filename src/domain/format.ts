/** Formatage des nombres, montants et dates à la française (fr-FR). */

/** Espace insécable et espace fine insécable (écrits par code pour rester visibles dans les sources). */
export const NBSP = String.fromCharCode(0xa0);
const NNBSP = String.fromCharCode(0x202f);

const cache = new Map<string, Intl.NumberFormat>();

function formateur(options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const cle = JSON.stringify(options);
  let f = cache.get(cle);
  if (!f) {
    f = new Intl.NumberFormat('fr-FR', options);
    cache.set(cle, f);
  }
  return f;
}

/** Remplace les espaces fines insécables par des espaces insécables (meilleur rendu Markdown/PDF). */
function normaliserEspaces(s: string): string {
  return s.split(NNBSP).join(NBSP);
}

export function fmtNombre(valeur: number, decimales = 0): string {
  if (!Number.isFinite(valeur)) return '–';
  return normaliserEspaces(
    formateur({ minimumFractionDigits: decimales, maximumFractionDigits: decimales }).format(valeur),
  );
}

/** Montant en euros, arrondi à l'euro par défaut. */
export function fmtEuro(valeur: number, decimales = 0): string {
  if (!Number.isFinite(valeur)) return '–';
  return normaliserEspaces(
    formateur({
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales,
    }).format(valeur),
  );
}

/** Montant compact : 12,5 k€ ; 1,2 M€. */
export function fmtEuroCompact(valeur: number): string {
  if (!Number.isFinite(valeur)) return '–';
  const abs = Math.abs(valeur);
  if (abs >= 1_000_000) return `${fmtNombre(valeur / 1_000_000, abs >= 10_000_000 ? 0 : 1)}${NBSP}M€`;
  if (abs >= 10_000) return `${fmtNombre(valeur / 1000, 0)}${NBSP}k€`;
  if (abs >= 1000) return `${fmtNombre(valeur / 1000, 1)}${NBSP}k€`;
  return fmtEuro(valeur);
}

/** Pourcentage à partir d'une part (0,35 -> « 35 % »). */
export function fmtPct(part: number, decimales = 0): string {
  if (!Number.isFinite(part)) return '–';
  return `${fmtNombre(part * 100, decimales)}${NBSP}%`;
}

/** Note sur 5 avec une décimale (3,8). */
export function fmtNote(note: number | null): string {
  return note === null ? '–' : fmtNombre(note, 1);
}

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const MOIS_LONGS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

/** Date ISO (AAAA-MM-JJ) -> « 2 décembre 2027 ». */
export function fmtDateLongue(iso: string): string {
  const [a, m, j] = iso.slice(0, 10).split('-').map(Number);
  if (!a || !m || !j) return iso;
  return `${j === 1 ? '1er' : j} ${MOIS_LONGS[m - 1]} ${a}`;
}

/** Date ISO -> « déc. 2027 ». */
export function fmtMoisAnnee(iso: string): string {
  const [a, m] = iso.slice(0, 10).split('-').map(Number);
  if (!a || !m) return iso;
  return `${MOIS[m - 1]} ${a}`;
}

/** Durée en mois (« 7,9 mois »), ou libellé si non atteinte. */
export function fmtMois(mois: number | null): string {
  if (mois === null) return 'Non atteint sur 3 ans';
  if (mois <= 0) return 'Immédiat';
  return `${fmtNombre(mois, 1)} mois`;
}

/** Typographie française des textes affichés : apostrophe typographique. */
export function typographie(texte: string): string {
  return texte.replace(/'/g, '\u2019');
}

/** Première lettre en minuscule, sigles conservés (« Annexe III » reste lisible dans une phrase). */
export function minusculeInitiale(texte: string): string {
  return texte.charAt(0).toLowerCase() + texte.slice(1);
}
