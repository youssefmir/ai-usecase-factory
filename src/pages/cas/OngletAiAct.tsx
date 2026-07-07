import type { ReactNode } from 'react';
import {
  CAS_ANNEXE_III,
  DEROGATIONS_6_3,
  DOMAINES_ANNEXE_III,
  EXCLUSIONS_ART_2,
  OPTIONS_GPAI,
  PRATIQUES_INTERDITES,
  ROLES,
  trouverCasAnnexeIII,
  type CasAnnexeIIIId,
  type DerogationId,
  type ExclusionId,
  type OptionGpaiId,
  type RoleId,
} from '../../domain/aiAct/catalog';
import type { ResultatAiAct } from '../../domain/aiAct/qualification';
import type { AiActReponses, UseCase } from '../../domain/model';
import { Avis } from '../../ui/bits';
import { CaseACocher, ChampSelection, ChoixReponse, ChoixSegmente, ZoneTexte } from '../../ui/Fields';
import { Plate } from '../../ui/Plate';
import type { MajCas } from './types';
import { VerdictAiAct } from './VerdictAiAct';

function Aide({ children }: { children: ReactNode }) {
  return <span className="block text-[12.5px] text-muted">{children}</span>;
}

export function OngletAiAct({ cas, resultat, maj }: { cas: UseCase; resultat: ResultatAiAct; maj: MajCas }) {
  const r = cas.aiAct;
  const set = <K extends keyof AiActReponses>(cle: K, valeur: AiActReponses[K]) =>
    maj((c) => {
      c.aiAct[cle] = valeur;
    });
  const casAnnexe = trouverCasAnnexeIII(r.annexeIII);
  const horsChamp = r.exclusion !== null && r.exclusion !== 'aucune';

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,27rem)]">
      <div className="flex min-w-0 flex-col gap-5">
        <Avis>
          Questionnaire guidé fondé sur le règlement (UE) 2024/1689 modifié par l’omnibus (UE) 2026/1744. Le verdict se met à jour à chaque réponse.
        </Avis>

        <Plate etiquette="Champ d’application" repere="01 / 06">
          <div className="flex flex-col gap-5">
            <ChoixReponse
              legende="Le système infère-t-il, à partir des données reçues, comment produire ses sorties (prédictions, contenus, recommandations, décisions) ?"
              aide="Définition de l’art. 3(1). Un programme qui applique uniquement des règles écrites par des humains, ou un calcul simple, n’est pas un système d’IA."
              valeur={r.inference}
              onChange={(v) => set('inference', v)}
            />
            <ChoixReponse
              legende="Fonctionne-t-il avec un certain degré d’autonomie ?"
              aide="Il produit ses sorties sans qu’un humain intervienne à chaque étape."
              valeur={r.autonomie}
              onChange={(v) => set('autonomie', v)}
            />
            <ChampSelection<ExclusionId>
              libelle="Une exclusion du champ d’application s’applique-t-elle ? (art. 2)"
              options={EXCLUSIONS_ART_2}
              vide="À préciser"
              valeur={r.exclusion}
              onChange={(v) => set('exclusion', v)}
            />
          </div>
        </Plate>

        {!horsChamp && (
          <>
            <Plate etiquette="Rôle de l’organisation" repere="02 / 06">
              <div className="flex flex-col gap-5">
                <ChoixSegmente<RoleId>
                  legende="Quel est votre rôle vis-à-vis de ce système ?"
                  aide={<Aide>{ROLES.map((x) => `${x.libelle} : ${x.description}`).join(' ')}</Aide>}
                  options={ROLES}
                  valeur={r.role}
                  onChange={(v) => set('role', v)}
                />
                {r.role === 'deployeur' && (
                  <ChoixReponse
                    legende="Modifiez-vous substantiellement le système ou sa destination, ou le commercialisez-vous sous votre nom ?"
                    aide="Dans ce cas, vous devenez fournisseur au sens de l’art. 25(1)."
                    valeur={r.modificationSubstantielle}
                    onChange={(v) => set('modificationSubstantielle', v)}
                  />
                )}
              </div>
            </Plate>

            <Plate etiquette="Pratiques interdites" repere="03 / 06">
              <p className="text-[13px] text-muted">Cochez toute pratique que le système mettrait en œuvre (art. 5, y compris les ajouts de l’omnibus).</p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {PRATIQUES_INTERDITES.map((p) => (
                  <CaseACocher
                    key={p.id}
                    libelle={p.libelle}
                    description={`${p.article} · ${p.description}`}
                    coche={r.pratiquesInterdites.includes(p.id)}
                    onChange={(coche) =>
                      maj((c) => {
                        c.aiAct.pratiquesInterdites = coche
                          ? [...c.aiAct.pratiquesInterdites, p.id]
                          : c.aiAct.pratiquesInterdites.filter((x) => x !== p.id);
                      })
                    }
                  />
                ))}
              </div>
              {r.pratiquesInterdites.length === 0 && (
                <div className="mt-3">
                  <CaseACocher
                    libelle="J’ai vérifié : aucune pratique interdite"
                    description="Confirmation nécessaire pour conclure la qualification."
                    coche={r.pratiquesVerifiees}
                    onChange={(v) => set('pratiquesVerifiees', v)}
                  />
                </div>
              )}
            </Plate>

            <Plate etiquette="Haut risque" repere="04 / 06">
              <div className="flex flex-col gap-5">
                <ChoixReponse
                  legende="Le système est-il un composant de sécurité d’un produit réglementé (annexe I), ou ce produit lui-même, soumis à une évaluation par un tiers ?"
                  aide="Machines, dispositifs médicaux, jouets, ascenseurs, véhicules… (art. 6(1))."
                  valeur={r.annexeI}
                  onChange={(v) => set('annexeI', v)}
                />
                <div>
                  <label htmlFor="annexe-iii" className="block text-[13px] font-semibold text-ink">
                    Le cas d’usage relève-t-il d’un domaine de l’annexe III ? (art. 6(2))
                  </label>
                  <select
                    id="annexe-iii"
                    className="field-input mt-1.5"
                    value={r.annexeIII ?? ''}
                    onChange={(e) => set('annexeIII', e.target.value === '' ? null : (e.target.value as CasAnnexeIIIId | 'aucun'))}
                  >
                    <option value="">À préciser</option>
                    <option value="aucun">Aucun domaine de l’annexe III</option>
                    {DOMAINES_ANNEXE_III.map((d) => (
                      <optgroup key={d.numero} label={`${d.numero}. ${d.libelle}`}>
                        {CAS_ANNEXE_III.filter((c) => c.domaine === d.numero).map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.point} {c.libelle}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                {casAnnexe?.hautRisque && (
                  <>
                    <ChoixReponse
                      legende="Le système effectue-t-il un profilage de personnes physiques ?"
                      aide="Évaluer des aspects personnels (situation économique, comportement, fiabilité, performance…) à partir de données. En cas de profilage, le système est toujours à haut risque."
                      valeur={r.profilage}
                      onChange={(v) => set('profilage', v)}
                    />
                    <ChampSelection<DerogationId | 'aucune'>
                      libelle="Une condition de dérogation de l’art. 6(3) est-elle remplie ?"
                      aide={
                        r.profilage === 'oui'
                          ? 'Dérogation impossible en cas de profilage : la réponse est conservée pour la traçabilité de l’analyse.'
                          : 'Une seule condition suffit, à documenter avant la mise sur le marché (art. 6(4)).'
                      }
                      options={[...DEROGATIONS_6_3.map((d) => ({ id: d.id, libelle: `${d.article} · ${d.libelle}` })), { id: 'aucune', libelle: 'Aucune condition remplie' }]}
                      vide="À préciser"
                      valeur={r.derogation}
                      onChange={(v) => set('derogation', v)}
                    />
                  </>
                )}
              </div>
            </Plate>

            <Plate etiquette="Transparence" repere="05 / 06">
              <p className="text-[13px] text-muted">Obligations de l’art. 50, applicables depuis le 2 août 2026.</p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {(
                  [
                    ['interactionDirecte', 'Interagit directement avec des personnes', 'Chatbot, agent vocal, assistant (art. 50(1)).'],
                    ['contenuSynthetique', 'Génère du texte, des images, de l’audio ou de la vidéo', 'Marquage des contenus de synthèse (art. 50(2)).'],
                    ['emotionOuBiometrie', 'Reconnaît des émotions ou catégorise par la biométrie', 'Information des personnes exposées (art. 50(3)).'],
                    ['hypertrucage', 'Produit des hypertrucages (« deepfakes »)', 'Divulgation du caractère artificiel (art. 50(4)).'],
                    ['texteInteretPublic', 'Publie des textes sur des questions d’intérêt public', 'Divulgation, sauf contrôle éditorial humain (art. 50(4)).'],
                  ] as const
                ).map(([cle, libelle, description]) => (
                  <CaseACocher
                    key={cle}
                    libelle={libelle}
                    description={description}
                    coche={r.transparence[cle]}
                    onChange={(v) =>
                      maj((c) => {
                        c.aiAct.transparence[cle] = v;
                      })
                    }
                  />
                ))}
              </div>
            </Plate>

            <Plate etiquette="Modèles à usage général et contexte" repere="06 / 06">
              <div className="flex flex-col gap-5">
                <ChampSelection<OptionGpaiId>
                  libelle="Le système repose-t-il sur un modèle d’IA à usage général (ex. grand modèle de langage) ?"
                  options={OPTIONS_GPAI}
                  vide="À préciser"
                  valeur={r.gpai}
                  onChange={(v) => set('gpai', v)}
                />
                <ChoixReponse
                  legende="L’organisation est-elle un organisme de droit public, ou une entité privée fournissant un service public ?"
                  aide="Détermine notamment l’obligation d’analyse d’impact sur les droits fondamentaux (FRIA, art. 27)."
                  valeur={r.organismePublic}
                  onChange={(v) => set('organismePublic', v)}
                />
              </div>
            </Plate>
          </>
        )}

        <Plate etiquette="Notes de qualification">
          <ZoneTexte
            libelle="Hypothèses, points à confirmer, références internes"
            lignes={3}
            valeur={r.notes}
            onChange={(v) => set('notes', v)}
          />
        </Plate>
      </div>

      <aside className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto">
        <VerdictAiAct resultat={resultat} reponses={r} />
      </aside>
    </div>
  );
}
