# Note de cadrage — UC-BL-004 Score d’aide à l’octroi (évaluation de solvabilité)

- **Référence** : UC-BL-004
- **Organisation** : Banque Lumen (fictive)
- **Porteur** : Direction des risques
- **Statut** : En cadrage
- **Date** : 2 novembre 2026
- **Version** : 1.0
- **Planification** : Vague 3

## 1. Synthèse

- **Problème** : La grille de score actuelle, fondée sur des règles expertes de 2015, discrimine mal les risques : trop de dossiers tombent en zone grise et le taux de défaut à 12 mois se dégrade (hypothèse : 3,1 %).
- **Solution envisagée** : Classification / scoring : modèle de gradient boosting avec explications locales (contributions des variables), seuils fixés par la direction des risques.
- **Priorisation** : Projet stratégique · priorité 56/100
- **AI Act** : Haut risque · annexe III, 5 b) · FRIA requise
- **RGPD** : AIPD probablement requise
- **Business case (3 ans)** : VAN 93 527 € · ROI 21 % · retour 30,2 mois · P(VAN > 0) 20 %
- **Planification** : Vague 3

## 2. Contexte et problème métier

La grille de score actuelle, fondée sur des règles expertes de 2015, discrimine mal les risques : trop de dossiers tombent en zone grise et le taux de défaut à 12 mois se dégrade (hypothèse : 3,1 %).

- **Processus concerné** : Octroi du crédit à la consommation : évaluation du risque et décision.
- **Objectifs** : Mieux discriminer le risque, réduire la zone grise et le coût du risque, en gardant une décision humaine motivée.
- **Porteur métier** : Direction des risques

## 3. Utilisateurs et situation actuelle

| Persona | Rôle | Besoin |
| --- | --- | --- |
| Karim, analyste crédit | Instruit les dossiers en zone grise et décide | Une vision synthétique et fiable du dossier pour décider vite et bien |
| Nadia, modélisatrice risque de crédit | Conçoit et valide les modèles | Un modèle performant, stable et explicable |

Grille de score à 14 variables ; 25 % des dossiers en zone grise analysés manuellement (20 minutes chacun).

- **Volume annuel** : 30 000 dossiers en zone grise (hypothèse)
- **Temps unitaire** : 20,0 min (hypothèse)

- Zone grise trop large
- Grille non recalibrée depuis 2015
- Motifs de refus difficiles à expliquer au client

## 4. Solution envisagée

- **Typologie** : Classification / scoring
- **Description** : Modèle de gradient boosting avec explications locales (contributions des variables), seuils fixés par la direction des risques.
- **Niveau d’autonomie** : Proposition validée par un humain
- **Supervision humaine** : L’analyste décide ; les motifs principaux sont affichés et la décision est motivée par écrit.
- **Alternatives étudiées** : Recalibrage de la grille actuelle : moins coûteux, gain de performance plus faible.

## 5. Données et intégration au SI

| Source | Disponibilité | Qualité | Données perso. |
| --- | --- | --- | --- |
| Historique de production et de défauts (5 ans) | Disponible | Bonne | Oui |
| Consultation du fichier des incidents de remboursement | Disponible | Bonne | Oui |
| Données de compte (clients existants) | Disponible | Moyenne | Oui |

- **Systèmes concernés** : Moteur de décision crédit, Outil d’instruction, Entrepôt de données risques
- **Mode d’intégration** : API temps réel
- **Principe** : Score et explications restitués dans l’outil d’instruction au moment de l’analyse.
- **Contraintes** : Validation indépendante du modèle avant mise en production ; suivi trimestriel de la performance.

## 6. Indicateurs de succès

| Indicateur | Référence | Cible | Source |
| --- | ---: | ---: | --- |
| Dossiers en zone grise (%) | 25,0 | 15,0 | Moteur de décision |
| Taux de défaut à 12 mois (%) | 3,1 | 2,8 | Entrepôt de données risques |

## 7. Priorisation (scoring multicritère)

| Critère | Note | Niveau retenu | Justification |
| --- | ---: | --- | --- |
| Impact financier | 5/5 | Gain majeur, visible dans les comptes de l’organisation |  |
| Impact client / usager | 3/5 | Amélioration perceptible d’un parcours |  |
| Alignement stratégique | 5/5 | Porté par la direction générale, condition de réussite de la stratégie |  |
| Urgence | 4/5 | Échéance externe ou réglementaire sous 6 à 12 mois |  |
| Maturité des données | 3/5 | Données disponibles mais à nettoyer ou à annoter |  |
| Complexité technique | 2/5 | Complexe : modèle sur mesure, exigence de performance élevée |  |
| Intégration SI | 2/5 | Intégration lourde à plusieurs systèmes, API inexistantes |  |
| Compétences | 2/5 | Compétences à recruter ou à acheter en totalité |  |
| Risque réglementaire | 4/5 | Système à haut risque ou décision automatisée encadrée (art. 22 RGPD) |  |
| Risque éthique et biais | 4/5 | Décisions significatives, risque de discrimination à surveiller |  |
| Risque opérationnel | 3/5 | Erreur coûteuse, contrôle humain nécessaire |  |
| Risque d’adoption | 3/5 | Changement de pratiques modéré, accompagnement nécessaire |  |

- Valeur 4,3/5 (83/100) : portée par impact financier (5/5) et alignement stratégique (5/5).
- Faisabilité 2,4/5 (34/100) : freinée par compétences (2/5) et intégration SI (2/5).
- Risque 3,6/5 (64/100) : principaux facteurs risque réglementaire (4/5) et risque éthique et biais (4/5).
- Valeur ≥ 3,0 et faisabilité < 3,0 : quadrant « Projet stratégique ».
- Priorité 56/100 = 45 % × valeur 83 + 35 % × faisabilité 34 + 20 % × (100 − risque 64).

## 8. Qualification AI Act

Haut risque · échéance clé : 2 décembre 2027.

1. Le système infère, à partir des données qu’il reçoit, comment générer des sorties (prédictions, contenus, recommandations ou décisions) avec un certain degré d’autonomie : c’est un système d’IA au sens de l’art. 3(1).
2. Aucune exclusion de l’art. 2 n’est invoquée.
3. Rôle déclaré : fournisseur et déployeur.
4. Aucune pratique interdite de l’art. 5 n’a été identifiée, y compris les interdictions ajoutées par l’omnibus (nudification, contenus pédocriminels).
5. Le cas d’usage relève de l’annexe III, point 5 b) : évaluer la solvabilité d’une personne physique ou établir sa note de crédit.
6. Le système effectue un profilage de personnes physiques : il est toujours considéré comme à haut risque, la dérogation de l’art. 6(3) est exclue (art. 6(3), dernier alinéa).
7. Aucune obligation de transparence de l’art. 50 n’est déclenchée.
8. Le système ne repose pas sur un modèle d’IA à usage général.
9. Le cas relève du point 5 b) de l’annexe III : le déployeur doit réaliser une analyse d’impact sur les droits fondamentaux (FRIA, art. 27).
10. Échéance : les obligations des systèmes de l’annexe III s’appliquent à partir du 2 décembre 2027 (report par l’omnibus).

| Obligation | Acteur | Vous concerne | Dès le |
| --- | --- | --- | --- |
| Système de gestion des risques et gouvernance des données d’entraînement, de validation et de test (art. 9 et 10). | Fournisseur du système | Oui | 2 décembre 2027 |
| Documentation technique, journalisation automatique, notice d’utilisation et conception du contrôle humain (art. 11 à 14) ; exactitude, robustesse et cybersécurité (art. 15). | Fournisseur du système | Oui | 2 décembre 2027 |
| Système de gestion de la qualité, évaluation de la conformité, déclaration UE et marquage CE, enregistrement dans la base de l’UE (art. 16, 17, 43, 47 à 49). | Fournisseur du système | Oui | 2 décembre 2027 |
| Surveillance après commercialisation et signalement des incidents graves (art. 72 et 73). | Fournisseur du système | Oui | 2 décembre 2027 |
| Utiliser le système conformément à la notice et confier le contrôle humain à des personnes compétentes, formées et dotées de l’autorité nécessaire (art. 26(1) et (2)). | Déployeur | Oui | 2 décembre 2027 |
| Veiller à la pertinence des données d’entrée sous son contrôle, surveiller le fonctionnement, signaler risques et incidents graves, conserver les journaux au moins six mois (art. 26(4) à (6)). | Déployeur | Oui | 2 décembre 2027 |
| Utiliser les informations fournies par le fournisseur pour réaliser l’AIPD prévue par le RGPD (art. 26(9)). | Déployeur | Oui | 2 décembre 2027 |
| Informer les personnes concernées qu’une décision les concernant est prise avec l’aide du système (art. 26(11)) et répondre aux demandes d’explication (art. 86). | Déployeur | Oui | 2 décembre 2027 |
| Réaliser une analyse d’impact sur les droits fondamentaux (FRIA) avant la première utilisation et notifier ses résultats à l’autorité de surveillance (art. 27). | Déployeur | Oui | 2 décembre 2027 |
| Prendre des mesures pour développer la maîtrise de l’IA du personnel et des personnes qui utilisent le système (art. 4 ; obligation recalibrée par l’omnibus en obligation de moyens). | Fournisseur et déployeur | Oui | 2 février 2025 |

## 9. Protection des données (RGPD)

AIPD probablement requise · 5 critère(s) WP248 retenu(s).

1. Le traitement porte sur des données personnelles (identité, situation financière, historique de crédit) : le RGPD s’applique.
2. Base légale envisagée : exécution d’un contrat ou mesures précontractuelles (art. 6(1)(b)).
3. Le traitement relève de la liste CNIL des types d’opérations pour lesquels une AIPD est obligatoire : AIPD requise (art. 35(4)).

> Le score produit pèse de manière déterminante sur la décision : selon la CJUE (SCHUFA, C-634/21, 7 décembre 2023), cela peut constituer une décision automatisée au sens de l’art. 22. Garantir une intervention humaine réelle, outillée et tracée. Critères suggérés par vos autres réponses mais non retenus : 8. usage innovant ou nouvelle solution technologique. Justifier ce choix.

## 10. Business case

| Hypothèse | Valeur | Provenance |
| --- | ---: | --- |
| Volume annuel | 30 000 dossiers en zone grise | Hypothèse |
| Temps unitaire (min) | 20,0 | Hypothèse |
| Part du temps économisée | 25,0 % | Hypothèse |
| Coût horaire chargé | 58 € | Hypothèse |
| Adoption années 1 / 2 / 3 | 25 % / 70 % / 100 % | Hypothèse |
| Gains qualité annuels | 520 000 € | Hypothèse |
| Charge de build (jours) | 360 | Hypothèse |
| TJM | 850 € | Hypothèse |
| Autres coûts ponctuels | 150 000 € | Hypothèse |
| Infrastructure et licences | 45 000 € | Hypothèse |
| Maintenance (% du build) | 20,0 % | Hypothèse |
| Autres coûts récurrents | 70 000 € | Hypothèse |
| Taux d’actualisation | 8,0 % | Hypothèse |

| Résultat (calculé) | Valeur |
| --- | ---: |
| Investissement (build) | 456 000 € |
| Gains annuels à pleine adoption | 665 000 € |
| VAN sur 3 ans | 93 527 € |
| ROI sur 3 ans (non actualisé) | 21 % |
| Délai de retour | 30,2 mois |
| TRI | 16 % |
| Monte Carlo (5 000 tirages) : P10 / P50 / P90 | -381 102 € / -149 710 € / 73 188 € |
| Probabilité que la VAN soit positive | 20 % |

Paramètres les plus influents (±20 %) : gains qualité (amplitude 338 094 €), taux d'adoption (amplitude 326 790 €), charge de build (jours) (amplitude 185 487 €).

## 11. Parties prenantes, dépendances et risques

| Partie prenante | Implication | Attentes |
| --- | --- | --- |
| Directeur des risques | Sponsor | Réduire le coût du risque |
| Comité des engagements | Décideur | Seuils et politique d’octroi |
| Validation indépendante des modèles | Expert / validation | Performance, stabilité, explicabilité |
| Conformité et DPO | Expert / validation | FRIA, AIPD, information des clients |

- **Prérequis (portefeuille)** : UC-BL-001 Contrôle automatique de complétude des dossiers à la soumission
- **Dépendances externes** : Validation indépendante du modèle

| Risque | Catégorie | Criticité | Mesure de maîtrise |
| --- | --- | ---: | --- |
| Discrimination indirecte via des variables corrélées | Éthique | 6/9 | Tests d’équité par segment, revue des variables |
| Dérive du modèle après un changement de conjoncture | Opérationnel | 6/9 | Suivi de stabilité et recalibrage |
| Décision de fait automatisée (score suivi sans analyse) | Conformité | 6/9 | Motivation écrite obligatoire, contrôle des taux de suivi du score |

## 12. Planification et décisions attendues

Vague 3.

- Projet stratégique à faisabilité très faible : prérequis à construire, vague 3 au plus tôt.
- Haut risque AI Act : prévoir les livrables de conformité dans le lot.

1. Planifier les livrables de conformité haut risque (documentation, contrôle humain, journalisation) avant le 2 décembre 2027.
2. Réaliser l’analyse d’impact sur les droits fondamentaux (FRIA, art. 27) avec la conformité.
3. Conduire l’AIPD avec le DPO avant le développement (art. 35 RGPD).
4. Concevoir une intervention humaine réelle et tracée sur les décisions (art. 22 RGPD).
5. Valider avec le métier les 16 hypothèses chiffrées du business case.
6. Soumettre le cas au comité pour une décision de lancement en vague 3.

---

*Organisation fictive : données de démonstration.*

*Qualification AI Act et pré-analyse RGPD : aide à la qualification, ne constitue pas un avis juridique.*

*Les valeurs marquées « hypothèse » sont des estimations à confirmer ; les résultats financiers sont calculés à partir de ces hypothèses.*

*Document généré par AI Use Case Factory.*
