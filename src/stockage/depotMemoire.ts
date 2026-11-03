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
