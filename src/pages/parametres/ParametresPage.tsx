import { RotateCcw } from 'lucide-react';
import { usePortefeuilleCourant } from '../../app/hooks';
import { useTitre } from '../../app/useTitre';
import { fmtNombre } from '../../domain/format';
import { AXES, CRITERES } from '../../domain/scoring/criteria';
import { partsAxes, poidsCritere } from '../../domain/scoring/scoring';
import { usePortefeuilles } from '../../store/portfolioStore';
import { EnTetePage } from '../../ui/bits';
import { Button } from '../../ui/Button';
import { CaseACocher, ChampNombre, ChampTexte, ZoneTexte } from '../../ui/Fields';
import { Plate } from '../../ui/Plate';
import { Reveal } from '../../ui/Reveal';

export default function ParametresPage() {
  const portefeuille = usePortefeuilleCourant();
  const maj = usePortefeuilles((s) => s.majPortefeuille);
  useTitre(`Paramètres · ${portefeuille.nom}`);
  const config = portefeuille.config;
  const parts = partsAxes(config.poidsAxes);
  const majP = (recette: Parameters<typeof maj>[1]) => maj(portefeuille.id, recette);

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-8 md:px-6 md:py-10">
      <Reveal>
        <EnTetePage
          surTitre={<span className="label-caps">Configuration du portefeuille</span>}
          titre="Paramètres"
          description="Pondérations du scoring, seuils des quadrants, calendrier et capacité de la roadmap, informations sur l’organisation. Les modifications s’appliquent immédiatement à tous les cas."
          actions={
            <Button
              icone={<RotateCcw className="size-4" aria-hidden="true" />}
              onClick={() =>
                majP((p) => {
                  p.config.poids = {};
                  p.config.poidsAxes = { valeur: 45, faisabilite: 35, risque: 20 };
                  p.config.seuilValeur = 3;
                  p.config.seuilFaisabilite = 3;
                })
              }
            >
              Pondérations par défaut
            </Button>
          }
        />
      </Reveal>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {AXES.map((axe, i) => {
          const criteres = CRITERES.filter((c) => c.axe === axe.id);
          const total = criteres.reduce((s, c) => s + poidsCritere(config, c.id), 0);
          return (
            <Reveal key={axe.id} rang={i + 1}>
              <Plate etiquette={`Poids · ${axe.libelle}`} repere={`total ${fmtNombre(total)}`}>
                <div className="flex flex-col gap-4">
                  {criteres.map((c) => {
                    const p = poidsCritere(config, c.id);
                    return (
                      <ChampNombre
                        key={c.id}
                        compact
                        libelle={c.libelle}
                        max={100}
                        valeur={p}
                        aide={`${fmtNombre(total > 0 ? (p / total) * 100 : 25)} % de l’axe`}
                        onChange={(v) =>
                          majP((x) => {
                            x.config.poids[c.id] = v ?? 0;
                          })
                        }
                      />
                    );
                  })}
                </div>
              </Plate>
            </Reveal>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Reveal rang={4}>
          <Plate etiquette="Score de priorité" repere="poids des axes">
            <div className="grid gap-4 sm:grid-cols-3">
              {(['valeur', 'faisabilite', 'risque'] as const).map((axe) => (
                <ChampNombre
                  key={axe}
                  compact
                  libelle={AXES.find((a) => a.id === axe)?.libelle ?? axe}
                  max={100}
                  valeur={config.poidsAxes[axe]}
                  aide={`${fmtNombre(parts[axe] * 100)} % de la priorité`}
                  onChange={(v) =>
                    majP((x) => {
                      x.config.poidsAxes[axe] = v ?? 0;
                    })
                  }
                />
              ))}
            </div>
            <p className="mt-4 text-[13px] text-muted">Priorité = part valeur × valeur + part faisabilité × faisabilité + part risque × (100 − risque).</p>
            <div className="mt-5 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
              <ChampNombre
                compact
                libelle="Seuil de valeur (quadrants)"
                decimales={2}
                min={1}
                max={5}
                valeur={config.seuilValeur}
                onChange={(v) =>
                  majP((x) => {
                    x.config.seuilValeur = v ?? 3;
                  })
                }
              />
              <ChampNombre
                compact
                libelle="Seuil de faisabilité (quadrants)"
                decimales={2}
                min={1}
                max={5}
                valeur={config.seuilFaisabilite}
                onChange={(v) =>
                  majP((x) => {
                    x.config.seuilFaisabilite = v ?? 3;
                  })
                }
              />
            </div>
          </Plate>
        </Reveal>

        <Reveal rang={5}>
          <Plate etiquette="Roadmap" repere="calendrier et capacité">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="date-debut" className="block text-[13px] font-semibold">
                  Date de début
                </label>
                <input
                  id="date-debut"
                  type="date"
                  className="field-input mono mt-1.5"
                  value={portefeuille.roadmap.dateDebut}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^\d{4}-\d{2}-\d{2}$/.test(v))
                      majP((x) => {
                        x.roadmap.dateDebut = `${v.slice(0, 8)}01`;
                      });
                  }}
                />
                <p className="mt-1 text-[12.5px] text-muted">Ramenée au premier jour du mois.</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => (
                <ChampNombre
                  key={i}
                  compact
                  libelle={`Capacité V${i + 1}`}
                  unite="cas"
                  min={1}
                  max={20}
                  valeur={portefeuille.roadmap.capacite[i as 0 | 1 | 2]}
                  onChange={(v) =>
                    majP((x) => {
                      x.roadmap.capacite[i as 0 | 1 | 2] = Math.max(1, Math.round(v ?? 1));
                    })
                  }
                />
              ))}
            </div>
          </Plate>
        </Reveal>
      </div>

      <Reveal rang={6} className="mt-6">
        <Plate etiquette="Organisation et portefeuille">
          <div className="grid gap-4 md:grid-cols-2">
            <ChampTexte
              libelle="Nom du portefeuille"
              requis
              valeur={portefeuille.nom}
              onChange={(v) =>
                majP((x) => {
                  x.nom = v;
                })
              }
            />
            <ChampTexte
              libelle="Organisation"
              valeur={portefeuille.organisation.nom}
              onChange={(v) =>
                majP((x) => {
                  x.organisation.nom = v;
                })
              }
            />
            <ChampTexte
              libelle="Secteur"
              valeur={portefeuille.organisation.secteur}
              onChange={(v) =>
                majP((x) => {
                  x.organisation.secteur = v;
                })
              }
            />
            <ChampTexte
              libelle="Taille"
              valeur={portefeuille.organisation.taille}
              onChange={(v) =>
                majP((x) => {
                  x.organisation.taille = v;
                })
              }
            />
            <ZoneTexte
              libelle="Description du portefeuille"
              lignes={2}
              valeur={portefeuille.description}
              onChange={(v) =>
                majP((x) => {
                  x.description = v;
                })
              }
            />
            <ZoneTexte
              libelle="Présentation de l’organisation"
              lignes={2}
              valeur={portefeuille.organisation.presentation}
              onChange={(v) =>
                majP((x) => {
                  x.organisation.presentation = v;
                })
              }
            />
            <div className="md:col-span-2">
              <CaseACocher
                libelle="Organisation fictive (données de démonstration)"
                description="Affiche la mention « Fictif » sur toutes les vues et dans la note de cadrage."
                coche={portefeuille.organisation.fictive}
                onChange={(v) =>
                  majP((x) => {
                    x.organisation.fictive = v;
                  })
                }
              />
            </div>
          </div>
        </Plate>
      </Reveal>
    </div>
  );
}
