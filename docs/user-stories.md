# Backlog produit : épopées, user stories et critères d’acceptation

Ce backlog applique au produit lui-même la démarche proposée aux utilisateurs : épopées, user stories au format INVEST (indépendante, négociable, valorisable, estimable, petite, testable), critères d’acceptation en Gherkin et priorisation MoSCoW (*Must*, *Should*, *Could*, *Won’t* pour cette version). Les personas sont décrites dans [personas.md](personas.md) ; la correspondance avec les tests figure dans [plan-de-recette.md](plan-de-recette.md).

## Synthèse

| Épopée | Objectif | Stories | Priorité dominante |
|---|---|---|---|
| E1 Portefeuilles | Organiser et partager les cas | US-01 à US-04 | Must |
| E2 Cadrage | Décrire un cas de façon comparable | US-05 à US-07 | Must |
| E3 Priorisation | Noter, comparer, arbitrer | US-08 à US-11 | Must |
| E4 Conformité | Qualifier AI Act et RGPD | US-12 à US-15 | Must |
| E5 Business case | Chiffrer avec ses incertitudes | US-16 à US-19 | Must / Should |
| E6 Planification et restitution | Roadmap et note de cadrage | US-20 à US-23 | Must / Should |
| E7 Assistant de saisie | Accélérer la saisie après atelier | US-24, US-25 | Could |
| E8 Socle | Accessibilité, thème, hors ligne | US-26 à US-29 | Must / Should |

Estimation en points relatifs (suite de Fibonacci).

## E1 Portefeuilles

### US-01 Créer et gérer des portefeuilles · Must · 3 pts
En tant que **Business Analyst**, je veux créer, dupliquer et supprimer des portefeuilles afin de séparer les missions et de tester des variantes.

```gherkin
Scénario : dupliquer un portefeuille
  Étant donné le portefeuille « Banque Lumen » avec 6 cas
  Quand je clique sur « Dupliquer »
  Alors un portefeuille « Banque Lumen (copie) » apparaît avec 6 cas
  Et les dépendances entre cas pointent vers les cas de la copie

Scénario : suppression confirmée
  Quand je supprime un portefeuille
  Alors une confirmation indique le nombre de cas supprimés
```

### US-02 Importer et exporter en JSON · Must · 3 pts
En tant que **Business Analyst**, je veux exporter et importer un portefeuille en JSON afin de le sauvegarder et de le partager.

```gherkin
Scénario : import invalide refusé
  Étant donné un fichier JSON dont un score vaut 9
  Quand je l’importe
  Alors l’import est refusé
  Et le message indique « cas[0].scores.urgence : Trop grand : nombre doit être <=5 »

Scénario : aller-retour sans perte
  Quand j’exporte puis réimporte un portefeuille
  Alors son contenu est identique
```

### US-03 Disposer de portefeuilles de démonstration · Must · 5 pts
En tant que **recruteur ou prospect**, je veux trois portefeuilles fictifs complets afin d’évaluer l’outil sans saisie.

```gherkin
Scénario : premier lancement
  Étant donné un navigateur sans données
  Quand j’ouvre l’atelier
  Alors Banque Lumen, Ardoise Bâtiment et Ville de Port-Aurèle sont listés
  Et chacun porte la mention « Fictif »
  Et toutes les valeurs chiffrées d’entrée sont étiquetées « hypothèse »
```

### US-04 Travailler sans stockage fiable · Must · 2 pts
En tant qu’**utilisateur en navigation privée**, je veux que l’outil fonctionne même si le stockage local est bloqué afin de ne pas être interrompu.

```gherkin
Scénario : stockage indisponible
  Étant donné un navigateur qui refuse l’écriture locale
  Quand je modifie un cas
  Alors la modification est conservée pendant la session
  Et un bandeau m’invite à exporter mes portefeuilles
```

## E2 Cadrage

### US-05 Renseigner une fiche structurée · Must · 8 pts
En tant que **Business Analyst**, je veux une fiche en sections (problème, personas, situation actuelle, solution, données, SI, KPI, parties prenantes, dépendances, risques) afin de cadrer tous les cas de la même façon.

```gherkin
Scénario : ajout d’un risque
  Quand j’ajoute un risque de probabilité 3 et d’impact 2
  Alors sa criticité affichée vaut 6 / 9
```

### US-06 Partager les volumes avec le business case · Should · 2 pts
En tant que **Business Analyst**, je veux que le volume et le temps unitaire saisis dans la situation actuelle alimentent le business case afin d’éviter les doubles saisies.

```gherkin
Scénario : valeur partagée
  Quand je modifie le volume annuel dans la fiche
  Alors l’onglet Business case affiche le même volume et une VAN recalculée
```

### US-07 Qualifier la provenance des chiffres · Must · 2 pts
En tant que **sponsor**, je veux savoir si un chiffre est une hypothèse, une estimation métier ou une mesure afin de juger la fiabilité du business case.

```gherkin
Scénario : hypothèses signalées
  Étant donné un cas dont 16 entrées sont des hypothèses
  Quand j’ouvre son business case
  Alors un avertissement indique « 16 valeur(s) d’entrée étiquetée(s) « hypothèse » »
```

## E3 Priorisation

### US-08 Noter avec des descripteurs explicites · Must · 5 pts
En tant que **Business Analyst**, je veux noter douze critères de 1 à 5 avec un descripteur par niveau afin d’obtenir des notes comparables entre évaluateurs.

```gherkin
Scénario : descripteur affiché
  Quand je note « Maturité des données » à 3
  Alors le descripteur « Données disponibles mais à nettoyer ou à annoter » s’affiche
```

### US-09 Comprendre le score · Must · 3 pts
En tant que **sponsor**, je veux une explication du score afin de discuter les arbitrages.

```gherkin
Scénario : explication générée
  Étant donné le cas UC-BL-003
  Quand j’ouvre l’onglet Scoring
  Alors je lis « Faisabilité 2,6/5 (39/100) : freinée par compétences (2/5) et complexité technique (2/5) »
```

### US-10 Ajuster les pondérations · Should · 3 pts
En tant que **responsable de portefeuille**, je veux modifier les poids et les seuils afin de refléter la stratégie de l’organisation.

```gherkin
Scénario : les cas glissent dans la matrice
  Étant donné la matrice de Banque Lumen
  Quand j’augmente le poids de l’impact financier
  Alors les cas changent de position avec une animation
  Et les quadrants sont recalculés
```

### US-11 Visualiser la matrice valeur × faisabilité · Must · 5 pts
En tant que **comité**, je veux une matrice où la taille indique la VAN et la forme la qualification AI Act afin de voir d’un coup d’œil valeur, faisabilité et risque.

```gherkin
Scénario : accès à la fiche depuis la matrice
  Quand je clique sur le point « BL-001 »
  Alors la fiche « Contrôle automatique de complétude des dossiers à la soumission » s’ouvre

Scénario : équivalent accessible
  Quand j’active « Données »
  Alors un tableau liste chaque cas avec sa valeur, sa faisabilité et sa VAN
```

## E4 Conformité

### US-12 Qualifier un cas au regard de l’AI Act · Must · 8 pts
En tant que **DPO**, je veux un questionnaire guidé qui produit un niveau de risque justifié afin d’anticiper les obligations.

```gherkin
Scénario : solvabilité avec profilage
  Étant donné un cas relevant de l’annexe III, point 5 b
  Et un système qui effectue un profilage
  Quand je consulte le verdict
  Alors le niveau est « Haut risque »
  Et la justification indique que la dérogation de l’art. 6(3) est exclue
  Et une FRIA est requise

Scénario : détection de fraude
  Étant donné le sous-cas « Détection de fraudes financières »
  Alors le niveau n’est pas « Haut risque »
  Et un avertissement rappelle les limites de l’exception
```

### US-13 Connaître les obligations et le calendrier · Must · 5 pts
En tant que **DPO**, je veux les obligations par acteur et les dates applicables afin de planifier la mise en conformité.

```gherkin
Scénario : échéance haut risque
  Étant donné un système à haut risque de l’annexe III
  Alors l’échéance clé affichée est le 2 décembre 2027
  Et chaque obligation indique si elle me concerne selon mon rôle
```

### US-14 Pré-analyser le RGPD · Must · 5 pts
En tant que **DPO**, je veux savoir si une AIPD est probablement requise afin de la lancer à temps.

```gherkin
Scénario : seuil de deux critères
  Étant donné deux critères WP248 cochés
  Alors le résultat est « AIPD probablement requise »

Scénario : score déterminant
  Étant donné un score qui pèse de manière déterminante sur la décision humaine
  Alors un point de vigilance cite l’arrêt CJUE C-634/21
```

### US-15 Afficher la mention de prudence juridique · Must · 1 pt
En tant qu’**éditeur de l’outil**, je veux que chaque verdict rappelle qu’il ne constitue pas un avis juridique afin d’éviter toute confusion.

```gherkin
Scénario : mention visible
  Quand un verdict AI Act ou RGPD s’affiche
  Alors la mention « ne constitue pas un avis juridique » est présente
```

## E5 Business case

### US-16 Calculer gains, coûts et rentabilité · Must · 5 pts
En tant que **sponsor**, je veux la VAN, le ROI, le délai de retour et le TRI sur trois ans afin de comparer les cas.

```gherkin
Scénario : cas de référence
  Étant donné le cas de référence du modèle
  Quand le business case est calculé
  Alors la VAN vaut 200 315,18 € et le délai de retour 7,95 mois
```

### US-17 Chiffrer le coût des modèles de langage · Should · 2 pts
En tant que **Business Analyst**, je veux saisir requêtes, tokens et prix par million afin d’estimer le coût de run d’une solution générative.

```gherkin
Scénario : prix présenté comme hypothèse
  Quand j’active le coût LLM
  Alors le champ « Prix par million de tokens » est marqué comme hypothèse éditable
```

### US-18 Identifier les hypothèses critiques · Should · 3 pts
En tant que **Business Analyst**, je veux un diagramme en tornade ±20 % afin de savoir quelles hypothèses fiabiliser en premier.

```gherkin
Scénario : tri par influence
  Alors les paramètres sont classés par amplitude de VAN décroissante
```

### US-19 Mesurer l’incertitude · Should · 5 pts
En tant que **comité**, je veux P10, P50, P90 et la probabilité de VAN positive afin de juger le risque financier.

```gherkin
Scénario : reproductibilité
  Étant donné une graine fixée
  Quand je relance la simulation
  Alors les centiles sont identiques
```

## E6 Planification et restitution

### US-20 Obtenir une roadmap proposée · Must · 5 pts
En tant que **responsable de portefeuille**, je veux une proposition en trois vagues qui respecte scores, risques, dépendances et capacité afin de gagner du temps de planification.

```gherkin
Scénario : prérequis respecté
  Étant donné un cas dépendant du contrôle de complétude
  Alors il est planifié dans une vague postérieure
```

### US-21 Ajuster la roadmap · Should · 3 pts
En tant que **responsable de portefeuille**, je veux déplacer un cas d’une vague à l’autre afin de tenir compte d’éléments hors modèle.

```gherkin
Scénario : incohérence signalée
  Quand je place un cas avant son prérequis
  Alors un avertissement s’affiche sur sa carte, sans bloquer l’ajustement
```

### US-22 Imprimer une note de cadrage A4 · Must · 5 pts
En tant que **Business Analyst**, je veux une note de cadrage imprimable afin de la diffuser en PDF.

```gherkin
Scénario : impression
  Quand je clique sur « Imprimer / PDF »
  Alors la note s’imprime en A4, en thème clair, sans la navigation
```

### US-23 Exporter la note en Markdown · Should · 2 pts
En tant que **Business Analyst**, je veux exporter la note en Markdown afin de l’intégrer à un wiki ou à un dépôt.

```gherkin
Scénario : téléchargement
  Quand je clique sur « Exporter en Markdown »
  Alors un fichier « note-cadrage-uc-bl-004-AAAA-MM-JJ.md » est téléchargé
```

## E7 Assistant de saisie

### US-24 Générer un brouillon depuis des notes · Could · 5 pts
En tant que **Business Analyst**, je veux coller des notes d’atelier et obtenir un brouillon de fiche afin de gagner du temps après un atelier.

```gherkin
Scénario : brouillon validé
  Étant donné une clé d’API saisie
  Quand je génère un brouillon
  Alors la réponse est validée par un schéma
  Et je peux la corriger avant de créer la fiche

Scénario : réponse invalide
  Quand le fournisseur renvoie une réponse hors format
  Alors aucune fiche n’est créée et les erreurs sont listées
```

### US-25 Protéger la clé d’API · Must (si E7) · 1 pt
En tant qu’**utilisateur**, je veux que ma clé ne soit jamais enregistrée afin d’éviter sa fuite.

```gherkin
Scénario : clé en mémoire
  Quand je recharge la page
  Alors la clé n’est plus renseignée
```

## E8 Socle

### US-26 Utiliser l’outil au clavier et au lecteur d’écran · Must · 3 pts
Focus visible, onglets au clavier, graphiques avec vue tableau, textes alternatifs.

### US-27 Choisir le thème clair ou sombre · Should · 2 pts
Thème du système par défaut, bascule mémorisée.

### US-28 Utiliser l’outil sur mobile · Should · 3 pts
Aucune barre de défilement horizontale à 390 px ; listes à la place des tableaux.

### US-29 Travailler hors ligne · Must · 2 pts
Aucune ressource externe au chargement : polices et bibliothèques embarquées.

## Hors périmètre de cette version (Won’t)

- Comptes utilisateurs, collaboration en temps réel et serveur de données.
- Génération de PDF côté application (l’impression du navigateur suffit).
- Connexion directe à EUR-Lex ou à une base juridique : le référentiel est maintenu dans le code.
