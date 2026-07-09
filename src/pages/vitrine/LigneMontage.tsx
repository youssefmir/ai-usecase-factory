import { motion } from 'motion/react';
import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import type { AnalysePortefeuille } from '../../domain/analysis';
import { NIVEAUX_AI_ACT } from '../../domain/aiAct/qualification';
import { fmtEuroCompact, fmtNombre } from '../../domain/format';
import { libelleVague } from '../../domain/roadmap/roadmap';
import { EASE_OUT, useMouvementReduit } from '../../ui/motion';
import { FormeSignal, SignalIcone } from '../../ui/signalShapes';
import { attributsEtiquette, placerEtiquettes } from '../../charts/etiquettes';

const L = 660;
const H = 380;
const Y_TAPIS = 92;
const STATIONS = [
  { x: 112, num: '01', nom: 'Cadrage', detail: '11 sections' },
  { x: 222, num: '02', nom: 'Scoring', detail: '12 critères' },
  { x: 332, num: '03', nom: 'AI Act', detail: 'art. 2 à 50' },
  { x: 442, num: '04', nom: 'Business case', detail: 'VAN · Monte Carlo' },
  { x: 552, num: '05', nom: 'Roadmap', detail: '3 vagues' },
];
const MATRICE = { x0: 150, x1: 630, y0: 196, y1: 356 };
const DUREE = 3.2;
const DECALAGE = 0.42;

const px = (f: number) => MATRICE.x0 + ((f - 1) / 4) * (MATRICE.x1 - MATRICE.x0);
const py = (v: number) => MATRICE.y1 - ((v - 1) / 4) * (MATRICE.y1 - MATRICE.y0);

/**
 * Ligne de montage : les cas d'usage d'un portefeuille de démonstration passent par les cinq postes
 * de l'atelier, puis se placent dans la matrice. Animation jouée une fois (bouton « Rejouer »).
 */
export function LigneMontage({ analyse, nom }: { analyse: AnalysePortefeuille; nom: string }) {
  const reduit = useMouvementReduit();
  const [cycle, setCycle] = useState(0);
  const cas = analyse.cas.filter((a) => a.scoring.valeur.note !== null && a.scoring.faisabilite.note !== null);
  const vagues = new Map(analyse.roadmap.entrees.map((e) => [e.casId, e.vague]));
  const seuil = { x: px(3), y: py(3) };
  const finLigne = (i: number) => (DUREE + i * DECALAGE) * 1000;
  const positions = placerEtiquettes(
    cas.map((a) => ({ id: a.cas.id, x: px(a.scoring.faisabilite.note ?? 1), y: py(a.scoring.valeur.note ?? 1), r: 10, largeur: 40 })),
    { x0: MATRICE.x0, x1: MATRICE.x1 },
  );

  return (
    <div className="plate overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <p className="label-caps">
          Ligne de montage · {nom} <span className="text-sig-yellow">■</span> données fictives
        </p>
        <button
          type="button"
          onClick={() => setCycle((c) => c + 1)}
          disabled={reduit}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-[2px] px-2 font-display text-[11px] font-semibold tracking-[0.08em] text-muted uppercase hover:text-ink disabled:opacity-40"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Rejouer
        </button>
      </div>

      <svg key={cycle} viewBox={`0 0 ${L} ${H}`} className="block h-auto w-full" role="img" aria-label={`Les ${cas.length} cas d’usage de ${nom} passent par les cinq postes de l’atelier puis se placent dans la matrice valeur × faisabilité.`}>
        {/* Tapis */}
        <line x1={20} x2={640} y1={Y_TAPIS + 15} y2={Y_TAPIS + 15} stroke="var(--ink)" strokeWidth={2} />
        {Array.from({ length: 32 }, (_, i) => (
          <circle key={i} cx={24 + i * 19.5} cy={Y_TAPIS + 21} r={3} fill="none" stroke="var(--rule-strong)" strokeWidth={1} />
        ))}

        {/* Postes */}
        {STATIONS.map((s) => (
          <g key={s.num}>
            <rect x={s.x - 46} y={22} width={92} height={46} fill="var(--surface)" stroke="var(--ink)" strokeWidth={1.25} />
            <rect x={s.x - 46} y={22} width={22} height={46} fill="var(--ink)" />
            <text x={s.x - 35} y={49} textAnchor="middle" className="mono fill-[var(--bg)] text-[11px] font-semibold">
              {s.num}
            </text>
            <text x={s.x - 18} y={41} className="fill-[var(--ink)] text-[10.5px] font-semibold tracking-[0.06em] uppercase" style={{ fontFamily: 'var(--font-display)' }}>
              {s.nom.length > 10 ? 'Business' : s.nom}
            </text>
            <text x={s.x - 18} y={55} className="fill-[var(--ink)] text-[10.5px] font-semibold tracking-[0.06em] uppercase" style={{ fontFamily: 'var(--font-display)' }}>
              {s.nom.length > 10 ? 'case' : ''}
            </text>
            <text x={s.x} y={82} textAnchor="middle" className="mono fill-[var(--muted)] text-[9px]">
              {s.detail}
            </text>
            <line x1={s.x} x2={s.x} y1={86} y2={Y_TAPIS + 4} stroke="var(--rule-strong)" strokeDasharray="2 3" />
          </g>
        ))}

        {/* Matrice d'arrivée */}
        <rect x={MATRICE.x0} y={MATRICE.y0} width={MATRICE.x1 - MATRICE.x0} height={MATRICE.y1 - MATRICE.y0} fill="var(--surface)" stroke="var(--rule)" />
        <line x1={seuil.x} x2={seuil.x} y1={MATRICE.y0} y2={MATRICE.y1} stroke="var(--ink)" />
        <line x1={MATRICE.x0} x2={MATRICE.x1} y1={seuil.y} y2={seuil.y} stroke="var(--ink)" />
        {[
          ['Projet stratégique', MATRICE.x0 + 8, MATRICE.y0 + 14, 'start'],
          ['Quick win', MATRICE.x1 - 8, MATRICE.y0 + 14, 'end'],
          ['À écarter', MATRICE.x0 + 8, MATRICE.y1 - 8, 'start'],
          ['À explorer', MATRICE.x1 - 8, MATRICE.y1 - 8, 'end'],
        ].map(([t, x, y, a]) => (
          <text key={String(t)} x={Number(x)} y={Number(y)} textAnchor={a as 'start' | 'end'} className="fill-[var(--muted)] text-[9.5px] font-semibold tracking-[0.12em] uppercase">
            {t}
          </text>
        ))}
        <text x={MATRICE.x0 - 10} y={(MATRICE.y0 + MATRICE.y1) / 2} textAnchor="end" className="fill-[var(--ink)] text-[10px] font-semibold tracking-[0.1em] uppercase">
          Valeur ↑
        </text>
        <text x={(MATRICE.x0 + MATRICE.x1) / 2} y={H - 6} textAnchor="middle" className="fill-[var(--ink)] text-[10px] font-semibold tracking-[0.1em] uppercase">
          Faisabilité →
        </text>
        <text x={20} y={MATRICE.y0 + 4} className="mono fill-[var(--muted)] text-[9px]">
          SORTIE
        </text>
        <path d={`M640 ${Y_TAPIS + 15} C 652 ${Y_TAPIS + 50}, 652 ${MATRICE.y0 - 40}, ${MATRICE.x1 - 6} ${MATRICE.y0 - 6}`} fill="none" stroke="var(--rule-strong)" strokeDasharray="3 4" />

        {/* Cas d'usage */}
        {cas.map((a, i) => {
          const fx = px(a.scoring.faisabilite.note ?? 1);
          const fy = py(a.scoring.valeur.note ?? 1);
          const xs = [-70, ...STATIONS.flatMap((s) => [s.x, s.x]), 640, fx];
          const ys = [...Array(xs.length - 1).fill(Y_TAPIS), fy];
          const n = xs.length;
          const temps = xs.map((_, k) => (k === n - 1 ? 1 : (k / (n - 2)) * 0.86));
          const niveau = a.aiAct.niveau === 'incomplet' ? a.aiAct.niveauProvisoire : a.aiAct.niveau;
          const delai = i * DECALAGE;
          const etiquette = attributsEtiquette(positions.get(a.cas.id) ?? 'droite', 10);
          return (
            <g key={a.cas.id}>
              {/* Jeton sur le tapis */}
              <motion.g
                initial={reduit ? { x: fx, y: fy, opacity: 0 } : { x: -70, y: Y_TAPIS, opacity: 1 }}
                animate={reduit ? { x: fx, y: fy, opacity: 0 } : { x: xs, y: ys, opacity: 0 }}
                transition={
                  reduit
                    ? { duration: 0 }
                    : {
                        x: { duration: DUREE, delay: delai, times: temps, ease: EASE_OUT },
                        y: { duration: DUREE, delay: delai, times: temps, ease: EASE_OUT },
                        opacity: { duration: 0.18, delay: delai + DUREE * 0.97, ease: 'easeOut' },
                      }
                }
              >
                <rect x={-27} y={-10} width={54} height={20} rx={2} fill="var(--ink)" />
                <text x={0} y={4} textAnchor="middle" className="mono fill-[var(--bg)] text-[10px] font-semibold">
                  {a.cas.code.replace(/^UC-/, '')}
                </text>
              </motion.g>
              {/* Pastille posée dans la matrice */}
              <motion.g
                initial={reduit ? false : { opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={reduit ? { duration: 0 } : { duration: 0.36, delay: delai + DUREE * 0.97, ease: EASE_OUT }}
                style={{ x: fx, y: fy }}
              >
                <FormeSignal niveau={niveau} r={10} creuse={a.businessCase.van <= 0} />
                <text
                  x={etiquette.x}
                  y={etiquette.y}
                  dy={etiquette.dy}
                  textAnchor={etiquette.textAnchor}
                  className="mono fill-[var(--ink)] text-[9.5px] font-medium"
                  style={{ paintOrder: 'stroke', stroke: 'var(--surface)', strokeWidth: 3 }}
                >
                  {a.cas.code.replace(/^UC-/, '')}
                </text>
              </motion.g>
            </g>
          );
        })}
      </svg>

      {/* Bordereau de sortie : une ligne apparaît à chaque cas sorti de la ligne */}
      <div className="border-t border-line">
        <table className="table-tech text-[12px]">
          <caption className="sr-only">Résultats calculés pour chaque cas d’usage du portefeuille {nom}</caption>
          <thead>
            <tr>
              <th scope="col">Cas</th>
              <th scope="col" className="hidden sm:table-cell">Val. / Fais.</th>
              <th scope="col">AI Act</th>
              <th scope="col" className="text-right">VAN</th>
              <th scope="col">Vague</th>
            </tr>
          </thead>
          <tbody key={cycle}>
            {cas.map((a, i) => (
              <motion.tr
                key={a.cas.id}
                initial={reduit ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={reduit ? { duration: 0 } : { duration: 0.3, delay: finLigne(i) / 1000, ease: EASE_OUT }}
              >
                <td className="max-w-[15rem] py-2">
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="mono shrink-0 text-[11px] text-muted">{a.cas.code.replace(/^UC-/, '')}</span>
                    <span className="truncate">{a.cas.titre}</span>
                  </span>
                </td>
                <td className="mono hidden py-2 whitespace-nowrap sm:table-cell">
                  {fmtNombre(a.scoring.valeur.note ?? 0, 1)} / {fmtNombre(a.scoring.faisabilite.note ?? 0, 1)}
                </td>
                <td className="py-2">
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                    <SignalIcone niveau={a.aiAct.niveau} taille={13} />
                    {NIVEAUX_AI_ACT[a.aiAct.niveau].court}
                  </span>
                </td>
                <td className={`mono py-2 text-right whitespace-nowrap ${a.businessCase.van < 0 ? 'text-sig-red' : ''}`}>{fmtEuroCompact(a.businessCase.van)}</td>
                <td className="mono py-2 whitespace-nowrap">{libelleVague(vagues.get(a.cas.id) ?? 0).replace('Vague ', 'V').replace('Hors roadmap', '—')}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
