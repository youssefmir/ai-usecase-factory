/**
 * Générateur pseudo-aléatoire à graine (mulberry32) et tirage selon une loi triangulaire.
 * Une même graine produit toujours la même suite : les simulations sont reproductibles.
 */

/** Générateur mulberry32 : renvoie une fonction qui produit des nombres dans [0, 1[. */
export function mulberry32(graine: number): () => number {
  let etat = graine >>> 0;
  return () => {
    etat = (etat + 0x6d2b79f5) >>> 0;
    let t = etat;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Inverse de la fonction de répartition de la loi triangulaire (bas, mode, haut).
 * u est un tirage uniforme dans [0, 1[.
 */
export function quantileTriangulaire(u: number, bas: number, mode: number, haut: number): number {
  if (!(haut > bas)) return mode;
  const fc = (mode - bas) / (haut - bas);
  if (u < fc) return bas + Math.sqrt(u * (haut - bas) * (mode - bas));
  return haut - Math.sqrt((1 - u) * (haut - bas) * (haut - mode));
}

/**
 * Centile par interpolation linéaire entre rangs (méthode « type 7 », celle des tableurs).
 * Le tableau doit être trié par ordre croissant.
 */
export function centile(trie: ArrayLike<number>, p: number): number {
  const n = trie.length;
  if (n === 0) return Number.NaN;
  const h = (n - 1) * Math.min(1, Math.max(0, p));
  const bas = Math.floor(h);
  const haut = Math.ceil(h);
  const vBas = trie[bas] ?? Number.NaN;
  const vHaut = trie[haut] ?? Number.NaN;
  return vBas + (h - bas) * (vHaut - vBas);
}
