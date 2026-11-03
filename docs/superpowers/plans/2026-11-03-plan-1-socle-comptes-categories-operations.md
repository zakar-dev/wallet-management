# Plan 1 — Socle, Comptes, Catégories, Opérations

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Une PWA Expo installable où l'on gère ses comptes et ses catégories, saisit / modifie / supprime des opérations (dépense, revenu, transfert) et les consulte groupées par jour avec recherche et filtres — données sur l'appareil (IndexedDB).

**Architecture:** Expo (React Native) + Expo Router, exporté en web statique. Toutes les règles métier dans `src/domaine/` (TypeScript pur, testé avec Jest). Stockage derrière une interface `Depot` (IndexedDB via `idb`, mémoire pour les tests). Un `DonneesProvider` React charge les données et expose les actions aux écrans ; les écrans n'appellent que des fonctions du domaine.

**Tech Stack:** Expo SDK (dernière stable via `create-expo-app`), Expo Router, react-native-web, react-native-svg, lucide-react-native, idb ; Jest (`jest-expo`) + `fake-indexeddb` (dev).

Spec : `docs/superpowers/specs/2026-11-03-wallet-management-design.md`.
Plans suivants (un par bloc, même ordre que le spec §3) : 2 Budget, 3 Récurrents, 4 Objectifs, 5 Dettes, 6 Analyse, 7 Habitudes & prévisions, 8 Sauvegarde (export/import, rappel 7 jours, démo).

## Global Constraints

- Plateformes : iPhone et Android, distribution **PWA** (pas de store), hébergement GitHub Pages.
- Données **sur l'appareil uniquement**, aucun serveur, hors ligne.
- Devise : MAD, une seule. Langue : français.
- **Montants en centimes entiers.** Formatage `94 148,00` à l'affichage seulement (espace insécable ` ` comme séparateur de milliers, virgule décimale).
- **Les soldes se calculent, ne se stockent pas.**
- **Tout calcul vit dans `src/domaine/`**, fonctions pures, sans React. Les écrans ne calculent rien.
- Dépendances runtime : Expo, Expo Router, react-native-web, react-native-svg, lucide-react-native, idb (+ paquets requis par Expo Router). Rien d'autre sans raison.
- Icônes Lucide blanches dans des carrés arrondis colorés. **Aucun emoji.**
- Thème sombre par défaut (`#000`, `#1c1c1e`, `#2c2c2e`, `#8e8e93`, `#38383a`, accent `#0a84ff`, succès `#30d158`, alerte `#ff9f0a`, erreur `#ff453a`), clair si le système est en clair (`#f2f2f7`, `#fff`, `#007aff`…).
- Chiffres tabulaires pour tous les montants.
- Saisie invalide : bouton OK grisé + message court ; jamais d'erreur technique à l'écran.
- Onglets : **Accueil, Opérations, (+), Budget, Plus**.

---

## Structure des fichiers

```
app/
  _layout.tsx                 Stack racine, DonneesProvider, thème
  (onglets)/_layout.tsx       barre d'onglets ; « + » ouvre /ajout
  (onglets)/index.tsx         Accueil
  (onglets)/operations.tsx    liste + recherche + filtres
  (onglets)/ajouter.tsx       écran vide (onglet intercepté)
  (onglets)/budget.tsx        provisoire (« bloc 4 »)
  (onglets)/plus.tsx          menu
  ajout.tsx                   feuille modale ajout / modification d'opération
  comptes/index.tsx           liste des comptes
  comptes/[id].tsx            formulaire compte (id = "nouveau" pour créer)
  categories/index.tsx        liste groupée des catégories
  categories/[id].tsx         formulaire catégorie
  groupes/[id].tsx            formulaire groupe
  +html.tsx                   <head> web : manifeste, thème, service worker
public/
  manifest.json, sw.js, icone-192.png, icone-512.png
src/domaine/
  montant.ts dates.ts texte.ts id.ts types.ts donnees.ts
  comptes.ts categories.ts operations.ts
src/stockage/
  depot.ts depotMemoire.ts depotIndexedDb.ts initialisation.ts DonneesProvider.tsx
src/ui/
  theme.ts icones.ts Texte.tsx IconeCarree.tsx Liste.tsx Segment.tsx
  Champ.tsx Ecran.tsx CarteCompte.tsx SelecteurCategorie.tsx Puces.tsx
tests/
  domaine/*.test.ts stockage/*.test.ts
```

---

### Task 1: Socle Expo + Jest

**Files:**
- Create: projet Expo à la racine (`package.json`, `app.json`, `tsconfig.json`), `jest.config.js`, `tests/socle.test.ts`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `npm test` (Jest), `npx expo start --web`, alias d'import `@/` → racine.

- [ ] **Step 1: Générer le projet dans un dossier temporaire puis le rapatrier** (le dépôt n'est pas vide)

```bash
npx create-expo-app@latest _tmp --template blank-typescript --no-install
cp -r _tmp/. . && rm -rf _tmp
rm -f App.tsx index.ts
```

- [ ] **Step 2: Installer les dépendances**

```bash
npm install
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar react-dom react-native-web @expo/metro-runtime react-native-svg
npm install lucide-react-native idb
npx expo install -- --save-dev jest-expo jest @types/jest
npm install --save-dev fake-indexeddb
```

- [ ] **Step 3: Configurer `package.json`** — `"main": "expo-router/entry"`, scripts :

```json
"scripts": {
  "start": "expo start",
  "web": "expo start --web",
  "test": "jest",
  "typecheck": "tsc --noEmit",
  "build:web": "expo export -p web"
}
```

- [ ] **Step 4: Configurer `app.json`** (`expo` →)

```json
"name": "Wallet",
"slug": "wallet-management",
"scheme": "wallet",
"userInterfaceStyle": "automatic",
"backgroundColor": "#000000",
"web": { "bundler": "metro", "output": "static", "name": "Wallet", "shortName": "Wallet", "themeColor": "#000000", "backgroundColor": "#000000" },
"plugins": ["expo-router"],
"experiments": { "typedRoutes": false }
```

- [ ] **Step 5: `tsconfig.json`** — `"strict": true`, `"paths": { "@/*": ["./*"] }`.

- [ ] **Step 6: `jest.config.js`**

```js
module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/tests/**/*.test.ts?(x)'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
};
```

- [ ] **Step 7: Test de fumée** `tests/socle.test.ts`

```ts
test('jest fonctionne', () => {
  expect(1 + 1).toBe(2);
});
```

Run: `npm test` → PASS. Run: `npm run typecheck` → aucune erreur.

- [ ] **Step 8: Commit**

```bash
git add -A ':!.idea'
git commit -m "chore: socle Expo + Expo Router + Jest"
```

---

### Task 2: Montants, dates, texte, identifiants

**Files:**
- Create: `src/domaine/montant.ts`, `src/domaine/dates.ts`, `src/domaine/texte.ts`, `src/domaine/id.ts`
- Test: `tests/domaine/montant.test.ts`, `tests/domaine/dates.test.ts`, `tests/domaine/texte.test.ts`

**Interfaces:**
- Produces:
  - `type Centimes = number`; `formatMontant(c: Centimes, opts?: { signe?: boolean }): string`; `parseMontant(saisie: string): Centimes | null`
  - `type DateISO = string` (`AAAA-MM-JJ`), `type Mois = string` (`AAAA-MM`); `aujourdhui(d?: Date): DateISO`; `ajouterJours(date: DateISO, n: number): DateISO`; `moisDe(date: DateISO): Mois`; `ajouterMois(mois: Mois, n: number): Mois`; `joursDansMois(mois: Mois): number`; `libelleJour(date: DateISO, ref?: DateISO): string`; `libelleMois(mois: Mois): string`; `estDateValide(s: string): boolean`
  - `normaliser(s: string): string`
  - `nouvelId(): string`

- [ ] **Step 1: Tests**

`tests/domaine/montant.test.ts`
```ts
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
```

`tests/domaine/dates.test.ts`
```ts
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
```

`tests/domaine/texte.test.ts`
```ts
import { normaliser } from '@/src/domaine/texte';

test('normaliser retire accents, casse et espaces de bord', () => {
  expect(normaliser('  Électricité ')).toBe('electricite');
});
```

- [ ] **Step 2: Run** `npm test -- tests/domaine` → FAIL (modules absents).

- [ ] **Step 3: Implémentation**

`src/domaine/montant.ts`
```ts
export type Centimes = number;

const ESPACE = ' ';
const MOINS = '−';

export function formatMontant(c: Centimes, opts: { signe?: boolean } = {}): string {
  const abs = Math.abs(c);
  const entiers = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ESPACE);
  const texte = `${entiers},${String(abs % 100).padStart(2, '0')}`;
  if (c < 0) return MOINS + texte;
  if (opts.signe && c > 0) return '+' + texte;
  return texte;
}

export function parseMontant(saisie: string): Centimes | null {
  const propre = saisie.replace(/[\s  ]/g, '').replace(',', '.');
  if (!/^\d+(\.\d{0,2})?$/.test(propre)) return null;
  const [entiers, decimales = ''] = propre.split('.');
  return Number(entiers) * 100 + Number(decimales.padEnd(2, '0'));
}
```

`src/domaine/dates.ts`
```ts
export type DateISO = string; // AAAA-MM-JJ
export type Mois = string; // AAAA-MM

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août',
  'septembre', 'octobre', 'novembre', 'décembre'];

const p2 = (n: number) => String(n).padStart(2, '0');
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const decouper = (date: DateISO) => date.split('-').map(Number);

export function aujourdhui(d: Date = new Date()): DateISO {
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}

export function ajouterJours(date: DateISO, n: number): DateISO {
  const [a, m, j] = decouper(date);
  return aujourdhui(new Date(a, m - 1, j + n));
}

export function moisDe(date: DateISO): Mois {
  return date.slice(0, 7);
}

export function ajouterMois(mois: Mois, n: number): Mois {
  const [a, m] = decouper(mois);
  const total = a * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${p2((total % 12) + 1)}`;
}

export function joursDansMois(mois: Mois): number {
  const [a, m] = decouper(mois);
  return new Date(a, m, 0).getDate();
}

export function libelleJour(date: DateISO, ref: DateISO = aujourdhui()): string {
  if (date === ref) return "Aujourd'hui";
  if (date === ajouterJours(ref, -1)) return 'Hier';
  const [a, m, j] = decouper(date);
  const jour = JOURS[new Date(a, m - 1, j).getDay()];
  const annee = a === decouper(ref)[0] ? '' : ` ${a}`;
  return majuscule(`${jour} ${j} ${MOIS[m - 1]}${annee}`);
}

export function libelleMois(mois: Mois): string {
  const [a, m] = decouper(mois);
  return majuscule(`${MOIS[m - 1]} ${a}`);
}

export function estDateValide(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [a, m, j] = decouper(s);
  return aujourdhui(new Date(a, m - 1, j)) === s;
}
```

`src/domaine/texte.ts`
```ts
export function normaliser(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
```

`src/domaine/id.ts`
```ts
export function nouvelId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
```

- [ ] **Step 4: Run** `npm test -- tests/domaine` → PASS.
- [ ] **Step 5: Commit** `git commit -m "feat(domaine): montants, dates, texte, identifiants"`

---

### Task 3: Types et règles des comptes

**Files:**
- Create: `src/domaine/types.ts`, `src/domaine/donnees.ts`, `src/domaine/comptes.ts`
- Test: `tests/domaine/comptes.test.ts`, `tests/domaine/donnees.test.ts`

**Interfaces:**
- Consumes: `Centimes`, `DateISO`, `Mois` (Task 2).
- Produces (types.ts): `TypeCompte`, `Compte`, `Nature`, `Groupe`, `Categorie`, `TypeOperation`, `Operation`, `Assignation`, `ModeleOperation`, `Recurrence`, `Objectif`, `Remboursement`, `Dette`, `Donnees`, `Collection = keyof Donnees`, `EntiteDe<C>`, `donneesVides(): Donnees`, `COLLECTIONS: Collection[]`.
- Produces (donnees.ts): `avecEntites<C>(d: Donnees, c: C, entites: EntiteDe<C>[]): Donnees` (upsert par id), `sansEntite(d: Donnees, c: Collection, id: string): Donnees`, `cloner<T>(x: T): T`.
- Produces (comptes.ts): `soldeCompte(compte, ops): Centimes`, `disponible(comptes, ops): Centimes`, `resteDette(d: Dette): Centimes`, `patrimoineNet(comptes, ops, dettes): Centimes`, `comptesActifs(comptes): Compte[]`, `compteParDefaut(comptes): Compte | undefined`, `definirParDefaut(comptes, id): Compte[]`, `compteUtilise(id, ops): boolean`, `erreurCompte(c: { nom: string }): string | null`, `LIBELLES_TYPE_COMPTE: Record<TypeCompte, string>`.

- [ ] **Step 1: Tests**

`tests/domaine/comptes.test.ts`
```ts
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
```

`tests/domaine/donnees.test.ts`
```ts
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
```

- [ ] **Step 2: Run** `npm test -- tests/domaine` → FAIL.

- [ ] **Step 3: Implémentation**

`src/domaine/types.ts`
```ts
import type { Centimes } from './montant';
import type { DateISO, Mois } from './dates';

export type TypeCompte = 'courant' | 'epargne' | 'especes';
export interface Compte {
  id: string; nom: string; type: TypeCompte; soldeOuverture: Centimes;
  couleur: string; archive: boolean; parDefaut: boolean;
}

export type Nature = 'revenu' | 'depense';
export interface Groupe { id: string; nom: string; nature: Nature; ordre: number }
export interface Categorie {
  id: string; nom: string; icone: string; couleur: string; groupeId: string; favori: boolean;
}

export type TypeOperation = 'depense' | 'revenu' | 'transfert';
export interface Operation {
  id: string; date: DateISO; montant: Centimes; type: TypeOperation; compteId: string;
  compteDestId?: string; categorieId?: string; libelle: string; recurrenceId?: string;
}

export interface Assignation { id: string; mois: Mois; categorieId: string; montant: Centimes }

export type ModeleOperation = Omit<Operation, 'id' | 'date' | 'recurrenceId'>;
export interface Recurrence {
  id: string; modele: ModeleOperation; frequence: 'hebdo' | 'mensuelle';
  prochaineEcheance: DateISO; active: boolean;
}

export interface Objectif {
  id: string; nom: string; icone: string; cible: Centimes; echeance?: DateISO; reserve: Centimes;
}

export interface Remboursement { date: DateISO; montant: Centimes }
export interface Dette {
  id: string; personne: string; sens: 'on_me_doit' | 'je_dois'; montant: Centimes;
  remboursements: Remboursement[];
}

export interface Donnees {
  comptes: Compte[]; groupes: Groupe[]; categories: Categorie[]; operations: Operation[];
  assignations: Assignation[]; recurrences: Recurrence[]; objectifs: Objectif[]; dettes: Dette[];
}
export type Collection = keyof Donnees;
export type EntiteDe<C extends Collection> = Donnees[C][number];

export const COLLECTIONS: Collection[] = [
  'comptes', 'groupes', 'categories', 'operations', 'assignations', 'recurrences', 'objectifs', 'dettes',
];

export function donneesVides(): Donnees {
  return {
    comptes: [], groupes: [], categories: [], operations: [],
    assignations: [], recurrences: [], objectifs: [], dettes: [],
  };
}
```

`src/domaine/donnees.ts`
```ts
import type { Collection, Donnees, EntiteDe } from './types';

export function cloner<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

export function avecEntites<C extends Collection>(d: Donnees, c: C, entites: EntiteDe<C>[]): Donnees {
  const liste = [...d[c]] as EntiteDe<C>[];
  for (const e of entites) {
    const i = liste.findIndex((x) => x.id === e.id);
    if (i >= 0) liste[i] = e;
    else liste.push(e);
  }
  return { ...d, [c]: liste };
}

export function sansEntite(d: Donnees, c: Collection, id: string): Donnees {
  return { ...d, [c]: (d[c] as { id: string }[]).filter((x) => x.id !== id) };
}
```

`src/domaine/comptes.ts`
```ts
import type { Centimes } from './montant';
import type { Compte, Dette, Operation, TypeCompte } from './types';

export const LIBELLES_TYPE_COMPTE: Record<TypeCompte, string> = {
  courant: 'Courant', epargne: 'Épargne', especes: 'Espèces',
};

export function soldeCompte(compte: Compte, operations: Operation[]): Centimes {
  let solde = compte.soldeOuverture;
  for (const o of operations) {
    if (o.type === 'transfert') {
      if (o.compteId === compte.id) solde -= o.montant;
      if (o.compteDestId === compte.id) solde += o.montant;
    } else if (o.compteId === compte.id) {
      solde += o.type === 'revenu' ? o.montant : -o.montant;
    }
  }
  return solde;
}

const somme = (valeurs: number[]) => valeurs.reduce((a, b) => a + b, 0);

export function disponible(comptes: Compte[], operations: Operation[]): Centimes {
  return somme(comptes
    .filter((c) => !c.archive && c.type !== 'epargne')
    .map((c) => soldeCompte(c, operations)));
}

export function resteDette(d: Dette): Centimes {
  return d.montant - somme(d.remboursements.map((r) => r.montant));
}

export function patrimoineNet(comptes: Compte[], operations: Operation[], dettes: Dette[]): Centimes {
  const soldes = somme(comptes.map((c) => soldeCompte(c, operations)));
  const creances = somme(dettes.filter((d) => d.sens === 'on_me_doit').map(resteDette));
  const dues = somme(dettes.filter((d) => d.sens === 'je_dois').map(resteDette));
  return soldes + creances - dues;
}

export function comptesActifs(comptes: Compte[]): Compte[] {
  return comptes.filter((c) => !c.archive)
    .sort((a, b) => Number(b.parDefaut) - Number(a.parDefaut));
}

export function compteParDefaut(comptes: Compte[]): Compte | undefined {
  return comptesActifs(comptes)[0];
}

export function definirParDefaut(comptes: Compte[], id: string): Compte[] {
  return comptes.map((c) => ({ ...c, parDefaut: c.id === id }));
}

export function compteUtilise(id: string, operations: Operation[]): boolean {
  return operations.some((o) => o.compteId === id || o.compteDestId === id);
}

export function erreurCompte(c: { nom: string }): string | null {
  return c.nom.trim() ? null : 'Donnez un nom au compte';
}
```

- [ ] **Step 4: Run** `npm test -- tests/domaine` → PASS.
- [ ] **Step 5: Commit** `git commit -m "feat(domaine): types, comptes et soldes calculés"`

---

### Task 4: Catégories

**Files:**
- Create: `src/domaine/categories.ts`
- Test: `tests/domaine/categories.test.ts`

**Interfaces:**
- Consumes: `Groupe`, `Categorie`, `Nature`, `Operation` (Task 3), `normaliser` (Task 2).
- Produces: `GROUPES_PAR_DEFAUT: Groupe[]`, `CATEGORIES_PAR_DEFAUT: Categorie[]`, `COULEURS: string[]`, `ICONES_CATEGORIES: string[]` (noms kebab Lucide), `interface GroupeDeCategories { groupe: Groupe; categories: Categorie[] }`, `categoriesParGroupe(groupes, categories, nature?): GroupeDeCategories[]`, `rechercherCategories(categories, texte): Categorie[]`, `categorieUtilisee(id, ops): boolean`, `erreurCategorie(c: { nom: string; groupeId: string }): string | null`, `erreurGroupe(g: { nom: string }): string | null`, `natureDeCategorie(id, categories, groupes): Nature | undefined`.

- [ ] **Step 1: Tests** `tests/domaine/categories.test.ts`

```ts
import {
  CATEGORIES_PAR_DEFAUT, GROUPES_PAR_DEFAUT, categorieUtilisee, categoriesParGroupe, erreurCategorie,
  erreurGroupe, natureDeCategorie, rechercherCategories,
} from '@/src/domaine/categories';
import type { Categorie } from '@/src/domaine/types';

test('jeu par défaut : 4 groupes et les catégories des captures', () => {
  expect(GROUPES_PAR_DEFAUT.map((g) => g.nom)).toEqual(
    ['Revenus fixes', 'Revenus variables', 'Dépenses fixes', 'Dépenses variables']);
  const noms = CATEGORIES_PAR_DEFAUT.map((c) => c.nom);
  for (const n of ['Loyer', 'Courses', 'Carburant', 'Café', 'Hammam & soins', 'Salaire', 'Bail']) {
    expect(noms).toContain(n);
  }
  const ids = new Set(GROUPES_PAR_DEFAUT.map((g) => g.id));
  expect(CATEGORIES_PAR_DEFAUT.every((c) => ids.has(c.groupeId))).toBe(true);
});

test('categoriesParGroupe : ordre des groupes, favoris d’abord puis alphabétique, filtre de nature', () => {
  const cats: Categorie[] = [
    { id: '1', nom: 'Zakat', icone: 'gift', couleur: '#fff', groupeId: 'g-dep-var', favori: false },
    { id: '2', nom: 'Café', icone: 'coffee', couleur: '#fff', groupeId: 'g-dep-var', favori: false },
    { id: '3', nom: 'Taxi', icone: 'car', couleur: '#fff', groupeId: 'g-dep-var', favori: true },
    { id: '4', nom: 'Salaire', icone: 'briefcase', couleur: '#fff', groupeId: 'g-rev-fixes', favori: false },
  ];
  const tout = categoriesParGroupe(GROUPES_PAR_DEFAUT, cats);
  expect(tout.map((g) => g.groupe.id)).toEqual(['g-rev-fixes', 'g-dep-var']); // groupes vides omis
  expect(tout[1].categories.map((c) => c.nom)).toEqual(['Taxi', 'Café', 'Zakat']);
  expect(categoriesParGroupe(GROUPES_PAR_DEFAUT, cats, 'revenu').map((g) => g.groupe.id)).toEqual(['g-rev-fixes']);
});

test('rechercherCategories ignore accents et casse', () => {
  expect(rechercherCategories(CATEGORIES_PAR_DEFAUT, 'cafe').map((c) => c.nom)).toEqual(['Café']);
  expect(rechercherCategories(CATEGORIES_PAR_DEFAUT, '  ')).toHaveLength(CATEGORIES_PAR_DEFAUT.length);
});

test('categorieUtilisee', () => {
  const ops = [{ id: 'o', date: '2026-11-01', montant: 1, type: 'depense' as const, compteId: 'a', categorieId: 'c-cafe', libelle: '' }];
  expect(categorieUtilisee('c-cafe', ops)).toBe(true);
  expect(categorieUtilisee('c-loyer', ops)).toBe(false);
});

test('natureDeCategorie', () => {
  expect(natureDeCategorie('c-salaire', CATEGORIES_PAR_DEFAUT, GROUPES_PAR_DEFAUT)).toBe('revenu');
  expect(natureDeCategorie('c-loyer', CATEGORIES_PAR_DEFAUT, GROUPES_PAR_DEFAUT)).toBe('depense');
  expect(natureDeCategorie('x', CATEGORIES_PAR_DEFAUT, GROUPES_PAR_DEFAUT)).toBeUndefined();
});

test('validations', () => {
  expect(erreurCategorie({ nom: '', groupeId: 'g' })).toBe('Donnez un nom à la catégorie');
  expect(erreurCategorie({ nom: 'Taxi', groupeId: '' })).toBe('Choisissez un groupe');
  expect(erreurCategorie({ nom: 'Taxi', groupeId: 'g' })).toBeNull();
  expect(erreurGroupe({ nom: ' ' })).toBe('Donnez un nom au groupe');
  expect(erreurGroupe({ nom: 'Enfants' })).toBeNull();
});
```

- [ ] **Step 2: Run** → FAIL.

- [ ] **Step 3: Implémentation** `src/domaine/categories.ts`

```ts
import { normaliser } from './texte';
import type { Categorie, Groupe, Nature, Operation } from './types';

export const COULEURS = ['#ff453a', '#ff9f0a', '#ffd60a', '#30d158', '#64d2ff', '#0a84ff',
  '#5e5ce6', '#bf5af2', '#ff375f', '#ac8e68', '#8e8e93'];

export const ICONES_CATEGORIES = ['briefcase', 'key', 'gift', 'tag', 'circle-plus', 'house', 'zap',
  'wifi', 'shield', 'repeat', 'shopping-cart', 'fuel', 'coffee', 'utensils', 'bath', 'bus', 'car',
  'heart-pulse', 'shopping-bag', 'gamepad-2', 'graduation-cap', 'baby', 'plane', 'smartphone',
  'shirt', 'dumbbell', 'paw-print', 'hand-coins', 'ellipsis'];

export const GROUPES_PAR_DEFAUT: Groupe[] = [
  { id: 'g-rev-fixes', nom: 'Revenus fixes', nature: 'revenu', ordre: 0 },
  { id: 'g-rev-var', nom: 'Revenus variables', nature: 'revenu', ordre: 1 },
  { id: 'g-dep-fixes', nom: 'Dépenses fixes', nature: 'depense', ordre: 2 },
  { id: 'g-dep-var', nom: 'Dépenses variables', nature: 'depense', ordre: 3 },
];

const cat = (id: string, nom: string, icone: string, couleur: string, groupeId: string): Categorie =>
  ({ id, nom, icone, couleur, groupeId, favori: false });

export const CATEGORIES_PAR_DEFAUT: Categorie[] = [
  cat('c-salaire', 'Salaire', 'briefcase', '#30d158', 'g-rev-fixes'),
  cat('c-bail', 'Bail', 'key', '#64d2ff', 'g-rev-fixes'),
  cat('c-primes', 'Primes', 'gift', '#ffd60a', 'g-rev-var'),
  cat('c-ventes', 'Ventes', 'tag', '#bf5af2', 'g-rev-var'),
  cat('c-autres-revenus', 'Autres revenus', 'circle-plus', '#8e8e93', 'g-rev-var'),
  cat('c-loyer', 'Loyer', 'house', '#ff9f0a', 'g-dep-fixes'),
  cat('c-energie', 'Électricité & eau', 'zap', '#ffd60a', 'g-dep-fixes'),
  cat('c-internet', 'Internet & téléphone', 'wifi', '#0a84ff', 'g-dep-fixes'),
  cat('c-assurance', 'Assurance', 'shield', '#5e5ce6', 'g-dep-fixes'),
  cat('c-abonnements', 'Abonnements', 'repeat', '#bf5af2', 'g-dep-fixes'),
  cat('c-courses', 'Courses', 'shopping-cart', '#30d158', 'g-dep-var'),
  cat('c-carburant', 'Carburant', 'fuel', '#ff453a', 'g-dep-var'),
  cat('c-cafe', 'Café', 'coffee', '#ac8e68', 'g-dep-var'),
  cat('c-restaurants', 'Restaurants', 'utensils', '#ff9f0a', 'g-dep-var'),
  cat('c-hammam', 'Hammam & soins', 'bath', '#64d2ff', 'g-dep-var'),
  cat('c-transport', 'Transport', 'bus', '#0a84ff', 'g-dep-var'),
  cat('c-sante', 'Santé', 'heart-pulse', '#ff375f', 'g-dep-var'),
  cat('c-shopping', 'Shopping', 'shopping-bag', '#bf5af2', 'g-dep-var'),
  cat('c-loisirs', 'Loisirs', 'gamepad-2', '#5e5ce6', 'g-dep-var'),
  cat('c-divers', 'Divers', 'ellipsis', '#8e8e93', 'g-dep-var'),
];

export interface GroupeDeCategories { groupe: Groupe; categories: Categorie[] }

const parFavoriPuisNom = (a: Categorie, b: Categorie) =>
  Number(b.favori) - Number(a.favori) || a.nom.localeCompare(b.nom, 'fr');

export function categoriesParGroupe(
  groupes: Groupe[], categories: Categorie[], nature?: Nature,
): GroupeDeCategories[] {
  return [...groupes]
    .filter((g) => !nature || g.nature === nature)
    .sort((a, b) => a.ordre - b.ordre)
    .map((groupe) => ({
      groupe,
      categories: categories.filter((c) => c.groupeId === groupe.id).sort(parFavoriPuisNom),
    }))
    .filter((g) => g.categories.length > 0);
}

export function rechercherCategories(categories: Categorie[], texte: string): Categorie[] {
  const q = normaliser(texte);
  if (!q) return categories;
  return categories.filter((c) => normaliser(c.nom).includes(q)).sort(parFavoriPuisNom);
}

export function categorieUtilisee(id: string, operations: Operation[]): boolean {
  return operations.some((o) => o.categorieId === id);
}

export function natureDeCategorie(id: string, categories: Categorie[], groupes: Groupe[]): Nature | undefined {
  const c = categories.find((x) => x.id === id);
  return groupes.find((g) => g.id === c?.groupeId)?.nature;
}

export function erreurCategorie(c: { nom: string; groupeId: string }): string | null {
  if (!c.nom.trim()) return 'Donnez un nom à la catégorie';
  if (!c.groupeId) return 'Choisissez un groupe';
  return null;
}

export function erreurGroupe(g: { nom: string }): string | null {
  return g.nom.trim() ? null : 'Donnez un nom au groupe';
}
```

Note : `categoriesParGroupe` omet les groupes vides ; l'écran de gestion des catégories affiche les groupes vides lui-même (il itère sur `groupes`, voir Task 10).

- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `git commit -m "feat(domaine): catégories, jeu par défaut et recherche"`

---

### Task 5: Opérations — validation, regroupement, filtres

**Files:**
- Create: `src/domaine/operations.ts`
- Test: `tests/domaine/operations.test.ts`

**Interfaces:**
- Consumes: types (Task 3), `normaliser` (Task 2).
- Produces: `interface Brouillon { type: TypeOperation; montant: Centimes | null; compteId?: string; compteDestId?: string; categorieId?: string; date: DateISO; libelle: string }`, `erreurOperation(b: Brouillon): string | null`, `versOperation(b: Brouillon, id: string): Operation`, `versBrouillon(o: Operation): Brouillon`, `effetNet(o: Operation): Centimes`, `trierOperations(ops): Operation[]`, `interface JourOperations { date: DateISO; operations: Operation[]; total: Centimes }`, `grouperParJour(ops): JourOperations[]`, `interface FiltreOperations { texte: string; type: TypeOperation | 'tout'; compteId?: string; categorieId?: string }`, `FILTRE_VIDE: FiltreOperations`, `filtrerOperations(ops, filtre, categories): Operation[]`, `operationsRecentes(ops, n): Operation[]`.

- [ ] **Step 1: Tests** `tests/domaine/operations.test.ts`

```ts
import {
  FILTRE_VIDE, erreurOperation, filtrerOperations, grouperParJour, operationsRecentes, versBrouillon,
  versOperation, type Brouillon,
} from '@/src/domaine/operations';
import { CATEGORIES_PAR_DEFAUT } from '@/src/domaine/categories';
import type { Operation } from '@/src/domaine/types';

const base: Brouillon = { type: 'depense', montant: 1500, compteId: 'a', categorieId: 'c-cafe', date: '2026-11-03', libelle: ' Café Paul ' };

describe('erreurOperation', () => {
  test('valide', () => expect(erreurOperation(base)).toBeNull());
  test('montant nul ou absent', () => {
    expect(erreurOperation({ ...base, montant: 0 })).toBe('Saisissez un montant');
    expect(erreurOperation({ ...base, montant: null })).toBe('Saisissez un montant');
  });
  test('compte manquant', () => expect(erreurOperation({ ...base, compteId: undefined })).toBe('Choisissez un compte'));
  test('catégorie manquante pour une dépense ou un revenu', () => {
    expect(erreurOperation({ ...base, categorieId: undefined })).toBe('Choisissez une catégorie');
    expect(erreurOperation({ ...base, type: 'revenu', categorieId: undefined })).toBe('Choisissez une catégorie');
  });
  test('transfert', () => {
    const t: Brouillon = { ...base, type: 'transfert', categorieId: undefined };
    expect(erreurOperation(t)).toBe('Choisissez le compte de destination');
    expect(erreurOperation({ ...t, compteDestId: 'a' })).toBe('Choisissez deux comptes différents');
    expect(erreurOperation({ ...t, compteDestId: 'b' })).toBeNull();
  });
  test('date invalide', () => expect(erreurOperation({ ...base, date: '2026-02-30' })).toBe('Date invalide'));
});

test('versOperation nettoie selon le type', () => {
  expect(versOperation(base, 'x')).toEqual({ id: 'x', type: 'depense', montant: 1500, compteId: 'a', categorieId: 'c-cafe', date: '2026-11-03', libelle: 'Café Paul' });
  const t = versOperation({ ...base, type: 'transfert', compteDestId: 'b' }, 'y');
  expect(t.categorieId).toBeUndefined();
  expect(t.compteDestId).toBe('b');
});

test('versBrouillon fait l’aller-retour', () => {
  const o = versOperation(base, 'x');
  expect(versOperation(versBrouillon(o), 'x')).toEqual(o);
});

const ops: Operation[] = [
  { id: '1', date: '2026-11-02', montant: 1000, type: 'depense', compteId: 'a', categorieId: 'c-cafe', libelle: 'Paul' },
  { id: '2', date: '2026-11-03', montant: 500000, type: 'revenu', compteId: 'a', categorieId: 'c-salaire', libelle: 'Novembre' },
  { id: '3', date: '2026-11-03', montant: 20000, type: 'depense', compteId: 'b', categorieId: 'c-courses', libelle: 'Marjane' },
  { id: '4', date: '2026-11-02', montant: 30000, type: 'transfert', compteId: 'a', compteDestId: 'b', libelle: '' },
];

test('grouperParJour : jours récents d’abord, total net (transferts neutres)', () => {
  const jours = grouperParJour(ops);
  expect(jours.map((j) => j.date)).toEqual(['2026-11-03', '2026-11-02']);
  expect(jours[0].total).toBe(500000 - 20000);
  expect(jours[1].total).toBe(-1000);
  expect(jours[1].operations.map((o) => o.id)).toEqual(['1', '4']);
});

describe('filtrerOperations', () => {
  const f = (x: Partial<typeof FILTRE_VIDE>) =>
    filtrerOperations(ops, { ...FILTRE_VIDE, ...x }, CATEGORIES_PAR_DEFAUT).map((o) => o.id);
  test('sans filtre', () => expect(f({})).toEqual(['1', '2', '3', '4']));
  test('texte sur libellé ou nom de catégorie, sans accents', () => {
    expect(f({ texte: 'marj' })).toEqual(['3']);
    expect(f({ texte: 'CAFE' })).toEqual(['1']);
  });
  test('type', () => expect(f({ type: 'depense' })).toEqual(['1', '3']));
  test('compte : source ou destination', () => expect(f({ compteId: 'b' })).toEqual(['3', '4']));
  test('catégorie', () => expect(f({ categorieId: 'c-salaire' })).toEqual(['2']));
});

test('operationsRecentes', () => {
  expect(operationsRecentes(ops, 2).map((o) => o.id)).toEqual(['3', '2']); // même date : dernière saisie d'abord
});
```

- [ ] **Step 2: Run** → FAIL.

- [ ] **Step 3: Implémentation** `src/domaine/operations.ts`

```ts
import { estDateValide, type DateISO } from './dates';
import type { Centimes } from './montant';
import { normaliser } from './texte';
import type { Categorie, Operation, TypeOperation } from './types';

export interface Brouillon {
  type: TypeOperation; montant: Centimes | null; compteId?: string; compteDestId?: string;
  categorieId?: string; date: DateISO; libelle: string;
}

export function erreurOperation(b: Brouillon): string | null {
  if (!b.montant || b.montant <= 0) return 'Saisissez un montant';
  if (!b.compteId) return 'Choisissez un compte';
  if (b.type === 'transfert') {
    if (!b.compteDestId) return 'Choisissez le compte de destination';
    if (b.compteDestId === b.compteId) return 'Choisissez deux comptes différents';
  } else if (!b.categorieId) {
    return 'Choisissez une catégorie';
  }
  if (!estDateValide(b.date)) return 'Date invalide';
  return null;
}

/** Suppose `erreurOperation(b) === null`. */
export function versOperation(b: Brouillon, id: string): Operation {
  const o: Operation = {
    id, type: b.type, montant: b.montant as Centimes, compteId: b.compteId as string,
    date: b.date, libelle: b.libelle.trim(),
  };
  if (b.type === 'transfert') o.compteDestId = b.compteDestId;
  else o.categorieId = b.categorieId;
  return o;
}

export function versBrouillon(o: Operation): Brouillon {
  return {
    type: o.type, montant: o.montant, compteId: o.compteId, compteDestId: o.compteDestId,
    categorieId: o.categorieId, date: o.date, libelle: o.libelle,
  };
}

export function effetNet(o: Operation): Centimes {
  if (o.type === 'revenu') return o.montant;
  if (o.type === 'depense') return -o.montant;
  return 0;
}

/** Plus récentes d'abord ; à date égale, l'ordre de saisie le plus récent d'abord. */
export function trierOperations(ops: Operation[]): Operation[] {
  return ops
    .map((o, i) => ({ o, i }))
    .sort((a, b) => b.o.date.localeCompare(a.o.date) || b.i - a.i)
    .map(({ o }) => o);
}

export interface JourOperations { date: DateISO; operations: Operation[]; total: Centimes }

export function grouperParJour(ops: Operation[]): JourOperations[] {
  const jours: JourOperations[] = [];
  const parDate = new Map<DateISO, Operation[]>();
  for (const o of [...ops].sort((a, b) => b.date.localeCompare(a.date))) {
    if (!parDate.has(o.date)) parDate.set(o.date, []);
    parDate.get(o.date)!.push(o);
  }
  for (const [date, operations] of parDate) {
    jours.push({ date, operations, total: operations.reduce((s, o) => s + effetNet(o), 0) });
  }
  return jours;
}

export interface FiltreOperations {
  texte: string; type: TypeOperation | 'tout'; compteId?: string; categorieId?: string;
}
export const FILTRE_VIDE: FiltreOperations = { texte: '', type: 'tout' };

export function filtrerOperations(
  ops: Operation[], f: FiltreOperations, categories: Categorie[],
): Operation[] {
  const q = normaliser(f.texte);
  const nomCat = new Map(categories.map((c) => [c.id, normaliser(c.nom)]));
  return ops.filter((o) =>
    (f.type === 'tout' || o.type === f.type)
    && (!f.compteId || o.compteId === f.compteId || o.compteDestId === f.compteId)
    && (!f.categorieId || o.categorieId === f.categorieId)
    && (!q || normaliser(o.libelle).includes(q) || (nomCat.get(o.categorieId ?? '') ?? '').includes(q)));
}

export function operationsRecentes(ops: Operation[], n: number): Operation[] {
  return trierOperations(ops).slice(0, n);
}
```

Note : le tri de `grouperParJour` est stable, donc à date égale l'ordre de saisie est conservé (`['1', '4']`).

- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `git commit -m "feat(domaine): validation, regroupement par jour et filtres des opérations"`

---

### Task 6: Stockage — interface Depot, mémoire, IndexedDB, initialisation

**Files:**
- Create: `src/stockage/depot.ts`, `src/stockage/depotMemoire.ts`, `src/stockage/depotIndexedDb.ts`, `src/stockage/initialisation.ts`
- Test: `tests/stockage/depot.test.ts`

**Interfaces:**
- Consumes: `Donnees`, `Collection`, `EntiteDe`, `COLLECTIONS`, `donneesVides` (Task 3) ; `avecEntites`, `sansEntite`, `cloner` (Task 3) ; `GROUPES_PAR_DEFAUT`, `CATEGORIES_PAR_DEFAUT` (Task 4).
- Produces:
  - `interface Depot { toutLire(): Promise<Donnees>; enregistrer<C extends Collection>(c: C, entites: EntiteDe<C>[]): Promise<void>; supprimer(c: Collection, id: string): Promise<void>; toutRemplacer(d: Donnees): Promise<void> }`
  - `class DepotMemoire implements Depot` (`constructor(initial?: Donnees)`)
  - `ouvrirDepotIndexedDb(nom?: string): Promise<Depot>`
  - `initialiserSiVide(depot: Depot): Promise<Donnees>` — si aucun groupe, écrit groupes et catégories par défaut.

- [ ] **Step 1: Tests** `tests/stockage/depot.test.ts` — la même suite contre les deux implémentations.

```ts
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
```

- [ ] **Step 2: Run** `npm test -- tests/stockage` → FAIL.

- [ ] **Step 3: Implémentation**

`src/stockage/depot.ts`
```ts
import type { Collection, Donnees, EntiteDe } from '@/src/domaine/types';

export interface Depot {
  toutLire(): Promise<Donnees>;
  enregistrer<C extends Collection>(c: C, entites: EntiteDe<C>[]): Promise<void>;
  supprimer(c: Collection, id: string): Promise<void>;
  toutRemplacer(d: Donnees): Promise<void>;
}
```

`src/stockage/depotMemoire.ts`
```ts
import { avecEntites, cloner, sansEntite } from '@/src/domaine/donnees';
import { donneesVides, type Collection, type Donnees, type EntiteDe } from '@/src/domaine/types';
import type { Depot } from './depot';

export class DepotMemoire implements Depot {
  private d: Donnees;
  constructor(initial: Donnees = donneesVides()) { this.d = cloner(initial); }
  async toutLire() { return cloner(this.d); }
  async enregistrer<C extends Collection>(c: C, entites: EntiteDe<C>[]) {
    this.d = avecEntites(this.d, c, cloner(entites));
  }
  async supprimer(c: Collection, id: string) { this.d = sansEntite(this.d, c, id); }
  async toutRemplacer(d: Donnees) { this.d = cloner(d); }
}
```

`src/stockage/depotIndexedDb.ts`
```ts
import { openDB, type IDBPDatabase } from 'idb';
import { COLLECTIONS, donneesVides, type Collection, type Donnees, type EntiteDe } from '@/src/domaine/types';
import type { Depot } from './depot';

const VERSION = 1;

export async function ouvrirDepotIndexedDb(nom = 'wallet-management'): Promise<Depot> {
  const db = await openDB(nom, VERSION, {
    upgrade(base) {
      for (const c of COLLECTIONS) {
        if (!base.objectStoreNames.contains(c)) base.createObjectStore(c, { keyPath: 'id' });
      }
    },
  });
  return new DepotIndexedDb(db);
}

class DepotIndexedDb implements Depot {
  constructor(private db: IDBPDatabase) {}

  async toutLire(): Promise<Donnees> {
    const tx = this.db.transaction(COLLECTIONS, 'readonly');
    const listes = await Promise.all(COLLECTIONS.map((c) => tx.objectStore(c).getAll()));
    await tx.done;
    const d = donneesVides() as Record<Collection, unknown[]>;
    COLLECTIONS.forEach((c, i) => { d[c] = listes[i]; });
    return d as unknown as Donnees;
  }

  async enregistrer<C extends Collection>(c: C, entites: EntiteDe<C>[]) {
    const tx = this.db.transaction(c, 'readwrite');
    await Promise.all([...entites.map((e) => tx.store.put(e)), tx.done]);
  }

  async supprimer(c: Collection, id: string) {
    await this.db.delete(c, id);
  }

  async toutRemplacer(d: Donnees) {
    const tx = this.db.transaction(COLLECTIONS, 'readwrite');
    const ecritures: Promise<unknown>[] = [];
    for (const c of COLLECTIONS) {
      const store = tx.objectStore(c);
      ecritures.push(store.clear());
      for (const e of d[c]) ecritures.push(store.put(e));
    }
    await Promise.all([...ecritures, tx.done]);
  }
}
```

`src/stockage/initialisation.ts`
```ts
import { CATEGORIES_PAR_DEFAUT, GROUPES_PAR_DEFAUT } from '@/src/domaine/categories';
import type { Donnees } from '@/src/domaine/types';
import type { Depot } from './depot';

export async function initialiserSiVide(depot: Depot): Promise<Donnees> {
  const d = await depot.toutLire();
  if (d.groupes.length > 0) return d;
  await depot.enregistrer('groupes', GROUPES_PAR_DEFAUT);
  await depot.enregistrer('categories', CATEGORIES_PAR_DEFAUT);
  return depot.toutLire();
}
```

- [ ] **Step 4: Run** `npm test` → PASS (si Jest refuse l'ESM de `idb` ou `fake-indexeddb`, ajouter `idb` et `fake-indexeddb` à `transformIgnorePatterns` dans `jest.config.js` : `transformIgnorePatterns: ['node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|expo-router|idb|fake-indexeddb)/)']`).
- [ ] **Step 5: Commit** `git commit -m "feat(stockage): interface Depot, IndexedDB, mémoire, jeu initial"`

---

### Task 7: Thème, kit UI et navigation à onglets

**Files:**
- Create: `src/ui/theme.ts`, `src/ui/icones.ts`, `src/ui/Texte.tsx`, `src/ui/IconeCarree.tsx`, `src/ui/Liste.tsx`, `src/ui/Segment.tsx`, `src/ui/Champ.tsx`, `src/ui/Ecran.tsx`, `src/ui/Puces.tsx`, `src/stockage/DonneesProvider.tsx`, `app/_layout.tsx`, `app/(onglets)/_layout.tsx`, `app/(onglets)/index.tsx`, `app/(onglets)/operations.tsx`, `app/(onglets)/ajouter.tsx`, `app/(onglets)/budget.tsx`, `app/(onglets)/plus.tsx`, `app/ajout.tsx` (provisoire)

**Interfaces:**
- Consumes: `Depot`, `ouvrirDepotIndexedDb`, `DepotMemoire`, `initialiserSiVide` (Task 6) ; `avecEntites`, `sansEntite` (Task 3).
- Produces:
  - `interface Theme { fond; carte; carte2; texte; texte2; separateur; accent; succes; alerte; erreur: string; sombre: boolean }`, `SOMBRE`, `CLAIR`, `useTheme(): Theme`, `CHIFFRES` (style `fontVariant: ['tabular-nums']`), `POLICE`.
  - `ICONES: Record<string, LucideIcon>` (clés kebab de `ICONES_CATEGORIES` + `wallet`, `piggy-bank`, `banknote`), `iconeDe(nom: string): LucideIcon` (repli `ellipsis`).
  - `<Texte variante?: 'grandTitre'|'titre'|'corps'|'secondaire'|'petit'|'montant' couleur? chiffres? style?>`
  - `<IconeCarree nom: string couleur: string taille?: number />`
  - `<Section titre?: string pied?: string>` (insère les séparateurs entre enfants), `<Ligne titre sousTitre? icone? couleurIcone? valeur? couleurValeur? onPress? chevron? droite?: ReactNode />`
  - `<Segment<T> options: {valeur: T; libelle: string}[] valeur: T onChange(v: T) />`
  - `<Champ etiquette? value onChangeText placeholder? keyboardType? autoFocus? style? />` (ligne de liste avec TextInput)
  - `<Ecran titre?: string droite?: ReactNode defilant?: boolean>` (fond, safe area, grand titre, padding bas pour la barre d'onglets)
  - `<Puces<T> options: {valeur: T; libelle: string; couleur?: string}[] valeur?: T onChange(v: T | undefined) />` (puces horizontales, re-toucher désélectionne)
  - `DonneesProvider({ children, depot? })`, `useDonnees(): { donnees: Donnees; enregistrer<C>(c: C, ...entites: EntiteDe<C>[]): Promise<void>; supprimer(c, id): Promise<void>; remplacer(d: Donnees): Promise<void> }`

- [ ] **Step 1: `src/ui/theme.ts`** — palettes exactes des Global Constraints ; clair : `fond #f2f2f7, carte #fff, carte2 #e5e5ea, texte #000, texte2 #6c6c70, separateur #c6c6c8, accent #007aff, succes #34c759, alerte #ff9500, erreur #ff3b30`. `useTheme` = `useColorScheme() === 'light' ? CLAIR : SOMBRE` (sombre par défaut).
- [ ] **Step 2: Composants `src/ui/*`** selon les interfaces ci-dessus. `Section` : fond `carte`, rayon 12, marges 16 ; séparateur 0.5px `separateur` indenté de 56 si la ligne a une icône, sinon 16. `Ligne` : hauteur min 44, icône 28 carrée rayon 7, valeur en `CHIFFRES`, chevron `ChevronRight` `texte2`. `Segment` : fond `carte2`, segment actif `#636366` (sombre) / `#fff` (clair), rayon 8.
- [ ] **Step 3: `DonneesProvider`** — au montage : `depot ?? (typeof indexedDB !== 'undefined' ? await ouvrirDepotIndexedDb() : new DepotMemoire())`, puis `initialiserSiVide`. Tant que non prêt : `View` plein écran couleur `fond`. Chaque action écrit dans le dépôt puis met l'état à jour avec `avecEntites` / `sansEntite`. Si l'écriture échoue : `console.error` et l'état n'est pas modifié (aucune erreur technique à l'écran).
- [ ] **Step 4: Navigation** — `app/_layout.tsx` : `Stack` sans en-tête, `ajout` en `presentation: 'modal'`, `StatusBar` adaptée au thème, enveloppé dans `SafeAreaProvider` + `DonneesProvider`. `app/(onglets)/_layout.tsx` : `Tabs` avec onglets `index` (Accueil, `House`), `operations` (`List`), `ajouter` (bouton rond accent `Plus` 44 px ; `listeners.tabPress` → `e.preventDefault(); router.push('/ajout')`), `budget` (`PieChart`), `plus` (`Ellipsis`). Barre : fond `rgba(28,28,30,0.82)` sombre / `rgba(249,249,249,0.85)` clair, `position: 'absolute'`, bordure haute `separateur`, sur web `backdropFilter: 'blur(20px)'`. `budget.tsx` et le contenu provisoire des autres onglets : `Ecran` avec titre + texte secondaire « Bientôt ».
- [ ] **Step 5: Vérifier** — `npm run typecheck` sans erreur ; `npx expo start --web` : les 4 onglets s'affichent en sombre, le « + » ouvre la modale provisoire. `npm test` → PASS.
- [ ] **Step 6: Commit** `git commit -m "feat(ui): thème iOS, kit de composants, onglets et fournisseur de données"`

---

### Task 8: Comptes (bloc 1)

**Files:**
- Create: `src/ui/CarteCompte.tsx`, `app/comptes/index.tsx`, `app/comptes/[id].tsx`
- Modify: `app/(onglets)/plus.tsx`, `app/(onglets)/index.tsx`

**Interfaces:**
- Consumes: `soldeCompte`, `comptesActifs`, `definirParDefaut`, `compteUtilise`, `erreurCompte`, `disponible`, `patrimoineNet`, `LIBELLES_TYPE_COMPTE` (Task 3) ; `parseMontant`, `formatMontant` (Task 2) ; `COULEURS` (Task 4) ; `nouvelId` ; kit UI (Task 7).
- Produces: route `/comptes`, `/comptes/[id]` (`nouveau` pour créer) ; `<CarteCompte compte solde onPress? empilee?: boolean />`.

- [ ] **Step 1: `CarteCompte`** — carte 16:10 rayon 16, fond = `compte.couleur` avec dégradé léger (sur web `backgroundImage: linear-gradient(135deg, rgba(255,255,255,.18), rgba(0,0,0,.15))`), icône du type (`wallet` courant, `piggy-bank` épargne, `banknote` espèces), nom, type, solde formaté `+ " MAD"` en `CHIFFRES` 22 px blanc. `empilee` : `marginTop: -110` sauf la première (effet Wallet : seul le haut de chaque carte dépasse).
- [ ] **Step 2: `/comptes`** — `Ecran titre="Comptes"`, bouton `Plus` en haut à droite → `/comptes/nouveau`. Section « Actifs » (`comptesActifs`) : `Ligne` icône du type, titre nom, sous-titre type (+ « · Par défaut »), valeur solde. Section « Archivés » si non vide. Liste vide : texte « Ajoutez votre premier compte ».
- [ ] **Step 3: `/comptes/[id]`** — formulaire : `Champ` Nom ; `Segment` Courant / Épargne / Espèces ; `Champ` Solde d'ouverture (`decimal-pad`, `parseMontant`, vide = 0, saisie illisible = erreur « Montant invalide ») ; nuancier `COULEURS` (pastilles 32 px, sélection = anneau blanc) ; `Switch` « Compte par défaut » (à l'enregistrement : `definirParDefaut` appliqué à tous les comptes si activé ; le premier compte créé est par défaut automatiquement) ; `Switch` « Archivé » (si existant). En-tête : « Annuler » / titre / « OK » grisé si `erreurCompte` ou montant invalide, message d'erreur en `petit` couleur `erreur` sous la section. Si existant : bouton « Supprimer le compte » (rouge) visible seulement si `!compteUtilise` ; premier appui → libellé « Confirmer la suppression », second → supprime et revient. Sinon texte secondaire « Ce compte a des opérations : archivez-le plutôt. »
- [ ] **Step 4: Plus** — `Section` avec `Ligne` Comptes (`wallet`, `#0a84ff`) → `/comptes`, Catégories (`tag`, `#ff9f0a`) → `/categories` ; puis Objectifs, Dettes, Récurrents, Habitudes, Prévisions, Sauvegarde, Réglages en lignes grisées sous-titre « Bientôt ».
- [ ] **Step 5: Accueil** — `Ecran titre="Accueil"` : « Patrimoine net » (`patrimoineNet`, 34 px, `CHIFFRES`) et « Disponible » (`disponible`) ; pile de `CarteCompte empilee` des `comptesActifs` (toucher → `/comptes/[id]`) ; aucun compte → `Section` avec `Ligne` « Ajouter un compte » → `/comptes/nouveau`.
- [ ] **Step 6: Vérifier dans le navigateur** — créer « CIH » courant 1 000,00, « Épargne » 5 000,00, « Espèces » 200,00 ; Accueil affiche patrimoine `6 200,00`, disponible `1 200,00` ; changer le compte par défaut ; archiver un compte (disparaît d'Accueil, visible dans Archivés) ; recharger la page → données toujours là. `npm run typecheck` OK.
- [ ] **Step 7: Commit** `git commit -m "feat(comptes): liste, formulaire, cartes Wallet sur l'accueil"`

---

### Task 9: Catégories (bloc 2)

**Files:**
- Create: `src/ui/SelecteurCategorie.tsx`, `app/categories/index.tsx`, `app/categories/[id].tsx`, `app/groupes/[id].tsx`

**Interfaces:**
- Consumes: `categoriesParGroupe`, `rechercherCategories`, `categorieUtilisee`, `erreurCategorie`, `erreurGroupe`, `COULEURS`, `ICONES_CATEGORIES` (Task 4) ; kit UI.
- Produces: `<SelecteurCategorie nature: Nature valeur?: string onChange(id: string) />` — champ de recherche + liste groupée (`categoriesParGroupe` filtré par `nature`, ou résultats `rechercherCategories` à plat si texte), coche `Check` accent sur la valeur, étoile `Star` remplie `alerte` pour les favoris ; routes `/categories`, `/categories/[id]` (`nouveau?groupeId=…`), `/groupes/[id]` (`nouveau?nature=…`).

- [ ] **Step 1: `/categories`** — `Ecran titre="Catégories"` ; recherche ; pour chaque groupe trié par `ordre` (y compris vides) : `Section titre={groupe.nom}` avec ses catégories (`IconeCarree`, nom, étoile à droite touchable qui bascule `favori` via `enregistrer`), dernière ligne « Ajouter une catégorie » (accent) → `/categories/nouveau?groupeId=…` ; en-tête de section touchable → `/groupes/[id]`. En bas : « Nouveau groupe de revenus » / « Nouveau groupe de dépenses ».
- [ ] **Step 2: `/categories/[id]`** — Nom ; groupe (liste des groupes, coche) ; grille d'icônes `ICONES_CATEGORIES` (carrés 44 px, sélection = fond de la couleur choisie) ; nuancier `COULEURS` ; `Switch` Favori ; aperçu `IconeCarree` en haut. OK grisé + message si `erreurCategorie`. Suppression en deux appuis si `!categorieUtilisee`, sinon message « Catégorie utilisée par des opérations ».
- [ ] **Step 3: `/groupes/[id]`** — Nom ; nature (`Segment` Revenu / Dépense, verrouillée si le groupe contient des catégories) ; `ordre` d'un nouveau groupe = max + 1. Suppression en deux appuis seulement si le groupe est vide.
- [ ] **Step 4: `SelecteurCategorie`** comme décrit dans Interfaces.
- [ ] **Step 5: Vérifier** — rechercher « cafe » trouve Café ; mettre Café en favori → passe en tête de son groupe ; créer le groupe « Enfants » (dépense) et la catégorie « École » (`graduation-cap`) dedans ; supprimer « École ». Typecheck OK.
- [ ] **Step 6: Commit** `git commit -m "feat(categories): groupes, catégories, favoris, recherche"`

---

### Task 10: Opérations (bloc 3) — feuille d'ajout, liste, accueil récent

**Files:**
- Modify: `app/ajout.tsx`, `app/(onglets)/operations.tsx`, `app/(onglets)/index.tsx`
- Create: `src/ui/LigneOperation.tsx`

**Interfaces:**
- Consumes: `Brouillon`, `erreurOperation`, `versOperation`, `versBrouillon`, `grouperParJour`, `filtrerOperations`, `FILTRE_VIDE`, `operationsRecentes` (Task 5) ; `compteParDefaut`, `comptesActifs` (Task 3) ; `aujourdhui`, `ajouterJours`, `libelleJour` (Task 2) ; `SelecteurCategorie` (Task 9).
- Produces: route `/ajout?id=…` (modification si `id`) ; `<LigneOperation operation compte categorie compteDest onPress />` — icône de la catégorie (transfert : `arrow-left-right` gris), titre = libellé sinon nom de catégorie (transfert : « Compte A → Compte B »), sous-titre = nom de catégorie · compte, montant `formatMontant(effetNet, { signe: true })` vert si revenu, texte normal si dépense, `texte2` si transfert (montant brut).

- [ ] **Step 1: `/ajout`** — en-tête « Annuler » / « Nouvelle opération » (ou « Modifier ») / « OK ». `Segment` Dépense / Revenu / Transfert (changer de type vide la catégorie). Montant en très grand (`TextInput` 48 px centré, `CHIFFRES`, `decimal-pad`, `autoFocus`, suffixe « MAD » `texte2`). `Section` : Catégorie (masquée pour un transfert ; toucher déplie `SelecteurCategorie nature=type` ; choisir replie), Compte (déplie la liste `comptesActifs`, défaut = `compteParDefaut`), Vers (transfert seulement), Date (`Champ` AAAA-MM-JJ + puces « Aujourd'hui » / « Hier » ; sur web un `<input type="date">` peut remplacer le champ), Libellé. OK grisé tant que `erreurOperation(brouillon)` ≠ null, message affiché sous le formulaire **seulement après** une première saisie du montant. OK → `enregistrer('operations', versOperation(b, id ?? nouvelId()))` puis `router.back()`. En modification : bouton « Supprimer l'opération » en deux appuis. Aucun compte : la feuille affiche « Créez d'abord un compte » + lien `/comptes/nouveau`.
- [ ] **Step 2: `/operations`** — `Ecran titre="Opérations"` ; champ de recherche ; `Segment` Tout / Dépenses / Revenus / Transferts ; `Puces` comptes et `Puces` catégories (catégories utilisées seulement) ; liste `grouperParJour(filtrerOperations(...))` : par jour une `Section titre={libelleJour(date)}` avec total du jour à droite de l'en-tête et des `LigneOperation` (toucher → `/ajout?id=…`). Aucun résultat : « Aucune opération ».
- [ ] **Step 3: Accueil** — ajouter la section « Récent » : `operationsRecentes(ops, 5)` en `LigneOperation`, lien « Tout voir » → onglet Opérations.
- [ ] **Step 4: Vérifier dans le navigateur** — avec les comptes de Task 8 : dépense 45,50 Courses sur CIH, revenu 8 000 Salaire, transfert 2 000 CIH → Épargne ; OK grisé pour montant vide, transfert vers le même compte, dépense sans catégorie ; soldes à jour sur l'accueil (CIH = 1 000 + 8 000 − 45,50 − 2 000 = `6 954,50`) ; modifier puis supprimer une opération ; recherche « cour » ; filtre compte Épargne montre le transfert. `npm test` et typecheck OK.
- [ ] **Step 5: Commit** `git commit -m "feat(operations): feuille d'ajout, liste par jour, recherche et filtres"`

---

### Task 11: PWA installable et publication GitHub Pages

**Files:**
- Create: `app/+html.tsx`, `public/manifest.json`, `public/sw.js`, `public/icone-192.png`, `public/icone-512.png`, `.github/workflows/pages.yml`
- Modify: `app.json` (`experiments.baseUrl`)

**Interfaces:**
- Produces: `npm run build:web` → `dist/` installable ; déploiement automatique sur push vers `main`.

- [ ] **Step 1: `app/+html.tsx`** — `<html lang="fr">`, `viewport` avec `viewport-fit=cover`, `theme-color #000000`, `apple-mobile-web-app-capable yes`, `apple-mobile-web-app-status-bar-style black-translucent`, `apple-mobile-web-app-title Wallet`, `<link rel="manifest" href="{base}/manifest.json">`, `<link rel="apple-touch-icon" href="{base}/icone-192.png">`, `ScrollViewStyleReset`, style `body { background:#000 }`, script d'enregistrement : `if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('{base}/sw.js'))`. `{base}` = `process.env.EXPO_BASE_URL ?? ''`.
- [ ] **Step 2: `public/manifest.json`** — `name "Wallet"`, `short_name "Wallet"`, `lang "fr"`, `display "standalone"`, `start_url "./"`, `scope "./"`, `background_color`/`theme_color "#000000"`, icônes 192 et 512 (`purpose "any maskable"`).
- [ ] **Step 3: `public/sw.js`** — cache « réseau d'abord, repli cache » pour les requêtes GET de même origine (navigations comprises, repli sur `index.html` en cache) ; nom de cache versionné `wallet-v1`, suppression des anciens caches à l'activation, `skipWaiting` + `clients.claim`.
- [ ] **Step 4: Icônes** — générer deux PNG (fond `#000`, carré arrondi `#0a84ff`, glyphe portefeuille blanc) avec un petit script Node utilisant `@expo/image-utils`/`sharp` déjà présents, ou les dessiner une fois en SVG et les convertir ; aucune nouvelle dépendance runtime.
- [ ] **Step 5: `app.json`** — `"experiments": { "baseUrl": "/wallet-management" }` (nom du dépôt GitHub).
- [ ] **Step 6: Workflow `.github/workflows/pages.yml`** — sur push `main` : checkout, setup-node 20, `npm ci`, `npm test`, `npx expo export -p web`, copie `dist/index.html` → `dist/404.html`, `actions/upload-pages-artifact` (`dist`), `actions/deploy-pages`.
- [ ] **Step 7: Vérifier** — `npm run build:web` réussit ; `npx serve dist` (ou `npx expo serve`) : manifeste et service worker chargés (onglet Application de Chrome), l'app fonctionne hors ligne après un premier chargement. La mise en ligne effective nécessite que l'utilisateur crée le dépôt GitHub et active Pages (Settings → Pages → Source : GitHub Actions).
- [ ] **Step 8: Commit** `git commit -m "feat(pwa): manifeste, service worker, publication GitHub Pages"`

---

## Hors de ce plan (plans suivants)

- Anneau « reste à dépenser » de l'accueil → plan 2 (dépend du budget).
- Interrupteur « Récurrente » de la feuille d'ajout → plan 3.
- Export / import / rappel de sauvegarde / données de démo → plan 8.
