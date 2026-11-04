import { disponible, patrimoineNet } from './comptes';
import { ajouterMois, dateDuMois, joursDansMois, moisDe, type DateISO, type Mois } from './dates';
import type { Centimes } from './montant';
import type { Categorie, Donnees, Operation } from './types';

/** Ce qui compte comme vrai revenu ou vraie dépense : ni hors solde, ni transfert, ni mouvement de dette. */
export function operationsComptees(ops: Operation[]): Operation[] {
  return ops.filter((o) => o.type !== 'transfert' && !o.horsSolde && !o.detteId);
}

/** Les `n` mois se terminant par `moisFin`, du plus ancien au plus récent. */
export function moisJusqua(moisFin: Mois, n: number): Mois[] {
  return Array.from({ length: n }, (_, i) => ajouterMois(moisFin, i - n + 1));
}

const depensesDuMois = (ops: Operation[], mois: Mois) =>
  ops.filter((o) => o.type === 'depense' && moisDe(o.date) === mois);
const somme = (ops: Operation[]) => ops.reduce((s, o) => s + o.montant, 0);

export interface FluxMois { mois: Mois; revenus: Centimes; depenses: Centimes }

export function fluxParMois(d: Donnees, moisFin: Mois, n: number): FluxMois[] {
  const ops = operationsComptees(d.operations);
  return moisJusqua(moisFin, n).map((mois) => ({
    mois,
    revenus: somme(ops.filter((o) => o.type === 'revenu' && moisDe(o.date) === mois)),
    depenses: somme(depensesDuMois(ops, mois)),
  }));
}

/** Patrimoine net à une date : opérations, dettes et remboursements datés au plus tard ce jour-là. */
export function patrimoineAu(d: Donnees, date: DateISO): Centimes {
  const ops = d.operations.filter((o) => o.date <= date);
  const dettes = d.dettes
    .filter((x) => x.date <= date)
    .map((x) => ({ ...x, remboursements: x.remboursements.filter((r) => r.date <= date) }));
  return patrimoineNet(d.comptes, ops, dettes);
}

export interface PointPatrimoine { mois: Mois; valeur: Centimes }

export function patrimoineParMois(d: Donnees, moisFin: Mois, n: number): PointPatrimoine[] {
  return moisJusqua(moisFin, n).map((mois) => ({ mois, valeur: patrimoineAu(d, dateDuMois(mois, 31)) }));
}

export interface PartCategorie { categorie: Categorie; montant: Centimes; part: number }

export function repartitionCategories(d: Donnees, mois: Mois): PartCategorie[] {
  const deps = depensesDuMois(operationsComptees(d.operations), mois);
  const total = somme(deps);
  const parCat = new Map<string, Centimes>();
  for (const o of deps) if (o.categorieId) parCat.set(o.categorieId, (parCat.get(o.categorieId) ?? 0) + o.montant);
  return [...parCat]
    .map(([id, montant]) => ({ categorie: d.categories.find((c) => c.id === id), montant, part: total ? montant / total : 0 }))
    .filter((x): x is PartCategorie => Boolean(x.categorie))
    .sort((a, b) => b.montant - a.montant);
}

export interface Indicateurs {
  depense: Centimes; joursEcoules: number; moyenneParJour: Centimes; projection: Centimes;
  moyenne6Mois: Centimes; autonomie: number | null; plusGrosses: Operation[];
}

/** Moyenne mensuelle des dépenses sur les 6 mois avant `mois`, depuis la première opération (au moins 1 mois). */
export function moyenneDepenses6Mois(ops: Operation[], mois: Mois): Centimes {
  const comptees = operationsComptees(ops);
  if (comptees.length === 0) return 0;
  const premier = comptees.reduce((m, o) => (moisDe(o.date) < m ? moisDe(o.date) : m), moisDe(comptees[0].date));
  const fenetre = moisJusqua(ajouterMois(mois, -1), 6).filter((m) => m >= premier);
  if (fenetre.length === 0) return 0;
  return Math.round(fenetre.reduce((s, m) => s + somme(depensesDuMois(comptees, m)), 0) / fenetre.length);
}

export function indicateursMois(d: Donnees, mois: Mois, aujourdhui: DateISO): Indicateurs {
  const moisCourant = moisDe(aujourdhui);
  const joursEcoules = mois < moisCourant ? joursDansMois(mois) : mois === moisCourant ? Number(aujourdhui.slice(8, 10)) : 0;
  const deps = joursEcoules === 0 ? [] : depensesDuMois(operationsComptees(d.operations), mois);
  const depense = somme(deps);
  const moyenneParJour = joursEcoules ? Math.round(depense / joursEcoules) : 0;
  const projection = mois < moisCourant ? depense : joursEcoules ? Math.round((depense / joursEcoules) * joursDansMois(mois)) : 0;
  const moyenne6Mois = moyenneDepenses6Mois(d.operations, mois);
  return {
    depense, joursEcoules, moyenneParJour, projection, moyenne6Mois,
    autonomie: moyenne6Mois > 0 ? disponible(d.comptes, d.operations) / moyenne6Mois : null,
    plusGrosses: [...deps].sort((a, b) => b.montant - a.montant).slice(0, 5),
  };
}
