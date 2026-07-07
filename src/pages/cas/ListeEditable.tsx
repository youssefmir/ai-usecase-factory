import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '../../ui/Button';
import { DUREES, transition, useMouvementReduit } from '../../ui/motion';

/** Liste d'éléments éditables avec ajout et suppression animés. */
export function ListeEditable<T extends { id: string }>({
  elements,
  rendu,
  onAjouter,
  onSupprimer,
  libelleAjout,
  libelleElement,
  vide,
}: {
  elements: readonly T[];
  rendu: (element: T, index: number) => ReactNode;
  onAjouter: () => void;
  onSupprimer: (id: string) => void;
  libelleAjout: string;
  libelleElement: (element: T, index: number) => string;
  vide?: string;
}) {
  const reduit = useMouvementReduit();
  return (
    <div className="flex flex-col gap-3">
      {elements.length === 0 && vide && <p className="text-[13.5px] text-muted">{vide}</p>}
      <AnimatePresence initial={false}>
        {elements.map((el, i) => (
          <motion.div
            key={el.id}
            layout={!reduit}
            initial={reduit ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduit ? undefined : { opacity: 0 }}
            transition={transition(DUREES.moyen, 0, reduit)}
            className="grid grid-cols-[2rem_1fr_auto] gap-3 rounded-[2px] border border-line bg-surface p-3"
          >
            <span className="mono pt-0.5 text-[12px] text-muted">{String(i + 1).padStart(2, '0')}</span>
            <div className="min-w-0">{rendu(el, i)}</div>
            <button
              type="button"
              onClick={() => onSupprimer(el.id)}
              className="self-start rounded-[2px] p-1.5 text-muted hover:bg-surface-2 hover:text-sig-red"
              aria-label={`Supprimer : ${libelleElement(el, i)}`}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
      <div>
        <Button taille="sm" icone={<Plus className="size-3.5" aria-hidden="true" />} onClick={onAjouter}>
          {libelleAjout}
        </Button>
      </div>
    </div>
  );
}

/** Liste de textes courts (irritants, systèmes, dépendances externes). */
export function ListeTextes({
  valeurs,
  onChange,
  libelle,
  libelleAjout,
  placeholder,
}: {
  valeurs: readonly string[];
  onChange: (v: string[]) => void;
  libelle: string;
  libelleAjout: string;
  placeholder?: string;
}) {
  return (
    <fieldset>
      <legend className="block text-[13px] font-semibold text-ink">{libelle}</legend>
      <ul className="mt-2 flex flex-col gap-2">
        {valeurs.map((v, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="mono w-6 text-[12px] text-muted">{String(i + 1).padStart(2, '0')}</span>
            <input
              className="field-input"
              value={v}
              placeholder={placeholder}
              aria-label={`${libelle} ${i + 1}`}
              onChange={(e) => onChange(valeurs.map((x, j) => (j === i ? e.target.value : x)))}
            />
            <button
              type="button"
              onClick={() => onChange(valeurs.filter((_, j) => j !== i))}
              className="rounded-[2px] p-1.5 text-muted hover:bg-surface-2 hover:text-sig-red"
              aria-label={`Supprimer : ${v || `${libelle} ${i + 1}`}`}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <Button taille="sm" className="mt-2" icone={<Plus className="size-3.5" aria-hidden="true" />} onClick={() => onChange([...valeurs, ''])}>
        {libelleAjout}
      </Button>
    </fieldset>
  );
}
