/** Classes des boutons (partagées entre <button> et liens stylés en bouton). */
export type Variante = 'primaire' | 'secondaire' | 'discret' | 'danger';
export type Taille = 'sm' | 'md';

const BASE =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[2px] border font-display font-semibold uppercase tracking-[0.06em] disabled:cursor-not-allowed disabled:opacity-50 select-none';

const VARIANTES: Record<Variante, string> = {
  primaire: 'border-action bg-action text-action-ink hover:border-[var(--action-hover)] hover:bg-[var(--action-hover)]',
  secondaire: 'border-line-strong bg-surface text-ink hover:border-ink',
  discret: 'border-transparent bg-transparent text-ink hover:bg-surface-2',
  danger: 'border-line-strong bg-surface text-sig-red hover:border-sig-red',
};

const TAILLES: Record<Taille, string> = {
  sm: 'min-h-8 px-3 text-[11.5px]',
  md: 'min-h-10 px-4 text-[12.5px]',
};

export function classesBouton(variante: Variante = 'secondaire', taille: Taille = 'md', extra = ''): string {
  return `${BASE} ${VARIANTES[variante]} ${TAILLES[taille]} ${extra}`.trim();
}
