import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Copy, Download, FolderOpen, Plus, RotateCcw, Trash2, Upload } from 'lucide-react';
import { useTitre } from '../../app/useTitre';
import { telecharger } from '../../app/telechargement';
import { dateDuJour } from '../../domain/aiAct/calendar';
import { analyserPortefeuille } from '../../domain/analysis';
import { fmtEuroCompact } from '../../domain/format';
import { analyserImport, exporterPortefeuilles, nomFichierExport } from '../../domain/io';
import type { NiveauAiAct } from '../../domain/aiAct/qualification';
import type { Portfolio } from '../../domain/model';
import { usePortefeuilles } from '../../store/portfolioStore';
import { Avis, EnTetePage, TagFictif } from '../../ui/bits';
import { Button, ButtonLink } from '../../ui/Button';
import { ChampTexte } from '../../ui/Fields';
import { Modal } from '../../ui/Modal';
import { DUREES, transition, useMouvementReduit } from '../../ui/motion';
import { SignalIcone } from '../../ui/signalShapes';

const NIVEAUX_COMPTES: NiveauAiAct[] = ['interdit', 'haut_risque', 'transparence', 'minimal'];

function CartePortefeuille({
  portefeuille,
  rang,
  onSupprimer,
}: {
  portefeuille: Portfolio;
  rang: number;
  onSupprimer: (p: Portfolio) => void;
}) {
  const dupliquer = usePortefeuilles((s) => s.dupliquerPortefeuille);
  const reduit = useMouvementReduit();
  const analyse = useMemo(() => analyserPortefeuille(portefeuille, dateDuJour()), [portefeuille]);
  const s = analyse.synthese;
  const comptes = NIVEAUX_COMPTES.map((n) => ({ n, nb: analyse.cas.filter((c) => c.aiAct.niveauProvisoire === n).length })).filter((c) => c.nb > 0);

  return (
    <motion.article
      layout={!reduit}
      initial={reduit ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={transition(DUREES.lent, rang * 0.07, reduit)}
      className="plate"
    >
      <div className="flex min-h-10 items-center gap-3 border-b border-line px-4 py-2">
        <span className="mono text-[11px] whitespace-nowrap text-muted">PF-{String(rang + 1).padStart(2, '0')}</span>
        {portefeuille.organisation.fictive && <TagFictif />}
        <span className="label-caps min-w-0 truncate">{portefeuille.organisation.secteur || 'Secteur non renseigné'}</span>
      </div>
      <div className="grid gap-5 p-4 md:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-8">
        <div className="min-w-0">
          <h2 className="text-[26px] font-semibold">
            <Link to={`/atelier/${portefeuille.id}`} className="hover:underline">
              {portefeuille.nom}
            </Link>
          </h2>
          {portefeuille.organisation.taille && <p className="mt-1 text-[13px] text-muted">{portefeuille.organisation.taille}</p>}
          {portefeuille.description && <p className="mt-2 max-w-xl text-[14px] text-ink/90">{portefeuille.description}</p>}
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <dl className="grid grid-cols-2 gap-y-3 sm:grid-cols-4">
            {[
              ['Cas', String(s.nbCas)],
              ['Quick wins', String(s.nbQuickWins)],
              ['AIPD', String(s.nbAipd)],
              ['VAN 3 ans', fmtEuroCompact(s.vanTotale)],
            ].map(([libelle, valeur]) => (
              <div key={libelle} className="border-l border-line pl-3">
                <dt className="label-caps whitespace-nowrap">{libelle}</dt>
                <dd className="mono mt-1 text-[20px] font-semibold whitespace-nowrap">{valeur}</dd>
              </div>
            ))}
          </dl>
          {comptes.length > 0 && (
            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-[12.5px] text-muted" aria-label="Qualification AI Act des cas">
              {comptes.map((c) => (
                <li key={c.n} className="inline-flex items-center gap-1.5">
                  <SignalIcone niveau={c.n} taille={15} />
                  <span className="mono text-ink">{c.nb}</span>
                  {c.n === 'haut_risque' ? 'à haut risque' : c.n === 'transparence' ? 'transparence' : c.n === 'minimal' ? 'risque minimal' : 'interdit'}
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <ButtonLink to={`/atelier/${portefeuille.id}`} variante="primaire" taille="sm" icone={<FolderOpen className="size-4" aria-hidden="true" />}>
              Ouvrir
            </ButtonLink>
            <Button taille="sm" icone={<Copy className="size-3.5" aria-hidden="true" />} onClick={() => dupliquer(portefeuille.id)}>
              Dupliquer
            </Button>
            <Button
              taille="sm"
              icone={<Download className="size-3.5" aria-hidden="true" />}
              onClick={() => telecharger(nomFichierExport(portefeuille.nom, 'json'), exporterPortefeuilles([portefeuille]))}
            >
              Exporter
            </Button>
            <Button
              taille="sm"
              variante="danger"
              className="ml-auto"
              icone={<Trash2 className="size-3.5" aria-hidden="true" />}
              onClick={() => onSupprimer(portefeuille)}
              aria-label={`Supprimer le portefeuille ${portefeuille.nom}`}
            >
              Supprimer
            </Button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export default function PortefeuillesPage() {
  useTitre('Portefeuilles');
  const navigate = useNavigate();
  const portefeuilles = usePortefeuilles((s) => s.portefeuilles);
  const creer = usePortefeuilles((s) => s.creerPortefeuille);
  const supprimer = usePortefeuilles((s) => s.supprimerPortefeuille);
  const importer = usePortefeuilles((s) => s.importerPortefeuilles);
  const reinitialiser = usePortefeuilles((s) => s.reinitialiserDemo);

  const [creation, setCreation] = useState(false);
  const [nom, setNom] = useState('');
  const [secteur, setSecteur] = useState('');
  const [aSupprimer, setASupprimer] = useState<Portfolio | null>(null);
  const [confirmerReinit, setConfirmerReinit] = useState(false);
  const [retourImport, setRetourImport] = useState<{ ok: boolean; messages: string[] } | null>(null);
  const fichier = useRef<HTMLInputElement>(null);

  const lancerImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const texte = await f.text();
    const r = analyserImport(texte);
    if (r.ok) {
      importer(r.portefeuilles);
      setRetourImport({
        ok: true,
        messages: [`${r.portefeuilles.length} portefeuille(s) importé(s) : ${r.portefeuilles.map((p) => p.nom).join(', ')}.`],
      });
    } else {
      setRetourImport({ ok: false, messages: r.erreurs });
    }
  };

  const valider = () => {
    if (!nom.trim()) return;
    const id = creer(nom.trim(), { secteur: secteur.trim() });
    setCreation(false);
    setNom('');
    setSecteur('');
    navigate(`/atelier/${id}`);
  };

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-8 md:px-6 md:py-10">
      <EnTetePage
        surTitre={
          <>
            <span className="label-caps">Atelier</span>
            <span className="mono text-[11px] text-muted">{portefeuilles.length} portefeuille(s)</span>
          </>
        }
        titre="Portefeuilles de cas d’usage"
        description="Chaque portefeuille regroupe les cas d’usage IA d’une organisation : fiches, scoring, qualification AI Act et RGPD, business cases et roadmap. Les données restent dans votre navigateur."
        actions={
          <>
            <Button variante="primaire" icone={<Plus className="size-4" aria-hidden="true" />} onClick={() => setCreation(true)}>
              Nouveau
            </Button>
            <Button icone={<Upload className="size-4" aria-hidden="true" />} onClick={() => fichier.current?.click()}>
              Importer
            </Button>
            <Button
              icone={<Download className="size-4" aria-hidden="true" />}
              onClick={() => telecharger(nomFichierExport('portefeuilles', 'json'), exporterPortefeuilles(portefeuilles))}
              disabled={portefeuilles.length === 0}
            >
              Exporter tout
            </Button>
          </>
        }
      />
      <input ref={fichier} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={lancerImport} />

      {retourImport && (
        <div className="mt-6">
          <Avis ton={retourImport.ok ? 'info' : 'danger'} titre={retourImport.ok ? 'Import réussi' : 'Import refusé : le fichier n’est pas valide'} role="status">
            <ul className="list-disc pl-5">
              {retourImport.messages.map((m) => (
                <li key={m} className="mono text-[12.5px]">
                  {m}
                </li>
              ))}
            </ul>
          </Avis>
        </div>
      )}

      {portefeuilles.length === 0 ? (
        <div className="plate mt-8 p-8 text-center">
          <p className="label-caps">Aucun portefeuille</p>
          <p className="mt-2 text-muted">Créez un portefeuille, importez un fichier JSON ou rechargez les données de démonstration.</p>
          <Button className="mt-4" icone={<RotateCcw className="size-4" aria-hidden="true" />} onClick={reinitialiser}>
            Recharger la démonstration
          </Button>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          <AnimatePresence>
            {portefeuilles.map((p, i) => (
              <CartePortefeuille key={p.id} portefeuille={p} rang={i} onSupprimer={setASupprimer} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <div className="mt-10 flex flex-col gap-2 border-t border-line pt-5 text-[13px] text-muted md:flex-row md:items-center md:justify-between">
        <p>Les organisations marquées « Fictif » sont des exemples inventés : leurs chiffres sont des hypothèses.</p>
        <button type="button" onClick={() => setConfirmerReinit(true)} className="inline-flex items-center gap-1.5 self-start underline hover:text-ink">
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Réinitialiser les données de démonstration
        </button>
      </div>

      <Modal
        ouverte={creation}
        onFermer={() => setCreation(false)}
        titre="Nouveau portefeuille"
        actions={
          <>
            <Button onClick={() => setCreation(false)}>Annuler</Button>
            <Button variante="primaire" onClick={valider} disabled={!nom.trim()}>
              Créer
            </Button>
          </>
        }
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            valider();
          }}
        >
          <ChampTexte libelle="Nom de l’organisation" valeur={nom} onChange={setNom} requis />
          <ChampTexte libelle="Secteur" valeur={secteur} onChange={setSecteur} placeholder="Ex. assurance, industrie, collectivité" />
        </form>
      </Modal>

      <Modal
        ouverte={aSupprimer !== null}
        onFermer={() => setASupprimer(null)}
        titre="Supprimer ce portefeuille ?"
        actions={
          <>
            <Button onClick={() => setASupprimer(null)}>Annuler</Button>
            <Button
              variante="danger"
              onClick={() => {
                if (aSupprimer) supprimer(aSupprimer.id);
                setASupprimer(null);
              }}
            >
              Supprimer définitivement
            </Button>
          </>
        }
      >
        <p>
          « {aSupprimer?.nom} » et ses {aSupprimer?.cas.length ?? 0} cas d’usage seront supprimés de ce navigateur. Exportez-le d’abord si vous souhaitez le conserver.
        </p>
      </Modal>

      <Modal
        ouverte={confirmerReinit}
        onFermer={() => setConfirmerReinit(false)}
        titre="Réinitialiser la démonstration ?"
        actions={
          <>
            <Button onClick={() => setConfirmerReinit(false)}>Annuler</Button>
            <Button
              variante="primaire"
              onClick={() => {
                reinitialiser();
                setConfirmerReinit(false);
              }}
            >
              Réinitialiser
            </Button>
          </>
        }
      >
        <p>Les trois portefeuilles fictifs retrouvent leur contenu d’origine. Vos propres portefeuilles ne sont pas modifiés.</p>
      </Modal>
    </div>
  );
}
