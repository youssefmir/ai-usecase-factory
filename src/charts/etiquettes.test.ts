import { describe, expect, it } from 'vitest';
import { placerEtiquettes } from './etiquettes';

describe('placement des étiquettes', () => {
  it('place à droite par défaut et évite un point voisin', () => {
    const positions = placerEtiquettes(
      [
        { id: 'a', x: 100, y: 100, r: 8, largeur: 40 },
        { id: 'b', x: 130, y: 100, r: 8, largeur: 40 },
        { id: 'c', x: 300, y: 300, r: 8, largeur: 40 },
      ],
      { x0: 0, x1: 500 },
    );
    expect(positions.get('c')).toBe('droite');
    expect(positions.get('a')).not.toBe('droite');
  });

  it('évite de sortir du cadre', () => {
    const positions = placerEtiquettes([{ id: 'a', x: 490, y: 100, r: 8, largeur: 40 }], { x0: 0, x1: 500 });
    expect(positions.get('a')).toBe('gauche');
  });
});
