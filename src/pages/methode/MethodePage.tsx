import type { ReactNode } from 'react';
import { useTitre } from '../../app/useTitre';
import { CAS_ANNEXE_III, DEROGATIONS_6_3, PRATIQUES_INTERDITES } from '../../domain/aiAct/catalog';
import { JALONS } from '../../domain/aiAct/calendar';
import { NIVEAUX_AI_ACT, type NiveauAiAct } from '../../domain/aiAct/qualification';
import { fmtDateLongue } from '../../domain/format';
import { CRITERES_AIPD } from '../../domain/rgpd/catalog';
import { AXES, CRITERES, QUADRANTS } from '../../domain/scoring/criteria';
import { EnTetePage } from '../../ui/bits';
import { Reveal } from '../../ui/Reveal';
import { SignalIcone } from '../../ui/signalShapes';
import { GlypheQuadrant } from '../../ui/Signals';

const SECTIONS = [
  { id: 'demarche', titre: 'Démarche' },
  { id: 'scoring', titre: 'Scoring multicritère' },
  { id: 'ai-act', titre: 'Qualification AI Act' },
  { id: 'rgpd', titre: 'Pré-analyse RGPD' },
  { id: 'business-case', titre: 'Business case' },
  { id: 'roadmap', titre: 'Roadmap' },
  { id: 'limites', titre: 'Limites' },
  { id: 'references', titre: 'Références' },
] as const;

function Section({ id, numero, titre, children }: { id: string; numero: number; titre: string; children: ReactNode }) {
  return (
    <Reveal auDefilement as="section">
      <div id={`methode-${id}`} className="scroll-mt-24 border-t-2 border-ink pt-5">
        <p className="mono text-[12px] text-muted">{String(numero).padStart(2, '0')} / {String(SECTIONS.length).padStart(2, '0')}</p>
        <h2 className="mt-1 text-[28px] font-semibold">{titre}</h2>
        <div className="mt-5 flex flex-col gap-5 text-[15px] leading-relaxed">{children}</div>
      </div>
    </Reveal>
  );
}

function Formule({ children }: { children: ReactNode }) {
  return <pre className="mono overflow-x-auto rounded-[2px] border border-line bg-surface px-4 py-3 text-[13px] leading-relaxed whitespace-pre">{children}</pre>;
}

const NIVEAUX_LEGENDE: NiveauAiAct[] = ['interdit', 'haut_risque', 'transparence', 'minimal', 'hors_champ', 'incomplet'];

export default function MethodePage() {
  useTitre('Méthode');
  return (
    <div className="mx-auto max-w-[1240px] px-4 py-8 md:px-6 md:py-10">
      <Reveal>
        <EnTetePage
          surTitre={<span className="label-caps">Documentation</span>}
          titre="Méthode"
          description="Le cadre utilisé par l’atelier : grilles de scoring, formules, logique de qualification AI Act et RGPD, modèle financier et règles de la roadmap. Les tableaux ci-dessous sont générés à partir du code : ils sont toujours à jour."
        />
      </Reveal>

      <div className="mt-8 grid gap-10 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <nav aria-label="Sommaire de la méthode" className="hidden lg:block">
          <ol className="sticky top-20 flex flex-col border-l border-line">
            {SECTIONS.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => document.getElementById(`methode-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="-ml-px flex w-full items-baseline gap-2 border-l-2 border-transparent py-1.5 pl-3 text-left text-[13px] text-muted hover:border-ink hover:text-ink"
                >
                  <span className="mono text-[11px]">{String(i + 1).padStart(2, '0')}</span>
                  {s.titre}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex min-w-0 flex-col gap-14">
          <Section id="demarche" numero={1} titre="Démarche">
            <p>
              L’atelier suit la démarche d’un Business Analyst IA : partir du problème métier, objectiver la valeur et la faisabilité, sécuriser
              la conformité, chiffrer avec ses incertitudes, puis planifier.
            </p>
            <ol className="grid gap-3 md:grid-cols-5">
              {[
                ['Cadrer', 'Fiche en 11 sections : problème, utilisateurs, données, SI, KPI, risques.'],
                ['Scorer', '12 critères notés de 1 à 5, avec un descripteur par niveau.'],
                ['Qualifier', 'AI Act (règlement 2024/1689 modifié) et RGPD (AIPD, art. 22).'],
                ['Chiffrer', 'Business case sur 3 ans, sensibilité et Monte Carlo.'],
                ['Planifier', 'Roadmap en 3 vagues et note de cadrage exportable.'],
              ].map(([titre, texte], i) => (
                <li key={titre} className="plate p-4">
                  <span className="mono text-[11px] text-muted">{String(i + 1).padStart(2, '0')}</span>
                  <p className="mt-1 font-display text-[16px] font-semibold uppercase">{titre}</p>
                  <p className="mt-1 text-[13.5px] text-muted">{texte}</p>
                </li>
              ))}
            </ol>
          </Section>

          <Section id="scoring" numero={2} titre="Scoring multicritère">
            <p>
              Chaque cas reçoit une note de 1 à 5 sur 12 critères répartis en trois axes. Pour la valeur et la faisabilité, 5 est le plus favorable ;
              pour le risque, 5 est le plus risqué. Les poids sont modifiables par portefeuille.
            </p>
            {AXES.map((axe) => (
              <div key={axe.id} className="overflow-x-auto">
                <table className="table-tech plate">
                  <caption className="px-3 py-2 text-left font-display text-[14px] font-semibold uppercase">
                    {axe.libelle} · poids par défaut dans la priorité : {axe.poidsDefaut} %
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Critère</th>
                      <th scope="col">Poids</th>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <th key={n} scope="col">
                          {n}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {CRITERES.filter((c) => c.axe === axe.id).map((c) => (
                      <tr key={c.id}>
                        <th scope="row" className="min-w-[9rem] text-left font-sans text-[13px] font-semibold tracking-normal text-ink normal-case">
                          {c.libelle}
                        </th>
                        <td className="mono">{c.poidsDefaut}</td>
                        {c.niveaux.map((n) => (
                          <td key={n} className="min-w-[8.5rem] text-[12.5px] text-muted">
                            {n}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            <Formule>{`Note d’axe (1 à 5)   = Σ (poids_i × note_i) / Σ poids_i
Note sur 100         = (note − 1) / 4 × 100
Priorité (0 à 100)   = 45 % × Valeur + 35 % × Faisabilité + 20 % × (100 − Risque)
Quadrant             = position (Faisabilité, Valeur) par rapport aux seuils (3 par défaut, bornes incluses)`}</Formule>
            <ul className="grid gap-3 md:grid-cols-2">
              {QUADRANTS.map((q) => (
                <li key={q.id} className="flex gap-3 border-l border-line pl-3">
                  <GlypheQuadrant quadrant={q.id} taille={18} />
                  <span>
                    <span className="font-semibold">{q.libelle}</span> : {q.description}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-[14px] text-muted">
              Une pratique interdite force le quadrant « À écarter ». Un risque moyen d’au moins 3,5 / 5 déclenche une alerte d’arbitrage.
            </p>
          </Section>

          <Section id="ai-act" numero={3} titre="Qualification AI Act">
            <p>
              Le questionnaire suit l’ordre du règlement (UE) 2024/1689, modifié par le règlement omnibus (UE) 2026/1744. Chaque réponse est
              tracée dans la justification du verdict.
            </p>
            <ol className="flex flex-col gap-2">
              {[
                'Champ d’application : exclusions de l’art. 2, définition du système d’IA (art. 3(1)).',
                'Rôle : fournisseur, déployeur ou les deux ; un déployeur qui modifie substantiellement le système devient fournisseur (art. 25).',
                `Pratiques interdites (art. 5) : ${PRATIQUES_INTERDITES.length} pratiques, dont 2 ajoutées par l’omnibus et applicables au 2 décembre 2026.`,
                `Haut risque (art. 6) : annexe I (composant de sécurité d’un produit réglementé) ou ${CAS_ANNEXE_III.filter((c) => c.hautRisque).length} cas de l’annexe III, avec l’exception de détection de fraude du point 5 b.`,
                `Dérogation de l’art. 6(3) : ${DEROGATIONS_6_3.length} conditions alternatives, jamais applicables en cas de profilage ; elle doit être documentée (art. 6(4)) et le système enregistré (art. 49(2)).`,
                'Transparence (art. 50), modèles à usage général (chapitre V), puis obligations du fournisseur (art. 16) et du déployeur (art. 26), FRIA (art. 27).',
              ].map((t, i) => (
                <li key={t} className="grid grid-cols-[2rem_1fr]">
                  <span className="mono text-[12px] text-muted">{String(i + 1).padStart(2, '0')}</span>
                  {t}
                </li>
              ))}
            </ol>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {NIVEAUX_LEGENDE.map((n) => (
                <li key={n} className="plate flex gap-3 p-3">
                  <SignalIcone niveau={n} taille={26} />
                  <span>
                    <span className="block font-display text-[14px] font-semibold uppercase">{NIVEAUX_AI_ACT[n].libelle}</span>
                    <span className="text-[13px] text-muted">{NIVEAUX_AI_ACT[n].description}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="overflow-x-auto">
              <table className="table-tech plate">
                <caption className="px-3 py-2 text-left font-display text-[14px] font-semibold uppercase">Calendrier d’application (à jour au 1er novembre 2026)</caption>
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Jalon</th>
                    <th scope="col">Détail</th>
                  </tr>
                </thead>
                <tbody>
                  {JALONS.map((j) => (
                    <tr key={j.id}>
                      <td className="mono whitespace-nowrap">{fmtDateLongue(j.date)}</td>
                      <td className="font-medium">{j.titre}</td>
                      <td className="text-[13px] text-muted">
                        {j.detail}
                        {j.prudence && <span className="block italic">{j.prudence}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="border-l-4 border-sig-yellow bg-sig-yellow-soft px-4 py-3 text-[14px]">
              Aide à la qualification, ne constitue pas un avis juridique. Les dates de l’omnibus proviennent de synthèses publiées après sa
              publication au Journal officiel (24 juillet 2026) : à confirmer dans le texte consolidé.
            </p>
          </Section>

          <Section id="rgpd" numero={4} titre="Pré-analyse RGPD">
            <p>
              Si des données personnelles sont traitées, l’atelier vérifie les données sensibles (art. 9), les décisions exclusivement
              automatisées à effet juridique ou significatif (art. 22) et la nécessité d’une analyse d’impact (AIPD, art. 35).
            </p>
            <ol className="grid gap-2 md:grid-cols-3">
              {CRITERES_AIPD.map((c) => (
                <li key={c.id} className="plate p-3 text-[13.5px]">
                  <span className="mono text-[11px] text-muted">CRITÈRE {c.numero}</span>
                  <p className="font-semibold">{c.libelle}</p>
                  <p className="text-muted">{c.description}</p>
                </li>
              ))}
            </ol>
            <Formule>{`AIPD probablement requise  si  liste CNIL  ou  nombre de critères WP248 ≥ 2
AIPD à documenter          si  1 critère
AIPD non requise a priori  si  0 critère`}</Formule>
            <p className="text-[14px] text-muted">
              Vigilance : un score qui pèse de manière déterminante sur une décision humaine peut relever de l’art. 22 (CJUE, 7 décembre 2023,
              SCHUFA, C-634/21).
            </p>
          </Section>

          <Section id="business-case" numero={5} titre="Business case">
            <Formule>{`Gains productivité(a) = V × (t / 60) × p × c × adoption(a)
Gains qualité(a)      = Q × adoption(a)
Build (année 0)       = jours × TJM + autres coûts ponctuels
Run(a)                = infra + maintenance % × Build + coût LLM(a) + autres coûts récurrents
Coût LLM(a)           = V × adoption(a) × requêtes × tokens × prix / 1 000 000
VAN                   = − Build + Σ (gains(a) − run(a)) / (1 + i)^a      a = 1 à 3
ROI                   = (Σ gains − Σ coûts) / Σ coûts                    (non actualisé)
Délai de retour       = instant où le cumul non actualisé devient positif (interpolation linéaire)
TRI                   = taux i tel que VAN(i) = 0 (dichotomie)`}</Formule>
            <p>
              <span className="font-semibold">Sensibilité :</span> chaque paramètre varie seul de −20 % et +20 % ; les paramètres sont classés
              par amplitude de VAN (diagramme en tornade). Les parts (adoption, part automatisable) restent plafonnées à 100 %.
            </p>
            <p>
              <span className="font-semibold">Monte Carlo :</span> à chaque tirage, chaque paramètre reçoit un facteur tiré selon une loi
              triangulaire (bas, mode = 1, haut). Le générateur pseudo-aléatoire mulberry32 est initialisé par une graine : même graine, mêmes
              résultats. Les centiles P10, P50 et P90 sont interpolés linéairement.
            </p>
            <p className="text-[14px] text-muted">
              Les prix des modèles de langage sont des hypothèses éditables, jamais la grille tarifaire d’un fournisseur.
            </p>
          </Section>

          <Section id="roadmap" numero={6} titre="Roadmap">
            <ul className="flex list-disc flex-col gap-2 pl-5">
              <li>Hors roadmap : cas écarté, pratique interdite, quadrant « À écarter » ou scoring incomplet.</li>
              <li>Vague minimale : Quick win en vague 1, projet stratégique en vague 2 (vague 3 si faisabilité inférieure à 2,5), cas à explorer en vague 3.</li>
              <li>Haut risque AI Act ou risque global d’au moins 3,5 : vague 2 au plus tôt, pour laisser le temps de la mise en conformité.</li>
              <li>Un cas est planifié strictement après ses prérequis ; les dépendances circulaires sont signalées.</li>
              <li>Capacité par vague (3 cas par défaut) : les cas éligibles sont retenus par priorité décroissante, le surplus glisse à la vague suivante.</li>
              <li>Un ajustement manuel remplace la proposition ; les incohérences sont signalées, jamais bloquées.</li>
            </ul>
          </Section>

          <Section id="limites" numero={7} titre="Limites">
            <ul className="flex list-disc flex-col gap-2 pl-5">
              <li>La qualification juridique est une aide : elle ne remplace ni un juriste ni le DPO.</li>
              <li>Le business case est un modèle simplifié sur 3 ans, sans fiscalité ni valeur terminale.</li>
              <li>Les données de démonstration décrivent des organisations fictives ; tous leurs chiffres sont des hypothèses.</li>
              <li>Les données restent dans le navigateur : exportez-les en JSON pour les sauvegarder ou les partager.</li>
            </ul>
          </Section>

          <Section id="references" numero={8} titre="Références">
            <ul className="flex flex-col gap-2 text-[14px]">
              {[
                ['Règlement (UE) 2024/1689 sur l’intelligence artificielle', 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj'],
                ['Règlement (UE) 2026/1744 (omnibus numérique sur l’IA)', 'https://eur-lex.europa.eu/eli/reg/2026/1744/oj'],
                ['Règlement (UE) 2016/679 (RGPD)', 'https://eur-lex.europa.eu/eli/reg/2016/679/oj'],
                ['Lignes directrices WP248 rév.01 sur l’AIPD, approuvées par le CEPD', 'https://ec.europa.eu/newsroom/article29/items/611236'],
                ['CNIL : liste des traitements pour lesquels une AIPD est requise', 'https://www.cnil.fr/fr/liste-traitements-aipd-requise'],
                ['CJUE, 7 décembre 2023, SCHUFA Holding, C-634/21', 'https://curia.europa.eu/juris/liste.jsf?num=C-634/21'],
              ].map(([libelle, url]) => (
                <li key={url}>
                  <a href={url} className="text-action underline">
                    {libelle}
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-[14px] text-muted">Le détail des sources et de la vérification des dates figure dans docs/qualification-ai-act.md du dépôt.</p>
          </Section>
        </div>
      </div>
    </div>
  );
}
