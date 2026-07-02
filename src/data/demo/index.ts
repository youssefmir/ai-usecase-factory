/**
 * Portefeuilles de démonstration (entreprises et collectivité FICTIVES).
 * Chaque appel renvoie des copies neuves, validées par le schéma.
 */
import { PortfolioSchema, type Portfolio } from '../../domain/model';
import { ardoiseBatiment } from './ardoiseBatiment';
import { banqueLumen } from './banqueLumen';
import { portAurele } from './portAurele';

const SOURCES = [banqueLumen, ardoiseBatiment, portAurele];

/** Date fixe de création des données de démonstration (stabilité des exports et des captures). */
const DATE_DEMO = '2026-11-01T09:00:00.000Z';

export function portefeuillesDemo(): Portfolio[] {
  return SOURCES.map((source) =>
    PortfolioSchema.parse({
      ...structuredClone(source),
      creeLe: DATE_DEMO,
      modifieLe: DATE_DEMO,
      cas: source.cas?.map((c) => ({ ...structuredClone(c), creeLe: DATE_DEMO, modifieLe: DATE_DEMO })),
    }),
  );
}

export const IDS_DEMO = SOURCES.map((s) => s.id);
