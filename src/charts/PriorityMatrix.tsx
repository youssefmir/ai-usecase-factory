import { motion } from 'motion/react';
import { useState } from 'react';
import { NIVEAUX_AI_ACT, type NiveauAiAct } from '../domain/aiAct/qualification';
import { fmtEuro, fmtNombre } from '../domain/format';
import { QUADRANTS, libelleQuadrant, type QuadrantId } from '../domain/scoring/criteria';
import { DUREES, transition, useMouvementReduit } from '../ui/motion';
import { FormeSignal } from '../ui/signalShapes';
import { CadreGraphique, type ElementLegende } from './ChartFrame';
import { Infobulle } from './Infobulle';
import { attributsEtiquette, placerEtiquettes } from './etiquettes';
import { echelleLineaire } from './scales';
import { useLargeur } from './useLargeur';

export interface PointMatrice {
  id: string;
  code: string;
  titre: string;
  valeur: number;
  faisabilite: number;
  van: number;
  niveau: NiveauAiAct;
  quadrant: QuadrantId | null;
}

const MARGES = { haut: 18, droite: 22, bas: 44, gauche: 52 };
const NIVEAUX_LEGENDE: NiveauAiAct[] = ['interdit', 'haut_risque', 'transparence', 'minimal', 'hors_champ', 'incomplet'];

function rayon(van: number, vanMax: number): number {
  if (van <= 0 || vanMax <= 0) return 9;
  return 9 + 13 * Math.sqrt(van / vanMax);
}

/** Petit décalage déterministe pour séparer des cas aux coordonnées identiques. */
function decalages(points: readonly PointMatrice[]): Map<string, [number, number]> {
  const vus = new Map<string, number>();
  const resultat = new Map<string, [number, number]>();
  for (const p of points) {
    const cle = `${p.valeur.toFixed(2)}-${p.faisabilite.toFixed(2)}`;
    const n = vus.get(cle) ?? 0;
    vus.set(cle, n + 1);
    const angle = n * 2.4;
    resultat.set(p.id, n === 0 ? [0, 0] : [Math.cos(angle) * 16, Math.sin(angle) * 16]);
  }
  return resultat;
}

export function PriorityMatrix({
  points,
  seuilValeur,
  seuilFaisabilite,
  onOuvrir,
  hauteur = 460,
  etiquettes = true,
  titre = 'Matrice de priorisation',
  sousTitre = 'Valeur × faisabilité (notes de 1 à 5). Taille = VAN sur 3 ans ; forme = qualification AI Act.',
}: {
  points: readonly PointMatrice[];
  seuilValeur: number;
  seuilFaisabilite: number;
  onOuvrir?: (id: string) => void;
  hauteur?: number;
  etiquettes?: boolean;
  titre?: string;
  sousTitre?: string;
}) {
  const { ref, largeur } = useLargeur<HTMLDivElement>();
  const reduit = useMouvementReduit();
  const [survol, setSurvol] = useState<string | null>(null);

  const x = echelleLineaire([1, 5], [MARGES.gauche, largeur - MARGES.droite]);
  const y = echelleLineaire([1, 5], [hauteur - MARGES.bas, MARGES.haut]);
  const vanMax = Math.max(0, ...points.map((p) => p.van));
  const ecarts = decalages(points);
  const niveauxPresents = NIVEAUX_LEGENDE.filter((n) => points.some((p) => p.niveau === n));

  const legende: ElementLegende[] = [
    ...niveauxPresents.map((n) => ({
      libelle: NIVEAUX_AI_ACT[n].court,
      temoin: (
        <svg viewBox="-10 -10 20 20" width={14} height={14} aria-hidden="true">
          <FormeSignal niveau={n} />
        </svg>
      ),
    })),
    {
      libelle: 'Forme évidée : VAN ≤ 0',
      temoin: (
        <svg viewBox="-10 -10 20 20" width={14} height={14} aria-hidden="true">
          <FormeSignal niveau="minimal" creuse />
        </svg>
      ),
    },
  ];

  const zones: { id: QuadrantId; x: number; y: number; ancre: 'start' | 'end' }[] = [
    { id: 'strategique', x: MARGES.gauche + 10, y: MARGES.haut + 16, ancre: 'start' },
    { id: 'quick_win', x: largeur - MARGES.droite - 10, y: MARGES.haut + 16, ancre: 'end' },
    { id: 'a_ecarter', x: MARGES.gauche + 10, y: hauteur - MARGES.bas - 10, ancre: 'start' },
    { id: 'a_explorer', x: largeur - MARGES.droite - 10, y: hauteur - MARGES.bas - 10, ancre: 'end' },
  ];

  const pointSurvole = points.find((p) => p.id === survol);
  const positionsEtiquettes = placerEtiquettes(
    points.map((p) => {
      const [dx, dy] = ecarts.get(p.id) ?? [0, 0];
      return { id: p.id, x: x(p.faisabilite) + dx, y: y(p.valeur) + dy, r: rayon(p.van, vanMax), largeur: 7 * p.code.replace(/^UC-/, '').length };
    }),
    { x0: MARGES.gauche, x1: largeur - MARGES.droite },
  );

  const tableau = (
    <table className="table-tech">
      <thead>
        <tr>
          <th scope="col">Code</th>
          <th scope="col">Cas d’usage</th>
          <th scope="col" className="text-right">Valeur</th>
          <th scope="col" className="text-right">Faisabilité</th>
          <th scope="col" className="text-right">VAN</th>
          <th scope="col">AI Act</th>
          <th scope="col">Quadrant</th>
        </tr>
      </thead>
      <tbody>
        {points.map((p) => (
          <tr key={p.id}>
            <td className="mono">{p.code}</td>
            <td>{p.titre}</td>
            <td className="mono text-right">{fmtNombre(p.valeur, 2)}</td>
            <td className="mono text-right">{fmtNombre(p.faisabilite, 2)}</td>
            <td className="mono text-right">{fmtEuro(p.van)}</td>
            <td>{NIVEAUX_AI_ACT[p.niveau].court}</td>
            <td>{libelleQuadrant(p.quadrant)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <CadreGraphique titre={titre} sousTitre={sousTitre} legende={legende} tableau={tableau}>
      <div ref={ref} className="relative w-full min-w-0 [contain:inline-size]" onMouseLeave={() => setSurvol(null)}>
        <svg width={largeur} height={hauteur} role="group" aria-label="Matrice valeur × faisabilité des cas d’usage" className="block">
          {[1, 2, 3, 4, 5].map((v) => (
            <g key={v}>
              <line x1={x(v)} x2={x(v)} y1={MARGES.haut} y2={hauteur - MARGES.bas} stroke="var(--chart-grid)" />
              <line x1={MARGES.gauche} x2={largeur - MARGES.droite} y1={y(v)} y2={y(v)} stroke="var(--chart-grid)" />
              <text x={x(v)} y={hauteur - MARGES.bas + 18} textAnchor="middle" className="fill-[var(--muted)] text-[11px] tabular-nums">
                {v}
              </text>
              <text x={MARGES.gauche - 10} y={y(v)} dy="0.32em" textAnchor="end" className="fill-[var(--muted)] text-[11px] tabular-nums">
                {v}
              </text>
            </g>
          ))}
          <text x={(MARGES.gauche + largeur - MARGES.droite) / 2} y={hauteur - 6} textAnchor="middle" className="fill-[var(--ink)] text-[11px] font-semibold tracking-[0.1em] uppercase">
            Faisabilité →
          </text>
          <text
            transform={`translate(14 ${(MARGES.haut + hauteur - MARGES.bas) / 2}) rotate(-90)`}
            textAnchor="middle"
            className="fill-[var(--ink)] text-[11px] font-semibold tracking-[0.1em] uppercase"
          >
            Valeur →
          </text>
          {zones.map((z) => (
            <text key={z.id} x={z.x} y={z.y} textAnchor={z.ancre} className="fill-[var(--muted)] text-[10.5px] font-semibold tracking-[0.14em] uppercase">
              {QUADRANTS.find((q) => q.id === z.id)?.libelle}
            </text>
          ))}
          <motion.line
            x1={MARGES.gauche}
            x2={largeur - MARGES.droite}
            y1={0}
            y2={0}
            stroke="var(--ink)"
            strokeWidth={1.25}
            initial={false}
            animate={{ y: y(seuilValeur) }}
            transition={transition(DUREES.lent, 0, reduit)}
          />
          <motion.line
            x1={0}
            x2={0}
            y1={MARGES.haut}
            y2={hauteur - MARGES.bas}
            stroke="var(--ink)"
            strokeWidth={1.25}
            initial={false}
            animate={{ x: x(seuilFaisabilite) }}
            transition={transition(DUREES.lent, 0, reduit)}
          />
          {[...points]
            .sort((a, b) => b.van - a.van)
            .map((p) => {
              const [dx, dy] = ecarts.get(p.id) ?? [0, 0];
              const px = x(p.faisabilite) + dx;
              const py = y(p.valeur) + dy;
              const r = rayon(p.van, vanMax);
              const etiquette = attributsEtiquette(positionsEtiquettes.get(p.id) ?? 'droite', r);
              return (
                <motion.g
                  key={p.id}
                  initial={reduit ? false : { x: px, y: py, opacity: 0 }}
                  animate={{ x: px, y: py, opacity: 1 }}
                  transition={transition(DUREES.lent, 0, reduit)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${p.code} ${p.titre} : valeur ${fmtNombre(p.valeur, 1)}, faisabilité ${fmtNombre(
                    p.faisabilite,
                    1,
                  )}, VAN ${fmtEuro(p.van)}, ${NIVEAUX_AI_ACT[p.niveau].court}`}
                  onMouseEnter={() => setSurvol(p.id)}
                  onFocus={() => setSurvol(p.id)}
                  onBlur={() => setSurvol(null)}
                  onClick={() => onOuvrir?.(p.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onOuvrir?.(p.id);
                    }
                  }}
                  className="cursor-pointer outline-none [&:focus-visible>circle:first-child]:stroke-[var(--action)]"
                >
                  <circle r={Math.max(14, r + 4)} fill="transparent" stroke="transparent" strokeWidth={2} />
                  <g stroke="var(--surface)" strokeWidth={0}>
                    <FormeSignal niveau={p.niveau} r={r} creuse={p.van <= 0} />
                  </g>
                  {etiquettes && (
                    <text
                      x={etiquette.x}
                      y={etiquette.y}
                      dy={etiquette.dy}
                      textAnchor={etiquette.textAnchor}
                      className="mono fill-[var(--ink)] text-[11px] font-medium"
                      style={{ paintOrder: 'stroke', stroke: 'var(--surface)', strokeWidth: 3 }}
                    >
                      {p.code.replace(/^UC-/, '')}
                    </text>
                  )}
                </motion.g>
              );
            })}
        </svg>
        {pointSurvole && (
          <Infobulle x={x(pointSurvole.faisabilite)} y={y(pointSurvole.valeur)} largeurConteneur={largeur}>
            <p className="mono text-[11px] text-muted">{pointSurvole.code}</p>
            <p className="font-semibold text-ink">{pointSurvole.titre}</p>
            <p className="mt-1 text-muted">
              Valeur <span className="mono text-ink">{fmtNombre(pointSurvole.valeur, 2)}</span> · Faisabilité{' '}
              <span className="mono text-ink">{fmtNombre(pointSurvole.faisabilite, 2)}</span>
            </p>
            <p className="text-muted">
              VAN <span className="mono text-ink">{fmtEuro(pointSurvole.van)}</span> · {NIVEAUX_AI_ACT[pointSurvole.niveau].court}
            </p>
            <p className="text-muted">{libelleQuadrant(pointSurvole.quadrant)}</p>
          </Infobulle>
        )}
      </div>
    </CadreGraphique>
  );
}
