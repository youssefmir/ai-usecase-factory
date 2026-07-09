import { AnimatePresence, motion } from 'motion/react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { FileText, Sparkles, X } from 'lucide-react';
import { usePortefeuilleCourant } from '../../app/hooks';
import { useTitre } from '../../app/useTitre';
import { brouillonVersCas, type Brouillon } from '../../assistant/brouillon';
import { genererBrouillon, type Fournisseur } from '../../assistant/client';
import { NOTES_EXEMPLE } from '../../assistant/prompt';
import { useSessionAssistant } from '../../assistant/sessionStore';
import { TYPOLOGIES, type TypologieId } from '../../domain/model';
import { usePortefeuilles } from '../../store/portfolioStore';
import { Avis, EnTetePage } from '../../ui/bits';
import { Button } from '../../ui/Button';
import { CaseACocher, ChampNombre, ChampSelection, ChampTexte, ChoixSegmente, ZoneTexte } from '../../ui/Fields';
import { DUREES, transition, useMouvementReduit } from '../../ui/motion';
import { Plate } from '../../ui/Plate';
import { Reveal } from '../../ui/Reveal';

const FOURNISSEURS: { id: Fournisseur; libelle: string }[] = [
  { id: 'mistral', libelle: 'Mistral' },
  { id: 'openai_compatible', libelle: 'Compatible OpenAI (ex. Ollama)' },
];

function ListeRetirable({ titre, elements, onRetirer }: { titre: string; elements: string[]; onRetirer: (i: number) => void }) {
  if (elements.length === 0) return null;
  return (
    <div>
      <p className="label-caps">{titre}</p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {elements.map((e, i) => (
          <li key={`${e}-${i}`} className="flex items-start justify-between gap-2 border-b border-line pb-1.5 text-[13.5px] last:border-b-0">
            <span>{e}</span>
            <button type="button" onClick={() => onRetirer(i)} className="rounded-[2px] p-1 text-muted hover:text-sig-red" aria-label={`Retirer : ${e}`}>
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AssistantPage() {
  const portefeuille = usePortefeuilleCourant();
  const ajouterCas = usePortefeuilles((s) => s.ajouterCas);
  const navigate = useNavigate();
  const reduit = useMouvementReduit();
  const { config, choisirFournisseur, majConfig, oublierCle } = useSessionAssistant();
  useTitre(`Assistant · ${portefeuille.nom}`);

  const [notes, setNotes] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreurs, setErreurs] = useState<string[]>([]);
  const [brouillon, setBrouillon] = useState<Brouillon | null>(null);
  const annulation = useRef<AbortController | null>(null);

  const generer = async () => {
    annulation.current?.abort();
    const controleur = new AbortController();
    annulation.current = controleur;
    setEnCours(true);
    setErreurs([]);
    const r = await genererBrouillon(notes, config, { signal: controleur.signal });
    setEnCours(false);
    if (r.ok) setBrouillon(r.brouillon);
    else setErreurs(r.erreurs);
  };

  const maj = (partiel: Partial<Brouillon>) => setBrouillon((b) => (b ? { ...b, ...partiel } : b));

  const creer = () => {
    if (!brouillon) return;
    const id = ajouterCas(portefeuille.id, brouillonVersCas(brouillon));
    if (id) navigate(`/atelier/${portefeuille.id}/cas/${id}`);
  };

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-8 md:px-6 md:py-10">
      <Reveal>
        <EnTetePage
          surTitre={
            <>
              <span className="label-caps">Fonction optionnelle</span>
              <span className="mono text-[11px] text-muted">clé fournie par l’utilisateur</span>
            </>
          }
          titre="Assistant de saisie"
          description="Collez des notes d’atelier : un modèle de langage propose un brouillon de fiche structurée, validé par schéma, que vous relisez avant de l’enregistrer. L’application fonctionne entièrement sans cet assistant."
        />
      </Reveal>

      <Reveal rang={1} className="mt-6">
        <Avis ton="alerte" titre="Avant d’utiliser l’assistant">
          <ul className="mt-1 list-disc pl-5">
            <li>Les notes sont envoyées au fournisseur choisi : n’y mettez ni données personnelles ni informations confidentielles.</li>
            <li>La clé d’API reste en mémoire pendant la session ; elle n’est jamais enregistrée dans le navigateur.</li>
            <li>Fonction testée avec des réponses simulées ; certains fournisseurs bloquent les appels directs depuis un navigateur (CORS).</li>
          </ul>
        </Avis>
      </Reveal>

      <div className="mt-6 grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <Reveal rang={2}>
          <Plate etiquette="Connexion au modèle" repere="01 / 03">
            <div className="flex flex-col gap-4">
              <ChoixSegmente<Fournisseur> legende="Fournisseur" options={FOURNISSEURS} valeur={config.fournisseur} onChange={choisirFournisseur} />
              <ChampTexte libelle="URL de base de l’API" valeur={config.urlBase} onChange={(v) => majConfig({ urlBase: v })} />
              <ChampTexte libelle="Modèle" valeur={config.modele} onChange={(v) => majConfig({ modele: v })} />
              <div>
                <label htmlFor="cle-api" className="block text-[13px] font-semibold">
                  Clé d’API {config.fournisseur === 'openai_compatible' && <span className="font-normal text-muted">(facultative en local)</span>}
                </label>
                <input
                  id="cle-api"
                  type="password"
                  autoComplete="off"
                  className="field-input mono mt-1.5"
                  value={config.cle}
                  onChange={(e) => majConfig({ cle: e.target.value })}
                />
                {config.cle && (
                  <button type="button" onClick={oublierCle} className="mt-1.5 text-[12.5px] text-muted underline hover:text-ink">
                    Oublier la clé
                  </button>
                )}
              </div>
              <CaseACocher
                libelle="Demander une réponse au format JSON"
                description="Paramètre « response_format » ; à désactiver si le serveur ne le prend pas en charge."
                coche={config.modeJson}
                onChange={(v) => majConfig({ modeJson: v })}
              />
            </div>
          </Plate>
        </Reveal>

        <div className="flex min-w-0 flex-col gap-6">
          <Reveal rang={3}>
            <Plate
              etiquette="Notes d’atelier"
              repere="02 / 03"
              actions={
                <Button taille="sm" variante="discret" icone={<FileText className="size-3.5" aria-hidden="true" />} onClick={() => setNotes(NOTES_EXEMPLE)}>
                  Exemple de notes
                </Button>
              }
            >
              <ZoneTexte libelle="Notes brutes (compte rendu, verbatim, prise de notes)" lignes={10} valeur={notes} onChange={setNotes} />
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button
                  variante="primaire"
                  icone={<Sparkles className="size-4" aria-hidden="true" />}
                  onClick={generer}
                  disabled={enCours || !notes.trim() || (config.fournisseur === 'mistral' && !config.cle.trim())}
                >
                  {enCours ? 'Génération…' : 'Générer le brouillon'}
                </Button>
                {enCours && (
                  <Button taille="sm" onClick={() => annulation.current?.abort()}>
                    Annuler
                  </Button>
                )}
                <p className="text-[12.5px] text-muted" aria-live="polite">
                  {enCours ? 'Appel au modèle en cours…' : config.fournisseur === 'mistral' && !config.cle ? 'Renseignez une clé pour activer la génération.' : ''}
                </p>
              </div>
              {erreurs.length > 0 && (
                <div className="mt-4">
                  <Avis ton="danger" titre="Aucun brouillon créé" role="alert">
                    <ul className="list-disc pl-5">
                      {erreurs.map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                  </Avis>
                </div>
              )}
            </Plate>
          </Reveal>

          <AnimatePresence>
            {brouillon && (
              <motion.div
                initial={reduit ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={transition(DUREES.lent, 0, reduit)}
              >
                <Plate
                  etiquette="Brouillon à relire"
                  repere="03 / 03"
                  actions={
                    <>
                      <Button taille="sm" onClick={() => setBrouillon(null)}>
                        Abandonner
                      </Button>
                      <Button taille="sm" variante="primaire" onClick={creer} disabled={brouillon.titre.trim().length < 3}>
                        Créer la fiche
                      </Button>
                    </>
                  }
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <ChampTexte className="md:col-span-2" libelle="Intitulé" requis valeur={brouillon.titre} onChange={(v) => maj({ titre: v })} />
                    <ZoneTexte className="md:col-span-2" libelle="Résumé" lignes={2} valeur={brouillon.resume} onChange={(v) => maj({ resume: v })} />
                    <ZoneTexte libelle="Problème métier" lignes={3} valeur={brouillon.probleme} onChange={(v) => maj({ probleme: v })} />
                    <ZoneTexte libelle="Solution envisagée" lignes={3} valeur={brouillon.descriptionSolution} onChange={(v) => maj({ descriptionSolution: v })} />
                    <ChampTexte libelle="Processus concerné" valeur={brouillon.processus} onChange={(v) => maj({ processus: v })} />
                    <ChampSelection<TypologieId>
                      libelle="Typologie"
                      options={TYPOLOGIES}
                      vide="À préciser"
                      valeur={brouillon.typologie}
                      onChange={(v) => maj({ typologie: v })}
                    />
                    <ChampNombre libelle="Volume annuel (hypothèse)" valeur={brouillon.volumeAnnuel} onChange={(v) => maj({ volumeAnnuel: v })} />
                    <ChampNombre libelle="Temps unitaire (hypothèse)" unite="min" decimales={1} valeur={brouillon.tempsUnitaireMin} onChange={(v) => maj({ tempsUnitaireMin: v })} />
                  </div>
                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <ListeRetirable titre="Irritants" elements={brouillon.irritants} onRetirer={(i) => maj({ irritants: brouillon.irritants.filter((_, j) => j !== i) })} />
                    <ListeRetirable
                      titre="Personas"
                      elements={brouillon.personas.map((p) => `${p.nom}${p.besoin ? ` : ${p.besoin}` : ''}`)}
                      onRetirer={(i) => maj({ personas: brouillon.personas.filter((_, j) => j !== i) })}
                    />
                    <ListeRetirable
                      titre="Indicateurs"
                      elements={brouillon.kpis.map((k) => `${k.nom}${k.cible !== null ? ` (cible ${k.cible}${k.unite ? ` ${k.unite}` : ''})` : ''}`)}
                      onRetirer={(i) => maj({ kpis: brouillon.kpis.filter((_, j) => j !== i) })}
                    />
                    <ListeRetirable
                      titre="Risques"
                      elements={brouillon.risques.map((r) => r.description)}
                      onRetirer={(i) => maj({ risques: brouillon.risques.filter((_, j) => j !== i) })}
                    />
                    <ListeRetirable
                      titre="Questions ouvertes"
                      elements={brouillon.questionsOuvertes}
                      onRetirer={(i) => maj({ questionsOuvertes: brouillon.questionsOuvertes.filter((_, j) => j !== i) })}
                    />
                  </div>
                  <p className="mt-5 text-[12.5px] text-muted">
                    La fiche est créée au statut « Idée », sans scores ni qualification : complétez ensuite le scoring, l’AI Act, le RGPD et le business case.
                  </p>
                </Plate>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
