/** @jest-environment node */
import 'fake-indexeddb/auto';
import type { Depot } from '@/src/stockage/depot';
import { DepotMemoire } from '@/src/stockage/depotMemoire';
import { ouvrirDepotIndexedDb } from '@/src/stockage/depotIndexedDb';
import { initialiserSiVide } from '@/src/stockage/initialisation';
import { donneesVides, type Compte } from '@/src/domaine/types';

const compte = (id: string, nom: string): Compte =>
  ({ id, nom, type: 'courant', soldeOuverture: 0, couleur: '#0a84ff', archive: false, parDefaut: false });

let n = 0;
const fabriques: [string, () => Promise<Depot>][] = [
  ['mémoire', async () => new DepotMemoire()],
  ['IndexedDB', () => ouvrirDepotIndexedDb(`test-${n++}`)],
];

describe.each(fabriques)('Depot %s', (_nom, fabrique) => {
  test('enregistrer, relire, remplacer, supprimer', async () => {
    const depot = await fabrique();
    await depot.enregistrer('comptes', [compte('a', 'A'), compte('b', 'B')]);
    await depot.enregistrer('comptes', [compte('a', 'A2')]);
    let d = await depot.toutLire();
    expect(d.comptes.map((c) => c.nom).sort()).toEqual(['A2', 'B']);
    await depot.supprimer('comptes', 'a');
    d = await depot.toutLire();
    expect(d.comptes.map((c) => c.id)).toEqual(['b']);
  });

  test('toutRemplacer écrase toutes les collections', async () => {
    const depot = await fabrique();
    await depot.enregistrer('comptes', [compte('a', 'A')]);
    await depot.toutRemplacer({ ...donneesVides(), comptes: [compte('z', 'Z')] });
    expect((await depot.toutLire()).comptes.map((c) => c.id)).toEqual(['z']);
  });

  test('les données lues ne sont pas partagées par référence', async () => {
    const depot = await fabrique();
    await depot.enregistrer('comptes', [compte('a', 'A')]);
    const d = await depot.toutLire();
    d.comptes[0].nom = 'muté';
    expect((await depot.toutLire()).comptes[0].nom).toBe('A');
  });

  test('initialiserSiVide écrit le jeu par défaut une seule fois', async () => {
    const depot = await fabrique();
    const d1 = await initialiserSiVide(depot);
    expect(d1.groupes).toHaveLength(4);
    expect(d1.categories.length).toBeGreaterThan(10);
    await depot.supprimer('categories', 'c-cafe');
    const d2 = await initialiserSiVide(depot);
    expect(d2.categories.find((c) => c.id === 'c-cafe')).toBeUndefined();
  });
});
