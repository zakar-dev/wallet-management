import {
  allouer, depenserObjectif, epargneLibre, epargneTotale, erreurAllocation, erreurObjectif, erreurRetrait, estAtteint,
  moisRestants, montantConseille, progression, retirer, trierObjectifs,
} from '@/src/domaine/objectifs';
import type { Compte, Objectif, Operation } from '@/src/domaine/types';

const compte = (id: string, type: Compte['type'], soldeOuverture: number, archive = false): Compte =>
  ({ id, nom: id, type, soldeOuverture, couleur: '#000', archive, parDefaut: false });

const comptes = [
  compte('ep1', 'epargne', 500000),
  compte('ep2', 'epargne', 200000, true), // archivé : exclu
  compte('cih', 'courant', 100000), // courant : exclu
];
const ops: Operation[] = [
  { id: 't', date: '2026-11-01', montant: 50000, type: 'transfert', compteId: 'cih', compteDestId: 'ep1', libelle: '' },
];

const voyage: Objectif = { id: 'v', nom: 'Voyage', icone: 'plane', cible: 1000000, echeance: '2027-02-15', reserve: 300000 };
const telephone: Objectif = { id: 't', nom: 'Téléphone', icone: 'smartphone', cible: 100000, reserve: 100000 };
const fonds: Objectif = { id: 'f', nom: 'Fonds d’urgence', icone: 'shield', cible: 2000000, reserve: 0 };

test('épargne totale : comptes épargne non archivés seulement', () => {
  expect(epargneTotale(comptes, ops)).toBe(550000);
});

test('épargne libre = épargne totale − Σ réservés', () => {
  // 5 500 − (3 000 + 1 000 + 0) = 1 500
  expect(epargneLibre(comptes, ops, [voyage, telephone, fonds])).toBe(150000);
});

describe('erreurAllocation', () => {
  test('refusée au-delà du libre, avec le montant libre', () => {
    expect(erreurAllocation(150001, 150000)).toBe('Il reste seulement 1 500,00 MAD libres sur vos comptes épargne');
    expect(erreurAllocation(150000, 150000)).toBeNull();
  });
  test('libre négatif affiché à zéro', () => {
    expect(erreurAllocation(100, -5000)).toBe('Il reste seulement 0,00 MAD libres sur vos comptes épargne');
  });
  test('montant nul ou invalide', () => {
    expect(erreurAllocation(0, 1000)).toBe('Saisissez un montant');
    expect(erreurAllocation(null, 1000)).toBe('Saisissez un montant');
  });
});

test('erreurRetrait', () => {
  expect(erreurRetrait(voyage, 300001)).toBe('Cet objectif ne contient que 3 000,00 MAD');
  expect(erreurRetrait(voyage, 300000)).toBeNull();
  expect(erreurRetrait(voyage, null)).toBe('Saisissez un montant');
});

test('allouer et retirer', () => {
  expect(allouer(voyage, 50000).reserve).toBe(350000);
  expect(retirer(voyage, 50000).reserve).toBe(250000);
});

test('dépenser : crée la dépense et réduit la réserve', () => {
  const r = depenserObjectif(voyage, 100000, { id: 'op9', compteId: 'ep1', categorieId: 'c-loisirs', date: '2026-11-04' });
  expect(r.objectif.reserve).toBe(200000);
  expect(r.operation).toEqual({
    id: 'op9', date: '2026-11-04', montant: 100000, type: 'depense', compteId: 'ep1', categorieId: 'c-loisirs', libelle: 'Voyage',
  });
});

test('moisRestants : mois courant compris, au moins 1', () => {
  expect(moisRestants('2026-11-04', '2027-02-15')).toBe(4);
  expect(moisRestants('2026-11-04', '2026-11-30')).toBe(1);
  expect(moisRestants('2026-11-04', '2026-09-01')).toBe(1);
});

describe('montantConseille', () => {
  test('reste ÷ mois restants', () => {
    // (10 000 − 3 000) ÷ 4 = 1 750
    expect(montantConseille(voyage, '2026-11-04')).toBe(175000);
  });
  test('arrondi au centime supérieur', () => {
    // 1 000 ÷ 3 mois (nov, déc, jan) = 333,333… → 333,34
    expect(montantConseille({ ...fonds, cible: 100000, echeance: '2027-01-10' }, '2026-11-04')).toBe(33334);
  });
  test('sans échéance : aucun ; atteint : 0', () => {
    expect(montantConseille(fonds, '2026-11-04')).toBeNull();
    expect(montantConseille({ ...telephone, echeance: '2027-01-01' }, '2026-11-04')).toBe(0);
  });
});

test('progression et atteint', () => {
  expect(progression(voyage)).toBeCloseTo(0.3);
  expect(progression({ ...telephone, reserve: 150000 })).toBe(1);
  expect(estAtteint(telephone)).toBe(true);
  expect(estAtteint(voyage)).toBe(false);
});

test('erreurObjectif', () => {
  expect(erreurObjectif({ nom: ' ', cible: 1000, echeance: '' })).toBe("Donnez un nom à l'objectif");
  expect(erreurObjectif({ nom: 'Voyage', cible: null, echeance: '' })).toBe('Saisissez un montant cible');
  expect(erreurObjectif({ nom: 'Voyage', cible: 0, echeance: '' })).toBe('Saisissez un montant cible');
  expect(erreurObjectif({ nom: 'Voyage', cible: 1000, echeance: '2026-02-30' })).toBe('Date invalide');
  expect(erreurObjectif({ nom: 'Voyage', cible: 1000, echeance: '' })).toBeNull();
  expect(erreurObjectif({ nom: 'Voyage', cible: 1000, echeance: '2027-02-15' })).toBeNull();
});

test('trierObjectifs : en cours par échéance, puis sans échéance, puis atteints', () => {
  const proche: Objectif = { ...voyage, id: 'p', echeance: '2026-12-01' };
  expect(trierObjectifs([fonds, telephone, voyage, proche]).map((o) => o.id)).toEqual(['p', 'v', 'f', 't']);
});
