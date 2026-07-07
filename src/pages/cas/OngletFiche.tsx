import { useId } from 'react';
import { nouvelId } from '../../domain/factory';
import {
  CATEGORIES_RISQUE,
  DISPONIBILITES,
  IMPLICATIONS,
  MODES_INTEGRATION,
  NIVEAUX_AUTONOMIE,
  QUALITES,
  TYPOLOGIES,
  type CategorieRisqueId,
  type ImplicationId,
  type ProvenanceId,
  type UseCase,
} from '../../domain/model';
import { Avis } from '../../ui/bits';
import { CaseACocher, ChampNombre, ChampSelection, ChampTexte, ZoneTexte } from '../../ui/Fields';
import { Plate } from '../../ui/Plate';
import { ListeEditable, ListeTextes } from './ListeEditable';
import type { MajCas } from './types';

const SECTIONS = [
  { id: 'identification', titre: 'Identification' },
  { id: 'probleme', titre: 'Problème et processus' },
  { id: 'personas', titre: 'Utilisateurs et personas' },
  { id: 'situation', titre: 'Situation actuelle' },
  { id: 'solution', titre: 'Solution IA envisagée' },
  { id: 'donnees', titre: 'Données nécessaires' },
  { id: 'integration', titre: 'Intégration SI' },
  { id: 'kpi', titre: 'Indicateurs (KPI)' },
  { id: 'parties', titre: 'Parties prenantes' },
  { id: 'dependances', titre: 'Dépendances' },
  { id: 'risques', titre: 'Risques' },
] as const;

const NIVEAUX_1_3 = [
  { id: '1', libelle: '1 · faible' },
  { id: '2', libelle: '2 · moyen' },
  { id: '3', libelle: '3 · fort' },
] as const;

export function OngletFiche({ cas, maj, autresCas, demo }: { cas: UseCase; maj: MajCas; autresCas: readonly UseCase[]; demo: boolean }) {
  const prefixe = useId();
  const ancre = (id: string) => `${prefixe}-${id}`;
  const provenance = (champ: 'volumeAnnuel' | 'tempsUnitaireMin'): ProvenanceId => cas.businessCase.provenance[champ] ?? 'hypothese';

  return (
    <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
      <nav aria-label="Sections de la fiche" className="no-print hidden lg:block">
        <ol className="sticky top-20 flex flex-col border-l border-line">
          {SECTIONS.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => document.getElementById(ancre(s.id))?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="-ml-px flex w-full items-baseline gap-2 border-l-2 border-transparent py-1.5 pl-3 text-left text-[13px] text-muted hover:border-ink hover:text-ink"
              >
                <span className="mono text-[11px]">{String(i + 1).padStart(2, '0')}</span>
                {s.titre}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="flex min-w-0 flex-col gap-5">
        {demo && (
          <Avis titre="Fiche de démonstration">
            Organisation fictive : volumes, temps, KPI et montants sont des hypothèses plausibles, à remplacer par des données mesurées.
          </Avis>
        )}

        <Plate id={ancre('identification')} etiquette="Identification" repere="01 / 11" className="scroll-mt-24">
          <div className="grid gap-4 md:grid-cols-[10rem_1fr]">
            <ChampTexte
              libelle="Code"
              valeur={cas.code}
              onChange={(v) =>
                maj((c) => {
                  c.code = v;
                })
              }
            />
            <ChampTexte
              libelle="Intitulé du cas d’usage"
              requis
              valeur={cas.titre}
              onChange={(v) =>
                maj((c) => {
                  c.titre = v;
                })
              }
            />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <ZoneTexte
              libelle="Résumé en une phrase"
              lignes={2}
              valeur={cas.resume}
              onChange={(v) =>
                maj((c) => {
                  c.resume = v;
                })
              }
            />
            <ChampTexte
              libelle="Porteur métier"
              valeur={cas.porteur}
              onChange={(v) =>
                maj((c) => {
                  c.porteur = v;
                })
              }
            />
          </div>
        </Plate>

        <Plate id={ancre('probleme')} etiquette="Problème et processus" repere="02 / 11" className="scroll-mt-24">
          <div className="grid gap-4">
            <ZoneTexte
              libelle="Problème métier"
              aide="Décrire le problème en langage métier, avec son effet mesurable (délai, coût, qualité, risque)."
              lignes={4}
              valeur={cas.probleme}
              onChange={(v) =>
                maj((c) => {
                  c.probleme = v;
                })
              }
            />
            <ChampTexte
              libelle="Processus concerné"
              valeur={cas.processus}
              onChange={(v) =>
                maj((c) => {
                  c.processus = v;
                })
              }
            />
            <ZoneTexte
              libelle="Objectifs"
              lignes={2}
              valeur={cas.objectifs}
              onChange={(v) =>
                maj((c) => {
                  c.objectifs = v;
                })
              }
            />
          </div>
        </Plate>

        <Plate id={ancre('personas')} etiquette="Utilisateurs et personas" repere="03 / 11" className="scroll-mt-24">
          <ListeEditable
            elements={cas.personas}
            libelleAjout="Ajouter un persona"
            libelleElement={(p) => p.nom || 'persona'}
            vide="Aucun persona : qui utilisera la solution, qui en subira les effets ?"
            onAjouter={() =>
              maj((c) => {
                c.personas.push({ id: nouvelId('persona'), nom: '', role: '', besoin: '' });
              })
            }
            onSupprimer={(id) =>
              maj((c) => {
                c.personas = c.personas.filter((p) => p.id !== id);
              })
            }
            rendu={(p, i) => (
              <div className="grid gap-3 md:grid-cols-2">
                <ChampTexte
                  libelle="Nom et fonction"
                  valeur={p.nom}
                  onChange={(v) =>
                    maj((c) => {
                      const x = c.personas[i];
                      if (x) x.nom = v;
                    })
                  }
                />
                <ChampTexte
                  libelle="Rôle dans le processus"
                  valeur={p.role}
                  onChange={(v) =>
                    maj((c) => {
                      const x = c.personas[i];
                      if (x) x.role = v;
                    })
                  }
                />
                <ChampTexte
                  className="md:col-span-2"
                  libelle="Besoin principal"
                  valeur={p.besoin}
                  onChange={(v) =>
                    maj((c) => {
                      const x = c.personas[i];
                      if (x) x.besoin = v;
                    })
                  }
                />
              </div>
            )}
          />
        </Plate>

        <Plate id={ancre('situation')} etiquette="Situation actuelle" repere="04 / 11" className="scroll-mt-24">
          <div className="grid gap-4">
            <ZoneTexte
              libelle="Fonctionnement actuel"
              lignes={2}
              valeur={cas.situationActuelle.description}
              onChange={(v) =>
                maj((c) => {
                  c.situationActuelle.description = v;
                })
              }
            />
            <div className="grid gap-4 md:grid-cols-3">
              <ChampNombre
                libelle="Volume annuel"
                unite={cas.businessCase.uniteVolume}
                valeur={cas.businessCase.volumeAnnuel}
                provenance={provenance('volumeAnnuel')}
                onProvenance={(p) =>
                  maj((c) => {
                    c.businessCase.provenance.volumeAnnuel = p;
                  })
                }
                onChange={(v) =>
                  maj((c) => {
                    c.businessCase.volumeAnnuel = v ?? 0;
                  })
                }
              />
              <ChampTexte
                libelle="Unité de volume"
                valeur={cas.businessCase.uniteVolume}
                onChange={(v) =>
                  maj((c) => {
                    c.businessCase.uniteVolume = v;
                  })
                }
              />
              <ChampNombre
                libelle="Temps unitaire"
                unite="min"
                decimales={1}
                valeur={cas.businessCase.tempsUnitaireMin}
                provenance={provenance('tempsUnitaireMin')}
                onProvenance={(p) =>
                  maj((c) => {
                    c.businessCase.provenance.tempsUnitaireMin = p;
                  })
                }
                onChange={(v) =>
                  maj((c) => {
                    c.businessCase.tempsUnitaireMin = v ?? 0;
                  })
                }
              />
            </div>
            <p className="text-[12.5px] text-muted">Le volume et le temps unitaire alimentent directement le business case.</p>
            <ListeTextes
              libelle="Irritants"
              libelleAjout="Ajouter un irritant"
              valeurs={cas.situationActuelle.irritants}
              onChange={(v) =>
                maj((c) => {
                  c.situationActuelle.irritants = v;
                })
              }
            />
          </div>
        </Plate>

        <Plate id={ancre('solution')} etiquette="Solution IA envisagée" repere="05 / 11" className="scroll-mt-24">
          <div className="grid gap-4 md:grid-cols-2">
            <ChampSelection
              libelle="Typologie"
              options={TYPOLOGIES}
              vide="À préciser"
              valeur={cas.solution.typologie}
              onChange={(v) =>
                maj((c) => {
                  c.solution.typologie = v;
                })
              }
            />
            <ChampSelection
              libelle="Niveau d’autonomie"
              options={NIVEAUX_AUTONOMIE}
              vide="À préciser"
              valeur={cas.solution.niveauAutonomie}
              onChange={(v) =>
                maj((c) => {
                  c.solution.niveauAutonomie = v;
                })
              }
            />
            <ZoneTexte
              className="md:col-span-2"
              libelle="Description de la solution"
              lignes={3}
              valeur={cas.solution.description}
              onChange={(v) =>
                maj((c) => {
                  c.solution.description = v;
                })
              }
            />
            <ZoneTexte
              libelle="Supervision humaine"
              lignes={2}
              valeur={cas.solution.supervisionHumaine}
              onChange={(v) =>
                maj((c) => {
                  c.solution.supervisionHumaine = v;
                })
              }
            />
            <ZoneTexte
              libelle="Alternatives étudiées"
              lignes={2}
              valeur={cas.solution.alternatives}
              onChange={(v) =>
                maj((c) => {
                  c.solution.alternatives = v;
                })
              }
            />
          </div>
        </Plate>

        <Plate id={ancre('donnees')} etiquette="Données nécessaires" repere="06 / 11" className="scroll-mt-24">
          <ListeEditable
            elements={cas.donnees.sources}
            libelleAjout="Ajouter une source"
            libelleElement={(s) => s.nom || 'source'}
            vide="Aucune source de données décrite."
            onAjouter={() =>
              maj((c) => {
                c.donnees.sources.push({
                  id: nouvelId('source'),
                  nom: '',
                  description: '',
                  disponibilite: 'partielle',
                  qualite: 'inconnue',
                  personnelles: false,
                  proprietaire: '',
                });
              })
            }
            onSupprimer={(id) =>
              maj((c) => {
                c.donnees.sources = c.donnees.sources.filter((s) => s.id !== id);
              })
            }
            rendu={(s, i) => (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <ChampTexte
                  className="md:col-span-2"
                  libelle="Source"
                  valeur={s.nom}
                  onChange={(v) =>
                    maj((c) => {
                      const x = c.donnees.sources[i];
                      if (x) x.nom = v;
                    })
                  }
                />
                <ChampSelection
                  libelle="Disponibilité"
                  options={DISPONIBILITES}
                  valeur={s.disponibilite}
                  onChange={(v) =>
                    maj((c) => {
                      const x = c.donnees.sources[i];
                      if (x && v) x.disponibilite = v;
                    })
                  }
                />
                <ChampSelection
                  libelle="Qualité"
                  options={QUALITES}
                  valeur={s.qualite}
                  onChange={(v) =>
                    maj((c) => {
                      const x = c.donnees.sources[i];
                      if (x && v) x.qualite = v;
                    })
                  }
                />
                <ChampTexte
                  className="md:col-span-2"
                  libelle="Description"
                  valeur={s.description}
                  onChange={(v) =>
                    maj((c) => {
                      const x = c.donnees.sources[i];
                      if (x) x.description = v;
                    })
                  }
                />
                <ChampTexte
                  libelle="Propriétaire"
                  valeur={s.proprietaire}
                  onChange={(v) =>
                    maj((c) => {
                      const x = c.donnees.sources[i];
                      if (x) x.proprietaire = v;
                    })
                  }
                />
                <div className="flex items-end">
                  <CaseACocher
                    libelle="Données personnelles"
                    coche={s.personnelles}
                    onChange={(v) =>
                      maj((c) => {
                        const x = c.donnees.sources[i];
                        if (x) x.personnelles = v;
                      })
                    }
                  />
                </div>
              </div>
            )}
          />
          <ZoneTexte
            className="mt-4"
            libelle="Commentaire sur les données"
            lignes={2}
            valeur={cas.donnees.commentaire}
            onChange={(v) =>
              maj((c) => {
                c.donnees.commentaire = v;
              })
            }
          />
        </Plate>

        <Plate id={ancre('integration')} etiquette="Intégration SI" repere="07 / 11" className="scroll-mt-24">
          <div className="grid gap-4 md:grid-cols-2">
            <ListeTextes
              libelle="Systèmes concernés"
              libelleAjout="Ajouter un système"
              valeurs={cas.integration.systemes}
              onChange={(v) =>
                maj((c) => {
                  c.integration.systemes = v;
                })
              }
            />
            <div className="flex flex-col gap-4">
              <ChampSelection
                libelle="Mode d’intégration"
                options={MODES_INTEGRATION}
                vide="À préciser"
                valeur={cas.integration.mode}
                onChange={(v) =>
                  maj((c) => {
                    c.integration.mode = v;
                  })
                }
              />
              <ZoneTexte
                libelle="Principe d’intégration"
                lignes={2}
                valeur={cas.integration.description}
                onChange={(v) =>
                  maj((c) => {
                    c.integration.description = v;
                  })
                }
              />
              <ZoneTexte
                libelle="Contraintes (sécurité, hébergement, performance)"
                lignes={2}
                valeur={cas.integration.contraintes}
                onChange={(v) =>
                  maj((c) => {
                    c.integration.contraintes = v;
                  })
                }
              />
            </div>
          </div>
        </Plate>

        <Plate id={ancre('kpi')} etiquette="Indicateurs (KPI)" repere="08 / 11" className="scroll-mt-24">
          <ListeEditable
            elements={cas.kpis}
            libelleAjout="Ajouter un indicateur"
            libelleElement={(k) => k.nom || 'indicateur'}
            vide="Aucun indicateur : comment mesurera-t-on le succès ?"
            onAjouter={() =>
              maj((c) => {
                c.kpis.push({ id: nouvelId('kpi'), nom: '', unite: '', baseline: null, cible: null, source: '' });
              })
            }
            onSupprimer={(id) =>
              maj((c) => {
                c.kpis = c.kpis.filter((k) => k.id !== id);
              })
            }
            rendu={(k, i) => (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr]">
                <ChampTexte
                  libelle="Indicateur"
                  valeur={k.nom}
                  onChange={(v) =>
                    maj((c) => {
                      const x = c.kpis[i];
                      if (x) x.nom = v;
                    })
                  }
                />
                <ChampTexte
                  libelle="Unité"
                  valeur={k.unite}
                  onChange={(v) =>
                    maj((c) => {
                      const x = c.kpis[i];
                      if (x) x.unite = v;
                    })
                  }
                />
                <ChampNombre
                  libelle="Référence"
                  decimales={1}
                  min={-1e12}
                  valeur={k.baseline}
                  onChange={(v) =>
                    maj((c) => {
                      const x = c.kpis[i];
                      if (x) x.baseline = v;
                    })
                  }
                />
                <ChampNombre
                  libelle="Cible"
                  decimales={1}
                  min={-1e12}
                  valeur={k.cible}
                  onChange={(v) =>
                    maj((c) => {
                      const x = c.kpis[i];
                      if (x) x.cible = v;
                    })
                  }
                />
                <ChampTexte
                  className="md:col-span-2 xl:col-span-4"
                  libelle="Source de la mesure"
                  valeur={k.source}
                  onChange={(v) =>
                    maj((c) => {
                      const x = c.kpis[i];
                      if (x) x.source = v;
                    })
                  }
                />
              </div>
            )}
          />
        </Plate>

        <Plate id={ancre('parties')} etiquette="Parties prenantes" repere="09 / 11" className="scroll-mt-24">
          <ListeEditable
            elements={cas.partiesPrenantes}
            libelleAjout="Ajouter une partie prenante"
            libelleElement={(p) => p.nom || 'partie prenante'}
            onAjouter={() =>
              maj((c) => {
                c.partiesPrenantes.push({ id: nouvelId('pp'), nom: '', implication: 'contributeur', attentes: '' });
              })
            }
            onSupprimer={(id) =>
              maj((c) => {
                c.partiesPrenantes = c.partiesPrenantes.filter((p) => p.id !== id);
              })
            }
            rendu={(p, i) => (
              <div className="grid gap-3 md:grid-cols-[2fr_1fr_2fr]">
                <ChampTexte
                  libelle="Personne ou entité"
                  valeur={p.nom}
                  onChange={(v) =>
                    maj((c) => {
                      const x = c.partiesPrenantes[i];
                      if (x) x.nom = v;
                    })
                  }
                />
                <ChampSelection
                  libelle="Implication"
                  options={IMPLICATIONS}
                  valeur={p.implication}
                  onChange={(v) =>
                    maj((c) => {
                      const x = c.partiesPrenantes[i];
                      if (x && v) x.implication = v as ImplicationId;
                    })
                  }
                />
                <ChampTexte
                  libelle="Attentes"
                  valeur={p.attentes}
                  onChange={(v) =>
                    maj((c) => {
                      const x = c.partiesPrenantes[i];
                      if (x) x.attentes = v;
                    })
                  }
                />
              </div>
            )}
          />
        </Plate>

        <Plate id={ancre('dependances')} etiquette="Dépendances" repere="10 / 11" className="scroll-mt-24">
          <div className="grid gap-5 md:grid-cols-2">
            <fieldset>
              <legend className="block text-[13px] font-semibold text-ink">Prérequis dans le portefeuille</legend>
              <p className="mt-1 text-[12.5px] text-muted">Le cas sera planifié après ces cas dans la roadmap.</p>
              <div className="mt-2 flex flex-col gap-2">
                {autresCas.length === 0 && <p className="text-[13px] text-muted">Aucun autre cas dans ce portefeuille.</p>}
                {autresCas.map((autre) => (
                  <CaseACocher
                    key={autre.id}
                    libelle={
                      <>
                        <span className="mono text-[12px] text-muted">{autre.code}</span> {autre.titre}
                      </>
                    }
                    coche={cas.dependances.cas.includes(autre.id)}
                    onChange={(coche) =>
                      maj((c) => {
                        c.dependances.cas = coche ? [...c.dependances.cas, autre.id] : c.dependances.cas.filter((d) => d !== autre.id);
                      })
                    }
                  />
                ))}
              </div>
            </fieldset>
            <ListeTextes
              libelle="Dépendances externes"
              libelleAjout="Ajouter une dépendance"
              valeurs={cas.dependances.externes}
              onChange={(v) =>
                maj((c) => {
                  c.dependances.externes = v;
                })
              }
            />
          </div>
        </Plate>

        <Plate id={ancre('risques')} etiquette="Risques" repere="11 / 11" className="scroll-mt-24">
          <ListeEditable
            elements={cas.risques}
            libelleAjout="Ajouter un risque"
            libelleElement={(r) => r.description || 'risque'}
            vide="Aucun risque identifié."
            onAjouter={() =>
              maj((c) => {
                c.risques.push({ id: nouvelId('risque'), description: '', categorie: 'operationnel', probabilite: 2, impact: 2, mitigation: '' });
              })
            }
            onSupprimer={(id) =>
              maj((c) => {
                c.risques = c.risques.filter((r) => r.id !== id);
              })
            }
            rendu={(r, i) => (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr]">
                <ChampTexte
                  libelle="Risque"
                  valeur={r.description}
                  onChange={(v) =>
                    maj((c) => {
                      const x = c.risques[i];
                      if (x) x.description = v;
                    })
                  }
                />
                <ChampSelection
                  libelle="Catégorie"
                  options={CATEGORIES_RISQUE}
                  valeur={r.categorie}
                  onChange={(v) =>
                    maj((c) => {
                      const x = c.risques[i];
                      if (x && v) x.categorie = v as CategorieRisqueId;
                    })
                  }
                />
                <ChampSelection
                  libelle="Probabilité"
                  options={NIVEAUX_1_3}
                  valeur={String(r.probabilite) as '1' | '2' | '3'}
                  onChange={(v) =>
                    maj((c) => {
                      const x = c.risques[i];
                      if (x && v) x.probabilite = Number(v);
                    })
                  }
                />
                <ChampSelection
                  libelle="Impact"
                  options={NIVEAUX_1_3}
                  valeur={String(r.impact) as '1' | '2' | '3'}
                  onChange={(v) =>
                    maj((c) => {
                      const x = c.risques[i];
                      if (x && v) x.impact = Number(v);
                    })
                  }
                />
                <ChampTexte
                  className="md:col-span-2 xl:col-span-3"
                  libelle="Mesure de maîtrise"
                  valeur={r.mitigation}
                  onChange={(v) =>
                    maj((c) => {
                      const x = c.risques[i];
                      if (x) x.mitigation = v;
                    })
                  }
                />
                <div className="flex flex-col justify-end">
                  <span className="label-caps">Criticité</span>
                  <span className={`mono mt-1.5 text-[20px] font-semibold ${r.probabilite * r.impact >= 6 ? 'text-sig-red' : ''}`}>
                    {r.probabilite * r.impact}
                    <span className="text-[12px] font-normal text-muted"> / 9</span>
                  </span>
                </div>
              </div>
            )}
          />
        </Plate>
      </div>
    </div>
  );
}
