import type { ReactNode } from 'react';

interface PlateProps {
  /** Étiquette de nomenclature affichée en en-tête (petites capitales). */
  etiquette?: ReactNode;
  /** Repère à droite de l'étiquette (« 02 / 05 », identifiant…). */
  repere?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  corpsClassName?: string;
  id?: string;
  /** Bandeau de danger jaune et noir en tête de plaque (haut risque). */
  danger?: boolean;
}

/** Plaque de travail : surface à filet fin, en-tête façon fiche technique. */
export function Plate({ etiquette, repere, actions, children, className = '', corpsClassName = 'p-4 md:p-5', id, danger }: PlateProps) {
  return (
    <section id={id} className={`plate relative overflow-hidden ${className}`}>
      {danger && <div className="hazard h-1.5 w-full" aria-hidden="true" />}
      {(etiquette || repere || actions) && (
        <header className="flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-line px-4 py-2">
          <div className="flex min-w-0 items-baseline gap-3">
            {etiquette && <h2 className="label-caps truncate">{etiquette}</h2>}
            {repere && <span className="mono text-[11px] text-muted">{repere}</span>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={corpsClassName}>{children}</div>
    </section>
  );
}
