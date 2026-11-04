import { fenetrePrecedente, operationsComptees } from './analyse';
import { disponible } from './comptes';
import { ajouterMois, moisDe, type DateISO, type Mois } from './dates';
import type { Centimes } from './montant';
import type { Donnees } from './types';

export interface PrevisionMensuelle {
  revenusRecurrents: Centimes; depensesRecurrentes: Centimes; depensesVariables: Centimes; solde: Centimes;
}
export interface Prevision { depart: Centimes; parMois: PrevisionMensuelle; points: { mois: Mois; valeur: Centimes }[] }

/**
 * Trésorerie projetée : départ = disponible ; chaque mois + récurrences de revenu − récurrences de dépense
 * − moyenne mensuelle (6 mois) des dépenses hors récurrences. Les récurrences de transfert sont ignorées.
 */
export function previsionTresorerie(d: Donnees, aujourdhui: DateISO, horizon: number): Prevision {
  const actives = d.recurrences.filter((r) => r.active);
  const total = (type: 'revenu' | 'depense') =>
    actives.filter((r) => r.modele.type === type).reduce((s, r) => s + r.modele.montant, 0);
  const mois = moisDe(aujourdhui);
  const fenetre = fenetrePrecedente(d.operations, mois);
  const variables = operationsComptees(d.operations)
    .filter((o) => o.type === 'depense' && !o.recurrenceId && fenetre.includes(moisDe(o.date)))
    .reduce((s, o) => s + o.montant, 0);
  const parMois: PrevisionMensuelle = {
    revenusRecurrents: total('revenu'),
    depensesRecurrentes: total('depense'),
    depensesVariables: fenetre.length ? Math.round(variables / fenetre.length) : 0,
    solde: 0,
  };
  parMois.solde = parMois.revenusRecurrents - parMois.depensesRecurrentes - parMois.depensesVariables;
  const depart = disponible(d.comptes, d.operations);
  return {
    depart,
    parMois,
    points: Array.from({ length: horizon }, (_, i) => ({ mois: ajouterMois(mois, i + 1), valeur: depart + parMois.solde * (i + 1) })),
  };
}
