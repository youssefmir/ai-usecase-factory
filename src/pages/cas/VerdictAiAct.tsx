import { motion } from 'motion/react';
import { trouverCasAnnexeIII } from '../../domain/aiAct/catalog';
import { LIBELLES_ACTEURS, NIVEAUX_AI_ACT, type Acteur, type ResultatAiAct } from '../../domain/aiAct/qualification';
import { fmtDateLongue, fmtNombre } from '../../domain/format';
import type { AiActReponses } from '../../domain/model';
import { DUREES, EASE_OUT, transition, useMouvementReduit } from '../../ui/motion';
import { FormeSignal } from '../../ui/signalShapes';

const ORDRE_ACTEURS: Acteur[] = ['tous', 'fournisseur', 'deployeur', 'fournisseur_modele'];

function detailVerdict(r: ResultatAiAct, reponses: AiActReponses): string[] {
  const d: string[] = [];
  const cas = trouverCasAnnexeIII(reponses.annexeIII);
  if (r.voieHautRisque === 'annexe_I') d.push('Annexe I');
  if (r.voieHautRisque === 'annexe_III' && cas) d.push(`Annexe III · ${cas.point}`);
  if (r.derogationAppliquee) d.push(`Dérogation art. 6(3)(${r.derogationAppliquee})`);
  if (cas && !cas.hautRisque) d.push(`Exception ${cas.point}`);
  if (r.fria) d.push('FRIA requise');
  if (r.transparence) d.push('Transparence art. 50');
  return d;
}

/**
 * Verdict de qualification : le panneau « se pose » comme un panneau de signalisation,
 * puis la justification se déroule ligne à ligne.
 */
export function VerdictAiAct({
  resultat,
  reponses,
  compact = false,
  declencher = true,
}: {
  resultat: ResultatAiAct;
  reponses: AiActReponses;
  compact?: boolean;
  /** Permet de différer l'animation (ex. apparition au défilement). */
  declencher?: boolean;
}) {
  const reduit = useMouvementReduit();
  const niveau = resultat.niveau;
  const forme = niveau === 'incomplet' ? resultat.niveauProvisoire : niveau;
  const details = detailVerdict(resultat, reponses);
  const echeance = resultat.echeanceCle;
  const visible = declencher || reduit;
  const groupes = ORDRE_ACTEURS.map((a) => ({ acteur: a, obligations: resultat.obligations.filter((o) => o.acteur === a) })).filter(
    (g) => g.obligations.length > 0,
  );

  return (
    <section aria-label="Verdict de la qualification AI Act" className="plate overflow-hidden">
      {niveau === 'haut_risque' && <div className="hazard h-2" aria-hidden="true" />}
      {niveau === 'interdit' && <div className="h-2 bg-sig-red" aria-hidden="true" />}
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <h2 className="label-caps">Verdict · qualification AI Act</h2>
        <span className="mono text-[11px] text-muted">Calculé</span>
      </div>

      <motion.div
        key={`${niveau}-${forme}`}
        className="flex items-start gap-4 px-4 pt-5 pb-4"
        initial={reduit ? false : { opacity: 0, y: -18, scale: 1.04 }}
        animate={visible ? { opacity: 1, y: 0, scale: 1 } : undefined}
        transition={reduit ? { duration: 0 } : { duration: 0.42, ease: EASE_OUT }}
        style={{ transformOrigin: '30% 0%' }}
      >
        <motion.svg
          viewBox="-10 -10 20 20"
          width={compact ? 52 : 60}
          height={compact ? 52 : 60}
          aria-hidden="true"
          className="shrink-0"
          initial={reduit ? false : { rotate: -8 }}
          animate={visible ? { rotate: 0 } : undefined}
          transition={transition(DUREES.lent, 0.08, reduit)}
        >
          <FormeSignal niveau={niveau} />
        </motion.svg>
        <div className="min-w-0">
          <p className="font-display text-[26px] leading-none font-bold tracking-[0.02em] text-ink uppercase md:text-[30px]">{NIVEAUX_AI_ACT[niveau].libelle}</p>
          {niveau === 'incomplet' && (
            <p className="mt-1 text-[13px] text-muted">Niveau provisoire : {NIVEAUX_AI_ACT[resultat.niveauProvisoire].libelle.toLowerCase()}</p>
          )}
          {details.length > 0 && (
            <p className="mono mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-ink">
              {details.map((d) => (
                <span key={d} className="rounded-[2px] border border-line-strong px-1.5 py-px">
                  {d}
                </span>
              ))}
            </p>
          )}
          {echeance && (
            <p className="mt-3 text-[13px] text-muted">
              Échéance clé : <span className="font-semibold text-ink">{fmtDateLongue(echeance.date)}</span>{' '}
              <span className="mono text-[12px]">
                {echeance.statut === 'en_vigueur' ? '· en vigueur' : `· J−${fmtNombre(echeance.joursRestants)}`}
              </span>
            </p>
          )}
        </div>
      </motion.div>

      {resultat.manquants.length > 0 && (
        <div className="mx-4 mb-4 rounded-[2px] border border-dashed border-line-strong px-3 py-2.5 text-[13px]">
          <p className="font-semibold">Questions à compléter ({resultat.manquants.length})</p>
          <ul className="mt-1 list-disc pl-5 text-muted">
            {resultat.manquants.slice(0, compact ? 2 : 8).map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="border-t border-line px-4 py-4">
        <h3 className="label-caps">Justification</h3>
        <ol className="mt-3 flex flex-col gap-2.5">
          {resultat.justification.slice(0, compact ? 4 : undefined).map((j, i) => (
            <motion.li
              key={j}
              className="grid grid-cols-[1.75rem_1fr] text-[13.5px] leading-snug text-ink/90"
              initial={reduit ? false : { opacity: 0, y: 6 }}
              animate={visible ? { opacity: 1, y: 0 } : undefined}
              transition={transition(DUREES.moyen, 0.25 + i * 0.06, reduit)}
            >
              <span className="mono text-[11px] text-muted">{String(i + 1).padStart(2, '0')}</span>
              {j}
            </motion.li>
          ))}
        </ol>
        {resultat.avertissements.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2">
            {resultat.avertissements.map((a) => (
              <li key={a} className="border-l-4 border-sig-yellow bg-sig-yellow-soft px-3 py-2 text-[13px]">
                {a}
              </li>
            ))}
          </ul>
        )}
      </div>

      {!compact && groupes.length > 0 && (
        <div className="border-t border-line px-4 py-4">
          <h3 className="label-caps">Obligations</h3>
          <div className="mt-3 flex flex-col gap-4">
            {groupes.map((g) => (
              <div key={g.acteur}>
                <p className="text-[12.5px] font-semibold text-muted">{LIBELLES_ACTEURS[g.acteur]}</p>
                <ul className="mt-1.5 flex flex-col gap-2">
                  {g.obligations.map((o) => (
                    <li key={o.id} className="grid grid-cols-[auto_1fr] gap-2.5 text-[13px]">
                      <span
                        aria-hidden="true"
                        className={`mt-1.5 size-2.5 rounded-full ${o.vousConcerne ? 'bg-sig-blue' : 'border border-line-strong'}`}
                      />
                      <span>
                        {o.texte}
                        <span className="mono mt-0.5 block text-[11px] text-muted">
                          {o.vousConcerne === true ? 'Vous concerne' : o.vousConcerne === false ? 'Autre acteur' : 'Rôle à préciser'} · dès le{' '}
                          {fmtDateLongue(o.echeance)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {!compact && resultat.calendrier.length > 0 && (
        <div className="border-t border-line px-4 py-4">
          <h3 className="label-caps">Calendrier applicable</h3>
          <ol className="relative mt-3 ml-1.5 border-l border-line-strong">
            {resultat.calendrier.map((j) => (
              <li key={j.id} className="relative pb-3 pl-4 last:pb-0">
                <span
                  aria-hidden="true"
                  className={`absolute top-1.5 -left-[5px] size-2.5 ${j.statut === 'en_vigueur' ? 'bg-ink' : 'border border-ink bg-surface'}`}
                />
                <p className="mono text-[12px] font-semibold text-ink">
                  {fmtDateLongue(j.date)}{' '}
                  <span className="font-normal text-muted">{j.statut === 'en_vigueur' ? '· en vigueur' : `· dans ${fmtNombre(j.joursRestants)} jours`}</span>
                </p>
                <p className="text-[13px]">{j.titre}</p>
                {j.prudence && <p className="text-[12px] text-muted">{j.prudence}</p>}
              </li>
            ))}
          </ol>
        </div>
      )}

      {!compact && (
        <div className="border-t border-line px-4 py-4">
          <h3 className="label-caps">Articles concernés</h3>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {resultat.articles.map((a) => (
              <li key={a.ref} className="mono rounded-[2px] border border-line-strong px-1.5 py-0.5 text-[11.5px]" title={a.titre}>
                {a.ref.replace(/^art\./, 'Art.')}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="border-t border-line bg-surface-2 px-4 py-2.5 text-[12px] text-muted">{resultat.mention}</p>
    </section>
  );
}
