# Plan 4 — Dettes & créances (bloc 7)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Plus → Dettes : suivre qui doit quoi, les remboursements partiels, et (au choix) faire bouger un compte.

**Architecture:** `src/domaine/dettes.ts` (TDD). Écrans `app/dettes/index.tsx`, `app/dettes/[id].tsx`,
`app/dettes/remboursement.tsx`. Opérations liées par `detteId`.

## Global Constraints
Celles du plan 1. Spec §3.7, §6 (Dette), §7.2 (patrimoine net = soldes + créances restantes − dettes restantes).

## Décisions (validées le 2026-11-04)
- Modèle : `Dette { id, personne, sens, montant, date, remboursements: Remboursement[], operationId? }`,
  `Remboursement { id, date, montant, operationId? }`, `Operation.detteId?`.
- Compte facultatif à la création et à chaque remboursement. S'il est choisi, une opération est créée :
  sortie d'argent (je prête, je rembourse) = `depense`, entrée (j'emprunte, on me rembourse) = `revenu` ;
  pas de catégorie ; libellé « Prêt à X », « Emprunt à X », « Remboursement de X », « Remboursement à X ».
- Ces opérations comptent dans les soldes mais jamais dans le budget (elles n'ont pas de catégorie) ni, plus tard,
  dans les analyses (filtre `detteId`).
- `erreurOperation` n'exige pas de catégorie si `detteId` ; la feuille d'ajout n'édite pas une opération liée
  (message + lien vers la dette).
- Remboursement > reste refusé (« Il reste X MAD à rembourser »). Dette soldée quand reste ≤ 0.
- Supprimer un remboursement supprime son opération ; supprimer une dette supprime ses opérations (pour corriger une erreur).

---

### Task 1: Domaine
**Files:** Modify `src/domaine/types.ts`, `src/domaine/operations.ts` · Create `src/domaine/dettes.ts` · Tests `tests/domaine/dettes.test.ts`, `operations.test.ts`
**Produces:** `creerDette(p): { dette; operation? }`, `ajouterRemboursement(d, p): { dette; operation? }`,
`retirerRemboursement(d, id): { dette; operationId? }`, `operationsDeDette(d): string[]`, `estSoldee(d)`,
`erreurDette({ personne, montant, date })`, `erreurRemboursement(d, montant, date)`, `totauxDettes(dettes): { onMeDoit; jeDois }`,
`trierDettes(dettes)`, `libelleMouvement(sens, personne, remboursement)` ; `Brouillon.detteId?` conservé ; catégorie non exigée si `detteId`.
- [ ] Tests à la main : sens des opérations (4 cas) et patrimoine inchangé à la création ; remboursements partiels → reste et soldée ;
  refus au-delà du reste ; suppression d'un remboursement ; totaux ; tri ; validations. FAIL → PASS → commit.

### Task 2: Écrans
**Files:** Create `app/dettes/index.tsx`, `app/dettes/[id].tsx`, `app/dettes/remboursement.tsx`, Modify `app/(onglets)/plus.tsx`, `app/ajout.tsx`, `src/ui/LigneOperation.tsx`
- [ ] Liste : totaux « On me doit » / « Je dois », sections En cours / Soldées (personne, sens, reste sur montant, jauge).
- [ ] `[id]` (`nouveau`) : création (personne, sens, montant, date, compte facultatif) ; détail (reste, remboursements avec
  suppression en deux appuis, « Ajouter un remboursement », supprimer la dette).
- [ ] `remboursement?id=` : montant, date, compte facultatif.
- [ ] Feuille d'ajout : opération liée → lecture seule + lien. `LigneOperation` : icône `hand-coins` pour une opération liée.
- [ ] Typecheck ; tests ; export ; commit ; merge ; push ; déploiement.
