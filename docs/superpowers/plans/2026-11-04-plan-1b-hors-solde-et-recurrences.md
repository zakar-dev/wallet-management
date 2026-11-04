# Plan 1b — Opérations hors solde et récurrences mensuelles

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Implémenter `docs/superpowers/specs/2026-11-04-hors-solde-et-recurrences-design.md` et redéployer.

**Architecture:** Règles dans `src/domaine/` (TDD), rattrapage des échéances dans `src/stockage/` au chargement,
UI dans la feuille d'ajout et un nouvel écran `app/recurrences/`.

## Global Constraints
Celles du plan 1 (calculs dans `src/domaine/`, centimes, pas d'emoji, OK grisé + message court, thème iOS).

---

### Task 1: Hors solde (domaine)
**Files:** Modify `src/domaine/types.ts`, `comptes.ts`, `operations.ts` · Test `tests/domaine/comptes.test.ts`, `operations.test.ts`
**Produces:** `Operation.horsSolde?: boolean` ; `Brouillon.horsSolde: boolean` ; `montantSigne(o): Centimes` (signe selon le type,
transfert 0, ignore horsSolde) ; `effetNet(o)` = 0 si horsSolde ; `soldeCompte` ignore les opérations hors solde ;
`horsSoldeSelonDate(date, aujourdhui): boolean` (= date < aujourdhui).
- [ ] Tests : solde ignore une dépense / un transfert hors solde ; total du jour l'ignore ; `versOperation` n'écrit `horsSolde` que s'il est vrai ; aller-retour brouillon conservé ; `horsSoldeSelonDate`.
- [ ] Run → FAIL ; implémenter ; Run → PASS ; commit.

### Task 2: Récurrences (domaine)
**Files:** Modify `src/domaine/types.ts`, `dates.ts` · Create `src/domaine/recurrences.ts` · Test `tests/domaine/recurrences.test.ts`, `dates.test.ts`
**Produces:** `Recurrence { id; modele: ModeleOperation; jour: number; prochaineEcheance: DateISO; active: boolean }` ;
`dateDuMois(mois, jour): DateISO` (borné au dernier jour) ; `prochaineEcheanceApres(jour, date): DateISO` (strictement après) ;
`creerRecurrence(op, jour, id, aujourdhui): Recurrence` ; `echeancesDues(rec, aujourdhui, nouvelId): { operations: Operation[]; recurrence: Recurrence }` ;
`reactiver(rec, aujourdhui): Recurrence` ; `libelleRecurrence(rec): string` (« le 1er / le 5 de chaque mois ») ; `erreurJour(texte): string | null`.
- [ ] Tests : 31 → 30 avril / 28 fév / 29 fév bissextile ; strictement après ; création sans rattrapage ; rattrapage de 3 mois ; jour 31 sur fév → mars 31 ; arrêtée inerte ; réactivation sans rattrapage ; libellés ; `erreurJour`.
- [ ] Run → FAIL ; implémenter ; Run → PASS ; commit.

### Task 3: Rattrapage au chargement (stockage)
**Files:** Modify `src/stockage/initialisation.ts`, `src/stockage/DonneesProvider.tsx` · Test `tests/stockage/depot.test.ts`
**Produces:** `rattraperRecurrences(depot, aujourdhui, nouvelId?): Promise<Donnees>` — enregistre opérations générées et récurrences avancées.
- [ ] Test avec `DepotMemoire` (2 échéances dues → 2 opérations, échéance avancée ; second appel sans effet) ; implémenter ; brancher dans `DonneesProvider` après `initialiserSiVide` ; commit.

### Task 4: Feuille d'ajout
**Files:** Modify `app/ajout.tsx`, `src/ui/LigneOperation.tsx`
- [ ] Interrupteur « Déjà incluse dans le solde » (suit la date tant que non touché).
- [ ] Interrupteur « Récurrente chaque mois » + champ Jour (erreur via `erreurJour`, OK grisé) ; à l'enregistrement : `creerRecurrence` + `recurrenceId` sur l'opération.
- [ ] Opération déjà récurrente : ligne « Récurrente · le N de chaque mois » → `/recurrences/[id]`.
- [ ] `LigneOperation` : `montantSigne`, gris + « Hors solde » si hors solde.
- [ ] Typecheck ; commit.

### Task 5: Écran Récurrents
**Files:** Create `app/recurrences/index.tsx`, `app/recurrences/[id].tsx` · Modify `app/(onglets)/plus.tsx`
- [ ] Liste actives / arrêtées ; détail avec Arrêter (deux appuis) / Réactiver (`reactiver`) ; entrée active dans Plus.
- [ ] Typecheck ; tests ; commit.

### Task 6: Déploiement
- [ ] `npx expo export -p web` local OK ; push `main` ; suivre le run GitHub Actions jusqu'à `success` ; vérifier le site.
