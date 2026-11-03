import {
  compteParDefaut, compteUtilise, comptesActifs, definirParDefaut, disponible, erreurCompte,
  patrimoineNet, resteDette, soldeCompte,
} from '@/src/domaine/comptes';
import type { Compte, Dette, Operation } from '@/src/domaine/types';

const compte = (id: string, type: Compte['type'], soldeOuverture: number, extra: Partial<Compte> = {}): Compte =>
  ({ id, nom: id, type, soldeOuverture, couleur: '#0a84ff', archive: false, parDefaut: false, ...extra });
const op = (o: Partial<Operation> & Pick<Operation, 'type' | 'montant' | 'compteId'>): Operation =>
  ({ id: Math.random().toString(), date: '2026-11-01', libelle: '', ...o });

const courant = compte('courant', 'courant', 100000);
const epargne = compte('epargne', 'epargne', 500000);
const especes = compte('especes', 'especes', 20000);
const ops: Operation[] = [
  op({ type: 'revenu', montant: 800000, compteId: 'courant', categorieId: 'c-salaire' }),
  op({ type: 'depense', montant: 45050, compteId: 'courant', categorieId: 'c-courses' }),
  op({ type: 'transfert', montant: 200000, compteId: 'courant', compteDestId: 'epargne' }),
  op({ type: 'transfert', montant: 10000, compteId: 'courant', compteDestId: 'especes' }),
  op({ type: 'depense', montant: 3500, compteId: 'especes', categorieId: 'c-cafe' }),
];

test('solde = ouverture + revenus − dépenses − transferts sortants + entrants', () => {
  // 1000,00 + 8000,00 − 450,50 − 2000,00 − 100,00 = 6449,50
  expect(soldeCompte(courant, ops)).toBe(644950);
  // 5000,00 + 2000,00
  expect(soldeCompte(epargne, ops)).toBe(700000);
  // 200,00 + 100,00 − 35,00
  expect(soldeCompte(especes, ops)).toBe(26500);
});

test('disponible = courants + espèces non archivés', () => {
  const archive = compte('vieux', 'courant', 99900, { archive: true });
  expect(disponible([courant, epargne, especes, archive], ops)).toBe(644950 + 26500);
});

test('resteDette', () => {
  const d: Dette = { id: 'd', personne: 'Ali', sens: 'je_dois', montant: 100000,
    remboursements: [{ date: '2026-11-01', montant: 30000 }] };
  expect(resteDette(d)).toBe(70000);
});

test('patrimoine net = tous les comptes + créances − dettes restantes', () => {
  const dettes: Dette[] = [
    { id: 'a', personne: 'Ali', sens: 'je_dois', montant: 100000, remboursements: [{ date: '2026-11-01', montant: 30000 }] },
    { id: 'b', personne: 'Sara', sens: 'on_me_doit', montant: 50000, remboursements: [] },
  ];
  expect(patrimoineNet([courant, epargne, especes], ops, dettes))
    .toBe(644950 + 700000 + 26500 + 50000 - 70000);
});

test('comptes actifs : sans archivés, compte par défaut en tête', () => {
  const b = compte('b', 'courant', 0, { parDefaut: true });
  const archive = compte('z', 'courant', 0, { archive: true });
  expect(comptesActifs([courant, archive, b]).map((c) => c.id)).toEqual(['b', 'courant']);
  expect(compteParDefaut([courant, archive, b])?.id).toBe('b');
  expect(compteParDefaut([courant])?.id).toBe('courant');
  expect(compteParDefaut([])).toBeUndefined();
});

test('definirParDefaut ne garde qu’un seul compte par défaut', () => {
  const r = definirParDefaut([compte('a', 'courant', 0, { parDefaut: true }), compte('b', 'courant', 0)], 'b');
  expect(r.map((c) => c.parDefaut)).toEqual([false, true]);
});

test('compteUtilise détecte source et destination', () => {
  expect(compteUtilise('epargne', ops)).toBe(true);
  expect(compteUtilise('inconnu', ops)).toBe(false);
});

test('erreurCompte', () => {
  expect(erreurCompte({ nom: '  ' })).toBe('Donnez un nom au compte');
  expect(erreurCompte({ nom: 'CIH' })).toBeNull();
});
