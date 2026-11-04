import { soldeCompte } from '@/src/domaine/comptes';
import { joursEntre } from '@/src/domaine/dates';
import { donneesDemo } from '@/src/domaine/demo';
import { epargneLibre } from '@/src/domaine/objectifs';
import {
  creerSauvegarde, lireSauvegarde, nomFichierSauvegarde, rappelSauvegarde, VERSION_SAUVEGARDE,
} from '@/src/domaine/sauvegarde';
import { COLLECTIONS, donneesVides, type Donnees } from '@/src/domaine/types';

const AUJ = '2026-11-04';

test('joursEntre', () => {
  expect(joursEntre('2026-10-28', AUJ)).toBe(7);
  expect(joursEntre('2026-02-28', '2026-03-01')).toBe(1);
  expect(joursEntre(AUJ, AUJ)).toBe(0);
});

describe('export / import', () => {
  const d = donneesDemo(AUJ);

  test('aller-retour sans perte', () => {
    const texte = JSON.stringify(creerSauvegarde(d, '2026-11-04T10:00:00.000Z'));
    const r = lireSauvegarde(texte);
    expect(r).toEqual({ ok: true, date: '2026-11-04T10:00:00.000Z', donnees: d });
  });

  test('format du fichier', () => {
    const s = creerSauvegarde(donneesVides(), '2026-11-04T10:00:00.000Z');
    expect(s).toEqual({ application: 'wallet-management', version: VERSION_SAUVEGARDE, date: '2026-11-04T10:00:00.000Z', donnees: donneesVides() });
    expect(nomFichierSauvegarde('2026-11-04')).toBe('wallet-sauvegarde-2026-11-04.json');
  });

  test.each([
    ['{pas du json', 'Fichier illisible'],
    ['[]', "Ce fichier n'est pas une sauvegarde Wallet"],
    [JSON.stringify({ application: 'autre', version: 1, donnees: {} }), "Ce fichier n'est pas une sauvegarde Wallet"],
    [JSON.stringify({ application: 'wallet-management', version: 2, date: 'x', donnees: donneesVides() }), "Sauvegarde trop récente : mettez l'app à jour"],
    [JSON.stringify({ application: 'wallet-management', version: 1, date: 'x', donnees: { ...donneesVides(), dettes: undefined } }), 'Sauvegarde incomplète ou abîmée'],
    [JSON.stringify({ application: 'wallet-management', version: 1, date: 'x', donnees: { ...donneesVides(), comptes: [{ nom: 'sans id' }] } }), 'Sauvegarde incomplète ou abîmée'],
  ])('%s → %s', (texte, erreur) => {
    expect(lireSauvegarde(texte)).toEqual({ ok: false, erreur });
  });
});

describe('rappelSauvegarde', () => {
  test.each([
    [null, true, true],
    ['2026-10-28', true, false],
    ['2026-10-27', true, true],
    [null, false, false],
  ])('dernière %s, données %s → %s', (derniere, donnees, attendu) => {
    expect(rappelSauvegarde(derniere, AUJ, donnees)).toBe(attendu);
  });
});

describe('données de démo', () => {
  const d: Donnees = donneesDemo(AUJ);
  test('toutes les collections remplies', () => {
    for (const c of COLLECTIONS) expect(d[c].length).toBeGreaterThan(0);
  });
  test('références valides et rien dans le futur', () => {
    const comptes = new Set(d.comptes.map((c) => c.id));
    const cats = new Set(d.categories.map((c) => c.id));
    for (const o of d.operations) {
      expect(comptes.has(o.compteId)).toBe(true);
      if (o.categorieId) expect(cats.has(o.categorieId)).toBe(true);
      expect(o.date <= AUJ).toBe(true);
    }
    for (const a of d.assignations) expect(cats.has(a.categorieId)).toBe(true);
  });
  test('soldes positifs et objectifs couverts par l’épargne', () => {
    for (const c of d.comptes) expect(soldeCompte(c, d.operations)).toBeGreaterThan(0);
    expect(epargneLibre(d.comptes, d.operations, d.objectifs)).toBeGreaterThanOrEqual(0);
  });
  test('identifiants uniques', () => {
    const ids = d.operations.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
