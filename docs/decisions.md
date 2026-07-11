# Journal des décisions

Chaque décision indique le contexte, le choix retenu, les options écartées et ses conséquences.

## D01 · Application 100 % côté client

- **Contexte** : démonstration publique sur GitHub Pages, données de démonstration fictives, aucun budget d’hébergement.
- **Décision** : aucune API ni base de données ; état dans le navigateur, import et export JSON.
- **Écarté** : serveur Node avec base de données (coût, comptes, sécurité).
- **Conséquences** : pas de collaboration en temps réel ; l’export JSON sert de sauvegarde et de partage.

## D02 · Vite, React 19 et TypeScript strict

- **Décision** : Vite 7, React 19, TypeScript en mode strict avec `noUncheckedIndexedAccess`, ESLint (typescript-eslint, react-hooks, jsx-a11y).
- **Raison** : écosystème standard, build statique rapide, typage qui protège les calculs financiers et réglementaires.

## D03 · HashRouter et chemin de publication configurable

- **Décision** : routes sous `#/` et `base` Vite fixé à `/ai-usecase-factory/`, surchargeable par la variable `BASE_PATH`.
- **Raison** : GitHub Pages ne sait pas réécrire les URL d’une application monopage ; le hash évite les erreurs 404 au rechargement.

## D04 · Schémas zod comme source de vérité

- **Décision** : le modèle de données est décrit par des schémas zod, dont dérivent les types TypeScript ; les mêmes schémas valident l’import JSON et les réponses de l’assistant.
- **Conséquences** : un fichier importé invalide est refusé avec des messages en français (locale zod), jamais chargé partiellement.

## D05 · État global avec zustand et immer, stockage tolérant

- **Décision** : zustand pour l’état, immer pour des mises à jour lisibles et immuables, middleware de persistance branché sur un adaptateur qui enveloppe chaque accès au stockage dans un `try/catch` avec repli en mémoire.
- **Raison** : l’application doit fonctionner en navigation privée, stockage bloqué ou quota dépassé ; l’immuabilité permet de mémoriser les calculs coûteux (Monte Carlo) par identité d’objet.

## D06 · Graphiques en SVG maison plutôt qu’ECharts

- **Contexte** : ECharts était suggéré ; la version 5 présentait un avis de sécurité (XSS) corrigé en 6.1, et la direction artistique exige des animations précises (glissement des points de la matrice, histogramme construit pendant l’échantillonnage).
- **Décision** : quatre graphiques en SVG (flux de trésorerie, tornado, Monte Carlo, matrice), couleurs en variables CSS, infobulles au survol et au clavier, vue tableau pour chaque graphique.
- **Conséquences** : bundle plus léger, thème clair ou sombre sans re-rendu, impression nette ; davantage de code à maintenir (échelles, graduations, placement des étiquettes, tous testés).
- **Couleurs** : palette vérifiée avec un outil de contrôle du contraste et du daltonisme. Les couleurs de signalisation (rouge, jaune, bleu, vert) ne distinguent pas toutes les paires pour un daltonien (rouge et vert notamment) : elles ne sont donc jamais seules, la forme de la pastille et un libellé portent toujours le sens.

## D07 · Animations avec motion, limitées et désactivables

- **Décision** : bibliothèque `motion` ; durées de 150 à 600 ms, courbe « ease-out », uniquement sur `transform` et `opacity`, aucune boucle décorative. Avec `prefers-reduced-motion`, l’état final s’affiche directement.
- **Animations porteuses de sens** : ligne de montage de la page d’ouverture, verdict AI Act qui « se pose », histogramme de Monte Carlo construit tirage après tirage, points de la matrice qui glissent quand les poids changent, transitions d’onglets et de listes.

## D08 · Direction artistique « atelier industriel et signalétique de sécurité »

- **Contexte** : éviter l’esthétique générique des interfaces produites à la chaîne (« AI slop ») décrite par plusieurs analyses : polices par défaut (Inter, Roboto), dégradés violets, glassmorphism, gabarit « hero centré + trois cartes + appel à l’action », palettes timides, textes creux.
- **Idée** : une usine à cas d’usage. Les écrans empruntent aux documents techniques industriels (fiches techniques, papier quadrillé, étiquettes de nomenclature, cartouche de plan) et à la signalétique de sécurité ISO 7010, dont le code colle au sens de l’AI Act : rouge = interdiction, jaune et noir = danger (haut risque), bleu = obligation (transparence et action), vert = situation sûre (risque minimal).
- **Choix** :
  - pastilles de risque à forme sémantique, dessinées en SVG : cercle barré, triangle, cercle plein, carré ;
  - typographies IBM Plex Sans Condensed (titres, étiquettes en petites capitales espacées), IBM Plex Sans (texte), IBM Plex Mono (identifiants comme « UC-BL-003 », chiffres, références d’articles) ;
  - fond béton clair avec quadrillage technique discret, salle de contrôle en thème sombre ; angles vifs, filets fins plutôt qu’ombres ; étapes numérotées « 01 / 05 » ;
  - page d’ouverture racontée comme une étude de cas, avec une composition éditoriale asymétrique et de vrais composants alimentés par les données de démonstration.
- **Inspirations** (dans l’esprit, sans copie) : fiches techniques industrielles et plans cotés, signalétique ISO 7010, densité et lisibilité des chiffres de Linear et du tableau de bord Stripe, famille IBM Plex.
- **Remplace** : une première identité commune (Inter et indigo) abandonnée au début du projet.

## D09 · Données de démonstration fictives et provenance des chiffres

- **Décision** : trois organisations inventées et signalées « Fictif » partout ; chaque entrée chiffrée du business case porte une provenance (hypothèse, estimation métier, mesure) ; tout résultat est marqué « Calculé ».
- **Raison** : aucun chiffre ne doit pouvoir passer pour une donnée réelle ; le lecteur sait ce qui est supposé et ce qui est déduit.

## D10 · Qualification AI Act déterministe et prudente

- **Décision** : arbre de décision explicite, testé cas par cas ; les réponses incertaines sont traitées par précaution (profilage incertain = profilage) ; chaque étape produit une phrase de justification ; mention systématique « ne constitue pas un avis juridique ».
- **Source des dates** : règlement 2024/1689 modifié par l’omnibus 2026/1744, vérifié par recherche web le 1er novembre 2026 ; les points non confirmés par le texte officiel sont signalés « à confirmer » (voir [qualification-ai-act.md](qualification-ai-act.md)).

## D11 · Monte Carlo reproductible

- **Décision** : générateur mulberry32 à graine, lois triangulaires, tirages conservés dans l’ordre.
- **Raison** : un comité doit retrouver les mêmes chiffres d’une séance à l’autre ; l’ordre des tirages permet d’animer la construction de l’histogramme sans changer le résultat final.

## D12 · Note de cadrage : un seul modèle, deux rendus

- **Décision** : la note est construite comme une structure de données (sections et blocs), rendue en HTML imprimable (CSS A4) et en Markdown.
- **Écarté** : génération de PDF dans le navigateur (bibliothèque lourde, rendu typographique moins bon que l’impression native).

## D13 · Assistant de saisie optionnel

- **Décision** : appel direct depuis le navigateur à Mistral ou à un point d’accès compatible OpenAI (par exemple Ollama en local), clé fournie par l’utilisateur et gardée en mémoire, réponse validée par zod et relue avant création de la fiche.
- **Limites assumées** : certains fournisseurs bloquent les appels directs depuis un navigateur (CORS) ; fonction testée uniquement avec des réponses simulées. L’application est complète sans elle.

## D14 · Outillage de test

- **Décision** : Vitest et Testing Library pour la logique et les composants ; Playwright pour les parcours de bout en bout et les captures d’écran.
- **Version** : Vitest 5. L’installation de Vitest 4.1 échouait avec npm 10.9 (erreur de résolution des dépendances optionnelles) ; la version 5 s’installe et prend en charge Vite 7.
- **Captures** : prises avec `prefers-reduced-motion: reduce`, donc dans l’état final des animations, sur un port dédié pour ne pas gêner d’autres serveurs locaux.
