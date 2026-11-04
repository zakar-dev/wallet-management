import { disponible } from './comptes';
import { categoriesDuGroupe, groupesTries } from './categories';
import { ajouterMois, moisDe, type Mois } from './dates';
import type { Centimes } from './montant';
import type { Assignation, Categorie, Donnees, Groupe, Operation } from './types';

export function idAssignation(mois: Mois, categorieId: string): string {
  return `${mois}:${categorieId}`;
}

export function versAssignation(mois: Mois, categorieId: string, montant: Centimes): Assignation {
  return { id: idAssignation(mois, categorieId), mois, categorieId, montant };
}

export interface Enveloppe { report: Centimes; assigne: Centimes; depense: Centimes; reste: Centimes }

/** Dépenses comptées (ni hors solde, ni revenu, ni transfert) de la catégorie, par mois. */
function depensesParMois(operations: Operation[], categorieId: string): Map<Mois, Centimes> {
  const m = new Map<Mois, Centimes>();
  for (const o of operations) {
    if (o.type !== 'depense' || o.horsSolde || o.categorieId !== categorieId) continue;
    const mois = moisDe(o.date);
    m.set(mois, (m.get(mois) ?? 0) + o.montant);
  }
  return m;
}

/**
 * Enveloppe (mois m, catégorie c) = report(m−1) + assigné(m) − dépensé(m).
 * Le report est le reste du mois précédent s'il est positif ; un dépassement n'est pas reporté.
 */
export function enveloppe(
  assignations: Assignation[], operations: Operation[], mois: Mois, categorieId: string,
): Enveloppe {
  const depenses = depensesParMois(operations, categorieId);
  const assigne = new Map<Mois, Centimes>();
  for (const a of assignations) if (a.categorieId === categorieId) assigne.set(a.mois, a.montant);

  const moisActifs = [...depenses.keys(), ...assigne.keys()].filter((x) => x <= mois).sort();
  let courant: Mois = moisActifs[0] ?? mois;
  let report = 0;
  for (;;) {
    const env: Enveloppe = {
      report, assigne: assigne.get(courant) ?? 0, depense: depenses.get(courant) ?? 0, reste: 0,
    };
    env.reste = env.report + env.assigne - env.depense;
    if (courant >= mois) return env;
    report = Math.max(0, env.reste);
    courant = ajouterMois(courant, 1);
  }
}

export type EtatEnveloppe = 'vide' | 'ok' | 'alerte' | 'depasse';

/** Part consommée de l'enveloppe, entre 0 et 1. */
export function ratioConsomme(e: Enveloppe): number {
  const budget = e.report + e.assigne;
  if (budget <= 0) return e.depense > 0 ? 1 : 0;
  return Math.min(1, e.depense / budget);
}

/** Vert, orange au-delà de 90 % consommés, rouge si dépassée. */
export function etatEnveloppe(e: Enveloppe): EtatEnveloppe {
  if (e.reste < 0) return 'depasse';
  if (e.report + e.assigne === 0 && e.depense === 0) return 'vide';
  return ratioConsomme(e) > 0.9 ? 'alerte' : 'ok';
}

export interface LigneBudget { categorie: Categorie; enveloppe: Enveloppe }
export interface GroupeBudget { groupe: Groupe; lignes: LigneBudget[]; reste: Centimes }

/** Enveloppes du mois pour les groupes de dépenses non vides, dans l'ordre des groupes. */
export function budgetDuMois(d: Donnees, mois: Mois): GroupeBudget[] {
  return groupesTries(d.groupes)
    .filter((g) => g.nature === 'depense')
    .map((groupe) => {
      const lignes = categoriesDuGroupe(d.categories, groupe.id).map((categorie) => ({
        categorie, enveloppe: enveloppe(d.assignations, d.operations, mois, categorie.id),
      }));
      return { groupe, lignes, reste: lignes.reduce((s, l) => s + l.enveloppe.reste, 0) };
    })
    .filter((g) => g.lignes.length > 0);
}

/**
 * Prêt à assigner = disponible − Σ restes positifs des enveloppes du mois.
 * Un reste négatif n'est pas compté : le dépassement a déjà réduit le disponible.
 */
export function pretAAssigner(d: Donnees, mois: Mois): Centimes {
  const restes = budgetDuMois(d, mois).flatMap((g) => g.lignes).reduce((s, l) => s + Math.max(0, l.enveloppe.reste), 0);
  return disponible(d.comptes, d.operations) - restes;
}

export interface ResumeBudget { budget: Centimes; depense: Centimes; reste: Centimes; ratio: number }

/** Totaux du mois pour l'anneau de l'accueil : budget = Σ (report + assigné). */
export function resumeBudget(d: Donnees, mois: Mois): ResumeBudget {
  const lignes = budgetDuMois(d, mois).flatMap((g) => g.lignes);
  const budget = lignes.reduce((s, l) => s + l.enveloppe.report + l.enveloppe.assigne, 0);
  const depense = lignes.reduce((s, l) => s + l.enveloppe.depense, 0);
  return { budget, depense, reste: budget - depense, ratio: budget > 0 ? Math.min(1, depense / budget) : 0 };
}

/** L'enveloppe telle qu'elle serait avec un autre montant assigné (aperçu avant validation). */
export function avecAssigne(e: Enveloppe, assigne: Centimes): Enveloppe {
  return { ...e, assigne, reste: e.report + assigne - e.depense };
}
