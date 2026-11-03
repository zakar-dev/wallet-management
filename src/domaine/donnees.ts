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
