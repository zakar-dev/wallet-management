import {
  CATEGORIES_PAR_DEFAUT, GROUPES_PAR_DEFAUT, categorieUtilisee, categoriesDuGroupe, categoriesParGroupe, groupesTries, prochainOrdre, erreurCategorie,
  erreurGroupe, natureDeCategorie, rechercherCategories,
} from '@/src/domaine/categories';
import type { Categorie } from '@/src/domaine/types';

test('jeu par défaut : 4 groupes et les catégories des captures', () => {
  expect(GROUPES_PAR_DEFAUT.map((g) => g.nom)).toEqual(
    ['Revenus fixes', 'Revenus variables', 'Dépenses fixes', 'Dépenses variables']);
  const noms = CATEGORIES_PAR_DEFAUT.map((c) => c.nom);
  for (const n of ['Loyer', 'Courses', 'Carburant', 'Café', 'Hammam & soins', 'Salaire', 'Bail']) {
    expect(noms).toContain(n);
  }
  const ids = new Set(GROUPES_PAR_DEFAUT.map((g) => g.id));
  expect(CATEGORIES_PAR_DEFAUT.every((c) => ids.has(c.groupeId))).toBe(true);
});

test('categoriesParGroupe : ordre des groupes, favoris d’abord puis alphabétique, filtre de nature', () => {
  const cats: Categorie[] = [
    { id: '1', nom: 'Zakat', icone: 'gift', couleur: '#fff', groupeId: 'g-dep-var', favori: false },
    { id: '2', nom: 'Café', icone: 'coffee', couleur: '#fff', groupeId: 'g-dep-var', favori: false },
    { id: '3', nom: 'Taxi', icone: 'car', couleur: '#fff', groupeId: 'g-dep-var', favori: true },
    { id: '4', nom: 'Salaire', icone: 'briefcase', couleur: '#fff', groupeId: 'g-rev-fixes', favori: false },
  ];
  const tout = categoriesParGroupe(GROUPES_PAR_DEFAUT, cats);
  expect(tout.map((g) => g.groupe.id)).toEqual(['g-rev-fixes', 'g-dep-var']); // groupes vides omis
  expect(tout[1].categories.map((c) => c.nom)).toEqual(['Taxi', 'Café', 'Zakat']);
  expect(categoriesParGroupe(GROUPES_PAR_DEFAUT, cats, 'revenu').map((g) => g.groupe.id)).toEqual(['g-rev-fixes']);
});

test('rechercherCategories ignore accents et casse', () => {
  expect(rechercherCategories(CATEGORIES_PAR_DEFAUT, 'cafe').map((c) => c.nom)).toEqual(['Café']);
  expect(rechercherCategories(CATEGORIES_PAR_DEFAUT, '  ')).toHaveLength(CATEGORIES_PAR_DEFAUT.length);
});

test('categorieUtilisee', () => {
  const ops = [{ id: 'o', date: '2026-11-01', montant: 1, type: 'depense' as const, compteId: 'a', categorieId: 'c-cafe', libelle: '' }];
  expect(categorieUtilisee('c-cafe', ops)).toBe(true);
  expect(categorieUtilisee('c-loyer', ops)).toBe(false);
});

test('natureDeCategorie', () => {
  expect(natureDeCategorie('c-salaire', CATEGORIES_PAR_DEFAUT, GROUPES_PAR_DEFAUT)).toBe('revenu');
  expect(natureDeCategorie('c-loyer', CATEGORIES_PAR_DEFAUT, GROUPES_PAR_DEFAUT)).toBe('depense');
  expect(natureDeCategorie('x', CATEGORIES_PAR_DEFAUT, GROUPES_PAR_DEFAUT)).toBeUndefined();
});

test('validations', () => {
  expect(erreurCategorie({ nom: '', groupeId: 'g' })).toBe('Donnez un nom à la catégorie');
  expect(erreurCategorie({ nom: 'Taxi', groupeId: '' })).toBe('Choisissez un groupe');
  expect(erreurCategorie({ nom: 'Taxi', groupeId: 'g' })).toBeNull();
  expect(erreurGroupe({ nom: ' ' })).toBe('Donnez un nom au groupe');
  expect(erreurGroupe({ nom: 'Enfants' })).toBeNull();
});

test('categoriesDuGroupe : favoris puis alphabétique, groupe vide accepté', () => {
  const cats: Categorie[] = [
    { id: '1', nom: 'Zakat', icone: 'gift', couleur: '#fff', groupeId: 'g', favori: false },
    { id: '2', nom: 'Café', icone: 'coffee', couleur: '#fff', groupeId: 'g', favori: false },
    { id: '3', nom: 'Taxi', icone: 'car', couleur: '#fff', groupeId: 'g', favori: true },
    { id: '4', nom: 'Salaire', icone: 'briefcase', couleur: '#fff', groupeId: 'autre', favori: false },
  ];
  expect(categoriesDuGroupe(cats, 'g').map((c) => c.nom)).toEqual(['Taxi', 'Café', 'Zakat']);
  expect(categoriesDuGroupe(cats, 'vide')).toEqual([]);
});

test('prochainOrdre', () => {
  expect(prochainOrdre(GROUPES_PAR_DEFAUT)).toBe(4);
  expect(prochainOrdre([])).toBe(0);
});

test('groupesTries suit ordre', () => {
  const inverses = [...GROUPES_PAR_DEFAUT].reverse();
  expect(groupesTries(inverses).map((g) => g.id)).toEqual(GROUPES_PAR_DEFAUT.map((g) => g.id));
});
