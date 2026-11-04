# Plan 2 — Budget par enveloppes (bloc 4)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Onglet Budget (mois, « Prêt à assigner », enveloppes par groupe avec jauge) et anneau « reste à dépenser » sur l'accueil.

**Architecture:** Règles dans `src/domaine/budget.ts` (TDD). Écrans `app/(onglets)/budget.tsx`, `app/budget/[categorieId].tsx`,
composants `src/ui/Jauge.tsx`, `src/ui/Anneau.tsx` (react-native-svg).

## Global Constraints
Celles du plan 1. Spec §3.4, §4 (Budget), §7.3. Les opérations hors solde et les transferts ne sont jamais « dépensés ».

## Règles (spec §7.3, précisées)
- Enveloppes : catégories des groupes de nature `depense` uniquement.
- `assigné(m, c)` = montant de l'assignation `id = "m:c"` (0 si absente).
- `dépensé(m, c)` = Σ dépenses non hors solde de c datées du mois m. Un revenu ou un transfert n'y entre pas.
- `report(m, c)` = max(0, reste(m−1, c)) ; 0 avant le premier mois où c a une assignation ou une dépense.
- `reste(m, c)` = report + assigné − dépensé (peut être négatif = dépassement, non reporté).
- **Prêt à assigner(m)** = disponible − Σ max(0, reste(m, c)). Les restes négatifs ne sont pas comptés :
  le dépassement a déjà réduit le disponible (sinon il serait compté deux fois).
- Jauge : consommé = dépensé ÷ (report + assigné). Vert ; orange si > 90 % ; rouge si dépassé (reste < 0).
  Rien d'assigné ni de dépensé : jauge vide grise.
- Accueil, mois courant : budget = Σ (report + assigné), dépensé = Σ dépensé, reste = budget − dépensé.
  Anneau affiché seulement si budget > 0.

---

### Task 1: Domaine budget
**Files:** Create `src/domaine/budget.ts` · Test `tests/domaine/budget.test.ts`
**Produces:**
`idAssignation(mois, categorieId): string` ;
`interface Enveloppe { report; assigne; depense; reste: Centimes }` ;
`enveloppe(assignations, operations, mois, categorieId): Enveloppe` ;
`type EtatEnveloppe = 'vide' | 'ok' | 'alerte' | 'depasse'` ; `etatEnveloppe(e): EtatEnveloppe` ; `ratioConsomme(e): number` (0..1, borné) ;
`interface LigneBudget { categorie: Categorie; enveloppe: Enveloppe }` ; `interface GroupeBudget { groupe: Groupe; lignes: LigneBudget[]; reste: Centimes }` ;
`budgetDuMois(d: Donnees, mois): GroupeBudget[]` ;
`pretAAssigner(d: Donnees, mois): Centimes` ;
`interface ResumeBudget { budget; depense; reste: Centimes; ratio: number }` ; `resumeBudget(d: Donnees, mois): ResumeBudget` ;
`versAssignation(mois, categorieId, montant): Assignation`.
- [ ] Tests (valeurs calculées à la main) : report sur plusieurs mois dont un mois sans assignation ; dépassement non reporté ;
  hors solde / revenu / transfert / autre mois exclus du dépensé ; états vide/ok/alerte (> 90 %)/dépassé ;
  prêt à assigner ignorant les restes négatifs ; groupes de revenus exclus ; résumé.
- [ ] FAIL → implémenter → PASS → commit.

### Task 2: Écran Budget
**Files:** Create `src/ui/Jauge.tsx`, `app/budget/[categorieId].tsx` · Modify `app/(onglets)/budget.tsx`
- [ ] Sélecteur de mois ‹ Novembre 2026 › (`ajouterMois`, `libelleMois`), carte « Prêt à assigner » (vert ≥ 0, rouge < 0).
- [ ] Par groupe de dépenses : Section (titre + reste du groupe), ligne par catégorie : icône, nom, jauge, « reste X » ;
  sous-titre « dépensé X sur Y ».
- [ ] Toucher une catégorie → feuille `/budget/[categorieId]?mois=AAAA-MM` : report, dépensé, champ « Assigné ce mois »
  (`parseMontant`, vide = 0, OK grisé si invalide), enregistre `versAssignation`.
- [ ] Typecheck ; commit.

### Task 3: Anneau sur l'accueil
**Files:** Create `src/ui/Anneau.tsx` · Modify `app/(onglets)/index.tsx`
- [ ] Anneau SVG (`resumeBudget` du mois courant) : « Reste à dépenser » au centre ; couleur selon le ratio
  (vert, orange > 90 %, rouge si reste < 0) ; toucher → onglet Budget. Budget nul → lien « Préparer le budget ».
- [ ] Typecheck ; tests ; export web ; commit ; merge `main` ; push ; suivre le déploiement.
