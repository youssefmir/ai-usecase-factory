import { motion } from 'motion/react';
import { BASES_LEGALES, CATEGORIES_ART_9, CRITERES_AIPD, type BaseLegaleId } from '../../domain/rgpd/catalog';
import { NIVEAUX_RGPD, SEUIL_CRITERES_AIPD, suggererCriteres, type ResultatRgpd } from '../../domain/rgpd/evaluation';
import type { RgpdReponses, UseCase } from '../../domain/model';
import { Avis } from '../../ui/bits';
import { CaseACocher, ChampSelection, ChampTexte, ChoixReponse, ZoneTexte } from '../../ui/Fields';
import { DUREES, transition, useMouvementReduit } from '../../ui/motion';
import { Plate } from '../../ui/Plate';
import type { MajCas } from './types';

/** Jauge des 9 critères WP248 avec le seuil de 2 critères. */
function JaugeCriteres({ nb }: { nb: number }) {
  const reduit = useMouvementReduit();
  return (
    <div>
      <div className="flex gap-1" aria-hidden="true">
        {CRITERES_AIPD.map((c, i) => (
          <motion.span
            key={c.id}
            className={`h-3 flex-1 origin-bottom ${i < nb ? 'bg-ink' : 'bg-[var(--chart-grid)]'} ${i === SEUIL_CRITERES_AIPD - 1 ? 'outline-2 outline-offset-1 outline-sig-yellow' : ''}`}
            initial={reduit ? false : { scaleY: 0.3, opacity: 0.4 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={transition(DUREES.moyen, i * 0.03, reduit)}
          />
        ))}
      </div>
      <p className="mono mt-2 text-[12px] text-muted">
        {nb} / 9 critères · seuil indicatif : {SEUIL_CRITERES_AIPD} critères (repère jaune)
      </p>
    </div>
  );
}

function Resultat({ resultat }: { resultat: ResultatRgpd }) {
  const reduit = useMouvementReduit();
  const fort = resultat.niveau === 'aipd_requise';
  return (
    <section aria-label="Résultat de la pré-analyse RGPD" className="plate overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <h2 className="label-caps">Pré-analyse RGPD</h2>
        <span className="mono text-[11px] text-muted">Calculé</span>
      </div>
      <motion.div
        key={resultat.niveau}
        className="px-4 pt-5 pb-4"
        initial={reduit ? false : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transition(DUREES.moyen, 0, reduit)}
      >
        <p className={`font-display text-[24px] leading-tight font-bold uppercase ${fort ? 'text-ink' : 'text-ink/80'}`}>{NIVEAUX_RGPD[resultat.niveau].libelle}</p>
        {resultat.applicable !== false && (
          <div className="mt-4">
            <JaugeCriteres nb={resultat.nbCriteres} />
          </div>
        )}
        <dl className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
          <div>
            <dt className="label-caps">Art. 9</dt>
            <dd className="mt-1">{resultat.article9 ? 'Données sensibles' : 'Non concerné'}</dd>
          </div>
          <div>
            <dt className="label-caps">Art. 22</dt>
            <dd className="mt-1">
              {{ applicable: 'Applicable', vigilance: 'Vigilance', non: 'Non applicable', inconnu: 'À préciser' }[resultat.article22]}
            </dd>
          </div>
        </dl>
      </motion.div>
      {resultat.manquants.length > 0 && (
        <div className="mx-4 mb-4 rounded-[2px] border border-dashed border-line-strong px-3 py-2.5 text-[13px]">
          <p className="font-semibold">Questions à compléter</p>
          <ul className="mt-1 list-disc pl-5 text-muted">
            {resultat.manquants.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="border-t border-line px-4 py-4">
        <h3 className="label-caps">Justification</h3>
        <ol className="mt-3 flex flex-col gap-2.5">
          {resultat.justification.map((j, i) => (
            <li key={j} className="grid grid-cols-[1.75rem_1fr] text-[13.5px] leading-snug">
              <span className="mono text-[11px] text-muted">{String(i + 1).padStart(2, '0')}</span>
              {j}
            </li>
          ))}
        </ol>
        {resultat.pointsVigilance.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2">
            {resultat.pointsVigilance.map((p) => (
              <li key={p} className="border-l-4 border-sig-yellow bg-sig-yellow-soft px-3 py-2 text-[13px]">
                {p}
              </li>
            ))}
          </ul>
        )}
      </div>
      {resultat.articles.length > 0 && (
        <div className="border-t border-line px-4 py-4">
          <h3 className="label-caps">Articles du RGPD concernés</h3>
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

export function OngletRgpd({ cas, resultat, maj }: { cas: UseCase; resultat: ResultatRgpd; maj: MajCas }) {
  const r = cas.rgpd;
  const set = <K extends keyof RgpdReponses>(cle: K, valeur: RgpdReponses[K]) =>
    maj((c) => {
      c.rgpd[cle] = valeur;
    });
  const suggestions = suggererCriteres(r, { systemeIA: cas.aiAct.inference === 'oui', profilage: cas.aiAct.profilage, annexeIII: cas.aiAct.annexeIII });
  const sansDonnees = r.donneesPersonnelles === 'non';

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
      <div className="flex min-w-0 flex-col gap-5">
        <Plate etiquette="Données traitées" repere="01 / 04">
          <div className="flex flex-col gap-5">
            <ChoixReponse
              legende="Le traitement porte-t-il sur des données personnelles ?"
              aide="Toute information se rapportant à une personne identifiée ou identifiable, directement ou indirectement (art. 4(1))."
              valeur={r.donneesPersonnelles}
              onChange={(v) => set('donneesPersonnelles', v)}
            />
            {!sansDonnees && (
              <>
                <ChampTexte libelle="Catégories de données" valeur={r.categoriesDonnees} onChange={(v) => set('categoriesDonnees', v)} />
                <ChoixReponse
                  legende="Des données sensibles sont-elles traitées ? (art. 9)"
                  aide="Santé, origine, opinions, convictions, appartenance syndicale, génétique, biométrie d’identification, vie ou orientation sexuelle."
                  valeur={r.donneesSensibles}
                  onChange={(v) => set('donneesSensibles', v)}
                />
                {r.donneesSensibles === 'oui' && (
                  <div className="grid gap-2 md:grid-cols-2">
                    {CATEGORIES_ART_9.map((c) => (
                      <CaseACocher
                        key={c.id}
                        libelle={c.libelle}
                        coche={r.categoriesSensibles.includes(c.id)}
                        onChange={(coche) =>
                          maj((x) => {
                            x.rgpd.categoriesSensibles = coche ? [...x.rgpd.categoriesSensibles, c.id] : x.rgpd.categoriesSensibles.filter((y) => y !== c.id);
                          })
                        }
                      />
                    ))}
                  </div>
                )}
                <CaseACocher
                  libelle="Données relatives à des infractions ou à des soupçons de fraude (art. 10)"
                  coche={r.donneesInfractions}
                  onChange={(v) => set('donneesInfractions', v)}
                />
              </>
            )}
          </div>
        </Plate>

        {!sansDonnees && (
          <>
            <Plate etiquette="Décision et base légale" repere="02 / 04">
              <div className="flex flex-col gap-5">
                <ChoixReponse
                  legende="Une décision est-elle prise exclusivement par le système, sans intervention humaine significative ?"
                  valeur={r.decisionAutomatisee}
                  onChange={(v) => set('decisionAutomatisee', v)}
                />
                {r.decisionAutomatisee === 'oui' && (
                  <ChoixReponse
                    legende="Cette décision produit-elle des effets juridiques ou affecte-t-elle la personne de manière significative ?"
                    aide="Refus de crédit, d’aide, d’emploi, de service…"
                    valeur={r.effetJuridique}
                    onChange={(v) => set('effetJuridique', v)}
                  />
                )}
                {r.decisionAutomatisee !== 'oui' && (
                  <CaseACocher
                    libelle="Le score ou la proposition du système pèse de manière déterminante sur la décision humaine"
                    description="Dans ce cas, la qualification de décision automatisée peut être retenue (CJUE, SCHUFA, C-634/21)."
                    coche={r.scoreDeterminant}
                    onChange={(v) => set('scoreDeterminant', v)}
                  />
                )}
                <ChampSelection<BaseLegaleId>
                  libelle="Base légale envisagée (art. 6)"
                  options={BASES_LEGALES}
                  vide="À déterminer"
                  valeur={r.baseLegale}
                  onChange={(v) => set('baseLegale', v)}
                />
              </div>
            </Plate>

            <Plate etiquette="Critères d’analyse d’impact (WP248)" repere="03 / 04">
              <p className="text-[13px] text-muted">
                Lignes directrices du CEPD reprises par la CNIL : au moins deux critères réunis rendent une AIPD probablement obligatoire.
              </p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {CRITERES_AIPD.map((c) => {
                  const suggere = suggestions.includes(c.id);
                  return (
                    <CaseACocher
                      key={c.id}
                      libelle={`${c.numero}. ${c.libelle}`}
                      description={c.description}
                      marque={
                        suggere ? (
                          <span className="rounded-[2px] bg-action-soft px-1.5 py-px font-display text-[10px] font-semibold tracking-[0.1em] text-action uppercase">
                            Suggéré
                          </span>
                        ) : undefined
                      }
                      coche={r.criteres.includes(c.id)}
                      onChange={(coche) =>
                        maj((x) => {
                          x.rgpd.criteres = coche ? [...x.rgpd.criteres, c.id] : x.rgpd.criteres.filter((y) => y !== c.id);
                        })
                      }
                    />
                  );
                })}
              </div>
              <div className="mt-4">
                <CaseACocher
                  libelle="Le traitement figure sur la liste CNIL des traitements soumis à AIPD obligatoire"
                  description="Ex. profilage pouvant exclure d’un contrat, accompagnement social ou médico-social."
                  coche={r.listeCnil}
                  onChange={(v) => set('listeCnil', v)}
                />
              </div>
            </Plate>
          </>
        )}

        <Plate etiquette="Notes" repere="04 / 04">
          <ZoneTexte libelle="Points à valider avec le DPO" lignes={3} valeur={r.notes} onChange={(v) => set('notes', v)} />
        </Plate>
        {sansDonnees && <Avis>Sans données personnelles, les questions sur l’AIPD sont masquées.</Avis>}
      </div>
      <aside className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto">
        <Resultat resultat={resultat} />
      </aside>
    </div>
  );
}
