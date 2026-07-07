import { motion } from 'motion/react';
import { useState } from 'react';
import type { ResultatSensibilite } from '../domain/businessCase/uncertainty';
import { fmtEuro, fmtEuroCompact, fmtNombre } from '../domain/format';
import { DUREES, transition, useMouvementReduit } from '../ui/motion';
import { CadreGraphique, TemoinRect } from './ChartFrame';
import { Infobulle } from './Infobulle';
import { echelleLineaire, fmtAxeEuro, graduations } from './scales';
import { useLargeur } from './useLargeur';

const HAUTEUR_LIGNE = 34;
const EPAISSEUR = 9;
const MARGES = { haut: 26, droite: 24, bas: 30 };

function signe(v: number): string {
  return `${v > 0 ? '+' : v < 0 ? '−' : ''}${fmtEuroCompact(Math.abs(v))}`;
}

export function TornadoChart({ sensibilite }: { sensibilite: ResultatSensibilite }) {
  const { ref, largeur } = useLargeur<HTMLDivElement>();
  const reduit = useMouvementReduit();
  const [survol, setSurvol] = useState<number | null>(null);
  const lignes = sensibilite.lignes;
  const pct = fmtNombre(sensibilite.variation * 100, 0);

  const gauche = Math.min(190, Math.max(120, largeur * 0.3));
  const hauteur = MARGES.haut + lignes.length * HAUTEUR_LIGNE + MARGES.bas;
  const extreme = Math.max(1, ...lignes.flatMap((l) => [Math.abs(l.ecartBas), Math.abs(l.ecartHaut)]));
  const { ticks, domaine } = graduations(-extreme, extreme, 4);
  const borne = Math.max(Math.abs(domaine[0]), Math.abs(domaine[1]));
  const x = echelleLineaire([-borne, borne], [gauche, largeur - MARGES.droite]);
  const x0 = x(0);

  const barre = (valeur: number, yHaut: number) => {
    const xa = Math.min(x0, x(valeur));
    const w = Math.abs(x(valeur) - x0);
    return { x: xa, y: yHaut, w, h: EPAISSEUR };
  };

  const tableau = (
    <table className="table-tech">
      <thead>
        <tr>
          <th scope="col">Paramètre</th>
          <th scope="col" className="text-right">VAN à −{pct} %</th>
          <th scope="col" className="text-right">VAN à +{pct} %</th>
          <th scope="col" className="text-right">Amplitude</th>
        </tr>
      </thead>
      <tbody>
        {lignes.map((l) => (
          <tr key={l.parametre}>
            <td>{l.libelle}</td>
            <td className="mono text-right">{fmtEuro(l.vanBasse)}</td>
            <td className="mono text-right">{fmtEuro(l.vanHaute)}</td>
            <td className="mono text-right">{fmtEuro(l.amplitude)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const ligneSurvolee = survol === null ? null : lignes[survol];

  return (
    <CadreGraphique
      titre={`Sensibilité de la VAN (±${pct} %)`}
      sousTitre={`Écart à la VAN centrale (${fmtEuro(sensibilite.vanCentrale)}) quand un seul paramètre varie. Paramètres classés par influence.`}
      legende={[
        { libelle: `Paramètre à −${pct} %`, temoin: <TemoinRect couleur="var(--chart-1-light)" /> },
        { libelle: `Paramètre à +${pct} %`, temoin: <TemoinRect couleur="var(--chart-1)" /> },
      ]}
      tableau={tableau}
    >
      <div ref={ref} className="relative" onMouseLeave={() => setSurvol(null)}>
        <svg width={largeur} height={hauteur} role="img" aria-label="Diagramme en tornade de la sensibilité de la VAN" className="block">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={MARGES.haut - 8} y2={hauteur - MARGES.bas} stroke={t === 0 ? 'var(--ink)' : 'var(--chart-grid)'} strokeWidth={1} />
              <text x={x(t)} y={hauteur - MARGES.bas + 18} textAnchor="middle" className="fill-[var(--muted)] text-[11px] tabular-nums">
                {t === 0 ? 'VAN centrale' : t > 0 ? `+${fmtAxeEuro(t)}` : `−${fmtAxeEuro(-t)}`}
              </text>
            </g>
          ))}
          {lignes.map((l, i) => {
            const yLigne = MARGES.haut + i * HAUTEUR_LIGNE;
            const bas = barre(l.ecartBas, yLigne + 6);
            const haut = barre(l.ecartHaut, yLigne + 6 + EPAISSEUR + 2);
            const etiqueter = i < 3;
            return (
              <g key={l.parametre}>
                <text x={gauche - 12} y={yLigne + 16} dy="0.32em" textAnchor="end" className="fill-[var(--ink)] text-[12.5px]">
                  {l.libelle}
                </text>
                {[
                  { r: bas, couleur: 'var(--chart-1-light)', v: l.ecartBas },
                  { r: haut, couleur: 'var(--chart-1)', v: l.ecartHaut },
                ].map(({ r, couleur, v }, j) => (
                  <g key={j}>
                    <motion.rect
                      x={r.x}
                      y={r.y}
                      width={Math.max(0.5, r.w)}
                      height={r.h}
                      rx={1.5}
                      fill={couleur}
                      style={{ transformBox: 'fill-box', transformOrigin: v >= 0 ? '0% 50%' : '100% 50%' }}
                      initial={reduit ? false : { scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={transition(DUREES.lent, i * 0.05, reduit)}
                    />
                    {etiqueter && Math.abs(v) > 0 && (
                      <text
                        x={v >= 0 ? r.x + r.w + 6 : r.x - 6}
                        y={r.y + r.h / 2}
                        dy="0.34em"
                        textAnchor={v >= 0 ? 'start' : 'end'}
                        className="fill-[var(--muted)] text-[10.5px] tabular-nums"
                      >
                        {signe(v)}
                      </text>
                    )}
                  </g>
                ))}
                <rect
                  x={0}
                  y={yLigne}
                  width={largeur}
                  height={HAUTEUR_LIGNE}
                  fill="transparent"
                  tabIndex={0}
                  role="img"
                  aria-label={`${l.libelle} : à −${pct} %, VAN ${fmtEuro(l.vanBasse)} ; à +${pct} %, VAN ${fmtEuro(l.vanHaute)}`}
                  onMouseEnter={() => setSurvol(i)}
                  onFocus={() => setSurvol(i)}
                  onBlur={() => setSurvol(null)}
                  className="outline-none focus-visible:stroke-[var(--action)] focus-visible:stroke-2"
                />
              </g>
            );
          })}
        </svg>
        {ligneSurvolee && survol !== null && (
          <Infobulle x={x0} y={MARGES.haut + survol * HAUTEUR_LIGNE} largeurConteneur={largeur}>
            <p className="font-semibold text-ink">{ligneSurvolee.libelle}</p>
            <p className="mt-1 text-muted">
              −{pct} % : <span className="mono text-ink">{fmtEuro(ligneSurvolee.vanBasse)}</span> ({signe(ligneSurvolee.ecartBas)})
            </p>
            <p className="text-muted">
              +{pct} % : <span className="mono text-ink">{fmtEuro(ligneSurvolee.vanHaute)}</span> ({signe(ligneSurvolee.ecartHaut)})
            </p>
          </Infobulle>
        )}
      </div>
    </CadreGraphique>
  );
}
