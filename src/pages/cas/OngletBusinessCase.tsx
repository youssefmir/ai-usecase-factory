import { useMemo } from 'react';
import { CashflowChart } from '../../charts/CashflowChart';
import { MonteCarloChart } from '../../charts/MonteCarloChart';
import { TornadoChart } from '../../charts/TornadoChart';
import type { ResultatBusinessCase } from '../../domain/businessCase/finance';
import { analyserSensibilite, bornesParametre, parametresActifs, simulerMonteCarlo, valeurParametre } from '../../domain/businessCase/uncertainty';
import { fmtEuro, fmtEuroCompact, fmtMois, fmtNombre, fmtPct } from '../../domain/format';
import { PARAMETRES_INCERTAINS, type BusinessCase, type ChampBusinessCase, type UseCase } from '../../domain/model';
import { Avis, Indicateur } from '../../ui/bits';
import { CaseACocher, ChampNombre, ChampTexte } from '../../ui/Fields';
import { Plate } from '../../ui/Plate';
import type { MajCas } from './types';

type ChampNumerique = Exclude<ChampBusinessCase, 'adoption'>;

export function OngletBusinessCase({ cas, resultat, maj }: { cas: UseCase; resultat: ResultatBusinessCase; maj: MajCas }) {
  const bc = cas.businessCase;
  const sensibilite = useMemo(() => analyserSensibilite(bc), [bc]);
  const monteCarlo = useMemo(() => simulerMonteCarlo(bc), [bc]);

  const champ = (
    cle: ChampNumerique,
    libelle: string,
    unite: string,
    options: { decimales?: number; pourcentage?: boolean; max?: number; aide?: string } = {},
  ) => (
    <ChampNombre
      libelle={libelle}
      unite={unite}
      compact
      decimales={options.decimales ?? 0}
      pourcentage={options.pourcentage}
      max={options.max}
      aide={options.aide}
      valeur={bc[cle]}
      provenance={bc.provenance[cle] ?? 'hypothese'}
      onProvenance={(p) =>
        maj((c) => {
          c.businessCase.provenance[cle] = p;
        })
      }
      onChange={(v) =>
        maj((c) => {
          c.businessCase[cle] = v ?? 0;
        })
      }
    />
  );

  const setTexte = (cle: 'uniteVolume' | 'libelleGainsQualite' | 'libelleAutresCoutsBuild' | 'libelleAutresCoutsRun', v: string) =>
    maj((c) => {
      c.businessCase[cle] = v;
    });

  const hypotheses = Object.values(bc.provenance).filter((p) => p === 'hypothese').length;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 xl:grid-cols-6">
        <Indicateur libelle="Gains annuels" valeur={fmtEuroCompact(resultat.gainsAnnuelsPleineAdoption)} detail="pleine adoption" provenance="calcule" />
        <Indicateur libelle="Investissement" valeur={fmtEuroCompact(resultat.build)} detail="build, année 0" provenance="calcule" />
        <Indicateur libelle="VAN 3 ans" valeur={fmtEuroCompact(resultat.van)} detail={`taux ${fmtPct(bc.tauxActualisation, 1)}`} provenance="calcule" />
        <Indicateur libelle="ROI 3 ans" valeur={resultat.roi === null ? '–' : fmtPct(resultat.roi)} detail="non actualisé" provenance="calcule" />
        <Indicateur libelle="Retour" valeur={resultat.delaiRetourMois === null ? '> 36 mois' : fmtMois(resultat.delaiRetourMois)} detail="délai de retour" provenance="calcule" />
        <Indicateur libelle="TRI" valeur={resultat.tri === null ? '–' : fmtPct(resultat.tri)} detail="taux interne" provenance="calcule" />
      </div>

      {hypotheses > 0 && (
        <Avis ton="alerte" titre={`${hypotheses} valeur(s) d’entrée étiquetée(s) « hypothèse »`}>
          Les résultats sont aussi fiables que les hypothèses : remplacez-les par des estimations métier ou des mesures (sélecteur à droite de chaque champ).
        </Avis>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,25rem)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <Plate etiquette="Volumes et temps" repere="01 / 06">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {champ('volumeAnnuel', 'Volume annuel', bc.uniteVolume || 'unités')}
              <ChampTexte libelle="Unité de volume" valeur={bc.uniteVolume} onChange={(v) => setTexte('uniteVolume', v)} />
              {champ('tempsUnitaireMin', 'Temps unitaire', 'min', { decimales: 1 })}
              {champ('partAutomatisable', 'Part du temps économisée', '%', { pourcentage: true, max: 1 })}
              {champ('coutHoraire', 'Coût horaire chargé', '€/h', { decimales: 2 })}
            </div>
          </Plate>

          <Plate etiquette="Adoption" repere="02 / 06">
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => (
                <ChampNombre
                  key={i}
                  libelle={`Année ${i + 1}`}
                  unite="%"
                  compact
                  pourcentage
                  max={1}
                  valeur={bc.adoption[i as 0 | 1 | 2]}
                  onChange={(v) =>
                    maj((c) => {
                      c.businessCase.adoption[i as 0 | 1 | 2] = v ?? 0;
                    })
                  }
                />
              ))}
            </div>
            <p className="mt-3 text-[12.5px] text-muted">Part des volumes réellement traités avec la solution chaque année (provenance : {bc.provenance.adoption === 'hypothese' ? 'hypothèse' : 'renseignée'}).</p>
          </Plate>

          <Plate etiquette="Gains qualité" repere="03 / 06">
            <div className="grid gap-4">
              {champ('gainsQualite', 'Gains qualité annuels', '€/an', { aide: 'À pleine adoption : erreurs, pertes ou abandons évités, revenus additionnels.' })}
              <ChampTexte libelle="Nature des gains" valeur={bc.libelleGainsQualite} onChange={(v) => setTexte('libelleGainsQualite', v)} />
            </div>
          </Plate>

          <Plate etiquette="Coûts de build" repere="04 / 06">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {champ('joursBuild', 'Charge', 'j')}
              {champ('tjm', 'TJM', '€/j')}
              {champ('autresCoutsBuild', 'Autres coûts ponctuels', '€')}
              <ChampTexte libelle="Nature" valeur={bc.libelleAutresCoutsBuild} onChange={(v) => setTexte('libelleAutresCoutsBuild', v)} />
            </div>
          </Plate>

          <Plate etiquette="Coûts de run" repere="05 / 06">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {champ('infraAnnuelle', 'Infrastructure et licences', '€/an')}
              {champ('maintenancePct', 'Maintenance', '% build', { pourcentage: true, max: 1 })}
              {champ('autresCoutsRun', 'Autres coûts récurrents', '€/an')}
              <ChampTexte libelle="Nature" valeur={bc.libelleAutresCoutsRun} onChange={(v) => setTexte('libelleAutresCoutsRun', v)} />
            </div>
            <div className="mt-5 border-t border-line pt-4">
              <CaseACocher
                libelle="Le cas utilise un modèle de langage facturé à l’usage"
                coche={bc.llmActif}
                onChange={(v) =>
                  maj((c) => {
                    c.businessCase.llmActif = v;
                  })
                }
              />
              {bc.llmActif && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  {champ('requetesParUnite', 'Requêtes par unité', 'req.', { decimales: 1 })}
                  {champ('tokensParRequete', 'Tokens par requête', 'tokens')}
                  {champ('prixMillionTokens', 'Prix par million de tokens', '€', {
                    decimales: 2,
                    aide: 'Hypothèse éditable, pas la grille tarifaire d’un fournisseur.',
                  })}
                  <div className="flex flex-col justify-end text-[12.5px] text-muted">
                    Coût LLM à pleine adoption : <span className="mono text-[15px] text-ink">{fmtEuro(resultat.coutLlmPleineAdoption)} / an</span>
                  </div>
                </div>
              )}
            </div>
          </Plate>

          <Plate etiquette="Actualisation" repere="06 / 06">
            {champ('tauxActualisation', 'Taux d’actualisation', '%', { pourcentage: true, decimales: 3, max: 0.5 })}
          </Plate>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <CashflowChart resultat={resultat} />
          <TornadoChart sensibilite={sensibilite} />
          <MonteCarloChart resultat={monteCarlo} />
          <BornesMonteCarlo bc={bc} maj={maj} />
        </div>
      </div>
    </div>
  );
}

function BornesMonteCarlo({ bc, maj }: { bc: BusinessCase; maj: MajCas }) {
  const actifs = parametresActifs(bc);
  return (
    <Plate etiquette="Paramètres de la simulation" repere="Loi triangulaire : bas / mode / haut">
      <div className="grid gap-4 sm:grid-cols-2">
        <ChampNombre
          libelle="Nombre de tirages"
          compact
          min={100}
          max={50000}
          valeur={bc.monteCarlo.iterations}
          onChange={(v) =>
            maj((c) => {
              c.businessCase.monteCarlo.iterations = Math.round(v ?? 5000);
            })
          }
        />
        <ChampNombre
          libelle="Graine du générateur"
          compact
          max={2 ** 31}
          valeur={bc.monteCarlo.graine}
          aide="Même graine, mêmes résultats."
          onChange={(v) =>
            maj((c) => {
              c.businessCase.monteCarlo.graine = Math.round(v ?? 42);
            })
          }
        />
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="table-tech">
          <thead>
            <tr>
              <th scope="col">Paramètre</th>
              <th scope="col" className="text-right">
                Mode
              </th>
              <th scope="col" className="text-right">
                Bas (%)
              </th>
              <th scope="col" className="text-right">
                Haut (%)
              </th>
            </tr>
          </thead>
          <tbody>
            {actifs.map((id) => {
              const bornes = bornesParametre(bc, id);
              const libelle = PARAMETRES_INCERTAINS.find((p) => p.id === id)?.libelle ?? id;
              const mode = valeurParametre(bc, id);
              const majBornes = (cle: 'basPct' | 'hautPct', v: number) =>
                maj((c) => {
                  c.businessCase.incertitudes[id] = { ...bornesParametre(c.businessCase, id), [cle]: v };
                });
              return (
                <tr key={id}>
                  <td>{libelle}</td>
                  <td className="mono text-right">
                    {id === 'partAutomatisable' || id === 'adoption' ? fmtPct(mode) : id === 'prixMillionTokens' ? fmtNombre(mode, 2) : fmtNombre(mode, id === 'tempsUnitaireMin' ? 1 : 0)}
                  </td>
                  <td className="w-24">
                    <input
                      className="field-input mono min-h-8 text-right"
                      inputMode="numeric"
                      aria-label={`Borne basse en % : ${libelle}`}
                      value={bornes.basPct}
                      onChange={(e) => {
                        const n = Number(e.target.value.replace(',', '.'));
                        if (Number.isFinite(n)) majBornes('basPct', Math.min(0, Math.max(-100, n)));
                      }}
                    />
                  </td>
                  <td className="w-24">
                    <input
                      className="field-input mono min-h-8 text-right"
                      inputMode="numeric"
                      aria-label={`Borne haute en % : ${libelle}`}
                      value={bornes.hautPct}
                      onChange={(e) => {
                        const n = Number(e.target.value.replace(',', '.'));
                        if (Number.isFinite(n)) majBornes('hautPct', Math.max(0, Math.min(300, n)));
                      }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[12.5px] text-muted">
        Les bornes sont relatives à la valeur centrale (mode). Les parts (adoption, part automatisable) restent plafonnées à 100 %.
      </p>
    </Plate>
  );
}
