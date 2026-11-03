import { formatMontant, parseMontant } from '@/src/domaine/montant';

describe('formatMontant', () => {
  test('milliers et décimales', () => {
    expect(formatMontant(9414800)).toBe('94 148,00');
  });
  test('petits montants', () => {
    expect(formatMontant(5)).toBe('0,05');
    expect(formatMontant(0)).toBe('0,00');
  });
  test('négatif avec signe moins', () => {
    expect(formatMontant(-123456)).toBe('−1 234,56');
  });
  test('signe + optionnel', () => {
    expect(formatMontant(1000, { signe: true })).toBe('+10,00');
    expect(formatMontant(0, { signe: true })).toBe('0,00');
  });
  test('millions', () => {
    expect(formatMontant(123456789)).toBe('1 234 567,89');
  });
});

describe('parseMontant', () => {
  test.each([
    ['12', 1200], ['12,5', 1250], ['12.05', 1205], ['1 234,56', 123456],
    ['0,99', 99], ['12,', 1200],
  ])('%s -> %i', (saisie, attendu) => {
    expect(parseMontant(saisie)).toBe(attendu);
  });
  test.each(['', 'abc', '1,234', '-5', '1,2,3'])('%s invalide', (saisie) => {
    expect(parseMontant(saisie)).toBeNull();
  });
});
