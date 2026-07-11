# Plan de recette

Correspondance entre les critères d’acceptation du [backlog](user-stories.md) et les tests automatisés. Commandes : `npm test` (tests unitaires et d’intégration, Vitest) et `npm run test:e2e` (parcours de bout en bout, Playwright).

## Tests automatisés

| Story | Critère vérifié | Test |
|---|---|---|
| US-01 | Duplication avec réécriture des dépendances | `src/domain/model.test.ts`, `src/store/portfolioStore.test.ts` |
| US-02 | Import refusé avec message en français, aller-retour sans perte | `src/domain/io.test.ts` |
| US-03 | Trois organisations fictives, valeurs étiquetées « hypothèse » | `src/data/demo/demo.test.ts`, `e2e/smoke.spec.ts` |
| US-04 | Repli en mémoire si le stockage est bloqué ou plein | `src/store/storage.test.ts` |
| US-05, US-06 | Fiche modifiable, valeur conservée après rechargement | `e2e/smoke.spec.ts` |
| US-08, US-09 | Moyennes pondérées, descripteurs, explication générée | `src/domain/scoring/scoring.test.ts` |
| US-10, US-11 | Matrice : six cas placés, ouverture de la fiche au clic | `e2e/smoke.spec.ts` |
| US-12 | Fraude contre solvabilité, dérogation 6(3) avec ou sans profilage, chatbot | `src/domain/aiAct/qualification.test.ts` |
| US-12 | Classification attendue des seize cas de démonstration | `src/data/demo/demo.test.ts` |
| US-13 | Obligations par rôle, FRIA, calendrier et jours restants | `src/domain/aiAct/qualification.test.ts` |
| US-14 | Seuil de deux critères WP248, art. 9, art. 22, vigilance SCHUFA | `src/domain/rgpd/evaluation.test.ts` |
| US-15 | Mention « ne constitue pas un avis juridique » | `src/domain/aiAct/qualification.test.ts`, `src/domain/note/note.test.ts` |
| US-16, US-17 | VAN, ROI, délai de retour, TRI, coût LLM sur un cas calculé à la main | `src/domain/businessCase/finance.test.ts` |
| US-18 | Tri par amplitude, symétrie, effet exact du TJM | `src/domain/businessCase/uncertainty.test.ts` |
| US-19 | Reproductibilité à graine égale, construction progressive de l’histogramme | `src/domain/businessCase/uncertainty.test.ts` |
| US-20, US-21 | Vagues, prérequis, capacité, cycles, ajustement manuel | `src/domain/roadmap/roadmap.test.ts` |
| US-22, US-23 | Structure de la note, Markdown, téléchargement | `src/domain/note/note.test.ts`, `e2e/smoke.spec.ts` |
| US-24 | Brouillon validé, réponse hors format refusée, erreurs HTTP et réseau | `src/assistant/client.test.ts`, `src/pages/assistant/AssistantPage.test.tsx` |
| US-26 | Onglets aux flèches, matrice au clavier (Tab puis Entrée), boîte de dialogue fermée par Échap | `e2e/qualite.spec.ts` |
| US-27 | Bascule du thème sombre | `e2e/smoke.spec.ts` |
| US-28 | Aucune barre de défilement horizontale à 390 px sur 14 vues | `e2e/qualite.spec.ts` |
| US-29 | Aucune ressource externe chargée (fonctionnement hors ligne) | `e2e/qualite.spec.ts` |

## Vérifications manuelles

| Story | Vérification | Résultat |
|---|---|---|
| US-22 | Impression A4 de la note UC-BL-004 (6 pages, en-têtes de tableaux répétés) | Conforme |
| US-10 | Glissement animé des points de la matrice quand les poids changent | Conforme |
| US-19 | Construction de l’histogramme pendant l’échantillonnage, bouton « Rejouer » | Conforme |
| US-24 | Appel réel à un fournisseur d’IA | Non testé (pas de clé d’API dans l’environnement de développement) |
