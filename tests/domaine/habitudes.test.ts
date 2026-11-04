import { CATEGORIES_PAR_DEFAUT, GROUPES_PAR_DEFAUT } from '@/src/domaine/categories';
import {
  calendrierDepenses, joursSansDepense, serieSaisie, tendancesCategories, topCommercants,
} from '@/src/domaine/habitudes';
import { previsionTresorerie } from '@/src/domaine/previsions';
import { donneesVides, type Donnees, type Operation } from '@/src/domaine/types';

const AUJ = '2026-11-04';
let n = 0;
const op = (o: Partial<Operation> & Pick<Operation, 'type' | 'montant' | 'date'>): Operation =>
  ({ id: `o${++n}`, compteId: 'cih', libelle: '', ...o });

const base = (operations: Operation[]): Donnees => ({
  ...donneesVides(), groupes: GROUPES_PAR_DEFAUT, categories: CATEGORIES_PAR_DEFAUT, operations,
  comptes: [{ id: 'cih', nom: 'CIH', type: 'courant', soldeOuverture: 1000000, couleur: '#000', archive: false, parDefaut: true }],
});

const d = base([
  op({ type: 'depense', montant: 1000, date: '2026-11-01', categorieId: 'c-courses', libelle: 'Marjane' }),
  op({ type: 'depense', montant: 500, date: '2026-11-01', categorieId: 'c-cafe', libelle: 'Café  du coin' }),
  op({ type: 'depense', montant: 3000, date: '2026-11-03', categorieId: 'c-courses', libelle: 'marjane ' }),
  op({ type: 'depense', montant: 99999, date: '2026-11-03', categorieId: 'c-courses', libelle: 'Ancien', horsSolde: true }),
  op({ type: 'depense', montant: 2000, date: '2026-10-15', categorieId: 'c-courses', libelle: 'Marjane' }),
  op({ type: 'depense', montant: 4000, date: '2026-10-20', categorieId: 'c-loyer', libelle: 'Loyer' }),
  op({ type: 'depense', montant: 600, date: '2026-09-10', categorieId: 'c-cafe', libelle: 'Café du coin' }),
  op({ type: 'depense', montant: 9999, date: '2026-08-10', categorieId: 'c-cafe', libelle: 'Vieux' }),
  op({ type: 'revenu', montant: 500000, date: '2026-11-02', categorieId: 'c-salaire', libelle: 'Salaire' }),
]);

test('calendrier : dépenses par jour et intensité relative', () => {
  const cal = calendrierDepenses(d, '2026-11', AUJ);
  expect(cal).toHaveLength(30);
  expect(cal.slice(0, 5)).toEqual([
    { date: '2026-11-01', montant: 1500, intensite: 0.5, futur: false },
    { date: '2026-11-02', montant: 0, intensite: 0, futur: false },
    { date: '2026-11-03', montant: 3000, intensite: 1, futur: false },
    { date: '2026-11-04', montant: 0, intensite: 0, futur: false },
    { date: '2026-11-05', montant: 0, intensite: 0, futur: true },
  ]);
});

test('jours sans dépense parmi les jours écoulés', () => {
  expect(joursSansDepense(d, '2026-11', AUJ)).toBe(2);
});

test('top commerçants sur 3 mois, libellés regroupés', () => {
  expect(topCommercants(d, '2026-11', 3, 5)).toEqual([
    { libelle: 'Marjane', total: 6000, passages: 3 },
    { libelle: 'Loyer', total: 4000, passages: 1 },
    { libelle: 'Café du coin', total: 1100, passages: 2 },
  ]);
});

test('tendances : mois vs moyenne des mois précédents', () => {
  const t = tendancesCategories(d, '2026-11');
  expect(t.map((x) => x.categorie.id)).toEqual(['c-courses', 'c-cafe', 'c-loyer']);
  // courses : 4 000 vs (0 + 0 + 2 000) / 3 → +500 %
  expect(t[0].montant).toBe(4000);
  expect(t[0].moyenne).toBe(667);
  expect(t[0].ecart).toBeCloseTo(5);
  // café : 500 vs (9 999 + 600 + 0) / 3 = 3 533
  expect(t[1].ecart).toBeCloseTo((500 - 10599 / 3) / (10599 / 3));
  // loyer : 0 vs 4 000 / 3 → −100 %
  expect(t[2].ecart).toBeCloseTo(-1);
});

describe('série de jours de saisie', () => {
  test('rien aujourd’hui : la série part d’hier', () => {
    expect(serieSaisie(d.operations, AUJ)).toBe(3);
  });
  test('une saisie aujourd’hui prolonge la série', () => {
    expect(serieSaisie([...d.operations, op({ type: 'depense', montant: 1, date: AUJ })], AUJ)).toBe(4);
  });
  test('aucune opération', () => {
    expect(serieSaisie([], AUJ)).toBe(0);
  });
});

test('prévision de trésorerie', () => {
  const p = base([
    op({ type: 'depense', montant: 10000, date: '2026-09-05', categorieId: 'c-courses' }),
    op({ type: 'depense', montant: 30000, date: '2026-10-05', categorieId: 'c-courses' }),
    op({ type: 'depense', montant: 50000, date: '2026-10-01', categorieId: 'c-loyer', recurrenceId: 'r2' }),
    op({ type: 'revenu', montant: 200000, date: '2026-10-01', categorieId: 'c-salaire', recurrenceId: 'r1' }),
  ]);
  const modele = (type: Operation['type'], montant: number) => ({ type, montant, compteId: 'cih', libelle: '' });
  p.recurrences = [
    { id: 'r1', jour: 1, active: true, prochaineEcheance: '2026-12-01', modele: modele('revenu', 200000) },
    { id: 'r2', jour: 1, active: true, prochaineEcheance: '2026-12-01', modele: modele('depense', 50000) },
    { id: 'r3', jour: 1, active: false, prochaineEcheance: '2026-12-01', modele: modele('depense', 99999) },
    { id: 'r4', jour: 1, active: true, prochaineEcheance: '2026-12-01', modele: { ...modele('transfert', 7777), compteDestId: 'x' } },
  ];
  // disponible 10 000 − 100 − 300 − 500 + 2 000 = 11 100 ; variables : (100 + 300) / 2 = 200
  // par mois : + 2 000 − 500 − 200 = + 1 300
  const r = previsionTresorerie(p, AUJ, 3);
  expect(r.depart).toBe(1110000);
  expect(r.parMois).toEqual({ revenusRecurrents: 200000, depensesRecurrentes: 50000, depensesVariables: 20000, solde: 130000 });
  expect(r.points).toEqual([
    { mois: '2026-12', valeur: 1240000 },
    { mois: '2027-01', valeur: 1370000 },
    { mois: '2027-02', valeur: 1500000 },
  ]);
});
