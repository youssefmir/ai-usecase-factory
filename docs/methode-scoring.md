# Méthode de scoring et de priorisation

Ce document décrit comment l’atelier note, classe et planifie les cas d’usage. Toutes les règles sont implémentées dans `src/domain/scoring/` et `src/domain/roadmap/`, et vérifiées par les tests `scoring.test.ts`, `roadmap.test.ts` et `demo.test.ts`.

## Principes

- **Une grille commune** : douze critères, notés de 1 à 5, répartis en trois axes (valeur, faisabilité, risque).
- **Un descripteur par niveau** : chaque note correspond à une phrase observable, pour que deux évaluateurs notent de la même façon.
- **Des poids explicites** : modifiables par portefeuille (page *Paramètres* ou curseurs de la matrice), ils matérialisent les arbitrages du comité.
- **Un score expliqué** : l’outil affiche la contribution de chaque critère et génère une explication en clair.

## Grilles de notation

Convention : pour la valeur et la faisabilité, 5 est le plus favorable ; pour le risque, 5 est le plus risqué. Les poids par défaut totalisent 100 sur chaque axe.

### Valeur (5 = valeur la plus forte ; 45 % du score de priorité)

| Critère | Poids | 1 | 2 | 3 | 4 | 5 |
|---|---:|---|---|---|---|---|
| Impact financier | 30 | Gain négligeable ou impossible à démontrer | Gain limité, local à une équipe | Gain significatif sur un processus, mesurable | Gain important à l’échelle d’une direction ou d’un métier | Gain majeur, visible dans les comptes de l’organisation |
| Impact client / usager | 25 | Aucun effet perceptible pour le client ou l’usager | Effet indirect et limité (qualité interne) | Amélioration perceptible d’un parcours | Amélioration nette et mesurable d’un parcours clé | Transformation de l’expérience sur un parcours majeur |
| Alignement stratégique | 25 | Hors des priorités affichées | Lien faible ou indirect avec la stratégie | Contribue à un objectif stratégique identifié | Contribue directement à une priorité de l’année | Porté par la direction générale, condition de réussite de la stratégie |
| Urgence | 20 | Aucune échéance, peut attendre | Souhaitable dans les 18 mois | Attendu sous 12 mois (pression métier) | Échéance externe ou réglementaire sous 6 à 12 mois | Problème critique en cours (pertes, saturation, non-conformité) |

### Faisabilité (5 = le plus facile à réaliser ; 35 % du score de priorité)

| Critère | Poids | 1 | 2 | 3 | 4 | 5 |
|---|---:|---|---|---|---|---|
| Maturité des données | 35 | Données inexistantes ou inaccessibles | Données dispersées, qualité inconnue, à constituer | Données disponibles mais à nettoyer ou à annoter | Données disponibles, historisées, de qualité correcte | Données prêtes, documentées et gouvernées |
| Complexité technique | 25 | Recherche : aucun précédent, performance incertaine | Complexe : modèle sur mesure, exigence de performance élevée | Modérée : techniques éprouvées à adapter au contexte | Faible : solution standard à paramétrer | Très faible : solution sur étagère, déjà éprouvée en interne |
| Intégration SI | 20 | Refonte de systèmes cœur nécessaire | Intégration lourde à plusieurs systèmes, API inexistantes | Intégration à un système, API à développer | API existantes, intégration simple | Fonctionne de manière autonome ou intégration native |
| Compétences | 20 | Aucune compétence interne, marché tendu | Compétences à recruter ou à acheter en totalité | Compétences partielles, accompagnement externe requis | Équipe interne compétente, appui ponctuel | Équipe interne expérimentée et disponible |

### Risque (5 = le plus risqué ; 20 % du score de priorité)

| Critère | Poids | 1 | 2 | 3 | 4 | 5 |
|---|---:|---|---|---|---|---|
| Risque réglementaire | 30 | Aucun enjeu réglementaire spécifique | Obligations générales (RGPD standard, maîtrise de l’IA) | Obligations de transparence ou AIPD probable | Système à haut risque ou décision automatisée encadrée (art. 22 RGPD) | Pratique potentiellement interdite ou incertitude juridique majeure |
| Risque éthique et biais | 25 | Aucun impact sur des personnes | Impact indirect, biais peu probable | Décisions concernant des personnes, biais possible mais contrôlable | Décisions significatives, risque de discrimination à surveiller | Effets lourds sur des personnes vulnérables, risque de discrimination élevé |
| Risque opérationnel | 25 | Erreur sans conséquence, facilement corrigée | Erreur gênante, détectée par le processus | Erreur coûteuse, contrôle humain nécessaire | Erreur grave (financière, juridique), difficile à détecter | Erreur critique : continuité d’activité ou sécurité en jeu |
| Risque d’adoption | 20 | Utilisateurs demandeurs, pratiques peu modifiées | Accueil favorable, formation légère | Changement de pratiques modéré, accompagnement nécessaire | Changement important, résistances attendues | Rejet probable sans transformation profonde de l’organisation |

Deux repères aident à noter sans remplacer le jugement :

- **Impact financier** : la fiche affiche les gains annuels et la VAN calculés par le business case.
- **Risque réglementaire** : une note est suggérée à partir des qualifications (pratique interdite = 5, haut risque ou décision automatisée = 4, transparence ou AIPD probable = 3, risque minimal = 2, hors champ = 1).

## Formules

```text
Note d’axe (1 à 5)  = Σ (poids_i × note_i) / Σ poids_i       (moyenne pondérée)
Note sur 100        = (note − 1) / 4 × 100
Priorité (0 à 100)  = p_V × Valeur + p_F × Faisabilité + p_R × (100 − Risque)
                      avec p_V, p_F, p_R = poids des axes / somme des poids (45, 35, 20 par défaut)
```

- Si tous les poids d’un axe valent 0, la moyenne redevient une moyenne simple (pondération égale).
- Tant qu’un critère n’est pas noté, l’axe n’a pas de note et la priorité n’est pas calculée : une note partielle serait trompeuse.

## Quadrants

La position (faisabilité, valeur) est comparée à deux seuils (3 par défaut, bornes incluses côté « élevé ») :

| Quadrant | Condition | Lecture |
|---|---|---|
| Quick win | valeur ≥ seuil et faisabilité ≥ seuil | À lancer rapidement |
| Projet stratégique | valeur ≥ seuil et faisabilité < seuil | À préparer (données, intégration, compétences) |
| À explorer | valeur < seuil et faisabilité ≥ seuil | Expérimentation opportuniste |
| À écarter | valeur < seuil et faisabilité < seuil | Ne pas engager en l’état |

Règles complémentaires :

- une **pratique interdite** par l’AI Act force le quadrant « À écarter », quel que soit le score ;
- un **risque moyen d’au moins 3,5 / 5** déclenche une alerte « arbitrage du comité requis ».

## Explication générée

Pour chaque axe, l’outil cite les critères notés 4 ou 5 (« portée par… ») et ceux notés 1 ou 2 (« freinée par… »), puis détaille le calcul de la priorité. Exemple réel, calculé sur le cas de démonstration UC-BL-003 (assistant de pré-analyse, Banque Lumen, organisation fictive) :

```text
Valeur 3,8/5 (70/100) : portée par alignement stratégique (5/5) et impact financier (4/5).
Faisabilité 2,6/5 (39/100) : freinée par compétences (2/5) et complexité technique (2/5).
Risque 3,3/5 (58/100) : principaux facteurs risque réglementaire (4/5) et risque éthique et biais (3/5).
Valeur ≥ 3,0 et faisabilité < 3,0 : quadrant « Projet stratégique ».
Priorité 54/100 = 45 % × valeur 70 + 35 % × faisabilité 39 + 20 % × (100 − risque 58).
```

## Roadmap en trois vagues

La proposition automatique (`src/domain/roadmap/roadmap.ts`) applique, dans l’ordre :

1. **Exclusions** : statut « écarté », pratique interdite, quadrant « À écarter » ou scoring incomplet : le cas reste hors roadmap.
2. **Vague minimale** : Quick win en vague 1 ; projet stratégique en vague 2 (vague 3 si la faisabilité est inférieure à 2,5) ; cas à explorer en vague 3.
3. **Prudence** : un cas à haut risque AI Act, ou dont le risque moyen atteint 3,5, ne démarre pas avant la vague 2 (temps de la mise en conformité).
4. **Dépendances** : un cas est planifié strictement après ses prérequis ; les dépendances circulaires sont signalées et bloquent la planification des cas concernés.
5. **Capacité** : chaque vague accueille au plus N cas (3 par défaut), retenus par score de priorité décroissant ; le surplus glisse vers la vague suivante, puis « au-delà de 18 mois ».
6. **Ajustement manuel** : il remplace la proposition. Les incohérences (prérequis non planifié ou planifié trop tard, haut risque en vague 1, surcapacité) sont signalées, jamais bloquées.

| Vague | Fenêtre |
|---|---|
| Vague 1 | 0 à 3 mois |
| Vague 2 | 3 à 9 mois |
| Vague 3 | 9 à 18 mois |

La frise affiche les échéances AI Act utiles au portefeuille (par exemple le 2 décembre 2027 pour les systèmes à haut risque de l’annexe III) et un bandeau de danger jaune et noir sur les lots à haut risque.

## Limites

- Les notes restent des jugements d’experts : la grille les rend comparables et discutables, pas objectives.
- Les poids par défaut sont un point de départ ; ils doivent être validés par le comité qui arbitre le portefeuille.
- La capacité par vague est exprimée en nombre de cas, pas en charge : c’est une simplification assumée.
