import { motion } from 'motion/react';
import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { AnalyseCas } from '../../domain/analysis';
import { fmtEuroCompact, fmtNombre } from '../../domain/format';
import type { Portfolio } from '../../domain/model';
import { AXES, CRITERES, libelleQuadrant, type Critere, type CritereId } from '../../domain/scoring/criteria';
import { partsAxes, poidsCritere, type ResultatAxe } from '../../domain/scoring/scoring';
import { Avis } from '../../ui/bits';
import { DUREES, transition, useMouvementReduit } from '../../ui/motion';
import { Plate } from '../../ui/Plate';
import { FormeSignal } from '../../ui/signalShapes';
import { TagQuadrant } from '../../ui/Signals';
import type { MajCas } from './types';

function suggestionReglementaire(a: AnalyseCas): { note: number; motif: string } | null {
  const niveau = a.aiAct.niveau === 'incomplet' ? a.aiAct.niveauProvisoire : a.aiAct.niveau;
  if (niveau === 'interdit') return { note: 5, motif: 'pratique interdite (AI Act)' };
  if (niveau === 'haut_risque') return { note: 4, motif: 'système à haut risque (AI Act)' };
  if (a.rgpd.article22 === 'applicable') return { note: 4, motif: 'décision automatisée (art. 22 RGPD)' };
  if (niveau === 'transparence' || a.rgpd.niveau === 'aipd_requise') return { note: 3, motif: niveau === 'transparence' ? 'obligations de transparence' : 'AIPD probable' };
  if (niveau === 'minimal') return { note: 2, motif: 'risque minimal' };
  if (niveau === 'hors_champ') return { note: 1, motif: 'hors champ de l’AI Act' };
  return null;
}

function LigneCritere({
  critere,
  note,
  poids,
  justification,
  onNote,
  onJustification,
  repere,
}: {
  critere: Critere;
  note: number | null;
  poids: number;
  justification: string;
  onNote: (n: number) => void;
  onJustification: (t: string) => void;
  repere?: React.ReactNode;
}) {
  const nom = useId();
  const [grille, setGrille] = useState(false);
  const descripteur = note ? critere.niveaux[note - 1] : null;
  return (
    <div className="border-b border-line py-4 first:pt-0 last:border-b-0 last:pb-0">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 md:max-w-[52%]">
          <p className="text-[14.5px] font-semibold text-ink">
            {critere.libelle} <span className="mono text-[11px] font-normal text-muted">poids {fmtNombre(poids)}</span>
          </p>
          <p className="mt-0.5 text-[13px] text-muted">{critere.question}</p>
        </div>
        <fieldset className="shrink-0">
          <legend className="sr-only">Note de 1 à 5 : {critere.libelle}</legend>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => {
              const actif = note === n;
              return (
                <label
                  key={n}
                  title={critere.niveaux[n - 1]}
                  className={`mono relative flex size-10 cursor-pointer items-center justify-center rounded-[2px] border text-[14px] font-semibold focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-action ${
                    actif ? 'border-ink bg-ink text-bg' : 'border-line-strong bg-surface text-ink hover:border-ink'
                  }`}
                >
                  <input type="radio" name={nom} value={n} checked={actif} onChange={() => onNote(n)} className="sr-only" />
                  {n}
                  <span className="sr-only"> : {critere.niveaux[n - 1]}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>
      <div className="mt-2 flex flex-col gap-2">
        <p className={`text-[13px] ${descripteur ? 'text-ink' : 'text-muted'}`}>
          {descripteur ? (
            <>
              <span className="mono mr-2 text-[11px] text-muted">NIVEAU {note}</span>
              {descripteur}
            </>
          ) : (
            'Non noté'
          )}
        </p>
        {repere}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setGrille((g) => !g)}
            aria-expanded={grille}
            className="inline-flex items-center gap-1 text-[12.5px] text-muted underline hover:text-ink"
          >
            <ChevronDown className={`size-3.5 ${grille ? 'rotate-180' : ''}`} aria-hidden="true" />
            {grille ? 'Masquer la grille' : 'Voir les 5 niveaux'}
          </button>
        </div>
        {grille && (
          <ol className="grid gap-1 text-[12.5px]">
            {critere.niveaux.map((d, i) => (
              <li key={d} className={`grid grid-cols-[1.5rem_1fr] gap-2 ${note === i + 1 ? 'font-semibold text-ink' : 'text-muted'}`}>
                <span className="mono">{i + 1}</span>
                {d}
              </li>
            ))}
          </ol>
        )}
        <input
          className="field-input min-h-9 text-[13px]"
          placeholder="Justification de la note (facultatif)"
          aria-label={`Justification : ${critere.libelle}`}
          value={justification}
          onChange={(e) => onJustification(e.target.value)}
        />
      </div>
    </div>
  );
}

function NoteAxe({ axe }: { axe: ResultatAxe }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="label-caps">{axe.libelle}</span>
      <span className="mono text-[24px] leading-none font-semibold">
        {axe.note === null ? '–' : fmtNombre(axe.note, 2)}
        <span className="text-[12px] font-normal text-muted"> / 5</span>
      </span>
      <span className="relative h-1 bg-[var(--chart-grid)]" aria-hidden="true">
        <span className="absolute inset-y-0 left-0 bg-ink" style={{ width: `${axe.note100 ?? 0}%` }} />
      </span>
    </div>
  );
}

/** Mini-matrice : position du cas par rapport aux seuils. */
function Position({ analyse, portefeuille }: { analyse: AnalyseCas; portefeuille: Portfolio }) {
  const reduit = useMouvementReduit();
  const { valeur, faisabilite } = analyse.scoring;
  const taille = 200;
  const marge = 14;
  const echelle = (v: number) => marge + ((v - 1) / 4) * (taille - 2 * marge);
  const sx = echelle(portefeuille.config.seuilFaisabilite);
  const sy = taille - echelle(portefeuille.config.seuilValeur);
  return (
    <svg viewBox={`0 0 ${taille} ${taille}`} width={taille} height={taille} role="img" aria-label={`Position dans la matrice : ${libelleQuadrant(analyse.scoring.quadrant)}`}>
      <rect x={marge} y={marge} width={taille - 2 * marge} height={taille - 2 * marge} fill="none" stroke="var(--rule)" />
      <line x1={sx} x2={sx} y1={marge} y2={taille - marge} stroke="var(--ink)" />
      <line x1={marge} x2={taille - marge} y1={sy} y2={sy} stroke="var(--ink)" />
      <text x={taille - marge - 4} y={marge + 12} textAnchor="end" className="fill-[var(--muted)] text-[8.5px] font-semibold tracking-[0.08em] uppercase">
        Quick win
      </text>
      <text x={marge + 4} y={marge + 12} className="fill-[var(--muted)] text-[8.5px] font-semibold tracking-[0.08em] uppercase">
        Stratégique
      </text>
      <text x={marge + 4} y={taille - marge - 6} className="fill-[var(--muted)] text-[8.5px] font-semibold tracking-[0.08em] uppercase">
        À écarter
      </text>
      <text x={taille - marge - 4} y={taille - marge - 6} textAnchor="end" className="fill-[var(--muted)] text-[8.5px] font-semibold tracking-[0.08em] uppercase">
        À explorer
      </text>
      {valeur.note !== null && faisabilite.note !== null && (
        <motion.g
          initial={false}
          animate={{ x: echelle(faisabilite.note), y: taille - echelle(valeur.note) }}
          transition={transition(DUREES.lent, 0, reduit)}
        >
          <FormeSignal niveau={analyse.aiAct.niveau === 'incomplet' ? analyse.aiAct.niveauProvisoire : analyse.aiAct.niveau} r={9} />
        </motion.g>
      )}
    </svg>
  );
}

export function OngletScoring({ analyse, portefeuille, maj }: { analyse: AnalyseCas; portefeuille: Portfolio; maj: MajCas }) {
  const { cas, scoring, businessCase } = analyse;
  const parts = partsAxes(portefeuille.config.poidsAxes);
  const suggestion = suggestionReglementaire(analyse);
  const resultats = { valeur: scoring.valeur, faisabilite: scoring.faisabilite, risque: scoring.risque };

  const noter = (id: CritereId, n: number) =>
    maj((c) => {
      c.scores[id] = n;
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex min-w-0 flex-col gap-5">
        {AXES.map((axe, i) => (
          <Plate
            key={axe.id}
            etiquette={`${axe.libelle} · ${fmtNombre(parts[axe.id] * 100, 0)} % de la priorité`}
            repere={`${String(i + 1).padStart(2, '0')} / 03 · ${axe.sens}`}
          >
            {CRITERES.filter((c) => c.axe === axe.id).map((critere) => (
              <LigneCritere
                key={critere.id}
                critere={critere}
                note={cas.scores[critere.id]}
                poids={poidsCritere(portefeuille.config, critere.id)}
                justification={cas.justificationsScores[critere.id] ?? ''}
                onNote={(n) => noter(critere.id, n)}
                onJustification={(t) =>
                  maj((c) => {
                    c.justificationsScores[critere.id] = t;
                  })
                }
                repere={
                  critere.id === 'impactFinancier' ? (
                    <p className="text-[12.5px] text-muted">
                      Repère calculé : gains annuels à pleine adoption <span className="mono text-ink">{fmtEuroCompact(businessCase.gainsAnnuelsPleineAdoption)}</span>, VAN 3 ans{' '}
                      <span className="mono text-ink">{fmtEuroCompact(businessCase.van)}</span>.
                    </p>
                  ) : critere.id === 'risqueReglementaire' && suggestion ? (
                    <p className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted">
                      Suggestion issue des qualifications : <span className="mono text-ink">{suggestion.note}</span> ({suggestion.motif}).
                      {cas.scores.risqueReglementaire !== suggestion.note && (
                        <button type="button" className="text-action underline" onClick={() => noter('risqueReglementaire', suggestion.note)}>
                          Appliquer
                        </button>
                      )}
                    </p>
                  ) : undefined
                }
              />
            ))}
          </Plate>
        ))}
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <Plate etiquette="Résultat du scoring" repere="Calculé">
          <div className="grid grid-cols-3 gap-4">
            <NoteAxe axe={resultats.valeur} />
            <NoteAxe axe={resultats.faisabilite} />
            <NoteAxe axe={resultats.risque} />
          </div>
          <div className="mt-5 flex items-end justify-between gap-4 border-t border-line pt-4">
            <div>
              <span className="label-caps">Score de priorité</span>
              <p className="mono mt-1 text-[40px] leading-none font-semibold">
                {scoring.priorite === null ? '–' : fmtNombre(scoring.priorite, 0)}
                <span className="text-[14px] font-normal text-muted"> / 100</span>
              </p>
              <div className="mt-3">
                <TagQuadrant quadrant={scoring.quadrant} />
              </div>
            </div>
            <Position analyse={analyse} portefeuille={portefeuille} />
          </div>
          <ol className="mt-4 flex flex-col gap-2 border-t border-line pt-4 text-[13px]">
            {scoring.explication.map((e) => (
              <li key={e} className="text-ink/90">
                {e}
              </li>
            ))}
          </ol>
          {scoring.alertes.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              {scoring.alertes.map((a) => (
                <Avis key={a} ton="alerte">
                  {a}
                </Avis>
              ))}
            </div>
          )}
        </Plate>
      </aside>
    </div>
  );
}
