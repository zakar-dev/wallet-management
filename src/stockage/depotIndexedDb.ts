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
