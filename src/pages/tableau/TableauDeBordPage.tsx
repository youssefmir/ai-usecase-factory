import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowDown, ArrowUp, Download, Plus } from 'lucide-react';
import { useAnalysePortefeuille, usePortefeuilleCourant } from '../../app/hooks';
import { telecharger } from '../../app/telechargement';
import { useTitre } from '../../app/useTitre';
import type { AnalyseCas } from '../../domain/analysis';
import { dateDuJour, jalonsPourPortees, type PorteeJalon } from '../../domain/aiAct/calendar';
import { NIVEAUX_AI_ACT, type NiveauAiAct } from '../../domain/aiAct/qualification';
import { fmtDateLongue, fmtEuroCompact, fmtNombre } from '../../domain/format';
import { exporterPortefeuilles, nomFichierExport } from '../../domain/io';
import { libelleTypologie } from '../../domain/model';
import { QUADRANTS, type QuadrantId } from '../../domain/scoring/criteria';
import type { VagueRoadmap } from '../../domain/roadmap/roadmap';
import { usePortefeuilles } from '../../store/portfolioStore';
import { EnTetePage, Indicateur, TagFictif } from '../../ui/bits';
import { Button } from '../../ui/Button';
import { Plate } from '../../ui/Plate';
import { Reveal } from '../../ui/Reveal';
import { BadgeAiAct, GlypheQuadrant, TagQuadrant, TagRgpd, TagVague } from '../../ui/Signals';

type Colonne = 'code' | 'titre' | 'valeur' | 'faisabilite' | 'risque' | 'priorite' | 'van' | 'vague';

interface Ligne {
  a: AnalyseCas;
  vague: VagueRoadmap;
}

const NIVEAUX_FILTRE: NiveauAiAct[] = ['interdit', 'haut_risque', 'transparence', 'minimal', 'hors_champ', 'incomplet'];

function valeurTri(l: Ligne, c: Colonne): number | string {
  switch (c) {
    case 'code':
      return l.a.cas.code;
    case 'titre':
      return l.a.cas.titre;
    case 'valeur':
      return l.a.scoring.valeur.note ?? -1;
    case 'faisabilite':
      return l.a.scoring.faisabilite.note ?? -1;
    case 'risque':
      return l.a.scoring.risque.note ?? -1;
    case 'priorite':
      return l.a.scoring.priorite ?? -1;
    case 'van':
      return l.a.businessCase.van;
    case 'vague':
      return l.vague === 0 ? 9 : l.vague;
  }
}

function Jauge({ valeur, max = 100 }: { valeur: number | null; max?: number }) {
  if (valeur === null) return <span className="text-muted">–</span>;
  return (
    <span className="flex items-center gap-2">
      <span className="mono w-9 text-right">{fmtNombre(valeur, 0)}</span>
      <span className="relative h-1 w-14 bg-[var(--chart-grid)]" aria-hidden="true">
        <span className="absolute inset-y-0 left-0 bg-ink" style={{ width: `${Math.max(0, Math.min(100, (valeur / max) * 100))}%` }} />
      </span>
    </span>
  );
}

export default function TableauDeBordPage() {
  const portefeuille = usePortefeuilleCourant();
  const analyse = useAnalysePortefeuille(portefeuille);
  const ajouterCas = usePortefeuilles((s) => s.ajouterCas);
  const navigate = useNavigate();
  useTitre(portefeuille.nom);

  const [recherche, setRecherche] = useState('');
  const [quadrant, setQuadrant] = useState<QuadrantId | ''>('');
  const [niveau, setNiveau] = useState<NiveauAiAct | ''>('');
  const [tri, setTri] = useState<{ col: Colonne; asc: boolean }>({ col: 'priorite', asc: false });

  const lignes: Ligne[] = useMemo(() => {
    const vagues = new Map(analyse.roadmap.entrees.map((e) => [e.casId, e.vague]));
    const filtre = recherche.trim().toLowerCase();
    return analyse.cas
      .map((a) => ({ a, vague: vagues.get(a.cas.id) ?? 0 }))
      .filter(({ a }) => !filtre || `${a.cas.code} ${a.cas.titre} ${a.cas.resume}`.toLowerCase().includes(filtre))
      .filter(({ a }) => !quadrant || a.scoring.quadrant === quadrant)
      .filter(({ a }) => !niveau || a.aiAct.niveau === niveau)
      .sort((x, y) => {
        const vx = valeurTri(x, tri.col);
        const vy = valeurTri(y, tri.col);
        const c = typeof vx === 'string' ? vx.localeCompare(String(vy)) : vx - (vy as number);
        return tri.asc ? c : -c;
      });
  }, [analyse, recherche, quadrant, niveau, tri]);

  const s = analyse.synthese;

  const echeances = useMemo(() => {
    const portees = new Set<PorteeJalon>();
    for (const a of analyse.cas) {
      if (a.aiAct.niveauProvisoire === 'haut_risque') portees.add(a.aiAct.voieHautRisque === 'annexe_I' ? 'haut_risque_annexe_I' : 'haut_risque_annexe_III');
      if (a.aiAct.transparence) portees.add('transparence');
      if (a.cas.aiAct.transparence.contenuSynthetique) portees.add('marquage_transitoire');
      if (a.aiAct.niveau === 'interdit') portees.add('interdictions');
    }
    return jalonsPourPortees([...portees], dateDuJour())
      .filter((j) => j.statut === 'a_venir')
      .map((j) => ({
        ...j,
        cas: analyse.cas
          .filter((a) => {
            if (j.id === 'haut_risque_annexe_III') return a.aiAct.niveauProvisoire === 'haut_risque' && a.aiAct.voieHautRisque !== 'annexe_I';
            if (j.id === 'haut_risque_annexe_I') return a.aiAct.voieHautRisque === 'annexe_I';
            if (j.id === 'marquage_transitoire') return a.cas.aiAct.transparence.contenuSynthetique;
            return false;
          })
          .map((a) => a.cas.code),
      }))
      .filter((j) => j.cas.length > 0);
  }, [analyse]);

  const nouveauCas = () => {
    const id = ajouterCas(portefeuille.id);
    if (id) navigate(`/atelier/${portefeuille.id}/cas/${id}`);
  };

  const enTeteTri = (col: Colonne, libelle: string, droite = false) => {
    const actif = tri.col === col;
    return (
      <th scope="col" aria-sort={actif ? (tri.asc ? 'ascending' : 'descending') : 'none'} className={droite ? 'text-right' : ''}>
        <button
          type="button"
          className={`inline-flex items-center gap-1 font-display tracking-[0.1em] uppercase ${actif ? 'text-ink' : ''}`}
          onClick={() => setTri((t) => ({ col, asc: t.col === col ? !t.asc : col === 'code' || col === 'titre' || col === 'vague' }))}
        >
          {libelle}
          {actif && (tri.asc ? <ArrowUp className="size-3" aria-hidden="true" /> : <ArrowDown className="size-3" aria-hidden="true" />)}
        </button>
      </th>
    );
  };

  const comptesQuadrants = Object.fromEntries(QUADRANTS.map((q) => [q.id, analyse.cas.filter((a) => a.scoring.quadrant === q.id).length]));

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-8 md:px-6 md:py-10">
      <Reveal>
        <EnTetePage
          surTitre={
            <>
              {portefeuille.organisation.fictive && <TagFictif />}
              <span className="label-caps">{portefeuille.organisation.secteur}</span>
            </>
          }
          titre={portefeuille.nom}
          description={portefeuille.organisation.presentation || portefeuille.description}
          meta={
            <>
              {portefeuille.organisation.taille && <span className="text-[13px] text-muted">{portefeuille.organisation.taille}</span>}
              {portefeuille.organisation.localisation && <span className="text-[13px] text-muted">{portefeuille.organisation.localisation}</span>}
            </>
          }
          actions={
            <>
              <Button variante="primaire" icone={<Plus className="size-4" aria-hidden="true" />} onClick={nouveauCas}>
                Nouveau cas d’usage
              </Button>
              <Button
                icone={<Download className="size-4" aria-hidden="true" />}
                onClick={() => telecharger(nomFichierExport(portefeuille.nom, 'json'), exporterPortefeuilles([portefeuille]))}
              >
                Exporter (JSON)
              </Button>
            </>
          }
        />
      </Reveal>

      <Reveal rang={1} className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 lg:grid-cols-6">
        <Indicateur libelle="Cas d’usage" valeur={s.nbCas} />
        <Indicateur libelle="Quick wins" valeur={s.nbQuickWins} />
        <Indicateur libelle="Haut risque" valeur={s.nbHautRisque} detail="AI Act, art. 6" />
        <Indicateur libelle="AIPD probables" valeur={s.nbAipd} detail="RGPD, art. 35" />
        <Indicateur libelle="VAN cumulée" valeur={fmtEuroCompact(s.vanTotale)} detail="3 ans" provenance="calcule" />
        <Indicateur libelle="Gains annuels" valeur={fmtEuroCompact(s.gainsAnnuels)} detail="pleine adoption" provenance="calcule" />
      </Reveal>

      <Reveal rang={2} className="mt-8">
        <div className="no-print flex flex-col gap-3 md:flex-row md:items-end">
          <div className="md:w-72">
            <label htmlFor="recherche-cas" className="label-caps">
              Rechercher
            </label>
            <input
              id="recherche-cas"
              type="search"
              className="field-input mt-1.5"
              placeholder="Code, titre, mot-clé"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
          </div>
          <div className="md:w-56">
            <label htmlFor="filtre-quadrant" className="label-caps">
              Quadrant
            </label>
            <select id="filtre-quadrant" className="field-input mt-1.5" value={quadrant} onChange={(e) => setQuadrant(e.target.value as QuadrantId | '')}>
              <option value="">Tous</option>
              {QUADRANTS.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.libelle}
                </option>
              ))}
            </select>
          </div>
          <div className="md:w-56">
            <label htmlFor="filtre-niveau" className="label-caps">
              Qualification AI Act
            </label>
            <select id="filtre-niveau" className="field-input mt-1.5" value={niveau} onChange={(e) => setNiveau(e.target.value as NiveauAiAct | '')}>
              <option value="">Toutes</option>
              {NIVEAUX_FILTRE.map((n) => (
                <option key={n} value={n}>
                  {NIVEAUX_AI_ACT[n].court}
                </option>
              ))}
            </select>
          </div>
          <p className="mono text-[12px] text-muted md:ml-auto">
            {lignes.length} / {analyse.cas.length} cas
          </p>
        </div>

        <div className="plate mt-4 hidden overflow-x-auto lg:block">
          <table className="table-tech">
            <caption className="sr-only">Cas d’usage du portefeuille, triables par colonne</caption>
            <thead>
              <tr>
                {enTeteTri('code', 'Code')}
                {enTeteTri('titre', 'Cas d’usage')}
                {enTeteTri('valeur', 'Val.', true)}
                {enTeteTri('faisabilite', 'Fais.', true)}
                {enTeteTri('risque', 'Risq.', true)}
                {enTeteTri('priorite', 'Priorité')}
                <th scope="col">Quadrant</th>
                <th scope="col">AI Act</th>
                <th scope="col">RGPD</th>
                {enTeteTri('van', 'VAN 3 ans', true)}
                {enTeteTri('vague', 'Vague')}
              </tr>
            </thead>
            <tbody>
              {lignes.map(({ a, vague }) => (
                <tr key={a.cas.id} className="hover:bg-surface-2">
                  <td className="mono text-[12.5px] whitespace-nowrap">
                    <Link to={`/atelier/${portefeuille.id}/cas/${a.cas.id}`} className="hover:underline">
                      {a.cas.code}
                    </Link>
                  </td>
                  <td className="min-w-[260px]">
                    <Link to={`/atelier/${portefeuille.id}/cas/${a.cas.id}`} className="font-medium text-ink hover:underline">
                      {a.cas.titre}
                    </Link>
                    <span className="block text-[12px] text-muted">{libelleTypologie(a.cas.solution.typologie)}</span>
                  </td>
                  <td className="mono text-right">{fmtNombre(a.scoring.valeur.note ?? Number.NaN, 1)}</td>
                  <td className="mono text-right">{fmtNombre(a.scoring.faisabilite.note ?? Number.NaN, 1)}</td>
                  <td className="mono text-right">{fmtNombre(a.scoring.risque.note ?? Number.NaN, 1)}</td>
                  <td>
                    <Jauge valeur={a.scoring.priorite} />
                  </td>
                  <td>
                    <TagQuadrant quadrant={a.scoring.quadrant} />
                  </td>
                  <td>
                    <BadgeAiAct niveau={a.aiAct.niveau} taille="sm" />
                  </td>
                  <td>
                    <TagRgpd niveau={a.rgpd.niveau} />
                  </td>
                  <td className={`mono text-right whitespace-nowrap ${a.businessCase.van < 0 ? 'text-sig-red' : ''}`}>{fmtEuroCompact(a.businessCase.van)}</td>
                  <td>
                    <TagVague vague={vague} />
                  </td>
                </tr>
              ))}
              {lignes.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-muted">
                    Aucun cas ne correspond aux filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <ul className="mt-4 flex flex-col gap-3 lg:hidden">
          {lignes.map(({ a, vague }) => (
            <li key={a.cas.id}>
              <Link to={`/atelier/${portefeuille.id}/cas/${a.cas.id}`} className="plate block p-4 hover:border-ink">
                <span className="flex items-center justify-between gap-2">
                  <span className="mono text-[12px] text-muted">{a.cas.code}</span>
                  <TagVague vague={vague} />
                </span>
                <span className="mt-1 block font-display text-[17px] leading-snug font-semibold">{a.cas.titre}</span>
                <span className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <TagQuadrant quadrant={a.scoring.quadrant} />
                  <BadgeAiAct niveau={a.aiAct.niveau} taille="sm" />
                  <span className={`mono text-[12.5px] ${a.businessCase.van < 0 ? 'text-sig-red' : ''}`}>VAN {fmtEuroCompact(a.businessCase.van)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Reveal>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <Reveal auDefilement>
          <Plate etiquette="Répartition par quadrant" repere="Valeur × faisabilité">
            <div className="grid grid-cols-[auto_1fr_1fr] gap-2 text-[13px]">
              <span />
              <span className="label-caps text-center">Faisabilité faible</span>
              <span className="label-caps text-center">Faisabilité élevée</span>
              <span className="label-caps self-center [writing-mode:vertical-rl] rotate-180">Valeur élevée</span>
              {(['strategique', 'quick_win'] as const).map((q) => (
                <CaseQuadrant key={q} id={q} nb={comptesQuadrants[q] ?? 0} />
              ))}
              <span className="label-caps self-center [writing-mode:vertical-rl] rotate-180">Valeur faible</span>
              {(['a_ecarter', 'a_explorer'] as const).map((q) => (
                <CaseQuadrant key={q} id={q} nb={comptesQuadrants[q] ?? 0} />
              ))}
            </div>
            <Link to={`/atelier/${portefeuille.id}/matrice`} className="mt-4 inline-block text-[13px] font-medium text-action underline">
              Ouvrir la matrice de priorisation
            </Link>
          </Plate>
        </Reveal>
        <Reveal auDefilement rang={1}>
          <Plate etiquette="Prochaines échéances AI Act" repere={fmtDateLongue(dateDuJour())}>
            {echeances.length === 0 ? (
              <p className="text-muted">Aucune échéance à venir ne concerne les cas qualifiés de ce portefeuille.</p>
            ) : (
              <ol className="flex flex-col">
                {echeances.map((j) => (
                  <li key={j.id} className="grid grid-cols-[7.5rem_1fr] gap-3 border-b border-line py-3 last:border-b-0">
                    <span>
                      <span className="mono block text-[13px] font-semibold text-ink">{fmtDateLongue(j.date)}</span>
                      <span className="mono text-[11px] text-muted">J−{fmtNombre(j.joursRestants)}</span>
                    </span>
                    <span>
                      <span className="block text-[14px] font-medium">{j.titre}</span>
                      <span className="mono text-[12px] text-muted">{j.cas.join(' · ')}</span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Plate>
        </Reveal>
      </div>
    </div>
  );
}

function CaseQuadrant({ id, nb }: { id: QuadrantId; nb: number }) {
  const q = QUADRANTS.find((x) => x.id === id);
  return (
    <div className={`flex min-h-24 flex-col justify-between border p-3 ${id === 'quick_win' ? 'border-ink' : 'border-line'}`}>
      <span className="flex items-center gap-2">
        <GlypheQuadrant quadrant={id} />
        <span className="font-display text-[13px] font-semibold tracking-[0.04em] uppercase">{q?.libelle}</span>
      </span>
      <span className="mono text-[28px] leading-none font-semibold">{nb}</span>
    </div>
  );
}
