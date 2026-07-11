# Modèle de business case

Le business case estime, sur trois ans, ce qu’un cas d’usage rapporte et coûte, puis mesure la robustesse du résultat. Il est implémenté dans `src/domain/businessCase/` et vérifié par `finance.test.ts` (valeurs de référence calculées à la main) et `uncertainty.test.ts` (sensibilité et Monte Carlo).

## Entrées

Chaque entrée porte une **provenance** affichée dans l’interface : *hypothèse*, *estimation métier* ou *mesure*. Toutes les valeurs des portefeuilles de démonstration sont des hypothèses.

| Notation | Entrée | Unité |
|---|---|---|
| V | Volume annuel traité | unités / an |
| t | Temps unitaire actuel | minutes |
| p | Part du temps économisée par la solution | 0 à 100 % |
| c | Coût horaire chargé | € / h |
| a₁, a₂, a₃ | Taux d’adoption des années 1, 2 et 3 | 0 à 100 % |
| Q | Gains qualité à pleine adoption (pertes évitées, revenus) | € / an |
| j, TJM | Charge de build et taux journalier moyen | jours, € / jour |
| A | Autres coûts ponctuels (licences, étiquetage, conformité) | € |
| I | Infrastructure et licences | € / an |
| m | Maintenance en part du build | % / an |
| R | Autres coûts récurrents (supervision, contrôle qualité) | € / an |
| r, k, π | Requêtes LLM par unité, tokens par requête, prix par million de tokens | –, –, € |
| i | Taux d’actualisation | % |

Le prix des modèles de langage est une **hypothèse éditable**, jamais présentée comme la grille tarifaire d’un fournisseur.

## Formules

```text
Build (année 0)          B = j × TJM + A
Gains de l'année n       G(n) = V × (t / 60) × p × c × a(n)  +  Q × a(n)
Coût LLM de l'année n    L(n) = V × a(n) × r × k × π / 1 000 000
Run de l'année n         C(n) = I + m × B + L(n) + R
Flux net                 F(0) = −B ;  F(n) = G(n) − C(n)   pour n = 1, 2, 3
VAN                      VAN = Σ F(n) / (1 + i)^n           pour n = 0 à 3
ROI (non actualisé)      ROI = (Σ G(n) − (B + Σ C(n))) / (B + Σ C(n))
Délai de retour          instant où le cumul de F devient positif, flux supposés réguliers dans l'année
TRI                      taux i* tel que VAN(i*) = 0, cherché par dichotomie entre −99 % et 1 000 %
```

Conventions :

- les parts (p, a) sont plafonnées à 100 % ;
- la maintenance est calculée sur le build total ;
- le ROI vaut « – » si aucun coût n’est saisi, le délai de retour « au-delà de 3 ans » si le cumul reste négatif, le TRI « – » s’il n’existe pas sur l’intervalle.

## Exemple calculé à la main

C’est le cas de référence des tests (`src/domain/businessCase/fixtures.ts`).

| Entrée | Valeur |
|---|---|
| Volume, temps, part économisée, coût horaire | 10 000 dossiers / an, 30 min, 50 %, 50 € / h |
| Adoption | 50 % / 80 % / 100 % |
| Gains qualité | 20 000 € / an |
| Build | 60 jours × 600 € + 4 000 € = 40 000 € |
| Run | infrastructure 6 000 € / an, maintenance 15 %, LLM : 2 requêtes × 3 000 tokens à 5 € le million |
| Actualisation | 10 % |

| Année | Gains | Coûts de run | Flux net | Cumul |
|---|---:|---:|---:|---:|
| 0 | – | – | −40 000 € | −40 000 € |
| 1 | 72 500 € | 12 150 € | 60 350 € | 20 350 € |
| 2 | 116 000 € | 12 240 € | 103 760 € | 124 110 € |
| 3 | 145 000 € | 12 300 € | 132 700 € | 256 810 € |

Détail de l’année 1 : gains = 10 000 × 0,5 h × 50 % × 50 € × 50 % + 20 000 € × 50 % = 62 500 € + 10 000 € ; coûts = 6 000 € + 15 % × 40 000 € + 300 € × 50 % = 12 150 €.

Résultats attendus (et obtenus par le code) :

- **VAN** = −40 000 + 60 350 / 1,1 + 103 760 / 1,21 + 132 700 / 1,331 = **200 315,18 €** ;
- **ROI** = (333 500 − 76 690) / 76 690 = **334,9 %** ;
- **Délai de retour** = 40 000 / 60 350 × 12 = **7,95 mois** ;
- le **TRI** annule la VAN des flux (vérifié par le test).

## Sensibilité (diagramme en tornade)

Chaque paramètre varie seul de −20 % puis de +20 %, les autres restant à leur valeur centrale. Les paramètres sont triés par amplitude de VAN : les premiers sont ceux qu’il faut fiabiliser en priorité. Les paramètres nuls ou sans objet (prix des tokens sans LLM) sont ignorés.

Propriétés vérifiées par les tests : écarts symétriques pour un paramètre linéaire (volume) ; effet exact d’une hausse du TJM (+7 200 € de build et +1 080 € de maintenance par an, actualisés).

## Monte Carlo

- À chaque tirage, chaque paramètre actif reçoit un **facteur multiplicatif** tiré selon une **loi triangulaire** (bas, mode = 1, haut). Les bornes sont relatives et modifiables par paramètre ; les données de démonstration utilisent des bornes asymétriques qui reflètent les biais d’estimation habituels (dépassement de charge plus probable qu’une économie, adoption et gains souvent surestimés).
- Tirage par inversion de la fonction de répartition : `x = b + √(u (h − b)(m − b))` si `u < (m − b)/(h − b)`, sinon `x = h − √((1 − u)(h − b)(h − m))`.
- Générateur pseudo-aléatoire **mulberry32** initialisé par une graine : même graine, mêmes résultats (test de reproductibilité).
- Sorties : **P10, P50, P90** de la VAN (interpolation linéaire entre rangs), moyenne, **probabilité que la VAN soit positive**, histogramme à pas rond dont une borne tombe sur 0.
- L’adoption reçoit un seul facteur appliqué aux trois années (corrélation parfaite entre années, hypothèse prudente).

L’écran rejoue l’échantillonnage : les tirages, déjà calculés, sont versés un à un dans des classes fixes et les centiles se stabilisent sous les yeux de l’utilisateur. Le résultat final est identique à celui du calcul direct (test dédié).

## Limites

- Horizon de trois ans, sans valeur terminale ni fiscalité : le modèle favorise les projets rapides à rentabiliser, ce qui est assumé pour un premier arbitrage.
- Les paramètres incertains sont indépendants entre eux (hors adoption).
- Les gains non monétaires (qualité de service public, conformité) ne sont pas valorisés : ils sont portés par le scoring.
