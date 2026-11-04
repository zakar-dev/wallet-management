# Plan 3 — Objectifs d'épargne (bloc 6)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Plus → Objectifs : créer des objectifs (cible, échéance facultative, icône), voir la progression et le montant
conseillé par mois, allouer / retirer / dépenser.

**Architecture:** Règles dans `src/domaine/objectifs.ts` (TDD). Écrans `app/objectifs/index.tsx`, `app/objectifs/[id].tsx`
(création / détail / réglages), `app/objectifs/mouvement.tsx` (allouer, retirer, dépenser).

## Global Constraints
Celles du plan 1. Spec §3.6, §6 (Objectif : id, nom, icone, cible, echeance?, reserve), §7.4.

## Règles
- **Épargne totale** = Σ soldes des comptes épargne non archivés. **Épargne libre** = épargne totale − Σ réservés.
- **Allouer** : refusé si montant > épargne libre, message « Il reste seulement X MAD libres sur vos comptes épargne » (spec §7.4).
- **Retirer** : remet de l'argent en épargne libre ; refusé si montant > réservé.
- **Dépenser** : crée une opération `depense` (compte épargne choisi, catégorie choisie, libellé = nom de l'objectif,
  date du jour) et réduit la réserve du même montant ; refusé si montant > réservé.
- **Mois restants** = mois de l'échéance − mois courant + 1 (au moins 1) ; **montant conseillé** = ⌈(cible − réservé) ÷ mois restants⌉,
  aucun sans échéance, 0 si atteint.
- **Atteint** si réservé ≥ cible ; progression = min(1, réservé ÷ cible).
- Supprimer un objectif libère sa réserve (rien d'autre à faire : la réserve n'est qu'un montant).
- Si l'épargne libre devient négative (retrait d'un compte épargne), la liste l'affiche en rouge.

---

### Task 1: Domaine objectifs
**Files:** Create `src/domaine/objectifs.ts` · Test `tests/domaine/objectifs.test.ts`
**Produces:** `epargneTotale(comptes, ops)`, `epargneLibre(comptes, ops, objectifs)`, `erreurAllocation(montant, libre)`,
`erreurRetrait(objectif, montant)`, `allouer(o, m)`, `retirer(o, m)`,
`depenserObjectif(o, m, { id, compteId, categorieId, date }): { objectif; operation }`,
`moisRestants(aujourdhui, echeance)`, `montantConseille(o, aujourdhui): Centimes | null`, `progression(o)`, `estAtteint(o)`,
`erreurObjectif({ nom, cible, echeance })`, `trierObjectifs(objectifs)`.
- [ ] Tests à la main : libre avec archivé et courant exclus ; refus d'allocation avec montant libre dans le message ;
  retrait / dépense au-delà du réservé ; dépense → opération correcte + réserve réduite ; mois restants (même mois, passé,
  4 mois) ; conseillé arrondi au centime supérieur ; atteint ; validations ; tri (en cours par échéance, sans échéance, atteints).
- [ ] FAIL → implémenter → PASS → commit.

### Task 2: Écrans
**Files:** Create `app/objectifs/index.tsx`, `app/objectifs/[id].tsx`, `app/objectifs/mouvement.tsx` · Modify `app/(onglets)/plus.tsx`
- [ ] Liste : carte « Épargne libre » ; objectifs avec icône, jauge, « X sur Y », « Z / mois jusqu'au … » ou « Atteint ».
- [ ] `[id]` (`nouveau` pour créer) : en-tête progression + boutons Allouer / Retirer / Dépenser ; réglages nom, cible,
  échéance (facultative), icône ; suppression en deux appuis.
- [ ] `mouvement?id=…&sens=allouer|retirer|depenser` : montant ; pour dépenser, compte épargne + catégorie de dépense ;
  OK grisé + message du domaine.
- [ ] Entrée « Objectifs » active dans Plus. Typecheck ; tests ; export ; commit ; merge ; push ; suivre le déploiement.
