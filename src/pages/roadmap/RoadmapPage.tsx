import { motion } from 'motion/react';
import { useMemo } from 'react';
import { Link } from 'react-router';
import { RotateCcw, TriangleAlert } from 'lucide-react';
import { useAnalysePortefeuille, usePortefeuilleCourant } from '../../app/hooks';
import { useTitre } from '../../app/useTitre';
import { JALONS } from '../../domain/aiAct/calendar';
import { fmtDateLongue, fmtMoisAnnee } from '../../domain/format';
import type { Vague } from '../../domain/model';
import { ajouterMois, HORIZON_ROADMAP_MOIS, libelleVague, moisDepuis, VAGUES, type EntreeRoadmap, type VagueRoadmap } from '../../domain/roadmap/roadmap';
import { usePortefeuilles } from '../../store/portfolioStore';
import { Avis, EnTetePage } from '../../ui/bits';
import { Button } from '../../ui/Button';
import { DUREES, transition, useMouvementReduit } from '../../ui/motion';
import { Plate } from '../../ui/Plate';
import { Reveal } from '../../ui/Reveal';
import { SignalIcone } from '../../ui/signalShapes';
import type { NiveauAiAct } from '../../domain/aiAct/qualification';

const OPTIONS_VAGUE: { valeur: string; libelle: string }[] = [
  { valeur: 'auto', libelle: 'Proposition automatique' },
  { valeur: '1', libelle: 'Vague 1 · 0 à 3 mois' },
  { valeur: '2', libelle: 'Vague 2 · 3 à 9 mois' },
  { valeur: '3', libelle: 'Vague 3 · 9 à 18 mois' },
  { valeur: '0', libelle: 'Hors roadmap' },
];

interface LigneFrise {
  entree: EntreeRoadmap;
  niveau: NiveauAiAct;
}

function Frise({ lignes, dateDebut, jalonsUtiles }: { lignes: LigneFrise[]; dateDebut: string; jalonsUtiles: ReadonlySet<string> }) {
  const reduit = useMouvementReduit();
  const mois = Array.from({ length: HORIZON_ROADMAP_MOIS }, (_, i) => ajouterMois(dateDebut, i));
  const fin = ajouterMois(dateDebut, HORIZON_ROADMAP_MOIS);
  const jalons = JALONS.filter((j) => jalonsUtiles.has(j.id) && j.date >= dateDebut && j.date < fin).map((j) => ({
    ...j,
    position: moisDepuis(dateDebut, j.date),
  }));
  const pct = (m: number) => `${(m / HORIZON_ROADMAP_MOIS) * 100}%`;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[820px]">
        {/* En-tête : mois et vagues */}
        <div className="grid grid-cols-[17rem_1fr] border-b border-line-strong">
          <div className="label-caps self-end px-3 pb-2">Cas d’usage</div>
          <div>
            <div className="relative flex h-8">
              {VAGUES.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-center border-l border-ink/70 font-display text-[11.5px] font-semibold tracking-[0.08em] uppercase"
                  style={{ width: pct(v.finMois - v.debutMois) }}
                >
                  {v.libelle} <span className="mono ml-2 font-normal text-muted normal-case">{v.fenetre}</span>
                </div>
              ))}
            </div>
            <div className="flex h-7 border-t border-line">
              {mois.map((m, i) => (
                <div key={m} className={`mono flex flex-1 items-center justify-center text-[10px] text-muted ${i > 0 ? 'border-l border-line' : ''}`}>
                  {fmtMoisAnnee(m).replace(/\s\d{4}$/, '')}
                  {m.endsWith('-01-01') || i === 0 ? <span className="ml-0.5">{m.slice(2, 4)}</span> : null}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lignes */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 right-0 left-[17rem]" aria-hidden="true">
            {VAGUES.map((v) => (
              <div key={v.id} className="absolute inset-y-0 border-l border-ink/30" style={{ left: pct(v.debutMois) }} />
            ))}
            {jalons.map((j) => (
              <div key={j.id} className="absolute inset-y-0 border-l-2 border-sig-red/80" style={{ left: pct(j.position) }} />
            ))}
          </div>
          {lignes.map(({ entree, niveau }, i) => {
            const debut = entree.debutMois ?? 0;
            const finMois = entree.finMois ?? 0;
            return (
              <div key={entree.casId} className="grid min-h-12 grid-cols-[17rem_1fr] border-b border-line">
                <div className="flex min-w-0 items-center gap-2 px-3 py-2">
                  <SignalIcone niveau={niveau} taille={15} />
                  <span className="mono shrink-0 text-[11.5px] text-muted">{entree.code}</span>
                  <span className="truncate text-[13px]" title={entree.titre}>
                    {entree.titre}
                  </span>
                </div>
                <div className="relative">
                  <motion.div
                    className={`absolute top-1/2 h-4 -translate-y-1/2 ${niveau === 'haut_risque' ? 'hazard' : 'bg-ink'}`}
                    style={{ left: 0, width: '100%', transformOrigin: '0% 50%' }}
                    initial={reduit ? false : { x: `${(debut / HORIZON_ROADMAP_MOIS) * 100}%`, scaleX: 0 }}
                    animate={{ x: `${(debut / HORIZON_ROADMAP_MOIS) * 100}%`, scaleX: (finMois - debut) / HORIZON_ROADMAP_MOIS }}
                    transition={transition(DUREES.lent, reduit ? 0 : 0.1 + i * 0.05, reduit)}
                    aria-hidden="true"
                  />
                  {(entree.manuelle || entree.conflits.length > 0) && (
                    <span
                      className="absolute top-1/2 -translate-y-1/2 pl-2 text-[11px] text-muted"
                      style={{ left: pct(finMois) }}
                    >
                      {entree.conflits.length > 0 ? <TriangleAlert className="inline size-3.5 text-sig-red" aria-label="Incohérence" /> : null}
                      {entree.manuelle ? ' ajusté' : ''}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {jalons.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[12px] text-muted">
            {jalons.map((j) => (
              <li key={j.id} className="inline-flex items-center gap-2">
                <span className="h-3 w-0.5 bg-sig-red" aria-hidden="true" />
                <span className="mono text-ink">{fmtDateLongue(j.date)}</span> {j.titre}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  const portefeuille = usePortefeuilleCourant();
  const analyse = useAnalysePortefeuille(portefeuille);
  const majCas = usePortefeuilles((s) => s.majCas);
  const majPortefeuille = usePortefeuilles((s) => s.majPortefeuille);
  useTitre(`Roadmap · ${portefeuille.nom}`);

  const niveauDe = useMemo(() => new Map(analyse.cas.map((a) => [a.cas.id, a.aiAct.niveau === 'incomplet' ? a.aiAct.niveauProvisoire : a.aiAct.niveau])), [analyse]);
  const entrees = analyse.roadmap.entrees;
  const planifiees = [...entrees]
    .filter((e) => e.vague >= 1 && e.vague <= 3)
    .sort((a, b) => a.vague - b.vague || (b.priorite ?? 0) - (a.priorite ?? 0));
  const ajustements = entrees.filter((e) => e.manuelle).length;
  const jalonsUtiles = useMemo(() => {
    const ids = new Set<string>();
    for (const a of analyse.cas) {
      const niveau = a.aiAct.niveau === 'incomplet' ? a.aiAct.niveauProvisoire : a.aiAct.niveau;
      if (niveau === 'haut_risque') ids.add(a.aiAct.voieHautRisque === 'annexe_I' ? 'haut_risque_annexe_I' : 'haut_risque_annexe_III');
      if (a.cas.aiAct.transparence.contenuSynthetique) ids.add('marquage_transitoire');
      if (a.aiAct.transparence) ids.add('application_generale');
      if (a.cas.aiAct.gpai === 'fournit_modele' || a.cas.aiAct.gpai === 'fournit_modele_systemique') ids.add('gpai_existants');
      if (a.cas.aiAct.organismePublic === 'oui' && niveau === 'haut_risque') ids.add('autorites_publiques');
    }
    return ids;
  }, [analyse]);
  const dateDebut = portefeuille.roadmap.dateDebut;

  const colonnes: { vague: VagueRoadmap; titre: string; sousTitre: string }[] = [
    ...VAGUES.map((v) => ({ vague: v.id as VagueRoadmap, titre: v.libelle, sousTitre: `${v.fenetre} · ${fmtMoisAnnee(ajouterMois(dateDebut, v.debutMois))}` })),
    { vague: 4, titre: 'Au-delà de 18 mois', sousTitre: 'capacité ou prérequis' },
    { vague: 0, titre: 'Hors roadmap', sousTitre: 'écarté ou incomplet' },
  ];

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-8 md:px-6 md:py-10">
      <Reveal>
        <EnTetePage
          surTitre={<span className="label-caps">Planification</span>}
          titre="Roadmap en trois vagues"
          description="Proposition automatique selon le quadrant, le niveau de risque, les dépendances et la capacité de chaque vague. Ajustez un cas : la frise et les contrôles de cohérence se mettent à jour."
          meta={
            <>
              <span className="text-[13px] text-muted">
                Début : <span className="mono text-ink">{fmtDateLongue(dateDebut)}</span>
              </span>
              <span className="text-[13px] text-muted">
                Capacité : <span className="mono text-ink">{portefeuille.roadmap.capacite.join(' / ')}</span> cas par vague
              </span>
            </>
          }
          actions={
            <Button
              icone={<RotateCcw className="size-4" aria-hidden="true" />}
              disabled={ajustements === 0}
              onClick={() =>
                majPortefeuille(portefeuille.id, (p) => {
                  p.cas.forEach((c) => {
                    c.roadmap.vagueManuelle = null;
                  });
                })
              }
            >
              Annuler les ajustements ({ajustements})
            </Button>
          }
        />
      </Reveal>

      {analyse.roadmap.alertes.length > 0 && (
        <div className="mt-6 flex flex-col gap-2">
          {analyse.roadmap.alertes.map((a) => (
            <Avis key={a} ton="alerte">
              {a}
            </Avis>
          ))}
        </div>
      )}

      <Reveal rang={1} className="mt-8">
        <Plate etiquette="Frise chronologique" repere={`${fmtMoisAnnee(dateDebut)} → ${fmtMoisAnnee(ajouterMois(dateDebut, HORIZON_ROADMAP_MOIS))}`} corpsClassName="p-0">
          {planifiees.length === 0 ? (
            <p className="p-5 text-muted">Aucun cas planifié : complétez le scoring des cas.</p>
          ) : (
            <Frise
              lignes={planifiees.map((e) => ({ entree: e, niveau: niveauDe.get(e.casId) ?? 'incomplet' }))}
              dateDebut={dateDebut}
              jalonsUtiles={jalonsUtiles}
            />
          )}
          <p className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-line px-4 py-2.5 text-[12px] text-muted">
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-6 bg-ink" aria-hidden="true" /> Fenêtre de réalisation
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="hazard h-3 w-6" aria-hidden="true" /> Haut risque : conformité à intégrer au lot
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-0.5 bg-sig-red" aria-hidden="true" /> Échéance AI Act
            </span>
          </p>
        </Plate>
      </Reveal>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {colonnes.map((col, ci) => {
          const cas = entrees.filter((e) => e.vague === col.vague);
          return (
            <Reveal key={col.vague} rang={ci} auDefilement>
              <section aria-label={col.titre} className="flex h-full flex-col">
                <header className="border-b-2 border-ink pb-2">
                  <h2 className="font-display text-[15px] font-semibold tracking-[0.04em] uppercase">
                    {col.titre} <span className="mono text-[12px] text-muted">({cas.length})</span>
                  </h2>
                  <p className="mono text-[11px] text-muted">{col.sousTitre}</p>
                </header>
                <ul className="mt-3 flex flex-col gap-3">
                  {cas.map((e) => (
                    <CarteRoadmap
                      key={e.casId}
                      entree={e}
                      niveau={niveauDe.get(e.casId) ?? 'incomplet'}
                      lien={`/atelier/${portefeuille.id}/cas/${e.casId}`}
                      onVague={(v) =>
                        majCas(portefeuille.id, e.casId, (c) => {
                          c.roadmap.vagueManuelle = v;
                        })
                      }
                    />
                  ))}
                  {cas.length === 0 && <li className="text-[13px] text-muted">Aucun cas.</li>}
                </ul>
              </section>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}

function CarteRoadmap({
  entree,
  niveau,
  lien,
  onVague,
}: {
  entree: EntreeRoadmap;
  niveau: NiveauAiAct;
  lien: string;
  onVague: (v: Vague | null) => void;
}) {
  const reduit = useMouvementReduit();
  return (
    <motion.li layout={!reduit} transition={transition(DUREES.moyen, 0, reduit)} className="plate p-3">
      <div className="flex items-center gap-2">
        <SignalIcone niveau={niveau} taille={15} />
        <span className="mono text-[11.5px] text-muted">{entree.code}</span>
        {entree.manuelle && <span className="ml-auto rounded-[2px] border border-ink px-1 font-display text-[10px] font-semibold tracking-[0.1em] uppercase">Ajusté</span>}
      </div>
      <Link to={lien} className="mt-1.5 block text-[13.5px] leading-snug font-medium hover:underline">
        {entree.titre}
      </Link>
      <label className="mt-3 block">
        <span className="sr-only">Vague de {entree.titre}</span>
        <select
          className="field-input min-h-8 text-[12.5px]"
          value={entree.manuelle ? String(entree.vague) : 'auto'}
          onChange={(e) => onVague(e.target.value === 'auto' ? null : (Number(e.target.value) as Vague))}
        >
          {OPTIONS_VAGUE.map((o) => (
            <option key={o.valeur} value={o.valeur}>
              {o.valeur === 'auto' ? `Auto · ${libelleVague(entree.vagueProposee)}` : o.libelle}
            </option>
          ))}
        </select>
      </label>
      {entree.conflits.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {entree.conflits.map((c) => (
            <li key={c} className="border-l-2 border-sig-red pl-2 text-[12px] text-ink">
              {c}
            </li>
          ))}
        </ul>
      )}
      <details className="mt-2 text-[12px] text-muted">
        <summary className="cursor-pointer select-none hover:text-ink">Pourquoi cette vague ?</summary>
        <ul className="mt-1.5 flex list-disc flex-col gap-1 pl-4">
          {entree.raisons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </details>
    </motion.li>
  );
}
