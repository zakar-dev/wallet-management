import { normaliser } from './texte';
import type { Categorie, Groupe, Nature, Operation } from './types';

export const COULEURS = ['#ff453a', '#ff9f0a', '#ffd60a', '#30d158', '#64d2ff', '#0a84ff',
  '#5e5ce6', '#bf5af2', '#ff375f', '#ac8e68', '#8e8e93'];

export const ICONES_CATEGORIES = ['briefcase', 'key', 'gift', 'tag', 'circle-plus', 'house', 'zap',
  'wifi', 'shield', 'repeat', 'shopping-cart', 'fuel', 'coffee', 'utensils', 'bath', 'bus', 'car',
  'heart-pulse', 'shopping-bag', 'gamepad-2', 'graduation-cap', 'baby', 'plane', 'smartphone',
  'shirt', 'dumbbell', 'paw-print', 'hand-coins', 'ellipsis'];

export const GROUPES_PAR_DEFAUT: Groupe[] = [
  { id: 'g-rev-fixes', nom: 'Revenus fixes', nature: 'revenu', ordre: 0 },
  { id: 'g-rev-var', nom: 'Revenus variables', nature: 'revenu', ordre: 1 },
  { id: 'g-dep-fixes', nom: 'Dépenses fixes', nature: 'depense', ordre: 2 },
  { id: 'g-dep-var', nom: 'Dépenses variables', nature: 'depense', ordre: 3 },
];

const cat = (id: string, nom: string, icone: string, couleur: string, groupeId: string): Categorie =>
  ({ id, nom, icone, couleur, groupeId, favori: false });

export const CATEGORIES_PAR_DEFAUT: Categorie[] = [
  cat('c-salaire', 'Salaire', 'briefcase', '#30d158', 'g-rev-fixes'),
  cat('c-bail', 'Bail', 'key', '#64d2ff', 'g-rev-fixes'),
  cat('c-primes', 'Primes', 'gift', '#ffd60a', 'g-rev-var'),
  cat('c-ventes', 'Ventes', 'tag', '#bf5af2', 'g-rev-var'),
  cat('c-autres-revenus', 'Autres revenus', 'circle-plus', '#8e8e93', 'g-rev-var'),
  cat('c-loyer', 'Loyer', 'house', '#ff9f0a', 'g-dep-fixes'),
  cat('c-energie', 'Électricité & eau', 'zap', '#ffd60a', 'g-dep-fixes'),
  cat('c-internet', 'Internet & téléphone', 'wifi', '#0a84ff', 'g-dep-fixes'),
  cat('c-assurance', 'Assurance', 'shield', '#5e5ce6', 'g-dep-fixes'),
  cat('c-abonnements', 'Abonnements', 'repeat', '#bf5af2', 'g-dep-fixes'),
  cat('c-courses', 'Courses', 'shopping-cart', '#30d158', 'g-dep-var'),
  cat('c-carburant', 'Carburant', 'fuel', '#ff453a', 'g-dep-var'),
  cat('c-cafe', 'Café', 'coffee', '#ac8e68', 'g-dep-var'),
  cat('c-restaurants', 'Restaurants', 'utensils', '#ff9f0a', 'g-dep-var'),
  cat('c-hammam', 'Hammam & soins', 'bath', '#64d2ff', 'g-dep-var'),
  cat('c-transport', 'Transport', 'bus', '#0a84ff', 'g-dep-var'),
  cat('c-sante', 'Santé', 'heart-pulse', '#ff375f', 'g-dep-var'),
  cat('c-shopping', 'Shopping', 'shopping-bag', '#bf5af2', 'g-dep-var'),
  cat('c-loisirs', 'Loisirs', 'gamepad-2', '#5e5ce6', 'g-dep-var'),
  cat('c-divers', 'Divers', 'ellipsis', '#8e8e93', 'g-dep-var'),
];

export interface GroupeDeCategories { groupe: Groupe; categories: Categorie[] }

const parFavoriPuisNom = (a: Categorie, b: Categorie) =>
  Number(b.favori) - Number(a.favori) || a.nom.localeCompare(b.nom, 'fr');

export function categoriesParGroupe(
  groupes: Groupe[], categories: Categorie[], nature?: Nature,
): GroupeDeCategories[] {
  return [...groupes]
    .filter((g) => !nature || g.nature === nature)
    .sort((a, b) => a.ordre - b.ordre)
    .map((groupe) => ({
      groupe,
      categories: categories.filter((c) => c.groupeId === groupe.id).sort(parFavoriPuisNom),
    }))
    .filter((g) => g.categories.length > 0);
}

export function rechercherCategories(categories: Categorie[], texte: string): Categorie[] {
  const q = normaliser(texte);
  if (!q) return categories;
  return categories.filter((c) => normaliser(c.nom).includes(q)).sort(parFavoriPuisNom);
}

export function categorieUtilisee(id: string, operations: Operation[]): boolean {
  return operations.some((o) => o.categorieId === id);
}

export function natureDeCategorie(id: string, categories: Categorie[], groupes: Groupe[]): Nature | undefined {
  const c = categories.find((x) => x.id === id);
  return groupes.find((g) => g.id === c?.groupeId)?.nature;
}

export function erreurCategorie(c: { nom: string; groupeId: string }): string | null {
  if (!c.nom.trim()) return 'Donnez un nom à la catégorie';
  if (!c.groupeId) return 'Choisissez un groupe';
  return null;
}

export function erreurGroupe(g: { nom: string }): string | null {
  return g.nom.trim() ? null : 'Donnez un nom au groupe';
}

/** Catégories d'un groupe (même vide), favoris d'abord puis par nom. */
export function categoriesDuGroupe(categories: Categorie[], groupeId: string): Categorie[] {
  return categories.filter((c) => c.groupeId === groupeId).sort(parFavoriPuisNom);
}

export function prochainOrdre(groupes: Groupe[]): number {
  return groupes.reduce((max, g) => Math.max(max, g.ordre + 1), 0);
}

export function groupesTries(groupes: Groupe[]): Groupe[] {
  return [...groupes].sort((a, b) => a.ordre - b.ordre);
}
