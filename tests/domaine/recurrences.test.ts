import {
  creerRecurrence, echeancesDues, libelleRecurrence, parseJour, prochaineEcheanceApres, reactiver,
} from '@/src/domaine/recurrences';
import type { Operation, Recurrence } from '@/src/domaine/types';

const loyer: Operation = {
  id: 'op1', date: '2026-11-04', montant: 300000, type: 'depense', compteId: 'cih',
  categorieId: 'c-loyer', libelle: 'Loyer', horsSolde: true, recurrenceId: 'ancienne',
};

const compteur = () => { let n = 0; return () => `g${++n}`; };

describe('prochaineEcheanceApres', () => {
  test('strictement après la date', () => {
    expect(prochaineEcheanceApres(5, '2026-11-04')).toBe('2026-11-05');
    expect(prochaineEcheanceApres(5, '2026-11-05')).toBe('2026-12-05');
    expect(prochaineEcheanceApres(5, '2026-12-20')).toBe('2027-01-05');
  });
  test('fin de mois : 31 devient le dernier jour, puis revient à 31', () => {
    expect(prochaineEcheanceApres(31, '2026-01-31')).toBe('2026-02-28');
    expect(prochaineEcheanceApres(31, '2026-02-28')).toBe('2026-03-31');
    expect(prochaineEcheanceApres(31, '2026-03-31')).toBe('2026-04-30');
  });
});

describe('creerRecurrence', () => {
  test('modèle sans id, date, recurrenceId ni horsSolde ; échéance le mois suivant', () => {
    const r = creerRecurrence(loyer, 4, 'r1', '2026-11-04');
    expect(r).toEqual({
      id: 'r1', jour: 4, active: true, prochaineEcheance: '2026-12-04',
      modele: { montant: 300000, type: 'depense', compteId: 'cih', categorieId: 'c-loyer', libelle: 'Loyer' },
    });
  });
  test('pas de rattrapage du passé : opération ancienne → prochaine échéance après aujourd’hui', () => {
    const r = creerRecurrence({ ...loyer, date: '2026-09-15' }, 15, 'r1', '2026-11-04');
    expect(r.prochaineEcheance).toBe('2026-11-15');
  });
  test('opération future : échéance après sa date', () => {
    const r = creerRecurrence({ ...loyer, date: '2026-12-20' }, 20, 'r1', '2026-11-04');
    expect(r.prochaineEcheance).toBe('2027-01-20');
  });
});

describe('echeancesDues', () => {
  const rec: Recurrence = {
    id: 'r1', jour: 31, active: true, prochaineEcheance: '2026-08-31',
    modele: { montant: 300000, type: 'depense', compteId: 'cih', categorieId: 'c-loyer', libelle: 'Loyer' },
  };
  test('rattrape tous les mois manqués et avance l’échéance', () => {
    const { operations, recurrence } = echeancesDues(rec, '2026-11-04', compteur());
    expect(operations.map((o) => o.date)).toEqual(['2026-08-31', '2026-09-30', '2026-10-31']);
    expect(operations[0]).toEqual({
      id: 'g1', date: '2026-08-31', montant: 300000, type: 'depense', compteId: 'cih',
      categorieId: 'c-loyer', libelle: 'Loyer', recurrenceId: 'r1',
    });
    expect(recurrence.prochaineEcheance).toBe('2026-11-30');
  });
  test('échéance du jour même incluse', () => {
    const { operations } = echeancesDues({ ...rec, jour: 4, prochaineEcheance: '2026-11-04' }, '2026-11-04', compteur());
    expect(operations.map((o) => o.date)).toEqual(['2026-11-04']);
  });
  test('rien à faire : même objet renvoyé', () => {
    const r = { ...rec, prochaineEcheance: '2026-11-30' };
    const res = echeancesDues(r, '2026-11-04', compteur());
    expect(res.operations).toEqual([]);
    expect(res.recurrence).toBe(r);
  });
  test('récurrence arrêtée inerte', () => {
    expect(echeancesDues({ ...rec, active: false }, '2026-11-04', compteur()).operations).toEqual([]);
  });
});

test('reactiver sans rattrapage', () => {
  const r: Recurrence = {
    id: 'r1', jour: 5, active: false, prochaineEcheance: '2026-06-05',
    modele: { montant: 1, type: 'depense', compteId: 'a', libelle: '' },
  };
  expect(reactiver(r, '2026-11-04')).toEqual({ ...r, active: true, prochaineEcheance: '2026-11-05' });
});

test('libelleRecurrence', () => {
  const r = (jour: number) => ({ id: 'r', jour, active: true, prochaineEcheance: '2026-12-01',
    modele: { montant: 1, type: 'depense' as const, compteId: 'a', libelle: '' } });
  expect(libelleRecurrence(r(1))).toBe('le 1er de chaque mois');
  expect(libelleRecurrence(r(15))).toBe('le 15 de chaque mois');
});

test('parseJour', () => {
  expect(parseJour('15')).toBe(15);
  expect(parseJour(' 1 ')).toBe(1);
  expect(parseJour('31')).toBe(31);
  for (const x of ['', '0', '32', '3.5', 'a', '-2']) expect(parseJour(x)).toBeNull();
});
