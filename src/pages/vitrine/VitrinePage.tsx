import { useInView } from 'motion/react';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { LIEN_DEPOT } from '../../app/liens';
import { useTitre } from '../../app/useTitre';
import { MonteCarloChart } from '../../charts/MonteCarloChart';
import { PriorityMatrix, type PointMatrice } from '../../charts/PriorityMatrix';
import { portefeuillesDemo } from '../../data/demo';
import { dateDuJour } from '../../domain/aiAct/calendar';
import { analyserPortefeuille } from '../../domain/analysis';
import { simulerMonteCarlo } from '../../domain/businessCase/uncertainty';
import { fmtEuroCompact, fmtNombre } from '../../domain/format';
import { ConfigScoringSchema } from '../../domain/model';
import { calculerScoring } from '../../domain/scoring/scoring';
import { ButtonLink } from '../../ui/Button';
import { Reveal } from '../../ui/Reveal';
import { VerdictAiAct } from '../cas/VerdictAiAct';
import { LigneMontage } from './LigneMontage';

function EnTeteSection({ numero, surTitre, titre }: { numero: string; surTitre: string; titre: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-t-2 border-ink pt-4 md:flex-row md:items-baseline md:gap-8">
      <p className="mono shrink-0 text-[13px] text-muted md:w-40">{numero} / 05</p>
      <div>
        <p className="label-caps">{surTitre}</p>
        <h2 className="mt-1 max-w-3xl text-[30px] leading-[1.08] font-semibold md:text-[40px]">{titre}</h2>
      </div>
    </div>
  );
}

export default function VitrinePage() {
  useTitre('');
  const demo = useMemo(() => portefeuillesDemo(), []);
  const analyses = useMemo(() => demo.map((p) => ({ p, a: analyserPortefeuille(p, dateDuJour()) })), [demo]);
  const banque = analyses[0];
  const tousCas = analyses.flatMap(({ a }) => a.cas);
  const stats = {
    cas: tousCas.length,
    hautRisque: tousCas.filter((c) => c.aiAct.niveauProvisoire === 'haut_risque').length,
    fria: tousCas.filter((c) => c.aiAct.fria).length,
    aipd: tousCas.filter((c) => c.rgpd.niveau === 'aipd_requise').length,
    vanNegatives: tousCas.filter((c) => c.businessCase.van < 0).length,
  };

  const casVerdict = banque?.a.cas.find((c) => c.cas.code === 'UC-BL-003');
  const casMonteCarlo = banque?.a.cas.find((c) => c.cas.code === 'UC-BL-004');
  const monteCarlo = useMemo(() => (casMonteCarlo ? simulerMonteCarlo(casMonteCarlo.cas.businessCase) : null), [casMonteCarlo]);

  const zoneVerdict = useRef<HTMLDivElement>(null);
  const verdictVisible = useInView(zoneVerdict, { once: true, margin: '0px 0px -20% 0px' });

  const [poidsFinancier, setPoidsFinancier] = useState(30);
  const points: PointMatrice[] = useMemo(() => {
    if (!banque) return [];
    const config = ConfigScoringSchema.parse({ poids: { impactFinancier: poidsFinancier } });
    return banque.a.cas.map((a) => {
      const s = calculerScoring(a.cas.scores, config);
      return {
        id: a.cas.id,
        code: a.cas.code,
        titre: a.cas.titre,
        valeur: s.valeur.note ?? 1,
        faisabilite: s.faisabilite.note ?? 1,
        van: a.businessCase.van,
        niveau: a.aiAct.niveau,
        quadrant: s.quadrant,
      };
    });
  }, [banque, poidsFinancier]);

  return (
    <div className="overflow-x-clip">
      {/* Ouverture : le produit en action dès le premier écran */}
      <section className="mx-auto grid max-w-[1240px] gap-10 px-4 pt-10 pb-16 md:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12 lg:pt-16">
        <div className="flex flex-col justify-center">
          <Reveal rang={0}>
            <p className="flex flex-wrap items-center gap-3">
              <span className="label-caps">Étude de cas · Business analysis IA</span>
              <span className="mono text-[11px] text-muted">FICHE N° 01</span>
            </p>
          </Reveal>
          <Reveal rang={1}>
            <h1 className="mt-4 text-[44px] leading-[0.98] font-bold tracking-[-0.01em] md:text-[64px]">
              AI Use Case
              <br />
              Factory
            </h1>
          </Reveal>
          <Reveal rang={2}>
            <p className="mt-5 max-w-xl font-display text-[21px] leading-snug font-medium text-ink md:text-[24px]">
              Cadrer, prioriser, chiffrer et sécuriser un portefeuille de cas d’usage IA.
            </p>
          </Reveal>
          <Reveal rang={3}>
            <p className="mt-4 max-w-xl text-[15.5px] text-muted">
              Un atelier pour Business Analyst : chaque idée d’IA passe par les mêmes postes de contrôle, du cadrage à la roadmap, et en ressort
              avec une décision argumentée, une qualification AI Act et RGPD, et un business case qui assume ses incertitudes.
            </p>
          </Reveal>
          <Reveal rang={4}>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink to="/atelier" variante="primaire" icone={<ArrowRight className="size-4" aria-hidden="true" />}>
                Ouvrir l’atelier
              </ButtonLink>
              <ButtonLink to="/methode">Lire la méthode</ButtonLink>
            </div>
            <a href={LIEN_DEPOT} className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-muted underline hover:text-ink">
              Code source sur GitHub <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          </Reveal>
        </div>
        <Reveal rang={2} className="min-w-0">
          {banque && <LigneMontage analyse={banque.a} nom={banque.p.nom} />}
        </Reveal>
      </section>

      {/* Bandeau de chiffres calculés */}
      <Reveal auDefilement>
        <div className="border-y border-ink bg-surface">
          <dl className="mx-auto grid max-w-[1240px] grid-cols-2 gap-y-5 px-4 py-6 md:grid-cols-5 md:px-6">
            {[
              [String(stats.cas), 'cas d’usage de démonstration'],
              ['3', 'organisations fictives'],
              [String(stats.hautRisque), 'cas à haut risque AI Act'],
              [String(stats.aipd), 'AIPD probables (RGPD)'],
              [String(stats.vanNegatives), 'VAN négatives à 3 ans'],
            ].map(([v, l]) => (
              <div key={l} className="border-l border-line pl-4">
                <dt className="sr-only">{l}</dt>
                <dd className="mono text-[32px] leading-none font-semibold">{v}</dd>
                <dd className="mt-1.5 text-[13px] text-muted">{l}</dd>
              </div>
            ))}
          </dl>
          <p className="mx-auto max-w-[1240px] px-4 pb-4 text-[12px] text-muted md:px-6">Valeurs calculées par l’application sur les données de démonstration, dont tous les chiffres d’entrée sont des hypothèses.</p>
        </div>
      </Reveal>

      <div className="mx-auto flex max-w-[1240px] flex-col gap-24 px-4 py-20 md:px-6">
        {/* 01 — Le problème */}
        <section aria-labelledby="titre-probleme">
          <Reveal auDefilement>
            <EnTeteSection numero="01" surTitre="Le problème" titre={<span id="titre-probleme">Trop d’idées d’IA, pas assez de critères pour trancher.</span>} />
          </Reveal>
          <div className="mt-10 grid gap-10 md:grid-cols-[10rem_1fr] md:gap-8">
            <div className="hidden md:block" />
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
              <Reveal auDefilement>
                <p className="text-[18px] leading-relaxed">
                  Dans une banque, une PME ou une collectivité, les idées d’IA arrivent plus vite que la capacité à les évaluer. Sans cadre commun,
                  on compare des projets qui n’ont rien en commun : un assistant conversationnel séduisant passe devant un contrôle documentaire
                  rentable, la conformité est découverte après le développement, et le business case se résume à un chiffre sans incertitude.
                </p>
              </Reveal>
              <ol className="flex flex-col">
                {[
                  ['Valeur non démontrée', 'Gains annoncés sans volumes, sans temps unitaires ni taux d’adoption.'],
                  ['Conformité tardive', 'AI Act et RGPD traités après le choix de la solution, au lieu de le guider.'],
                  ['Chiffres sans incertitude', 'Une VAN unique, alors que les hypothèses peuvent varier du simple au double.'],
                ].map(([titre, texte], i) => (
                  <Reveal key={titre} auDefilement rang={i} as="li">
                    <div className="grid grid-cols-[3rem_1fr] border-b border-line py-4">
                      <span className="mono text-[13px] text-muted">{String(i + 1).padStart(2, '0')}</span>
                      <span>
                        <span className="block font-display text-[17px] font-semibold uppercase">{titre}</span>
                        <span className="text-[14.5px] text-muted">{texte}</span>
                      </span>
                    </div>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* 02 — La méthode BA */}
        <section aria-labelledby="titre-methode">
          <Reveal auDefilement>
            <EnTeteSection numero="02" surTitre="La méthode" titre={<span id="titre-methode">Cinq postes, les mêmes pour chaque cas.</span>} />
          </Reveal>
          <ol className="mt-10 grid gap-0 md:grid-cols-5">
            {[
              ['Cadrer', 'Fiche en 11 sections', 'Problème, personas, données, SI, KPI, risques.'],
              ['Scorer', '12 critères notés de 1 à 5', 'Chaque niveau a un descripteur explicite.'],
              ['Qualifier', 'AI Act et RGPD', 'Verdict justifié, articles, obligations, échéances.'],
              ['Chiffrer', 'VAN, ROI, Monte Carlo', 'Sensibilité ±20 % et probabilité de VAN positive.'],
              ['Planifier', 'Roadmap et note de cadrage', 'Trois vagues, dépendances, export A4 et Markdown.'],
            ].map(([titre, livrable, texte], i) => (
              <Reveal key={titre} auDefilement rang={i} as="li">
                <div className="flex h-full flex-col border-t-4 border-ink bg-surface p-4 md:border-r md:border-r-line">
                  <span className="mono text-[12px] text-muted">POSTE {String(i + 1).padStart(2, '0')}</span>
                  <span className="mt-2 font-display text-[22px] font-bold uppercase">{titre}</span>
                  <span className="mt-1 text-[13.5px] font-semibold">{livrable}</span>
                  <span className="mt-2 text-[13.5px] text-muted">{texte}</span>
                </div>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* 03 — Le produit en action */}
        <section aria-labelledby="titre-produit">
          <Reveal auDefilement>
            <EnTeteSection numero="03" surTitre="Le produit en action" titre={<span id="titre-produit">De vrais composants, sur des données fictives.</span>} />
          </Reveal>

          <div className="mt-12 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <Reveal auDefilement>
              <h3 className="font-display text-[22px] font-semibold uppercase">Un verdict AI Act qui se justifie</h3>
              <p className="mt-3 text-[15.5px] text-muted">
                L’assistant de pré-analyse de Banque Lumen évalue la situation économique du demandeur : c’est un profilage. La dérogation
                « tâche préparatoire » de l’art. 6(3)(d) a été envisagée, puis écartée par la logique : le cas est à haut risque (annexe III,
                point 5 b), avec une FRIA et une échéance au 2 décembre 2027.
              </p>
              <p className="mt-3 text-[13px] text-muted">La qualification est une aide : elle ne constitue pas un avis juridique.</p>
            </Reveal>
            <div ref={zoneVerdict}>{casVerdict && <VerdictAiAct resultat={casVerdict.aiAct} reponses={casVerdict.cas.aiAct} compact declencher={verdictVisible} />}</div>
          </div>

          <div className="mt-16 grid items-start gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <div className="order-2 min-w-0 lg:order-1">{monteCarlo && <MonteCarloChart resultat={monteCarlo} />}</div>
            <Reveal auDefilement className="order-1 lg:order-2">
              <h3 className="font-display text-[22px] font-semibold uppercase">Un business case qui assume l’incertitude</h3>
              <p className="mt-3 text-[15.5px] text-muted">
                Le score d’aide à l’octroi affiche une VAN centrale positive de {casMonteCarlo ? fmtEuroCompact(casMonteCarlo.businessCase.van) : '–'}. Mais
                les hypothèses de coûts sont asymétriques (dépassements de charge plus probables que les économies) : la simulation de Monte Carlo
                le montre en direct, tirage après tirage.
              </p>
              {monteCarlo && (
                <p className="mt-3 text-[15.5px]">
                  Probabilité d’une VAN positive : <span className="mono font-semibold">{fmtNombre(monteCarlo.probaVanPositive * 100)} %</span>.
                </p>
              )}
            </Reveal>
          </div>

          <div className="mt-16 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
            <Reveal auDefilement>
              <h3 className="font-display text-[22px] font-semibold uppercase">Une priorisation qui se discute</h3>
              <p className="mt-3 text-[15.5px] text-muted">
                Les poids des critères sont des choix explicites. Augmentez le poids de l’impact financier : les cas les plus rentables montent dans
                la matrice, les autres descendent. Le comité voit l’effet de chaque arbitrage.
              </p>
              <div className="mt-6">
                <div className="flex items-baseline justify-between">
                  <label htmlFor="poids-financier" className="text-[14px] font-semibold">
                    Poids de l’impact financier
                  </label>
                  <span className="mono text-[13px]">{poidsFinancier}</span>
                </div>
                <input
                  id="poids-financier"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={poidsFinancier}
                  onChange={(e) => setPoidsFinancier(Number(e.target.value))}
                  className="mt-2 w-full accent-[var(--ink)]"
                />
                <p className="mt-1 text-[12.5px] text-muted">Démonstration locale : les poids du portefeuille ne sont pas modifiés.</p>
              </div>
            </Reveal>
            <div className="min-w-0">
              <PriorityMatrix
                points={points}
                seuilValeur={3}
                seuilFaisabilite={3}
                hauteur={380}
                titre="Matrice de priorisation · Banque Lumen"
                sousTitre="Forme = qualification AI Act ; taille = VAN sur 3 ans ; forme évidée = VAN négative."
              />
            </div>
          </div>
        </section>

        {/* 04 — Ce que vous obtenez */}
        <section aria-labelledby="titre-livrables">
          <Reveal auDefilement>
            <EnTeteSection numero="04" surTitre="Ce que vous obtenez" titre={<span id="titre-livrables">Des livrables prêts pour le comité.</span>} />
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-[10rem_1fr] md:gap-8">
            <div className="hidden md:block" />
            <ul className="grid gap-x-10 gap-y-6 md:grid-cols-2">
              {[
                ['Note de cadrage', 'A4 imprimable et Markdown : cartouche, 12 sections, décisions attendues.'],
                ['Matrice de priorisation', 'Valeur × faisabilité, filtres, pondération discutée en séance.'],
                ['Roadmap en trois vagues', 'Proposée selon scores, risques, dépendances et capacité ; ajustable.'],
                ['Qualifications tracées', 'AI Act et RGPD : verdict, justification, obligations, calendrier.'],
                ['Business case probabiliste', 'VAN, ROI, retour, TRI, tornado ±20 %, P10 / P50 / P90.'],
                ['Données portables', 'Export et import JSON validés, stockage local, aucun serveur.'],
              ].map(([titre, texte], i) => (
                <Reveal key={titre} auDefilement rang={i % 2} as="li">
                  <div className="grid grid-cols-[2.5rem_1fr] border-b border-line pb-4">
                    <span className="mono text-[12px] text-muted">{String(i + 1).padStart(2, '0')}</span>
                    <span>
                      <span className="block text-[16px] font-semibold">{titre}</span>
                      <span className="text-[14.5px] text-muted">{texte}</span>
                    </span>
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* 05 — Ouvrir l'atelier */}
        <section aria-labelledby="titre-atelier">
          <Reveal auDefilement>
            <EnTeteSection numero="05" surTitre="À vous" titre={<span id="titre-atelier">Ouvrez l’atelier avec trois portefeuilles prêts.</span>} />
          </Reveal>
          <Reveal auDefilement>
            <div className="mt-10 grid gap-6 md:grid-cols-[10rem_1fr] md:gap-8">
              <div className="hidden md:block" />
              <div className="plate flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[16px]">
                    Banque Lumen, Ardoise Bâtiment et la Ville de Port-Aurèle sont chargées au premier lancement. Tout est modifiable ; rien ne
                    quitte votre navigateur.
                  </p>
                  <p className="mt-2 text-[13px] text-muted">Organisations fictives. Les chiffres d’entrée sont des hypothèses, les résultats sont calculés.</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-3">
                  <ButtonLink to="/atelier" variante="primaire" icone={<ArrowRight className="size-4" aria-hidden="true" />}>
                    Ouvrir l’atelier
                  </ButtonLink>
                  <a
                    href={LIEN_DEPOT}
                    className="inline-flex min-h-10 items-center gap-2 rounded-[2px] border border-line-strong bg-surface px-4 font-display text-[12.5px] font-semibold tracking-[0.06em] uppercase hover:border-ink"
                  >
                    GitHub <ExternalLink className="size-4" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </div>
    </div>
  );
}
