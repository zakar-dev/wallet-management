import { normaliser } from '@/src/domaine/texte';

test('normaliser retire accents, casse et espaces de bord', () => {
  expect(normaliser('  Électricité ')).toBe('electricite');
});
