import type { Collection, Donnees, EntiteDe } from '@/src/domaine/types';

export interface Depot {
  toutLire(): Promise<Donnees>;
  enregistrer<C extends Collection>(c: C, entites: EntiteDe<C>[]): Promise<void>;
  supprimer(c: Collection, id: string): Promise<void>;
  toutRemplacer(d: Donnees): Promise<void>;
}
