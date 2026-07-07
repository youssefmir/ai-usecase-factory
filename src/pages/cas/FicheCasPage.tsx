import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Copy, FileText, Trash2 } from 'lucide-react';
import { useAnalysePortefeuille, usePortefeuilleCourant } from '../../app/hooks';
import { useTitre } from '../../app/useTitre';
import { fmtEuroCompact } from '../../domain/format';
import { STATUTS, type StatutId } from '../../domain/model';
import { usePortefeuilles } from '../../store/portfolioStore';
import { TagFictif } from '../../ui/bits';
import { Button, ButtonLink } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { DUREES, transition, useMouvementReduit } from '../../ui/motion';
import { Reveal } from '../../ui/Reveal';
import { BadgeAiAct, TagQuadrant, TagRgpd, TagVague } from '../../ui/Signals';
import { Onglets } from '../../ui/Tabs';
import { OngletAiAct } from './OngletAiAct';
import { OngletBusinessCase } from './OngletBusinessCase';
import { OngletFiche } from './OngletFiche';
import { OngletRgpd } from './OngletRgpd';
import { OngletScoring } from './OngletScoring';
import type { MajCas } from './types';

const ONGLETS = [
  { id: 'fiche', libelle: 'Fiche', repere: '01' },
  { id: 'scoring', libelle: 'Scoring', repere: '02' },
  { id: 'ai-act', libelle: 'AI Act', repere: '03' },
  { id: 'rgpd', libelle: 'RGPD', repere: '04' },
  { id: 'business-case', libelle: 'Business case', repere: '05' },
] as const;
type OngletId = (typeof ONGLETS)[number]['id'];

export default function FicheCasPage() {
  const portefeuille = usePortefeuilleCourant();
  const analyse = useAnalysePortefeuille(portefeuille);
  const { cid, onglet } = useParams();
  const navigate = useNavigate();
  const reduit = useMouvementReduit();
  const majCas = usePortefeuilles((s) => s.majCas);
  const dupliquerCas = usePortefeuilles((s) => s.dupliquerCas);
  const supprimerCas = usePortefeuilles((s) => s.supprimerCas);
  const [confirmerSuppression, setConfirmerSuppression] = useState(false);

  const analyseCas = analyse.cas.find((a) => a.cas.id === cid);
  const entreeRoadmap = analyse.roadmap.entrees.find((e) => e.casId === cid);
  const actif: OngletId = ONGLETS.some((o) => o.id === onglet) ? (onglet as OngletId) : 'fiche';
  useTitre(analyseCas ? `${analyseCas.cas.code} ${analyseCas.cas.titre}` : 'Cas introuvable');

  const maj: MajCas = useCallback((recette) => {
    if (cid) majCas(portefeuille.id, cid, recette);
  }, [majCas, portefeuille.id, cid]);

  const autresCas = useMemo(() => portefeuille.cas.filter((c) => c.id !== cid), [portefeuille.cas, cid]);

  if (!analyseCas) {
    return (
      <div className="mx-auto max-w-[1240px] px-4 py-16 md:px-6">
        <p className="mono text-[13px] text-muted">ERREUR 404</p>
        <h1 className="mt-2 text-3xl font-semibold">Cas d’usage introuvable</h1>
        <ButtonLink to={`/atelier/${portefeuille.id}`} variante="primaire" className="mt-6">
          Retour au tableau de bord
        </ButtonLink>
      </div>
    );
  }

  const { cas, scoring, aiAct, rgpd, businessCase } = analyseCas;

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-8 md:px-6 md:py-10">
      <Reveal>
        <header className="border-b border-ink/80 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="mono rounded-[2px] bg-ink px-2 py-0.5 text-[12.5px] font-semibold tracking-[0.04em] text-bg">{cas.code || 'UC-—'}</span>
              {portefeuille.organisation.fictive && <TagFictif />}
              <label className="flex items-center gap-2 text-[12.5px] text-muted">
                <span className="label-caps">Statut</span>
                <select
                  className="h-8 rounded-[2px] border border-line-strong bg-surface px-2 text-[13px] text-ink"
                  value={cas.statut}
                  onChange={(e) =>
                    maj((c) => {
                      c.statut = e.target.value as StatutId;
                    })
                  }
                >
                  {STATUTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.libelle}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="no-print flex flex-wrap gap-2">
              <ButtonLink to={`/atelier/${portefeuille.id}/cas/${cas.id}/note`} variante="primaire" taille="sm" icone={<FileText className="size-4" aria-hidden="true" />}>
                Note de cadrage
              </ButtonLink>
              <Button
                taille="sm"
                icone={<Copy className="size-3.5" aria-hidden="true" />}
                onClick={() => {
                  const id = dupliquerCas(portefeuille.id, cas.id);
                  if (id) navigate(`/atelier/${portefeuille.id}/cas/${id}`);
                }}
              >
                Dupliquer
              </Button>
              <Button taille="sm" variante="danger" icone={<Trash2 className="size-3.5" aria-hidden="true" />} onClick={() => setConfirmerSuppression(true)}>
                Supprimer
              </Button>
            </div>
          </div>
          <h1 className="mt-4 max-w-4xl text-[28px] leading-[1.08] font-semibold md:text-[38px]">{cas.titre}</h1>
          {cas.resume && <p className="mt-3 max-w-3xl text-[15px] text-muted">{cas.resume}</p>}
          <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
            <div className="flex flex-col gap-1">
              <dt className="label-caps">Quadrant</dt>
              <dd>
                <TagQuadrant quadrant={scoring.quadrant} />
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="label-caps">AI Act</dt>
              <dd>
                <BadgeAiAct niveau={aiAct.niveau} provisoire={aiAct.niveauProvisoire} taille="sm" />
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="label-caps">RGPD</dt>
              <dd>
                <TagRgpd niveau={rgpd.niveau} />
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="label-caps">VAN 3 ans</dt>
              <dd className={`mono text-[13.5px] font-semibold ${businessCase.van < 0 ? 'text-sig-red' : ''}`}>{fmtEuroCompact(businessCase.van)}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="label-caps">Roadmap</dt>
              <dd>
                <TagVague vague={entreeRoadmap?.vague ?? 0} />
              </dd>
            </div>
          </dl>
        </header>
      </Reveal>

      <Onglets
        className="no-print mt-6"
        prefixe="cas"
        etiquette="Sections du cas d’usage"
        onglets={ONGLETS}
        actif={actif}
        onChange={(id) => navigate(`/atelier/${portefeuille.id}/cas/${cas.id}/${id}`, { replace: true })}
      />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={actif}
          id={`cas-panneau-${actif}`}
          role="tabpanel"
          aria-labelledby={`cas-onglet-${actif}`}
          initial={reduit ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduit ? undefined : { opacity: 0, y: -4 }}
          transition={transition(DUREES.moyen, 0, reduit)}
          className="mt-6"
        >
          {actif === 'fiche' && <OngletFiche cas={cas} maj={maj} autresCas={autresCas} demo={portefeuille.organisation.fictive} />}
          {actif === 'scoring' && <OngletScoring analyse={analyseCas} portefeuille={portefeuille} maj={maj} />}
          {actif === 'ai-act' && <OngletAiAct cas={cas} resultat={aiAct} maj={maj} />}
          {actif === 'rgpd' && <OngletRgpd cas={cas} resultat={rgpd} maj={maj} />}
          {actif === 'business-case' && <OngletBusinessCase cas={cas} resultat={businessCase} maj={maj} />}
        </motion.div>
      </AnimatePresence>

      <Modal
        ouverte={confirmerSuppression}
        onFermer={() => setConfirmerSuppression(false)}
        titre="Supprimer ce cas d’usage ?"
        actions={
          <>
            <Button onClick={() => setConfirmerSuppression(false)}>Annuler</Button>
            <Button
              variante="danger"
              onClick={() => {
                supprimerCas(portefeuille.id, cas.id);
                navigate(`/atelier/${portefeuille.id}`);
              }}
            >
              Supprimer
            </Button>
          </>
        }
      >
        <p>
          « {cas.titre} » sera supprimé et retiré des dépendances des autres cas. Cette action est définitive pour ce navigateur.
        </p>
      </Modal>
    </div>
  );
}
