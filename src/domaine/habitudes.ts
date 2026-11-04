import { fenetrePrecedente, moisJusqua, operationsComptees } from './analyse';
import { ajouterJours, dateDuMois, joursDansMois, moisDe, type DateISO, type Mois } from './dates';
import type { Centimes } from './montant';
import { normaliser } from './texte';
import type { Categorie, Donnees, Operation } from './types';

const depensesComptees = (ops: Operation[]) => operationsComptees(ops).filter((o) => o.type === 'depense');

export interface JourCalendrier { date: DateISO; montant: Centimes; intensite: number; futur: boolean }

/** Dépenses de chaque jour du mois ; intensité relative au jour le plus dépensier (0..1). */
export function calendrierDepenses(d: Donnees, mois: Mois, aujourdhui: DateISO): JourCalendrier[] {
  const parJour = new Map<DateISO, Centimes>();
  for (const o of depensesComptees(d.operations)) {
    if (moisDe(o.date) === mois) parJour.set(o.date, (parJour.get(o.date) ?? 0) + o.montant);
  }
  const max = Math.max(0, ...parJour.values());
  return Array.from({ length: joursDansMois(mois) }, (_, i) => {
    const date = dateDuMois(mois, i + 1);
    const montant = parJour.get(date) ?? 0;
    return { date, montant, intensite: max ? montant / max : 0, futur: date > aujourdhui };
  });
}

/** Jours écoulés du mois sans aucune dépense. */
export function joursSansDepense(d: Donnees, mois: Mois, aujourdhui: DateISO): number {
  return calendrierDepenses(d, mois, aujourdhui).filter((j) => !j.futur && j.montant === 0).length;
}

export interface Commercant { libelle: string; total: Centimes; passages: number }

const cleLibelle = (l: string) => normaliser(l).replace(/\s+/g, ' ');
const libelleAffiche = (l: string) => l.trim().replace(/\s+/g, ' ');

/** Top des libellés de dépense (casse, accents et espaces ignorés) sur les `nbMois` derniers mois. */
export function topCommercants(d: Donnees, moisFin: Mois, nbMois: number, top: number): Commercant[] {
  const fenetre = new Set(moisJusqua(moisFin, nbMois));
  const groupes = new Map<string, { total: Centimes; passages: number; formes: Map<string, number> }>();
  const ops = depensesComptees(d.operations)
    .filter((o) => o.libelle.trim() && fenetre.has(moisDe(o.date)))
    .sort((a, b) => b.date.localeCompare(a.date));
  for (const o of ops) {
    const cle = cleLibelle(o.libelle);
    const g = groupes.get(cle) ?? { total: 0, passages: 0, formes: new Map<string, number>() };
    g.total += o.montant;
    g.passages += 1;
    const forme = libelleAffiche(o.libelle);
    g.formes.set(forme, (g.formes.get(forme) ?? 0) + 1);
    groupes.set(cle, g);
  }
  return [...groupes.values()]
    .map((g) => ({
      // forme la plus fréquente ; à égalité, la plus récente (insérée en premier)
      libelle: [...g.formes].reduce((a, b) => (b[1] > a[1] ? b : a))[0],
      total: g.total,
      passages: g.passages,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, top);
}

export interface Tendance { categorie: Categorie; montant: Centimes; moyenne: Centimes; ecart: number | null }

/** Dépense du mois par catégorie comparée à la moyenne des mois précédents (écart relatif, null si moyenne nulle). */
export function tendancesCategories(d: Donnees, mois: Mois): Tendance[] {
  const deps = depensesComptees(d.operations);
  const fenetre = fenetrePrecedente(d.operations, mois);
  const total = (cat: string, m: Mois) =>
    deps.filter((o) => o.categorieId === cat && moisDe(o.date) === m).reduce((s, o) => s + o.montant, 0);
  return d.categories
    .map((categorie) => {
      const montant = total(categorie.id, mois);
      const moyenneBrute = fenetre.length ? fenetre.reduce((s, m) => s + total(categorie.id, m), 0) / fenetre.length : 0;
      return {
        categorie, montant, moyenne: Math.round(moyenneBrute),
        ecart: moyenneBrute > 0 ? (montant - moyenneBrute) / moyenneBrute : null,
      };
    })
    .filter((t) => t.montant > 0 || t.moyenne > 0)
    .sort((a, b) => b.montant - a.montant || b.moyenne - a.moyenne);
}

/** Jours consécutifs ayant au moins une opération, jusqu'à aujourd'hui (ou hier si rien aujourd'hui). */
export function serieSaisie(ops: Operation[], aujourdhui: DateISO): number {
  const jours = new Set(ops.map((o) => o.date));
  let jour = jours.has(aujourdhui) ? aujourdhui : ajouterJours(aujourdhui, -1);
  let serie = 0;
  while (jours.has(jour)) {
    serie += 1;
    jour = ajouterJours(jour, -1);
  }
  return serie;
}
