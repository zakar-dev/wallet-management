import {
  ajouterJours, ajouterMois, aujourdhui, estDateValide, joursDansMois, libelleJour, libelleMois, moisDe,
} from '@/src/domaine/dates';

test('aujourdhui formate en local', () => {
  expect(aujourdhui(new Date(2026, 0, 5))).toBe('2026-01-05');
});
test('ajouterJours traverse les mois et années', () => {
  expect(ajouterJours('2026-02-28', 1)).toBe('2026-03-01');
  expect(ajouterJours('2026-01-01', -1)).toBe('2025-12-31');
});
test('moisDe', () => expect(moisDe('2026-11-03')).toBe('2026-11'));
test('ajouterMois', () => {
  expect(ajouterMois('2026-11', 2)).toBe('2027-01');
  expect(ajouterMois('2026-01', -1)).toBe('2025-12');
});
test('joursDansMois', () => {
  expect(joursDansMois('2026-02')).toBe(28);
  expect(joursDansMois('2028-02')).toBe(29);
  expect(joursDansMois('2026-01')).toBe(31);
  expect(joursDansMois('2026-04')).toBe(30);
});
test('libelleJour', () => {
  expect(libelleJour('2026-11-03', '2026-11-03')).toBe("Aujourd'hui");
  expect(libelleJour('2026-11-02', '2026-11-03')).toBe('Hier');
  expect(libelleJour('2026-11-01', '2026-11-03')).toBe('Dimanche 1 novembre');
  expect(libelleJour('2025-12-31', '2026-11-03')).toBe('Mercredi 31 décembre 2025');
});
test('libelleMois', () => expect(libelleMois('2026-11')).toBe('Novembre 2026'));
test('estDateValide', () => {
  expect(estDateValide('2026-02-28')).toBe(true);
  expect(estDateValide('2026-02-30')).toBe(false);
  expect(estDateValide('03/11/2026')).toBe(false);
});
