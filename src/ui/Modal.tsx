import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { DUREES, transition, useMouvementReduit } from './motion';

/** Boîte de dialogue modale : Échap ferme, le focus revient à l'élément déclencheur. */
export function Modal({
  ouverte,
  onFermer,
  titre,
  children,
  actions,
}: {
  ouverte: boolean;
  onFermer: () => void;
  titre: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const reduit = useMouvementReduit();
  const idTitre = useId();
  const panneau = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ouverte) return;
    const precedent = document.activeElement as HTMLElement | null;
    const premier = panneau.current?.querySelector<HTMLElement>('input, select, textarea, button:not([data-fermer])');
    (premier ?? panneau.current)?.focus();
    const touche = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onFermer();
      if (e.key === 'Tab' && panneau.current) {
        const focusables = [...panneau.current.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea')].filter(
          (el) => !el.hasAttribute('disabled'),
        );
        const debut = focusables[0];
        const fin = focusables[focusables.length - 1];
        if (!debut || !fin) return;
        if (e.shiftKey && document.activeElement === debut) {
          e.preventDefault();
          fin.focus();
        } else if (!e.shiftKey && document.activeElement === fin) {
          e.preventDefault();
          debut.focus();
        }
      }
    };
    document.addEventListener('keydown', touche);
    return () => {
      document.removeEventListener('keydown', touche);
      precedent?.focus?.();
    };
  }, [ouverte, onFermer]);

  return createPortal(
    <AnimatePresence>
      {ouverte && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <motion.div
            className="absolute inset-0 bg-[#15171a]/55"
            initial={{ opacity: reduit ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition(DUREES.rapide, 0, reduit)}
            onClick={onFermer}
            aria-hidden="true"
          />
          <motion.div
            ref={panneau}
            role="dialog"
            aria-modal="true"
            aria-labelledby={idTitre}
            tabIndex={-1}
            className="plate relative w-full max-w-lg border-ink/70 sm:w-[min(32rem,100%)]"
            initial={reduit ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={transition(DUREES.moyen, 0, reduit)}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <h2 id={idTitre} className="text-[18px] font-semibold">
                {titre}
              </h2>
              <button type="button" data-fermer onClick={onFermer} className="rounded-[2px] p-1.5 text-muted hover:bg-surface-2 hover:text-ink" aria-label="Fermer">
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-5 py-4 text-[14.5px]">{children}</div>
            {actions && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3">{actions}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
