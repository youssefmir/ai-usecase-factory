/**
 * Pastilles de signalisation (inspirées de l'ISO 7010), dessinées en SVG et centrées sur l'origine :
 * cercle barré rouge = interdiction ; triangle jaune bordé de noir = danger (haut risque) ;
 * cercle bleu plein = obligation (transparence) ; carré vert = situation sûre (risque minimal).
 * La forme porte le sens : la couleur n'est jamais seule.
 */
import type { NiveauAiAct } from '../domain/aiAct/qualification';

const NOIR = '#15171a';

export function FormeSignal({ niveau, r = 10, creuse = false }: { niveau: NiveauAiAct; r?: number; creuse?: boolean }) {
  switch (niveau) {
    case 'interdit':
      return (
        <g>
          <circle r={r * 0.8} fill="var(--surface)" stroke="var(--sig-red)" strokeWidth={r * 0.28} />
          <line x1={-r * 0.56} y1={-r * 0.56} x2={r * 0.56} y2={r * 0.56} stroke="var(--sig-red)" strokeWidth={r * 0.28} />
        </g>
      );
    case 'haut_risque':
      return (
        <g>
          <path
            d={`M0 ${-r * 0.95} L${r * 0.98} ${r * 0.78} L${-r * 0.98} ${r * 0.78} Z`}
            fill={creuse ? 'var(--surface)' : 'var(--sig-yellow)'}
            stroke={creuse ? 'var(--sig-yellow)' : NOIR}
            strokeWidth={creuse ? r * 0.22 : r * 0.13}
            strokeLinejoin="round"
          />
          {!creuse && (
            <g fill={NOIR}>
              <rect x={-r * 0.09} y={-r * 0.36} width={r * 0.18} height={r * 0.62} rx={r * 0.04} />
              <rect x={-r * 0.1} y={r * 0.38} width={r * 0.2} height={r * 0.2} rx={r * 0.04} />
            </g>
          )}
        </g>
      );
    case 'transparence':
      return (
        <g>
          <circle
            r={r * 0.88}
            fill={creuse ? 'var(--surface)' : 'var(--sig-blue)'}
            stroke={creuse ? 'var(--sig-blue)' : 'none'}
            strokeWidth={r * 0.2}
          />
          {!creuse && (
            <g fill="var(--surface)">
              <circle cy={-r * 0.42} r={r * 0.13} />
              <rect x={-r * 0.09} y={-r * 0.18} width={r * 0.18} height={r * 0.62} rx={r * 0.03} />
            </g>
          )}
        </g>
      );
    case 'minimal':
      return (
        <g>
          <rect
            x={-r * 0.8}
            y={-r * 0.8}
            width={r * 1.6}
            height={r * 1.6}
            rx={r * 0.06}
            fill={creuse ? 'var(--surface)' : 'var(--sig-green)'}
            stroke={creuse ? 'var(--sig-green)' : 'none'}
            strokeWidth={r * 0.2}
          />
          {!creuse && (
            <path
              d={`M${-r * 0.42} ${r * 0.02} L${-r * 0.1} ${r * 0.34} L${r * 0.45} ${-r * 0.3}`}
              fill="none"
              stroke="var(--surface)"
              strokeWidth={r * 0.2}
              strokeLinecap="square"
            />
          )}
        </g>
      );
    case 'hors_champ':
      return (
        <rect
          x={-r * 0.75}
          y={-r * 0.75}
          width={r * 1.5}
          height={r * 1.5}
          fill="var(--surface)"
          stroke="var(--muted)"
          strokeWidth={r * 0.14}
          strokeDasharray={`${r * 0.3} ${r * 0.2}`}
        />
      );
    default:
      return (
        <circle r={r * 0.78} fill="var(--surface)" stroke="var(--muted)" strokeWidth={r * 0.14} strokeDasharray={`${r * 0.28} ${r * 0.2}`} />
      );
  }
}

export function SignalIcone({ niveau, taille = 16, className = '' }: { niveau: NiveauAiAct; taille?: number; className?: string }) {
  return (
    <svg viewBox="-10 -10 20 20" width={taille} height={taille} className={`shrink-0 ${className}`} aria-hidden="true" focusable="false">
      <FormeSignal niveau={niveau} />
    </svg>
  );
}
