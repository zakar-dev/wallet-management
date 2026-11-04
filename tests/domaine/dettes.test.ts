import { patrimoineNet } from '@/src/domaine/comptes';
import {
  ajouterRemboursement, creerDette, erreurDette, erreurRemboursement, estSoldee, libelleMouvement, operationsDeDette,
  retirerRemboursement, totauxDettes, trierDettes,
} from '@/src/domaine/dettes';
import type { Compte, Dette } from '@/src/domaine/types';

const cih: Compte = { id: 'cih', nom: 'CIH', type: 'courant', soldeOuverture: 500000, couleur: '#000', archive: false, parDefaut: true };

describe('creerDette', () => {
  test('je prête depuis un compte : dépense liée, patrimoine inchangé', () => {
    const { dette, operation } = creerDette({
      id: 'd1', personne: ' Ali ', sens: 'on_me_doit', montant: 100000, date: '2026-11-04', compteId: 'cih', operationId: 'o1',
    });
    expect(dette).toEqual({
      id: 'd1', personne: 'Ali', sens: 'on_me_doit', montant: 100000, date: '2026-11-04', remboursements: [], operationId: 'o1',
    });
    expect(operation).toEqual({
      id: 'o1', date: '2026-11-04', montant: 100000, type: 'depense', compteId: 'cih', libelle: 'Prêt à Ali', detteId: 'd1',
    });
    // avant : 5 000 ; après : 5 000 − 1 000 (compte) + 1 000 (créance) = 5 000
    expect(patrimoineNet([cih], [operation!], [dette])).toBe(500000);
  });
  test('j’emprunte : revenu lié', () => {
    const { operation } = creerDette({
      id: 'd2', personne: 'Sara', sens: 'je_dois', montant: 50000, date: '2026-11-04', compteId: 'cih', operationId: 'o2',
    });
    expect(operation?.type).toBe('revenu');
    expect(operation?.libelle).toBe('Emprunt à Sara');
  });
  test('sans compte : aucune opération', () => {
    const r = creerDette({ id: 'd3', personne: 'Ali', sens: 'on_me_doit', montant: 100, date: '2026-11-04', operationId: 'o3' });
    expect(r.operation).toBeUndefined();
    expect(r.dette.operationId).toBeUndefined();
  });
});

describe('remboursements', () => {
  const base: Dette = { id: 'd1', personne: 'Ali', sens: 'on_me_doit', montant: 100000, date: '2026-10-01', remboursements: [] };

  test('on me rembourse sur un compte : revenu lié ; partiels jusqu’à soldée', () => {
    const r1 = ajouterRemboursement(base, { id: 'r1', date: '2026-11-01', montant: 30000, compteId: 'cih', operationId: 'o1' });
    expect(r1.operation).toEqual({
      id: 'o1', date: '2026-11-01', montant: 30000, type: 'revenu', compteId: 'cih', libelle: 'Remboursement de Ali', detteId: 'd1',
    });
    expect(r1.dette.remboursements).toEqual([{ id: 'r1', date: '2026-11-01', montant: 30000, operationId: 'o1' }]);
    expect(estSoldee(r1.dette)).toBe(false);
    const r2 = ajouterRemboursement(r1.dette, { id: 'r2', date: '2026-11-04', montant: 70000, operationId: 'o2' });
    expect(r2.operation).toBeUndefined();
    expect(estSoldee(r2.dette)).toBe(true);
  });

  test('je rembourse : dépense liée', () => {
    const d: Dette = { ...base, sens: 'je_dois' };
    const r = ajouterRemboursement(d, { id: 'r1', date: '2026-11-01', montant: 1000, compteId: 'cih', operationId: 'o1' });
    expect(r.operation?.type).toBe('depense');
    expect(r.operation?.libelle).toBe('Remboursement à Ali');
  });

  test('retirerRemboursement renvoie l’opération à supprimer', () => {
    const r1 = ajouterRemboursement(base, { id: 'r1', date: '2026-11-01', montant: 30000, compteId: 'cih', operationId: 'o1' });
    const res = retirerRemboursement(r1.dette, 'r1');
    expect(res.dette.remboursements).toEqual([]);
    expect(res.operationId).toBe('o1');
  });

  test('operationsDeDette : création et remboursements', () => {
    const d: Dette = {
      ...base, operationId: 'o0',
      remboursements: [{ id: 'r1', date: '2026-11-01', montant: 1, operationId: 'o1' }, { id: 'r2', date: '2026-11-02', montant: 1 }],
    };
    expect(operationsDeDette(d)).toEqual(['o0', 'o1']);
  });
});

describe('validations', () => {
  const d: Dette = { id: 'd', personne: 'Ali', sens: 'on_me_doit', montant: 100000, date: '2026-10-01',
    remboursements: [{ id: 'r', date: '2026-10-15', montant: 40000 }] };
  test('erreurDette', () => {
    expect(erreurDette({ personne: ' ', montant: 100, date: '2026-11-04' })).toBe('Indiquez la personne');
    expect(erreurDette({ personne: 'Ali', montant: null, date: '2026-11-04' })).toBe('Saisissez un montant');
    expect(erreurDette({ personne: 'Ali', montant: 100, date: '2026-13-01' })).toBe('Date invalide');
    expect(erreurDette({ personne: 'Ali', montant: 100, date: '2026-11-04' })).toBeNull();
  });
  test('erreurRemboursement : pas plus que le reste', () => {
    expect(erreurRemboursement(d, 60001, '2026-11-04')).toBe('Il reste 600,00 MAD à rembourser');
    expect(erreurRemboursement(d, 60000, '2026-11-04')).toBeNull();
    expect(erreurRemboursement(d, 0, '2026-11-04')).toBe('Saisissez un montant');
    expect(erreurRemboursement(d, 100, 'hier')).toBe('Date invalide');
  });
});

test('totaux des restes par sens', () => {
  const dettes: Dette[] = [
    { id: 'a', personne: 'A', sens: 'on_me_doit', montant: 100000, date: '2026-10-01', remboursements: [{ id: 'r', date: '2026-10-02', montant: 25000 }] },
    { id: 'b', personne: 'B', sens: 'on_me_doit', montant: 5000, date: '2026-10-01', remboursements: [] },
    { id: 'c', personne: 'C', sens: 'je_dois', montant: 30000, date: '2026-10-01', remboursements: [] },
  ];
  expect(totauxDettes(dettes)).toEqual({ onMeDoit: 80000, jeDois: 30000 });
});

test('trierDettes : en cours (récentes d’abord) puis soldées', () => {
  const d = (id: string, date: string, solde = false): Dette => ({
    id, personne: id, sens: 'on_me_doit', montant: 100, date,
    remboursements: solde ? [{ id: 'r', date, montant: 100 }] : [],
  });
  expect(trierDettes([d('a', '2026-09-01'), d('b', '2026-10-01', true), d('c', '2026-11-01')]).map((x) => x.id))
    .toEqual(['c', 'a', 'b']);
});

test('libelleMouvement', () => {
  expect(libelleMouvement('on_me_doit', 'Ali', false)).toBe('Prêt à Ali');
  expect(libelleMouvement('je_dois', 'Ali', false)).toBe('Emprunt à Ali');
  expect(libelleMouvement('on_me_doit', 'Ali', true)).toBe('Remboursement de Ali');
  expect(libelleMouvement('je_dois', 'Ali', true)).toBe('Remboursement à Ali');
});
