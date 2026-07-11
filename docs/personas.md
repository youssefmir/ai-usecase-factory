# Personas

Les personas décrivent les utilisateurs cibles d’AI Use Case Factory. Ce sont des **hypothèses de conception** construites à partir des rôles qui interviennent dans un portefeuille de projets IA ; elles ne reposent pas sur des entretiens réels et ne citent personne.

## Vue d’ensemble

| Persona | Rôle | Usage principal | Fonctions clés |
|---|---|---|---|
| Sarah | Business Analyst IA en cabinet de conseil | Animer les ateliers et cadrer les cas | Fiche, scoring, note de cadrage, assistant de saisie |
| Marc | Responsable data et innovation d’une banque | Arbitrer le portefeuille en comité | Matrice, pondérations, roadmap, business case |
| Camille | DPO et référente conformité | Vérifier AI Act et RGPD avant engagement | Qualification AI Act, pré-analyse RGPD, obligations |
| Patrick | Dirigeant d’une PME | Décider vite de ce qui vaut la peine | Tableau de bord, VAN, quick wins |
| Élise | Chargée de transformation numérique d’une collectivité | Préparer des projets IA défendables publiquement | FRIA, transparence, roadmap, export |

## Sarah, Business Analyst IA (persona principale)

- **Contexte** : intervient chez plusieurs clients ; anime des ateliers d’idéation puis de cadrage avec les métiers.
- **Objectifs** : transformer des idées hétérogènes en fiches comparables ; produire rapidement une note de cadrage crédible ; montrer la méthode au client.
- **Frustrations** : des tableurs différents à chaque mission ; des chiffres de gains invérifiables ; la conformité traitée en fin de projet.
- **Scénario type** : après un atelier, Sarah colle ses notes dans l’assistant, relit le brouillon, complète la fiche, note les critères avec le métier, qualifie l’AI Act et exporte la note de cadrage en Markdown pour le compte rendu.
- **Critère de succès** : une note de cadrage relue par le client sans retouche de fond.

## Marc, responsable data et innovation

- **Contexte** : reçoit chaque trimestre une vingtaine de demandes de cas d’usage ; présente le portefeuille au comité de direction.
- **Objectifs** : prioriser de façon argumentée ; montrer l’effet des arbitrages ; présenter une roadmap réaliste.
- **Frustrations** : la priorité va au sponsor le plus insistant ; les business cases affichent une seule VAN, sans risque.
- **Scénario type** : en comité, Marc ajuste les poids dans la matrice, montre les cas qui changent de quadrant, puis valide la roadmap proposée en trois vagues.
- **Critère de succès** : une décision de comité tracée, avec ses hypothèses et ses incertitudes.

## Camille, DPO et référente conformité

- **Contexte** : doit se prononcer sur chaque projet traitant des données personnelles ; suit l’entrée en application de l’AI Act.
- **Objectifs** : savoir tôt si un cas est à haut risque, s’il faut une AIPD ou une FRIA ; disposer d’une justification écrite.
- **Frustrations** : des qualifications orales, non argumentées ; des dates d’application qui changent (omnibus 2026).
- **Scénario type** : Camille ouvre l’onglet AI Act d’un score de crédit, vérifie la justification (annexe III, profilage, dérogation écartée), puis l’onglet RGPD (critères WP248, art. 22).
- **Critère de succès** : une pré-qualification qu’elle peut corriger ou confirmer en moins d’un quart d’heure.

## Patrick, dirigeant de PME

- **Contexte** : 80 salariés, pas d’équipe data ; sollicité par des éditeurs de solutions d’IA.
- **Objectifs** : identifier deux ou trois cas rentables et peu risqués ; éviter un projet coûteux sans retour.
- **Frustrations** : un discours commercial sans chiffres ; peu de temps à consacrer au sujet.
- **Scénario type** : Patrick parcourt le tableau de bord, repère les quick wins et la VAN, puis lit la note de cadrage du cas retenu.
- **Critère de succès** : une décision prise en une réunion, avec un budget et un délai de retour.

## Élise, chargée de transformation numérique en collectivité

- **Contexte** : ville de taille moyenne ; services sociaux, accueil, finances ; obligations de transparence envers les usagers.
- **Objectifs** : préparer des projets défendables devant les élus et les usagers ; anticiper la FRIA et l’information du public.
- **Frustrations** : des valeurs de service public difficiles à chiffrer ; la crainte d’un projet d’IA mal accueilli.
- **Scénario type** : Élise constate qu’un agent conversationnel a une VAN négative mais une forte valeur usager, l’argumente avec le scoring, et planifie l’aide à l’instruction sociale en vague 3 après la FRIA.
- **Critère de succès** : un dossier compréhensible par un élu non spécialiste.

## Besoins transverses

- Comprendre **pourquoi** l’outil propose un score, un verdict ou une vague (explications systématiques).
- Distinguer clairement **hypothèses** et **résultats calculés**.
- Travailler **sans serveur ni compte**, et pouvoir **exporter** pour partager.
- Utiliser l’outil au clavier, sur mobile, en thème clair ou sombre.
