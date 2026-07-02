import type { ReactNode } from 'react';
import { Info, TriangleAlert } from 'lucide-react';

/** Étiquette de provenance d'une valeur : hypothèse, estimation métier, mesure ou calculé. */
export function TagProvenance({ type }: { type: 'hypothese' | 'estimation_metier' | 'mesure' | 'calcule' }) {
  const libelle = { hypothese: 'Hypothèse', estimation_metier: 'Estimation métier', mesure: 'Mesure', calcule: 'Calculé' }[type];
  const style =
    type === 'hypothese'
      ? 'border-dashed border-line-strong text-muted'
      : type === 'calcule'
        ? 'border-action/40 text-action'
        : 'border-line-strong text-ink';
  return (
    <span className={`inline-flex items-center rounded-[2px] border px-1.5 py-px font-display text-[10px] font-semibold uppercase tracking-[0.1em] ${style}`}>
      {libelle}
    </span>
  );
}

/** Mention « organisation fictive » pour les portefeuilles de démonstration. */
export function TagFictif() {
  return (
    <span className="inline-flex items-center gap-1 rounded-[2px] bg-sig-yellow px-1.5 py-px font-display text-[10.5px] font-bold uppercase tracking-[0.12em] text-black">
      Fictif
    </span>
  );
}

export function Avis({
  ton = 'info',
  titre,
  children,
  role,
}: {
  ton?: 'info' | 'alerte' | 'danger';
  titre?: ReactNode;
  children: ReactNode;
  role?: 'status' | 'alert';
}) {
  const styles = {
    info: 'border-l-action bg-surface',
    alerte: 'border-l-sig-yellow bg-sig-yellow-soft',
    danger: 'border-l-sig-red bg-sig-red-soft',
  }[ton];
  const Icone = ton === 'info' ? Info : TriangleAlert;
  return (
    <div role={role} className={`flex gap-3 rounded-[2px] border border-line border-l-4 px-4 py-3 text-[14px] ${styles}`}>
      <Icone aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">
        {titre && <p className="font-semibold">{titre}</p>}
        <div className="text-ink/90">{children}</div>
      </div>
    </div>
  );
}

export function Indicateur({
  libelle,
  valeur,
  detail,
  provenance,
}: {
  libelle: ReactNode;
  valeur: ReactNode;
  detail?: ReactNode;
  provenance?: 'hypothese' | 'calcule';
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 border-l border-line pl-4">
      <span className="label-caps">{libelle}</span>
      <span className="mono text-[26px] leading-none font-semibold tracking-tight text-ink">{valeur}</span>
      {(detail || provenance) && (
        <span className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted">
          {detail}
          {provenance && <TagProvenance type={provenance} />}
        </span>
      )}
    </div>
  );
}

export function VisuellementCache({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

/** Titre de page façon cartouche : identifiant mono, titre condensé, filet. */
export function EnTetePage({
  surTitre,
  titre,
  description,
  actions,
  meta,
}: {
  surTitre?: ReactNode;
  titre: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-ink/80 pb-5 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0 max-w-3xl">
        {surTitre && <div className="mb-2 flex flex-wrap items-center gap-2">{surTitre}</div>}
        <h1 className="text-[30px] leading-[1.05] font-semibold text-ink md:text-[40px]">{titre}</h1>
        {description && <p className="mt-3 max-w-2xl text-[15px] text-muted">{description}</p>}
        {meta && <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">{meta}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 md:justify-end">{actions}</div>}
    </header>
  );
}
