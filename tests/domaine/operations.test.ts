import {
  FILTRE_VIDE, categoriesUtilisees, effetNet, erreurOperation, horsSoldeSelonDate, montantSigne, filtrerOperations, grouperParJour, operationsRecentes, versBrouillon,
  versOperation, type Brouillon,
} from '@/src/domaine/operations';
import { CATEGORIES_PAR_DEFAUT } from '@/src/domaine/categories';
import type { Operation } from '@/src/domaine/types';

const base: Brouillon = { type: 'depense', montant: 1500, compteId: 'a', categorieId: 'c-cafe', date: '2026-11-03', libelle: ' Café Paul ', horsSolde: false };

describe('erreurOperation', () => {
  test('valide', () => expect(erreurOperation(base)).toBeNull());
  test('montant nul ou absent', () => {
    expect(erreurOperation({ ...base, montant: 0 })).toBe('Saisissez un montant');
    expect(erreurOperation({ ...base, montant: null })).toBe('Saisissez un montant');
  });
  test('compte manquant', () => expect(erreurOperation({ ...base, compteId: undefined })).toBe('Choisissez un compte'));
  test('catégorie manquante pour une dépense ou un revenu', () => {
    expect(erreurOperation({ ...base, categorieId: undefined })).toBe('Choisissez une catégorie');
    expect(erreurOperation({ ...base, type: 'revenu', categorieId: undefined })).toBe('Choisissez une catégorie');
  });
  test('transfert', () => {
    const t: Brouillon = { ...base, type: 'transfert', categorieId: undefined };
    expect(erreurOperation(t)).toBe('Choisissez le compte de destination');
    expect(erreurOperation({ ...t, compteDestId: 'a' })).toBe('Choisissez deux comptes différents');
    expect(erreurOperation({ ...t, compteDestId: 'b' })).toBeNull();
  });
  test('date invalide', () => expect(erreurOperation({ ...base, date: '2026-02-30' })).toBe('Date invalide'));
});

test('versOperation nettoie selon le type', () => {
  expect(versOperation(base, 'x')).toEqual({ id: 'x', type: 'depense', montant: 1500, compteId: 'a', categorieId: 'c-cafe', date: '2026-11-03', libelle: 'Café Paul' });
  const t = versOperation({ ...base, type: 'transfert', compteDestId: 'b' }, 'y');
  expect(t.categorieId).toBeUndefined();
  expect(t.compteDestId).toBe('b');
});

test('versBrouillon fait l’aller-retour', () => {
  const o = versOperation(base, 'x');
  expect(versOperation(versBrouillon(o), 'x')).toEqual(o);
});

const ops: Operation[] = [
  { id: '1', date: '2026-11-02', montant: 1000, type: 'depense', compteId: 'a', categorieId: 'c-cafe', libelle: 'Paul' },
  { id: '2', date: '2026-11-03', montant: 500000, type: 'revenu', compteId: 'a', categorieId: 'c-salaire', libelle: 'Novembre' },
  { id: '3', date: '2026-11-03', montant: 20000, type: 'depense', compteId: 'b', categorieId: 'c-courses', libelle: 'Marjane' },
  { id: '4', date: '2026-11-02', montant: 30000, type: 'transfert', compteId: 'a', compteDestId: 'b', libelle: '' },
];

test('grouperParJour : jours récents d’abord, total net (transferts neutres)', () => {
  const jours = grouperParJour(ops);
  expect(jours.map((j) => j.date)).toEqual(['2026-11-03', '2026-11-02']);
  expect(jours[0].total).toBe(500000 - 20000);
  expect(jours[1].total).toBe(-1000);
  expect(jours[1].operations.map((o) => o.id)).toEqual(['1', '4']);
});

describe('filtrerOperations', () => {
  const f = (x: Partial<typeof FILTRE_VIDE>) =>
    filtrerOperations(ops, { ...FILTRE_VIDE, ...x }, CATEGORIES_PAR_DEFAUT).map((o) => o.id);
  test('sans filtre', () => expect(f({})).toEqual(['1', '2', '3', '4']));
  test('texte sur libellé ou nom de catégorie, sans accents', () => {
    expect(f({ texte: 'marj' })).toEqual(['3']);
    expect(f({ texte: 'CAFE' })).toEqual(['1']);
  });
  test('type', () => expect(f({ type: 'depense' })).toEqual(['1', '3']));
  test('compte : source ou destination', () => expect(f({ compteId: 'b' })).toEqual(['3', '4']));
  test('catégorie', () => expect(f({ categorieId: 'c-salaire' })).toEqual(['2']));
});

test('operationsRecentes', () => {
  expect(operationsRecentes(ops, 2).map((o) => o.id)).toEqual(['3', '2']); // même date : dernière saisie d'abord
});

test('categoriesUtilisees : seulement celles présentes dans les opérations, par nom', () => {
  expect(categoriesUtilisees(CATEGORIES_PAR_DEFAUT, ops).map((c) => c.nom)).toEqual(['Café', 'Courses', 'Salaire']);
});

describe('hors solde', () => {
  test('horsSoldeSelonDate : seulement avant aujourd’hui', () => {
    expect(horsSoldeSelonDate('2026-11-03', '2026-11-04')).toBe(true);
    expect(horsSoldeSelonDate('2026-11-04', '2026-11-04')).toBe(false);
    expect(horsSoldeSelonDate('2026-11-05', '2026-11-04')).toBe(false);
  });
  test('effetNet nul mais montantSigne conservé', () => {
    const o: Operation = { id: 'h', date: '2026-10-01', montant: 1000, type: 'depense', compteId: 'a', categorieId: 'c-cafe', libelle: '', horsSolde: true };
    expect(effetNet(o)).toBe(0);
    expect(montantSigne(o)).toBe(-1000);
    expect(montantSigne({ ...o, type: 'revenu' })).toBe(1000);
    expect(montantSigne({ ...o, type: 'transfert', compteDestId: 'b' })).toBe(0);
  });
  test('total du jour ignore les opérations hors solde', () => {
    const jour = grouperParJour([
      { id: '1', date: '2026-10-01', montant: 1000, type: 'depense', compteId: 'a', categorieId: 'c-cafe', libelle: '' },
      { id: '2', date: '2026-10-01', montant: 5000, type: 'depense', compteId: 'a', categorieId: 'c-cafe', libelle: '', horsSolde: true },
    ]);
    expect(jour[0].total).toBe(-1000);
    expect(jour[0].operations).toHaveLength(2);
  });
  test('versOperation n’écrit horsSolde que s’il est vrai, aller-retour conservé', () => {
    expect('horsSolde' in versOperation({ ...base, horsSolde: false }, 'x')).toBe(false);
    const o = versOperation({ ...base, horsSolde: true }, 'x');
    expect(o.horsSolde).toBe(true);
    expect(versOperation(versBrouillon(o), 'x')).toEqual(o);
  });
});
