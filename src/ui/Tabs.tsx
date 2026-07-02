import { motion } from 'motion/react';
import { useRef, type KeyboardEvent } from 'react';
import { DUREES, transition, useMouvementReduit } from './motion';

export interface Onglet<T extends string> {
  id: T;
  libelle: string;
  repere?: string;
}

/**
 * Barre d'onglets accessible (rôles ARIA, flèches gauche / droite, Début / Fin).
 * Le soulignement glisse d'un onglet à l'autre (animation de transform).
 */
export function Onglets<T extends string>({
  onglets,
  actif,
  onChange,
  etiquette,
  prefixe,
  className = '',
}: {
  onglets: readonly Onglet<T>[];
  actif: T;
  onChange: (id: T) => void;
  etiquette: string;
  prefixe: string;
  className?: string;
}) {
  const reduit = useMouvementReduit();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const clavier = (e: KeyboardEvent<HTMLButtonElement>) => {
    const index = onglets.findIndex((o) => o.id === actif);
    let cible = -1;
    if (e.key === 'ArrowRight') cible = (index + 1) % onglets.length;
    if (e.key === 'ArrowLeft') cible = (index - 1 + onglets.length) % onglets.length;
    if (e.key === 'Home') cible = 0;
    if (e.key === 'End') cible = onglets.length - 1;
    const onglet = onglets[cible];
    if (cible >= 0 && onglet) {
      e.preventDefault();
      onChange(onglet.id);
      refs.current[cible]?.focus();
    }
  };

  return (
    <div
      role="tablist"
      aria-label={etiquette}
      className={`flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:thin] ${className}`}
    >
      {onglets.map((o, i) => {
        const estActif = o.id === actif;
        return (
          <button
            key={o.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`${prefixe}-onglet-${o.id}`}
            role="tab"
            type="button"
            aria-selected={estActif}
            aria-controls={`${prefixe}-panneau-${o.id}`}
            tabIndex={estActif ? 0 : -1}
            onClick={() => onChange(o.id)}
            onKeyDown={clavier}
            className={`relative flex min-h-11 shrink-0 items-center gap-2 px-3 font-display text-[13px] font-semibold tracking-[0.06em] uppercase ${
              estActif ? 'text-ink' : 'text-muted hover:text-ink'
            }`}
          >
            {o.repere && <span className="mono text-[11px] font-normal text-muted">{o.repere}</span>}
            {o.libelle}
            {estActif && (
              <motion.span
                layoutId={`${prefixe}-soulignement`}
                className="absolute inset-x-0 -bottom-px h-[3px] bg-ink"
                transition={transition(DUREES.moyen, 0, reduit)}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
