# Plans 5 à 7 — Sauvegarde, Analyse, Habitudes & prévisions

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.
> Ordre : 5 (sauvegarde, les données ne vivent que sur le téléphone), 6, 7. Déploiement après chaque plan.

## Global Constraints
Celles du plan 1. Toute règle dans `src/domaine/` avec tests (valeurs calculées à la main).
**Opérations comptées** dans l'analyse, les habitudes et les prévisions : ni hors solde, ni liées à une dette (`detteId`),
ni transferts.

---

## Plan 5 — Sauvegarde (spec §8)

### Règles
- Fichier JSON `{ application: 'wallet-management', version: 1, date (ISO), donnees }`, nommé `wallet-sauvegarde-AAAA-MM-JJ.json`.
- Import : JSON illisible → « Fichier illisible » ; mauvaise application → « Ce fichier n'est pas une sauvegarde Wallet » ;
  version > 1 → « Sauvegarde trop récente : mettez l'app à jour » ; collection manquante ou élément sans `id` texte →
  « Sauvegarde incomplète ou abîmée ». Puis aperçu et **remplacement complet** en deux appuis.
- Date de dernière sauvegarde : `localStorage` (même durée de vie que les données sur l'appareil), lecture protégée.
- Rappel sur l'accueil si des données existent (au moins un compte) et dernière sauvegarde absente ou > 7 jours.
- Partage : `navigator.share({ files })` si disponible (feuille de partage iOS / Android), sinon téléchargement.
- Démo (Réglages, jamais par défaut) : 3 comptes, ~3 mois d'opérations, assignations, une récurrence, un objectif, une dette ;
  remplace tout, en deux appuis. Réglages propose aussi « Tout effacer » (deux appuis).

### Tasks
1. Domaine `src/domaine/sauvegarde.ts` + `joursEntre` dans `dates.ts` + `src/domaine/demo.ts` — TDD : aller-retour export → import
   sans perte, chaque erreur, rappel (jamais / 7 / 8 jours / sans données), démo cohérente (références valides, import OK).
2. `src/stockage/reglages.ts` (dernière sauvegarde), `src/ui/fichiers.ts` (partager / choisir un fichier, web),
   écrans `app/sauvegarde.tsx`, `app/reglages.tsx`, rappel sur l'accueil, entrées actives dans Plus. Export ; déploiement.

---

## Plan 6 — Analyse (spec §3.8, §7.5)

### Règles
- **Flux** : par mois, Σ revenus et Σ dépenses comptés, 6 derniers mois jusqu'au mois choisi.
- **Patrimoine** : valeur en fin de mois sur 12 mois = soldes avec les opérations datées ≤ fin du mois + créances − dettes
  existantes à cette date (dette datée ≤ fin, remboursements datés ≤ fin).
- **Catégories** : dépenses du mois par catégorie, part du total, triées décroissant.
- **Indicateurs du mois** : jours écoulés (mois courant : jour du jour ; passé : tous ; futur : 0) ; moyenne par jour ;
  projection fin de mois = dépensé ÷ jours écoulés × jours du mois (mois passé : le dépensé) ; moyenne 6 mois = moyenne des
  dépenses des 6 mois précédents, en ne comptant que les mois depuis la première opération (au moins 1) ;
  autonomie (mois) = disponible ÷ moyenne 6 mois (aucune si moyenne nulle) ; 5 plus grosses dépenses du mois.

### Tasks
1. `src/domaine/analyse.ts` — TDD.
2. `src/ui/graphiques/` (barres groupées, courbe, barres horizontales, SVG), écran `app/analyse.tsx`
   (segment Flux / Patrimoine / Catégories, sélecteur de mois, indicateurs), entrée en tête de Plus. Export ; déploiement.

---

## Plan 7 — Habitudes & prévisions (spec §3.9, §7.6)

### Règles
- **Calendrier** du mois : dépenses comptées par jour, intensité relative au jour le plus dépensier.
- **Jours sans dépense** du mois (jours écoulés seulement).
- **Top commerçants** : libellés normalisés (casse, accents, espaces), 3 derniers mois, top 5 par total, avec nombre de passages.
- **Tendances** : pour chaque catégorie de dépense, mois choisi vs moyenne des 6 mois précédents ; écart en % (aucun si moyenne nulle).
- **Série de saisie** : jours consécutifs jusqu'à aujourd'hui (ou hier si rien aujourd'hui) ayant au moins une opération datée.
- **Prévision** de trésorerie, horizon 3 / 6 / 12 / 24 mois : départ = disponible ; chaque mois + Σ récurrences actives de revenu
  − Σ récurrences actives de dépense − moyenne mensuelle (6 mois) des dépenses comptées hors récurrences.
  Les récurrences de transfert sont ignorées.

### Tasks
1. `src/domaine/habitudes.ts`, `src/domaine/previsions.ts` — TDD.
2. Écrans `app/habitudes.tsx`, `app/previsions.tsx` (courbe + tableau), entrées actives dans Plus. Export ; déploiement.
