import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { RotateCcw } from 'lucide-react';
import { useAnalysePortefeuille, usePortefeuilleCourant } from '../../app/hooks';
import { useTitre } from '../../app/useTitre';
import { PriorityMatrix, type PointMatrice } from '../../charts/PriorityMatrix';
import { NIVEAUX_AI_ACT, type NiveauAiAct } from '../../domain/aiAct/qualification';
import { fmtNombre } from '../../domain/format';
import { TYPOLOGIES, type TypologieId } from '../../domain/model';
import { CRITERES, QUADRANTS, type CritereId, type QuadrantId } from '../../domain/scoring/criteria';
import { poidsCritere } from '../../domain/scoring/scoring';
import { usePortefeuilles } from '../../store/portfolioStore';
import { EnTetePage } from '../../ui/bits';
import { Button } from '../../ui/Button';
import { Plate } from '../../ui/Plate';
import { Reveal } from '../../ui/Reveal';
import { SignalIcone } from '../../ui/signalShapes';

const NIVEAUX: NiveauAiAct[] = ['interdit', 'haut_risque', 'transparence', 'minimal', 'hors_champ', 'incomplet'];

function Curseur({
  libelle,
  valeur,
  min,
  max,
  pas,
  onChange,
  affichage,
}: {
  libelle: string;
  valeur: number;
  min: number;
  max: number;
  pas: number;
  onChange: (v: number) => void;
  affichage: string;
}) {
  const id = `curseur-${libelle.replace(/\W+/g, '-')}`;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-[13px] text-ink">
          {libelle}
        </label>
        <span className="mono text-[12px] text-muted">{affichage}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={pas}
        value={valeur}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-[var(--ink)]"
      />
    </div>
  );
}

export default function MatricePage() {
  const portefeuille = usePortefeuilleCourant();
  const analyse = useAnalysePortefeuille(portefeuille);
  const majPortefeuille = usePortefeuilles((s) => s.majPortefeuille);
  const navigate = useNavigate();
  useTitre(`Matrice · ${portefeuille.nom}`);

  const [niveaux, setNiveaux] = useState<NiveauAiAct[]>([]);
  const [quadrant, setQuadrant] = useState<QuadrantId | ''>('');
  const [typologie, setTypologie] = useState<TypologieId | ''>('');
  const [vanPositive, setVanPositive] = useState(false);
  const [etiquettes, setEtiquettes] = useState(true);

  const points: PointMatrice[] = useMemo(
    () =>
      analyse.cas
        .filter((a) => a.scoring.valeur.note !== null && a.scoring.faisabilite.note !== null)
        .filter((a) => niveaux.length === 0 || niveaux.includes(a.aiAct.niveau))
        .filter((a) => !quadrant || a.scoring.quadrant === quadrant)
        .filter((a) => !typologie || a.cas.solution.typologie === typologie)
        .filter((a) => !vanPositive || a.businessCase.van > 0)
        .map((a) => ({
          id: a.cas.id,
          code: a.cas.code,
          titre: a.cas.titre,
          valeur: a.scoring.valeur.note ?? 1,
          faisabilite: a.scoring.faisabilite.note ?? 1,
          van: a.businessCase.van,
          niveau: a.aiAct.niveau,
          quadrant: a.scoring.quadrant,
        })),
    [analyse, niveaux, quadrant, typologie, vanPositive],
  );

  const incomplets = analyse.cas.filter((a) => a.scoring.valeur.note === null || a.scoring.faisabilite.note === null);
  const config = portefeuille.config;
  const setPoids = (id: CritereId, v: number) =>
    majPortefeuille(portefeuille.id, (p) => {
      p.config.poids[id] = v;
    });

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-8 md:px-6 md:py-10">
      <Reveal>
        <EnTetePage
          surTitre={<span className="label-caps">Priorisation</span>}
          titre="Matrice valeur × faisabilité"
          description="Chaque cas est placé selon ses notes de valeur et de faisabilité. Modifiez les poids : les cas glissent vers leur nouvelle position. Cliquez sur un cas pour ouvrir sa fiche."
        />
      </Reveal>

      <Reveal rang={1} className="no-print mt-6 flex flex-col gap-4 lg:flex-row lg:items-end">
        <fieldset>
          <legend className="label-caps">Qualification AI Act</legend>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {NIVEAUX.map((n) => {
              const actif = niveaux.includes(n);
              return (
                <button
                  key={n}
                  type="button"
                  aria-pressed={actif}
                  onClick={() => setNiveaux((l) => (actif ? l.filter((x) => x !== n) : [...l, n]))}
                  className={`inline-flex min-h-9 items-center gap-1.5 rounded-[2px] border px-2 text-[12px] ${
                    actif ? 'border-ink bg-ink text-bg' : 'border-line-strong bg-surface text-ink hover:border-ink'
                  }`}
                >
                  <SignalIcone niveau={n} taille={14} />
                  {NIVEAUX_AI_ACT[n].court}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className="grid grid-cols-2 gap-3 lg:flex lg:items-end">
          <div className="lg:w-44">
            <label htmlFor="m-quadrant" className="label-caps">
              Quadrant
            </label>
            <select id="m-quadrant" className="field-input mt-1.5" value={quadrant} onChange={(e) => setQuadrant(e.target.value as QuadrantId | '')}>
              <option value="">Tous</option>
              {QUADRANTS.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.libelle}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:w-48">
            <label htmlFor="m-typologie" className="label-caps">
              Typologie
            </label>
            <select id="m-typologie" className="field-input mt-1.5" value={typologie} onChange={(e) => setTypologie(e.target.value as TypologieId | '')}>
              <option value="">Toutes</option>
              {TYPOLOGIES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.libelle}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 lg:ml-auto">
          <label className="inline-flex items-center gap-2 text-[13px]">
            <input type="checkbox" className="size-4 accent-[var(--action)]" checked={vanPositive} onChange={(e) => setVanPositive(e.target.checked)} />
            VAN positive uniquement
          </label>
          <label className="inline-flex items-center gap-2 text-[13px]">
            <input type="checkbox" className="size-4 accent-[var(--action)]" checked={etiquettes} onChange={(e) => setEtiquettes(e.target.checked)} />
            Codes des cas
          </label>
        </div>
      </Reveal>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <Reveal rang={2} className="min-w-0">
          <PriorityMatrix
            points={points}
            seuilValeur={config.seuilValeur}
            seuilFaisabilite={config.seuilFaisabilite}
            etiquettes={etiquettes}
            onOuvrir={(id) => navigate(`/atelier/${portefeuille.id}/cas/${id}`)}
          />
          <p className="mono mt-3 text-[12px] text-muted">
            {points.length} cas affiché(s){incomplets.length > 0 ? ` · ${incomplets.length} cas au scoring incomplet non placé(s)` : ''}
          </p>
        </Reveal>

        <Reveal rang={3}>
          <Plate
            etiquette="Pondération"
            repere="Persistée"
            actions={
              <Button
                taille="sm"
                variante="discret"
                icone={<RotateCcw className="size-3.5" aria-hidden="true" />}
                onClick={() =>
                  majPortefeuille(portefeuille.id, (p) => {
                    p.config.poids = {};
                    p.config.seuilValeur = 3;
                    p.config.seuilFaisabilite = 3;
                  })
                }
              >
                Défaut
              </Button>
            }
          >
            {(['valeur', 'faisabilite'] as const).map((axe) => {
              const criteres = CRITERES.filter((c) => c.axe === axe);
              const total = criteres.reduce((s, c) => s + poidsCritere(config, c.id), 0) || 1;
              return (
                <fieldset key={axe} className="mb-5 flex flex-col gap-3 last:mb-0">
                  <legend className="label-caps mb-2">{axe === 'valeur' ? 'Critères de valeur' : 'Critères de faisabilité'}</legend>
                  {criteres.map((c) => {
                    const p = poidsCritere(config, c.id);
                    return (
                      <Curseur
                        key={c.id}
                        libelle={c.libelle}
                        valeur={p}
                        min={0}
                        max={100}
                        pas={5}
                        affichage={`${fmtNombre(p)} · ${fmtNombre((p / total) * 100)} %`}
                        onChange={(v) => setPoids(c.id, v)}
                      />
                    );
                  })}
                </fieldset>
              );
            })}
            <div className="mt-5 border-t border-line" aria-hidden="true" />
            <fieldset className="mt-4 flex flex-col gap-3">
              <legend className="label-caps mb-2">Seuils des quadrants</legend>
              <Curseur
                libelle="Seuil de valeur"
                valeur={config.seuilValeur}
                min={1.5}
                max={4.5}
                pas={0.25}
                affichage={`${fmtNombre(config.seuilValeur, 2)} / 5`}
                onChange={(v) =>
                  majPortefeuille(portefeuille.id, (p) => {
                    p.config.seuilValeur = v;
                  })
                }
              />
              <Curseur
                libelle="Seuil de faisabilité"
                valeur={config.seuilFaisabilite}
                min={1.5}
                max={4.5}
                pas={0.25}
                affichage={`${fmtNombre(config.seuilFaisabilite, 2)} / 5`}
                onChange={(v) =>
                  majPortefeuille(portefeuille.id, (p) => {
                    p.config.seuilFaisabilite = v;
                  })
                }
              />
            </fieldset>
          </Plate>
        </Reveal>
      </div>
    </div>
  );
}
