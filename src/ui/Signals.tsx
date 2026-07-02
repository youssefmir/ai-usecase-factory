import { NIVEAUX_AI_ACT, type NiveauAiAct } from '../domain/aiAct/qualification';
import { NIVEAUX_RGPD, type NiveauRgpd } from '../domain/rgpd/evaluation';
import { libelleQuadrant, type QuadrantId } from '../domain/scoring/criteria';
import { libelleVague, type VagueRoadmap } from '../domain/roadmap/roadmap';
import { SignalIcone } from './signalShapes';

export function BadgeAiAct({
  niveau,
  detail,
  taille = 'md',
  provisoire,
}: {
  niveau: NiveauAiAct;
  detail?: string | null;
  taille?: 'sm' | 'md';
  provisoire?: NiveauAiAct | null;
}) {
  const libelle = NIVEAUX_AI_ACT[niveau].court;
  return (
    <span className={`inline-flex items-center gap-1.5 ${taille === 'sm' ? 'text-[11px]' : 'text-[12px]'}`}>
      <SignalIcone niveau={niveau} taille={taille === 'sm' ? 14 : 17} />
      <span className="font-display font-semibold tracking-[0.06em] text-ink uppercase">{libelle}</span>
      {provisoire && niveau === 'incomplet' && provisoire !== 'incomplet' && (
        <span className="text-muted normal-case">(provisoire : {NIVEAUX_AI_ACT[provisoire].court.toLowerCase()})</span>
      )}
      {detail && <span className="mono text-[11px] text-muted normal-case">{detail}</span>}
    </span>
  );
}

/** Glyphe 2 x 2 : la case pleine indique le quadrant (x = faisabilité, y = valeur). */
export function GlypheQuadrant({ quadrant, taille = 14 }: { quadrant: QuadrantId | null; taille?: number }) {
  const cases: { id: QuadrantId; x: number; y: number }[] = [
    { id: 'strategique', x: 0, y: 0 },
    { id: 'quick_win', x: 8, y: 0 },
    { id: 'a_ecarter', x: 0, y: 8 },
    { id: 'a_explorer', x: 8, y: 8 },
  ];
  return (
    <svg viewBox="0 0 15 15" width={taille} height={taille} aria-hidden="true" className="shrink-0">
      {cases.map((c) => (
        <rect
          key={c.id}
          x={c.x + 0.5}
          y={c.y + 0.5}
          width={6}
          height={6}
          fill={c.id === quadrant ? 'var(--ink)' : 'none'}
          stroke={c.id === quadrant ? 'var(--ink)' : 'var(--rule-strong)'}
          strokeWidth={1}
        />
      ))}
    </svg>
  );
}

export function TagQuadrant({ quadrant }: { quadrant: QuadrantId | null }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] whitespace-nowrap text-ink">
      <GlypheQuadrant quadrant={quadrant} />
      <span className={quadrant ? '' : 'text-muted'}>{libelleQuadrant(quadrant)}</span>
    </span>
  );
}

export function TagRgpd({ niveau }: { niveau: NiveauRgpd }) {
  const fort = niveau === 'aipd_requise';
  return (
    <span
      className={`inline-flex items-center rounded-[2px] border px-1.5 py-px text-[11.5px] whitespace-nowrap ${
        fort ? 'border-ink font-semibold text-ink' : 'border-line-strong text-muted'
      }`}
    >
      {NIVEAUX_RGPD[niveau].court}
    </span>
  );
}

export function TagVague({ vague }: { vague: VagueRoadmap }) {
  const court = vague >= 1 && vague <= 3 ? `V${vague}` : vague === 4 ? '18 m +' : '—';
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] whitespace-nowrap" title={libelleVague(vague)}>
      <span
        className={`mono inline-flex min-w-7 justify-center rounded-[2px] px-1 py-px text-[11px] font-semibold ${
          vague >= 1 && vague <= 3 ? 'bg-ink text-bg' : 'border border-line-strong text-muted'
        }`}
      >
        {court}
      </span>
      <span className="sr-only">{libelleVague(vague)}</span>
    </span>
  );
}
