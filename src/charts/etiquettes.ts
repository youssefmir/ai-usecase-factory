/**
 * Placement simple des étiquettes de points (à droite, à gauche, au-dessus ou au-dessous)
 * pour éviter qu'une étiquette ne recouvre un autre point ou une autre étiquette.
 */
export type Position = 'droite' | 'gauche' | 'dessus' | 'dessous';

export interface PointEtiquete {
  id: string;
  x: number;
  y: number;
  r: number;
  largeur: number;
}

interface Boite {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const HAUTEUR = 12;

function boite(p: PointEtiquete, pos: Position): Boite {
  switch (pos) {
    case 'droite':
      return { x0: p.x + p.r + 4, x1: p.x + p.r + 4 + p.largeur, y0: p.y - HAUTEUR / 2, y1: p.y + HAUTEUR / 2 };
    case 'gauche':
      return { x0: p.x - p.r - 4 - p.largeur, x1: p.x - p.r - 4, y0: p.y - HAUTEUR / 2, y1: p.y + HAUTEUR / 2 };
    case 'dessus':
      return { x0: p.x - p.largeur / 2, x1: p.x + p.largeur / 2, y0: p.y - p.r - 4 - HAUTEUR, y1: p.y - p.r - 4 };
    case 'dessous':
      return { x0: p.x - p.largeur / 2, x1: p.x + p.largeur / 2, y0: p.y + p.r + 4, y1: p.y + p.r + 4 + HAUTEUR };
  }
}

const chevauche = (a: Boite, b: Boite) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

export function placerEtiquettes(points: readonly PointEtiquete[], limites: { x0: number; x1: number }): Map<string, Position> {
  const resultat = new Map<string, Position>();
  const occupees: Boite[] = points.map((p) => ({ x0: p.x - p.r, x1: p.x + p.r, y0: p.y - p.r, y1: p.y + p.r }));
  const ordre = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  for (const p of ordre) {
    const candidates: Position[] = ['droite', 'gauche', 'dessus', 'dessous'];
    let choisi: Position = 'droite';
    let meilleur = Number.POSITIVE_INFINITY;
    for (const pos of candidates) {
      const b = boite(p, pos);
      const hors = b.x0 < limites.x0 || b.x1 > limites.x1 ? 2 : 0;
      const conflits = occupees.filter((o) => chevauche(o, b)).length - (chevauche(b, { x0: p.x - p.r, x1: p.x + p.r, y0: p.y - p.r, y1: p.y + p.r }) ? 1 : 0);
      const cout = conflits * 10 + hors + candidates.indexOf(pos) * 0.1;
      if (cout < meilleur) {
        meilleur = cout;
        choisi = pos;
      }
    }
    resultat.set(p.id, choisi);
    occupees.push(boite(p, choisi));
  }
  return resultat;
}

/** Attributs SVG du texte selon la position choisie. */
export function attributsEtiquette(pos: Position, r: number): { x: number; y: number; textAnchor: 'start' | 'end' | 'middle'; dy: string } {
  switch (pos) {
    case 'droite':
      return { x: r + 5, y: 0, textAnchor: 'start', dy: '0.32em' };
    case 'gauche':
      return { x: -r - 5, y: 0, textAnchor: 'end', dy: '0.32em' };
    case 'dessus':
      return { x: 0, y: -r - 6, textAnchor: 'middle', dy: '0' };
    case 'dessous':
      return { x: 0, y: r + 5, textAnchor: 'middle', dy: '0.8em' };
  }
}
