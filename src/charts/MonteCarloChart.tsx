import { useInView } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { centile } from '../domain/businessCase/random';
import { compterDansClasses, type ResultatMonteCarlo } from '../domain/businessCase/uncertainty';
import { fmtEuro, fmtEuroCompact, fmtNombre, fmtPct } from '../domain/format';
import { useMouvementReduit } from '../ui/motion';
import { Indicateur } from '../ui/bits';
import { CadreGraphique, TemoinRect } from './ChartFrame';
import { Infobulle } from './Infobulle';
import { echelleLineaire, fmtAxeEuro, graduations } from './scales';
import { useLargeur } from './useLargeur';

const HAUTEUR = 240;
const MARGES = { haut: 34, droite: 18, bas: 32, gauche: 46 };
const DUREE_MS = 1800;

const easeOut = (p: number) => 1 - (1 - p) ** 3;

/**
 * Histogramme de la VAN simulée. L'échantillonnage est rejoué à l'écran : les tirages
 * (déjà calculés, graine fixe) sont versés un à un dans des classes fixes ; les centiles
 * se déplacent puis se stabilisent. Avec « moins d'animations », l'état final s'affiche.
 */
export function MonteCarloChart({ resultat }: { resultat: ResultatMonteCarlo }) {
  const { ref, largeur } = useLargeur<HTMLDivElement>();
  const reduit = useMouvementReduit();
  const zone = useRef<HTMLDivElement>(null);
  const visible = useInView(zone, { once: true, margin: '0px 0px -10% 0px' });
  const [cycle, setCycle] = useState(0);
  const [progres, setProgres] = useState(() => (reduit ? 1 : 0));
  const [survol, setSurvol] = useState<number | null>(null);

  useEffect(() => {
    if (reduit || !visible) return;
    let raf = 0;
    let t0: number | null = null;
    const pas = (t: number) => {
      t0 ??= t;
      const p = Math.min(1, (t - t0) / DUREE_MS);
      setProgres(easeOut(p));
      if (p < 1) raf = requestAnimationFrame(pas);
    };
    raf = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf);
  }, [cycle, visible, reduit]);

  const n = resultat.iterations;
  const k = reduit ? n : Math.round(progres * n);
  const classes = resultat.histogramme;
  const effectifs = useMemo(() => compterDansClasses(resultat.tirages, classes, k), [resultat.tirages, classes, k]);
  const stats = useMemo(() => {
    if (k === 0) return null;
    const echantillon = Float64Array.from(resultat.tirages.subarray(0, k)).sort();
    let positifs = 0;
    for (const v of echantillon) if (v > 0) positifs += 1;
    return { p10: centile(echantillon, 0.1), p50: centile(echantillon, 0.5), p90: centile(echantillon, 0.9), proba: positifs / k };
  }, [resultat.tirages, k]);

  const maxFinal = Math.max(1, ...classes.map((c) => c.effectif));
  const premiere = classes[0];
  const derniere = classes[classes.length - 1];
  const { ticks } = graduations(premiere?.debut ?? 0, derniere?.fin ?? 1, 5);
  const x = echelleLineaire([premiere?.debut ?? 0, derniere?.fin ?? 1], [MARGES.gauche, largeur - MARGES.droite]);
  const yBas = HAUTEUR - MARGES.bas;
  const hauteurMax = yBas - MARGES.haut;
  const visibles = ticks.filter((t) => t >= (premiere?.debut ?? 0) && t <= (derniere?.fin ?? 0));
  const graduationsY = [0, Math.round(maxFinal / 2), maxFinal];

  const tableau = (
    <table className="table-tech">
      <thead>
        <tr>
          <th scope="col">Classe de VAN</th>
          <th scope="col" className="text-right">Tirages</th>
          <th scope="col" className="text-right">Part</th>
        </tr>
      </thead>
      <tbody className="mono">
        {classes.map((c) => (
          <tr key={c.debut}>
            <td>
              {fmtEuroCompact(c.debut)} à {fmtEuroCompact(c.fin)}
            </td>
            <td className="text-right">{fmtNombre(c.effectif)}</td>
            <td className="text-right">{fmtPct(c.effectif / n, 1)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const marqueurs = stats
    ? [
        { id: 'P10', v: stats.p10 },
        { id: 'P50', v: stats.p50 },
        { id: 'P90', v: stats.p90 },
      ]
    : [];
  const classeSurvolee = survol === null ? null : classes[survol];

  return (
    <div ref={zone} className="flex flex-col gap-4">
      <CadreGraphique
        titre="Distribution simulée de la VAN (Monte Carlo)"
        sousTitre={`${fmtNombre(n)} tirages, lois triangulaires bas / mode / haut, graine ${resultat.graine} : résultat reproductible.`}
        legende={[
          { libelle: 'VAN ≤ 0', temoin: <TemoinRect couleur="var(--chart-neutral)" /> },
          { libelle: 'VAN > 0', temoin: <TemoinRect couleur="var(--chart-1)" /> },
        ]}
        tableau={tableau}
        actions={
          <button
            type="button"
            onClick={() => {
              setProgres(0);
              setCycle((c) => c + 1);
            }}
            disabled={reduit}
            className="no-print inline-flex min-h-8 items-center gap-1.5 rounded-[2px] border border-line-strong px-2 font-display text-[11px] font-semibold tracking-[0.08em] text-ink uppercase hover:border-ink disabled:opacity-50"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Rejouer l’échantillonnage
          </button>
        }
      >
        <div ref={ref} className="relative w-full min-w-0 [contain:inline-size]" onMouseLeave={() => setSurvol(null)}>
          <svg width={largeur} height={HAUTEUR} role="img" aria-label="Histogramme de la VAN simulée" className="block">
            {graduationsY.map((g) => (
              <g key={g}>
                <line x1={MARGES.gauche} x2={largeur - MARGES.droite} y1={yBas - (g / maxFinal) * hauteurMax} y2={yBas - (g / maxFinal) * hauteurMax} stroke="var(--chart-grid)" />
                <text x={MARGES.gauche - 8} y={yBas - (g / maxFinal) * hauteurMax} dy="0.32em" textAnchor="end" className="fill-[var(--muted)] text-[10.5px] tabular-nums">
                  {fmtNombre(g)}
                </text>
              </g>
            ))}
            {classes.map((c, i) => {
              const x0 = x(c.debut) + 1;
              const w = Math.max(1, x(c.fin) - x(c.debut) - 2);
              const echelle = (effectifs[i] ?? 0) / maxFinal;
              return (
                <g key={c.debut}>
                  <rect
                    x={x0}
                    y={MARGES.haut}
                    width={w}
                    height={hauteurMax}
                    fill={c.fin <= 0 ? 'var(--chart-neutral)' : 'var(--chart-1)'}
                    style={{ transformBox: 'fill-box', transformOrigin: '50% 100%', transform: `scaleY(${echelle})` }}
                  />
                  <rect
                    x={x0 - 1}
                    y={MARGES.haut}
                    width={w + 2}
                    height={hauteurMax}
                    fill="transparent"
                    onMouseEnter={() => setSurvol(i)}
                  />
                </g>
              );
            })}
            <line x1={MARGES.gauche} x2={largeur - MARGES.droite} y1={yBas} y2={yBas} stroke="var(--ink)" />
            {visibles.map((t) => (
              <text key={t} x={x(t)} y={yBas + 18} textAnchor="middle" className="fill-[var(--muted)] text-[11px] tabular-nums">
                {fmtAxeEuro(t)}
              </text>
            ))}
            {marqueurs.map((m, i) => (
              <g key={m.id} style={{ transform: `translateX(${x(m.v)}px)` }}>
                <line y1={MARGES.haut - 4} y2={yBas} stroke="var(--ink)" strokeWidth={1} />
                <text y={MARGES.haut - 10 - (i % 2) * 0} textAnchor={i === 0 ? 'end' : i === 2 ? 'start' : 'middle'} dx={i === 0 ? -3 : i === 2 ? 3 : 0} className="fill-[var(--ink)] text-[11px] font-semibold">
                  {m.id}
                </text>
              </g>
            ))}
          </svg>
          {classeSurvolee && survol !== null && (
            <Infobulle x={x((classeSurvolee.debut + classeSurvolee.fin) / 2)} y={MARGES.haut + 10} largeurConteneur={largeur}>
              <p className="font-semibold text-ink">
                {fmtEuroCompact(classeSurvolee.debut)} à {fmtEuroCompact(classeSurvolee.fin)}
              </p>
              <p className="mono text-ink">{fmtNombre(effectifs[survol] ?? 0)} tirages</p>
              <p className="text-muted">{fmtPct((effectifs[survol] ?? 0) / Math.max(1, k), 1)} des tirages affichés</p>
            </Infobulle>
          )}
        </div>
        <p className="mono px-2 pt-1 text-[11px] text-muted" aria-live="polite">
          {k < n ? `Échantillonnage : ${fmtNombre(k)} / ${fmtNombre(n)}` : `${fmtNombre(n)} tirages`}
        </p>
      </CadreGraphique>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Indicateur libelle="P10" valeur={stats ? fmtEuroCompact(stats.p10) : '–'} detail="scénario prudent" provenance="calcule" />
        <Indicateur libelle="P50" valeur={stats ? fmtEuroCompact(stats.p50) : '–'} detail="médiane" provenance="calcule" />
        <Indicateur libelle="P90" valeur={stats ? fmtEuroCompact(stats.p90) : '–'} detail="scénario favorable" provenance="calcule" />
        <Indicateur libelle="P(VAN > 0)" valeur={stats ? fmtPct(stats.proba) : '–'} detail={`moyenne ${fmtEuro(resultat.moyenne)}`} provenance="calcule" />
      </div>
    </div>
  );
}
