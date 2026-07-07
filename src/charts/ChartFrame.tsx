import { useId, useState, type ReactNode } from 'react';
import { Table2 } from 'lucide-react';

export interface ElementLegende {
  libelle: string;
  /** Rendu du témoin (rectangle, trait, forme). */
  temoin: ReactNode;
}

/**
 * Cadre commun des graphiques : titre, légende, graphique et sa vue tableau (équivalent accessible).
 */
export function CadreGraphique({
  titre,
  sousTitre,
  legende,
  tableau,
  children,
  actions,
  className = '',
}: {
  titre: string;
  sousTitre?: ReactNode;
  legende?: ElementLegende[];
  tableau: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  const [voirTableau, setVoirTableau] = useState(false);
  const id = useId();
  return (
    <figure className={`plate m-0 ${className}`} aria-labelledby={`${id}-titre`}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <h3 id={`${id}-titre`} className="font-display text-[15px] font-semibold tracking-[0.02em] text-ink">
            {titre}
          </h3>
          {sousTitre && <p className="mt-0.5 text-[12.5px] text-muted">{sousTitre}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          <button
            type="button"
            onClick={() => setVoirTableau((v) => !v)}
            aria-pressed={voirTableau}
            className="no-print inline-flex min-h-8 items-center gap-1.5 rounded-[2px] border border-line-strong px-2 font-display text-[11px] font-semibold tracking-[0.08em] text-ink uppercase hover:border-ink"
          >
            <Table2 className="size-3.5" aria-hidden="true" />
            {voirTableau ? 'Graphique' : 'Données'}
          </button>
        </div>
      </div>
      {legende && legende.length > 0 && (
        <ul className="flex flex-wrap gap-x-5 gap-y-1 px-4 pt-3 text-[12.5px] text-muted" aria-label="Légende">
          {legende.map((l) => (
            <li key={l.libelle} className="inline-flex items-center gap-2">
              {l.temoin}
              <span>{l.libelle}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="px-2 pt-2 pb-3 md:px-4">{voirTableau ? <div className="overflow-x-auto px-2">{tableau}</div> : children}</div>
    </figure>
  );
}

export function TemoinRect({ couleur }: { couleur: string }) {
  return <span aria-hidden="true" className="inline-block h-2.5 w-3.5 rounded-[1px]" style={{ background: couleur }} />;
}

export function TemoinTrait({ couleur }: { couleur: string }) {
  return <span aria-hidden="true" className="inline-block h-[2px] w-4" style={{ background: couleur }} />;
}
