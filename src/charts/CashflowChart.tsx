import { motion } from 'motion/react';
import { useState } from 'react';
import type { ResultatBusinessCase } from '../domain/businessCase/finance';
import { fmtEuro, fmtEuroCompact } from '../domain/format';
import { DUREES, transition, useMouvementReduit } from '../ui/motion';
import { CadreGraphique, TemoinRect, TemoinTrait } from './ChartFrame';
import { Infobulle } from './Infobulle';
import { echelleLineaire, fmtAxeEuro, graduations } from './scales';
import { useLargeur } from './useLargeur';

const HAUTEUR = 260;
const MARGES = { haut: 18, droite: 72, bas: 34, gauche: 58 };

/** Barre arrondie (2 px) côté valeur, carrée côté ligne de base. */
function cheminBarre(x: number, largeur: number, y0: number, y1: number): string {
  const r = Math.min(2, Math.abs(y1 - y0) / 2, largeur / 2);
  if (y1 < y0) {
    return `M${x} ${y0} V${y1 + r} Q${x} ${y1} ${x + r} ${y1} H${x + largeur - r} Q${x + largeur} ${y1} ${x + largeur} ${y1 + r} V${y0} Z`;
  }
  return `M${x} ${y0} V${y1 - r} Q${x} ${y1} ${x + r} ${y1} H${x + largeur - r} Q${x + largeur} ${y1} ${x + largeur} ${y1 - r} V${y0} Z`;
}

export function CashflowChart({ resultat }: { resultat: ResultatBusinessCase }) {
  const { ref, largeur } = useLargeur<HTMLDivElement>();
  const reduit = useMouvementReduit();
  const [survol, setSurvol] = useState<number | null>(null);

  const points = [
    { annee: 0, libelle: 'Année 0', flux: -resultat.build, cumul: -resultat.build },
    ...resultat.annees.map((a) => ({ annee: a.annee, libelle: `Année ${a.annee}`, flux: a.fluxNet, cumul: a.cumul })),
  ];
  const valeurs = points.flatMap((p) => [p.flux, p.cumul, 0]);
  const { ticks, domaine } = graduations(Math.min(...valeurs), Math.max(...valeurs), 4);
  const y = echelleLineaire(domaine, [HAUTEUR - MARGES.bas, MARGES.haut]);
  const largeurUtile = largeur - MARGES.gauche - MARGES.droite;
  const bande = largeurUtile / points.length;
  const cx = (i: number) => MARGES.gauche + bande * i + bande / 2;
  const largeurBarre = Math.min(24, bande * 0.42);
  const y0 = y(0);
  const ligne = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${cx(i)} ${y(p.cumul)}`).join(' ');
  const dernier = points[points.length - 1];

  const tableau = (
    <table className="table-tech">
      <thead>
        <tr>
          <th scope="col">Année</th>
          <th scope="col" className="text-right">Gains</th>
          <th scope="col" className="text-right">Coûts</th>
          <th scope="col" className="text-right">Flux net</th>
          <th scope="col" className="text-right">Cumul</th>
          <th scope="col" className="text-right">Flux actualisé</th>
        </tr>
      </thead>
      <tbody className="mono">
        <tr>
          <td>0 (build)</td>
          <td className="text-right">–</td>
          <td className="text-right">{fmtEuro(resultat.build)}</td>
          <td className="text-right">{fmtEuro(-resultat.build)}</td>
          <td className="text-right">{fmtEuro(-resultat.build)}</td>
          <td className="text-right">{fmtEuro(-resultat.build)}</td>
        </tr>
        {resultat.annees.map((a) => (
          <tr key={a.annee}>
            <td>{a.annee}</td>
            <td className="text-right">{fmtEuro(a.gainsTotaux)}</td>
            <td className="text-right">{fmtEuro(a.coutsRun)}</td>
            <td className="text-right">{fmtEuro(a.fluxNet)}</td>
            <td className="text-right">{fmtEuro(a.cumul)}</td>
            <td className="text-right">{fmtEuro(a.fluxActualise)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const pointSurvole = survol === null ? null : points[survol];

  return (
    <CadreGraphique
      titre="Flux de trésorerie sur 3 ans"
      sousTitre="Investissement en année 0, puis flux nets annuels (gains − coûts de run). Valeurs calculées."
      legende={[
        { libelle: 'Flux net annuel', temoin: <TemoinRect couleur="var(--chart-1-light)" /> },
        { libelle: 'Flux cumulé', temoin: <TemoinTrait couleur="var(--chart-1)" /> },
      ]}
      tableau={tableau}
    >
      <div ref={ref} className="relative w-full min-w-0 [contain:inline-size]" onMouseLeave={() => setSurvol(null)}>
        <svg width={largeur} height={HAUTEUR} role="img" aria-label="Graphique des flux de trésorerie annuels et cumulés" className="block">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={MARGES.gauche} x2={largeur - MARGES.droite} y1={y(t)} y2={y(t)} stroke={t === 0 ? 'var(--ink)' : 'var(--chart-grid)'} strokeWidth={1} />
              <text x={MARGES.gauche - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-[var(--muted)] text-[11px] tabular-nums">
                {fmtAxeEuro(t)}
              </text>
            </g>
          ))}
          {points.map((p, i) => {
            const haut = y(p.flux);
            return (
              <g key={p.annee}>
                <motion.path
                  d={cheminBarre(cx(i) - largeurBarre / 2, largeurBarre, y0, haut)}
                  fill="var(--chart-1-light)"
                  style={{ transformBox: 'fill-box', transformOrigin: p.flux >= 0 ? '50% 100%' : '50% 0%' }}
                  initial={reduit ? false : { scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={transition(DUREES.lent, i * 0.08, reduit)}
                />
                <text x={cx(i)} y={HAUTEUR - MARGES.bas + 18} textAnchor="middle" className="fill-[var(--muted)] text-[11.5px]">
                  {p.libelle}
                </text>
                {/* Zone de survol plus large que la barre */}
                <rect
                  x={cx(i) - bande / 2}
                  y={MARGES.haut}
                  width={bande}
                  height={HAUTEUR - MARGES.haut - MARGES.bas}
                  fill="transparent"
                  tabIndex={0}
                  role="img"
                  aria-label={`${p.libelle} : flux net ${fmtEuro(p.flux)}, cumul ${fmtEuro(p.cumul)}`}
                  onMouseEnter={() => setSurvol(i)}
                  onFocus={() => setSurvol(i)}
                  onBlur={() => setSurvol(null)}
                  className="outline-none focus-visible:stroke-[var(--action)] focus-visible:stroke-2"
                />
              </g>
            );
          })}
          <motion.path
            d={ligne}
            fill="none"
            stroke="var(--chart-1)"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            initial={reduit ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={transition(DUREES.lent, 0.3, reduit)}
            pointerEvents="none"
          />
          {points.map((p, i) => (
            <circle key={p.annee} cx={cx(i)} cy={y(p.cumul)} r={4.5} fill="var(--chart-1)" stroke="var(--surface)" strokeWidth={2} pointerEvents="none" />
          ))}
          {dernier && (
            <text x={cx(points.length - 1) + largeurBarre / 2 + 6} y={y(dernier.cumul)} dy="0.32em" className="fill-[var(--ink)] text-[12px] font-semibold tabular-nums">
              {fmtEuroCompact(dernier.cumul)}
            </text>
          )}
          {survol !== null && (
            <line x1={cx(survol)} x2={cx(survol)} y1={MARGES.haut} y2={HAUTEUR - MARGES.bas} stroke="var(--rule-strong)" strokeWidth={1} pointerEvents="none" />
          )}
        </svg>
        {pointSurvole && survol !== null && (
          <Infobulle x={cx(survol)} y={y(pointSurvole.cumul)} largeurConteneur={largeur}>
            <p className="font-semibold text-ink">{pointSurvole.libelle}</p>
            <p className="mono text-ink">{fmtEuro(pointSurvole.flux)}</p>
            <p className="text-muted">flux net de l’année</p>
            <p className="mono mt-1 text-ink">{fmtEuro(pointSurvole.cumul)}</p>
            <p className="text-muted">flux cumulé</p>
          </Infobulle>
        )}
      </div>
    </CadreGraphique>
  );
}
