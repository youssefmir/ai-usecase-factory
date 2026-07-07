import { useId, useState, type ReactNode } from 'react';
import type { ProvenanceId, Reponse } from '../domain/model';
import { PROVENANCES } from '../domain/model';
import { fmtNombre } from '../domain/format';

const LIBELLE = 'block text-[13px] font-semibold text-ink';
const AIDE = 'mt-1 text-[12.5px] text-muted';

interface BaseProps {
  libelle: ReactNode;
  aide?: ReactNode;
  className?: string;
}

export function ChampTexte({
  libelle,
  aide,
  valeur,
  onChange,
  placeholder,
  className = '',
  requis,
}: BaseProps & {
  valeur: string;
  onChange: (v: string) => void;
  placeholder?: string;
  requis?: boolean;
}) {
  const id = useId();
  const invalide = requis && valeur.trim() === '';
  return (
    <div className={className}>
      <label htmlFor={id} className={LIBELLE}>
        {libelle}
        {requis && <span className="text-muted"> (obligatoire)</span>}
      </label>
      <input
        id={id}
        className="field-input mt-1.5"
        value={valeur}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalide || undefined}
        aria-describedby={aide ? `${id}-aide` : undefined}
      />
      {aide && (
        <p id={`${id}-aide`} className={AIDE}>
          {aide}
        </p>
      )}
    </div>
  );
}

export function ZoneTexte({
  libelle,
  aide,
  valeur,
  onChange,
  lignes = 3,
  placeholder,
  className = '',
}: BaseProps & { valeur: string; onChange: (v: string) => void; lignes?: number; placeholder?: string }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className={LIBELLE}>
        {libelle}
      </label>
      <textarea
        id={id}
        className="field-input mt-1.5 resize-y leading-relaxed"
        rows={lignes}
        value={valeur}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={aide ? `${id}-aide` : undefined}
      />
      {aide && (
        <p id={`${id}-aide`} className={AIDE}>
          {aide}
        </p>
      )}
    </div>
  );
}

/** Saisie numérique tolérante (virgule ou point), affichage à la française hors édition. */
export function ChampNombre({
  libelle,
  aide,
  valeur,
  onChange,
  unite,
  min = 0,
  max,
  decimales = 0,
  pourcentage = false,
  className = '',
  provenance,
  onProvenance,
  compact = false,
}: BaseProps & {
  valeur: number | null;
  onChange: (v: number | null) => void;
  unite?: string;
  min?: number;
  max?: number;
  decimales?: number;
  /** La valeur stockée est une part (0,35) affichée en pourcentage (35). */
  pourcentage?: boolean;
  provenance?: ProvenanceId;
  onProvenance?: (p: ProvenanceId) => void;
  compact?: boolean;
}) {
  const id = useId();
  const [edition, setEdition] = useState<string | null>(null);
  const affichee = valeur === null ? '' : fmtNombre(pourcentage ? valeur * 100 : valeur, pourcentage ? Math.max(0, decimales - 2) : decimales);
  const uniteCourte = pourcentage ? '%' : unite && unite.length <= 6 ? unite : undefined;
  const uniteLongue = !pourcentage && unite && unite.length > 6 ? unite : undefined;
  const minAffiche = pourcentage ? min * 100 : min;
  const maxAffiche = max === undefined ? undefined : pourcentage ? max * 100 : max;

  const valider = (texte: string) => {
    const propre = texte.replace(/\s/g, '').replace(',', '.');
    if (propre === '') {
      onChange(null);
      return;
    }
    const n = Number(propre);
    if (!Number.isFinite(n)) return;
    const borne = Math.min(maxAffiche ?? Number.POSITIVE_INFINITY, Math.max(minAffiche, n));
    onChange(pourcentage ? borne / 100 : borne);
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className={`${LIBELLE} ${compact ? 'text-[12.5px]' : ''}`}>
          {libelle}
          {uniteLongue && <span className="font-normal text-muted"> ({uniteLongue})</span>}
        </label>
        {provenance && onProvenance && <SelecteurProvenance valeur={provenance} onChange={onProvenance} libelleChamp={String(libelle)} />}
      </div>
      <div className="relative mt-1.5">
        <input
          id={id}
          inputMode="decimal"
          className={`field-input mono text-right ${uniteCourte ? 'pr-14' : ''}`}
          value={edition ?? affichee}
          onFocus={() => setEdition(affichee.replace(/\s/g, ''))}
          onChange={(e) => {
            setEdition(e.target.value);
            valider(e.target.value);
          }}
          onBlur={() => setEdition(null)}
          aria-describedby={aide ? `${id}-aide` : undefined}
        />
        {uniteCourte && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[12px] text-muted">{uniteCourte}</span>
        )}
      </div>
      {aide && (
        <p id={`${id}-aide`} className={AIDE}>
          {aide}
        </p>
      )}
    </div>
  );
}

export function SelecteurProvenance({
  valeur,
  onChange,
  libelleChamp,
}: {
  valeur: ProvenanceId;
  onChange: (p: ProvenanceId) => void;
  libelleChamp: string;
}) {
  return (
    <select
      aria-label={`Provenance : ${libelleChamp}`}
      className={`h-6 rounded-[2px] border bg-surface px-1 font-display text-[10px] font-semibold tracking-[0.1em] uppercase ${
        valeur === 'hypothese' ? 'border-dashed border-line-strong text-muted' : 'border-line-strong text-ink'
      }`}
      value={valeur}
      onChange={(e) => onChange(e.target.value as ProvenanceId)}
    >
      {PROVENANCES.map((p) => (
        <option key={p.id} value={p.id}>
          {p.libelle}
        </option>
      ))}
    </select>
  );
}

export function ChampSelection<T extends string>({
  libelle,
  aide,
  valeur,
  onChange,
  options,
  vide,
  className = '',
}: BaseProps & {
  valeur: T | null;
  onChange: (v: T | null) => void;
  options: readonly { id: T; libelle: string }[];
  /** Libellé de l'option vide (absente si non fourni). */
  vide?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className={LIBELLE}>
        {libelle}
      </label>
      <select
        id={id}
        className="field-input mt-1.5"
        value={valeur ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : (e.target.value as T))}
        aria-describedby={aide ? `${id}-aide` : undefined}
      >
        {vide !== undefined && <option value="">{vide}</option>}
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.libelle}
          </option>
        ))}
      </select>
      {aide && (
        <p id={`${id}-aide`} className={AIDE}>
          {aide}
        </p>
      )}
    </div>
  );
}

const REPONSES: { id: Reponse; libelle: string }[] = [
  { id: 'oui', libelle: 'Oui' },
  { id: 'non', libelle: 'Non' },
  { id: 'nsp', libelle: 'Je ne sais pas' },
];

/** Groupe de boutons radio segmentés. */
export function ChoixSegmente<T extends string>({
  legende,
  aide,
  valeur,
  onChange,
  options,
  className = '',
}: {
  legende: ReactNode;
  aide?: ReactNode;
  valeur: T | null;
  onChange: (v: T) => void;
  options: readonly { id: T; libelle: string }[];
  className?: string;
}) {
  const nom = useId();
  return (
    <fieldset className={className}>
      <legend className={LIBELLE}>{legende}</legend>
      {aide && <p className={AIDE}>{aide}</p>}
      <div className="mt-2 inline-flex flex-wrap gap-1.5">
        {options.map((o) => {
          const actif = valeur === o.id;
          return (
            <label
              key={o.id}
              className={`relative inline-flex min-h-9 cursor-pointer items-center rounded-[2px] border px-3 text-[13px] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-action ${
                actif ? 'border-ink bg-ink text-bg' : 'border-line-strong bg-surface text-ink hover:border-ink'
              }`}
            >
              <input type="radio" name={nom} value={o.id} checked={actif} onChange={() => onChange(o.id)} className="sr-only" />
              {o.libelle}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function ChoixReponse(props: Omit<Parameters<typeof ChoixSegmente<Reponse>>[0], 'options'>) {
  return <ChoixSegmente<Reponse> {...props} options={REPONSES} />;
}

export function CaseACocher({
  libelle,
  description,
  coche,
  onChange,
  marque,
}: {
  libelle: ReactNode;
  description?: ReactNode;
  coche: boolean;
  onChange: (v: boolean) => void;
  /** Mention complémentaire (ex. « suggéré »). */
  marque?: ReactNode;
}) {
  const id = useId();
  return (
    <div
      className={`flex gap-3 rounded-[2px] border px-3 py-2.5 ${coche ? 'border-ink bg-surface' : 'border-line bg-surface'} hover:border-ink`}
    >
      <input id={id} type="checkbox" checked={coche} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[var(--action)]" />
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="flex flex-wrap items-center gap-2 text-[13.5px] font-medium text-ink">
          {libelle}
          {marque}
        </span>
        {description && <span className="mt-0.5 block text-[12.5px] text-muted">{description}</span>}
      </label>
    </div>
  );
}
