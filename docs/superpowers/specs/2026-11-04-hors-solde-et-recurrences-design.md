# Opérations hors solde et récurrences mensuelles — conception

Date : 2026-11-04 · Statut : validé · Complète `2026-11-03-wallet-management-design.md`
(remplace la partie « Récurrents » du bloc 5 et ajoute une règle au §7).

## 1. Opérations hors solde (historique)

But : saisir des opérations passées, déjà reflétées dans le solde d'ouverture, sans fausser les soldes.

- Champ `horsSolde?: boolean` sur `Operation` (absent = faux).
- Feuille d'ajout : interrupteur **« Déjà incluse dans le solde »**. Tant que l'utilisateur ne l'a pas touché,
  il suit la date : activé si date < aujourd'hui, désactivé sinon. Une fois touché, il garde la valeur choisie.
  En modification, la valeur enregistrée est conservée.
- Une opération hors solde ne compte dans **aucun** calcul : solde des comptes, disponible, patrimoine,
  total du jour, et plus tard budget, analyse, habitudes, prévisions. Elle reste listée, montant en gris,
  mention « Hors solde ». Vaut pour dépense, revenu et transfert.

## 2. Récurrences mensuelles

- Fréquence **mensuelle uniquement** (l'hebdomadaire du spec initial est abandonné).
- `Recurrence { id, modele, jour (1–31), prochaineEcheance, active }`, `modele` = l'opération sans id, date,
  recurrenceId ni horsSolde.
- Feuille d'ajout : interrupteur **« Récurrente chaque mois »** + champ **Jour du mois** (défaut : jour de la
  date saisie). Disponible à la création comme en modification d'une opération non récurrente.
  L'opération saisie est la première occurrence et reçoit `recurrenceId`.
- Jour > longueur du mois → dernier jour du mois (31 → 30 avril, 28 ou 29 février).
- Première échéance = premier jour J strictement après max(date de l'opération, aujourd'hui) : aucun
  rattrapage du passé à la création.
- **Création automatique** : à l'ouverture de l'app, toute récurrence active dont l'échéance est ≤ aujourd'hui
  génère une opération normale (comptée) par échéance due, mois manqués compris, puis avance son échéance.
- Les occurrences sont des opérations indépendantes : modifier / supprimer l'une n'affecte pas les autres.
- Écran **Plus → Récurrents** : liste (libellé ou catégorie, montant, « le 5 de chaque mois », prochaine date) ;
  détail avec **Arrêter** (deux appuis) et **Réactiver** (prochaine échéance recalculée après aujourd'hui,
  pas de rattrapage). Les opérations déjà créées sont conservées.
- Feuille d'une opération récurrente : ligne « Récurrente · le 5 de chaque mois » vers le détail.

## 3. Tests

Hors solde exclu des soldes et totaux ; interrupteur suivant la date ; échéances fin de mois (28/29/30/31),
rattrapage sur plusieurs mois, pas de rattrapage à la création ni à la réactivation, récurrence arrêtée inerte.
