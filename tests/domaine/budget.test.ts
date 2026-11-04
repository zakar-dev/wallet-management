import {
  budgetDuMois, enveloppe, etatEnveloppe, idAssignation, pretAAssigner, ratioConsomme, resumeBudget, versAssignation,
  type Enveloppe,
} from '@/src/domaine/budget';
import { CATEGORIES_PAR_DEFAUT, GROUPES_PAR_DEFAUT } from '@/src/domaine/categories';
import { donneesVides, type Assignation, type Compte, type Donnees, type Operation } from '@/src/domaine/types';

const a = (mois: string, categorieId: string, montant: number): Assignation =>
  ({ id: idAssignation(mois, categorieId), mois, categorieId, montant });

let n = 0;
const op = (o: Partial<Operation> & Pick<Operation, 'type' | 'montant' | 'date'>): Operation =>
  ({ id: `o${++n}`, compteId: 'cih', libelle: '', ...o });

const comptes: Compte[] = [
  { id: 'cih', nom: 'CIH', type: 'courant', soldeOuverture: 1000000, couleur: '#000', archive: false, parDefaut: true },
  { id: 'ep', nom: 'Épargne', type: 'epargne', soldeOuverture: 0, couleur: '#000', archive: false, parDefaut: false },
];

const assignations = [
  a('2026-09', 'c-courses', 100000),
  // octobre : aucune assignation pour les courses
  a('2026-11', 'c-courses', 50000),
  a('2026-10', 'c-loyer', 300000),
  a('2026-11', 'c-loyer', 300000),
];

const operations: Operation[] = [
  op({ type: 'depense', montant: 60000, date: '2026-09-10', categorieId: 'c-courses' }),
  op({ type: 'depense', montant: 30000, date: '2026-10-05', categorieId: 'c-courses' }),
  op({ type: 'depense', montant: 20000, date: '2026-11-02', categorieId: 'c-courses' }),
  op({ type: 'depense', montant: 99900, date: '2026-11-03', categorieId: 'c-courses', horsSolde: true }),
  op({ type: 'revenu', montant: 5000, date: '2026-11-04', categorieId: 'c-courses' }),
  op({ type: 'transfert', montant: 10000, date: '2026-11-04', compteDestId: 'ep' }),
  op({ type: 'depense', montant: 350000, date: '2026-10-01', categorieId: 'c-loyer' }),
];

const donnees: Donnees = {
  ...donneesVides(), comptes, groupes: GROUPES_PAR_DEFAUT, categories: CATEGORIES_PAR_DEFAUT, operations, assignations,
};

describe('enveloppe', () => {
  test('report sur plusieurs mois, y compris un mois sans assignation', () => {
    // sept : 0 + 1000 − 600 = 400 ; oct : 400 + 0 − 300 = 100 ; nov : 100 + 500 − 200 = 400
    expect(enveloppe(assignations, operations, '2026-09', 'c-courses')).toEqual({ report: 0, assigne: 100000, depense: 60000, reste: 40000 });
    expect(enveloppe(assignations, operations, '2026-10', 'c-courses')).toEqual({ report: 40000, assigne: 0, depense: 30000, reste: 10000 });
    expect(enveloppe(assignations, operations, '2026-11', 'c-courses')).toEqual({ report: 10000, assigne: 50000, depense: 20000, reste: 40000 });
  });
  test('hors solde, revenu et transfert ne sont pas du dépensé', () => {
    expect(enveloppe(assignations, operations, '2026-11', 'c-courses').depense).toBe(20000);
  });
  test('avant toute activité : tout à zéro', () => {
    expect(enveloppe(assignations, operations, '2026-08', 'c-courses')).toEqual({ report: 0, assigne: 0, depense: 0, reste: 0 });
  });
  test('un dépassement n’est pas reporté', () => {
    expect(enveloppe(assignations, operations, '2026-10', 'c-loyer').reste).toBe(-50000);
    expect(enveloppe(assignations, operations, '2026-11', 'c-loyer')).toEqual({ report: 0, assigne: 300000, depense: 0, reste: 300000 });
  });
});

describe('état et ratio', () => {
  const e = (assigne: number, depense: number, report = 0): Enveloppe =>
    ({ report, assigne, depense, reste: report + assigne - depense });
  test.each([
    [e(0, 0), 'vide', 0],
    [e(10000, 9000), 'ok', 0.9],
    [e(10000, 9100), 'alerte', 0.91],
    [e(10000, 10000), 'alerte', 1],
    [e(10000, 10001), 'depasse', 1],
    [e(0, 500), 'depasse', 1],
    [e(0, 1000, 4000), 'ok', 0.25],
  ])('%o → %s', (env, etat, ratio) => {
    expect(etatEnveloppe(env)).toBe(etat);
    expect(ratioConsomme(env)).toBeCloseTo(ratio);
  });
});

test('prêt à assigner = disponible − restes positifs', () => {
  // solde CIH = 10 000 − 600 − 300 − 200 + 50 − 100 − 3 500 = 5 350,00 ; épargne exclue du disponible
  // novembre : restes courses 400 + loyer 3 000 → 5 350 − 3 400 = 1 950
  expect(pretAAssigner(donnees, '2026-11')).toBe(195000);
  // octobre : courses 100, loyer −500 (ignoré) → 5 350 − 100 = 5 250
  expect(pretAAssigner(donnees, '2026-10')).toBe(525000);
});

test('budgetDuMois : groupes de dépenses seulement, dans l’ordre, avec le reste du groupe', () => {
  const groupes = budgetDuMois(donnees, '2026-11');
  expect(groupes.map((g) => g.groupe.id)).toEqual(['g-dep-fixes', 'g-dep-var']);
  expect(groupes[0].reste).toBe(300000);
  expect(groupes[1].reste).toBe(40000);
  const loyer = groupes[0].lignes.find((l) => l.categorie.id === 'c-loyer');
  expect(loyer?.enveloppe.assigne).toBe(300000);
  expect(groupes[1].lignes.length).toBe(CATEGORIES_PAR_DEFAUT.filter((c) => c.groupeId === 'g-dep-var').length);
});

test('resumeBudget du mois', () => {
  const r = resumeBudget(donnees, '2026-11');
  expect(r.budget).toBe(360000);
  expect(r.depense).toBe(20000);
  expect(r.reste).toBe(340000);
  expect(r.ratio).toBeCloseTo(20000 / 360000);
});

test('versAssignation', () => {
  expect(versAssignation('2026-11', 'c-courses', 50000))
    .toEqual({ id: '2026-11:c-courses', mois: '2026-11', categorieId: 'c-courses', montant: 50000 });
});
