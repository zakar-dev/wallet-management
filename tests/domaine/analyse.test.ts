import {
  fluxParMois, indicateursMois, operationsComptees, patrimoineParMois, repartitionCategories,
} from '@/src/domaine/analyse';
import { CATEGORIES_PAR_DEFAUT, GROUPES_PAR_DEFAUT } from '@/src/domaine/categories';
import { donneesVides, type Donnees, type Operation } from '@/src/domaine/types';

let n = 0;
const op = (o: Partial<Operation> & Pick<Operation, 'type' | 'montant' | 'date'>): Operation =>
  ({ id: `o${++n}`, compteId: 'cih', libelle: '', ...o });

const operations: Operation[] = [
  op({ type: 'revenu', montant: 500000, date: '2026-09-01', categorieId: 'c-salaire' }),
  op({ type: 'depense', montant: 100000, date: '2026-09-10', categorieId: 'c-courses' }),
  op({ type: 'revenu', montant: 500000, date: '2026-10-01', categorieId: 'c-salaire' }),
  op({ type: 'depense', montant: 200000, date: '2026-10-05', categorieId: 'c-loyer' }),
  op({ type: 'depense', montant: 50000, date: '2026-10-20', categorieId: 'c-courses' }),
  op({ type: 'depense', montant: 30000, date: '2026-11-02', categorieId: 'c-courses', libelle: 'Marjane' }),
  op({ type: 'depense', montant: 10000, date: '2026-11-03', categorieId: 'c-cafe' }),
  // exclus des analyses
  op({ type: 'depense', montant: 99999, date: '2026-11-03', categorieId: 'c-courses', horsSolde: true }),
  op({ type: 'transfert', montant: 40000, date: '2026-11-04', compteDestId: 'ep' }),
  op({ type: 'depense', montant: 20000, date: '2026-11-01', detteId: 'd1', libelle: 'Prêt à Ali' }),
];

const d: Donnees = {
  ...donneesVides(),
  comptes: [
    { id: 'cih', nom: 'CIH', type: 'courant', soldeOuverture: 100000, couleur: '#000', archive: false, parDefaut: true },
    { id: 'ep', nom: 'Épargne', type: 'epargne', soldeOuverture: 0, couleur: '#000', archive: false, parDefaut: false },
  ],
  groupes: GROUPES_PAR_DEFAUT,
  categories: CATEGORIES_PAR_DEFAUT,
  operations,
  dettes: [{ id: 'd1', personne: 'Ali', sens: 'on_me_doit', montant: 20000, date: '2026-11-01', remboursements: [] }],
};

test('operationsComptees exclut hors solde, transferts et dettes', () => {
  expect(operationsComptees(operations)).toHaveLength(7);
});

test('flux par mois', () => {
  expect(fluxParMois(d, '2026-11', 3)).toEqual([
    { mois: '2026-09', revenus: 500000, depenses: 100000 },
    { mois: '2026-10', revenus: 500000, depenses: 250000 },
    { mois: '2026-11', revenus: 0, depenses: 40000 },
  ]);
});

test('patrimoine en fin de mois', () => {
  // sept : 1 000 + 5 000 − 1 000 = 5 000 ; oct : + 5 000 − 2 500 = 7 500
  // nov : CIH 7 500 − 300 − 100 − 400 − 200 = 6 500 ; épargne 400 ; créance 200 → 7 100
  expect(patrimoineParMois(d, '2026-11', 3)).toEqual([
    { mois: '2026-09', valeur: 500000 },
    { mois: '2026-10', valeur: 750000 },
    { mois: '2026-11', valeur: 710000 },
  ]);
});

test('répartition des dépenses du mois par catégorie', () => {
  const r = repartitionCategories(d, '2026-11');
  expect(r.map((x) => [x.categorie.id, x.montant, x.part])).toEqual([['c-courses', 30000, 0.75], ['c-cafe', 10000, 0.25]]);
});

describe('indicateurs du mois', () => {
  test('mois courant', () => {
    const i = indicateursMois(d, '2026-11', '2026-11-04');
    expect(i.depense).toBe(40000);
    expect(i.joursEcoules).toBe(4);
    expect(i.moyenneParJour).toBe(10000);
    // 400 ÷ 4 × 30 = 3 000
    expect(i.projection).toBe(300000);
    // mois précédents depuis la 1re opération : sept (1 000) et oct (2 500) → 1 750
    expect(i.moyenne6Mois).toBe(175000);
    // disponible 6 500 ÷ 1 750 = 3,71 mois
    expect(i.autonomie).toBeCloseTo(650000 / 175000);
    expect(i.plusGrosses.map((o) => o.montant)).toEqual([30000, 10000]);
  });
  test('mois passé : projection = dépensé', () => {
    const i = indicateursMois(d, '2026-10', '2026-11-04');
    expect(i.joursEcoules).toBe(31);
    expect(i.projection).toBe(250000);
    expect(i.moyenneParJour).toBe(8065);
    expect(i.moyenne6Mois).toBe(100000);
  });
  test('mois futur : rien d’écoulé', () => {
    const i = indicateursMois(d, '2026-12', '2026-11-04');
    expect([i.joursEcoules, i.moyenneParJour, i.projection, i.depense]).toEqual([0, 0, 0, 0]);
  });
  test('sans historique : pas d’autonomie', () => {
    const vide = { ...d, operations: [] };
    const i = indicateursMois(vide, '2026-11', '2026-11-04');
    expect(i.moyenne6Mois).toBe(0);
    expect(i.autonomie).toBeNull();
  });
});
