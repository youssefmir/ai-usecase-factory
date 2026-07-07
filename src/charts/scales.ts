/** Échelles et graduations pour les graphiques SVG. */
import { fmtEuroCompact } from '../domain/format';

export interface Echelle {
  (v: number): number;
  domaine: [number, number];
  plage: [number, number];
}

export function echelleLineaire(domaine: [number, number], plage: [number, number]): Echelle {
  const [d0, d1] = domaine;
  const [r0, r1] = plage;
  const etendue = d1 - d0 || 1;
  const f = ((v: number) => r0 + ((v - d0) / etendue) * (r1 - r0)) as Echelle;
  f.domaine = domaine;
  f.plage = plage;
  return f;
}

/** Pas « rond » : 1, 2, 2,5 ou 5 x 10^k. */
export function pasRond(brut: number): number {
  if (!(brut > 0) || !Number.isFinite(brut)) return 1;
  const puissance = 10 ** Math.floor(Math.log10(brut));
  const n = brut / puissance;
  return ([1, 2, 2.5, 5, 10].find((c) => n <= c) ?? 10) * puissance;
}

/** Graduations régulières couvrant [min, max] (domaine élargi aux graduations extrêmes). */
export function graduations(min: number, max: number, cible = 5): { ticks: number[]; domaine: [number, number] } {
  if (min === max) {
    const marge = Math.abs(min) || 1;
    min -= marge;
    max += marge;
  }
  const pas = pasRond((max - min) / cible);
  const debut = Math.floor(min / pas) * pas;
  const fin = Math.ceil(max / pas) * pas;
  const ticks: number[] = [];
  for (let v = debut; v <= fin + pas / 2; v += pas) ticks.push(Math.abs(v) < pas / 1e6 ? 0 : v);
  return { ticks, domaine: [debut, fin] };
}

export function fmtAxeEuro(v: number): string {
  return v === 0 ? '0' : fmtEuroCompact(v);
}
