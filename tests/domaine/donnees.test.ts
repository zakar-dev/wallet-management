import { avecEntites, sansEntite } from '@/src/domaine/donnees';
import { donneesVides, type Compte } from '@/src/domaine/types';

const c = (id: string, nom: string): Compte =>
  ({ id, nom, type: 'courant', soldeOuverture: 0, couleur: '#000', archive: false, parDefaut: false });

test('avecEntites ajoute puis remplace par id sans muter', () => {
  const d0 = donneesVides();
  const d1 = avecEntites(d0, 'comptes', [c('a', 'A'), c('b', 'B')]);
  const d2 = avecEntites(d1, 'comptes', [c('a', 'A2')]);
  expect(d0.comptes).toHaveLength(0);
  expect(d2.comptes.map((x) => x.nom)).toEqual(['A2', 'B']);
});

test('sansEntite retire par id', () => {
  const d = avecEntites(donneesVides(), 'comptes', [c('a', 'A'), c('b', 'B')]);
  expect(sansEntite(d, 'comptes', 'a').comptes.map((x) => x.id)).toEqual(['b']);
});
