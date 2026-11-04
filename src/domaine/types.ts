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
  /** Opération historique déjà reflétée dans le solde d'ouverture : exclue de tous les calculs. */
  horsSolde?: boolean;
}

export interface Assignation { id: string; mois: Mois; categorieId: string; montant: Centimes }

export type ModeleOperation = Omit<Operation, 'id' | 'date' | 'recurrenceId' | 'horsSolde'>;
/** Récurrence mensuelle : `jour` 1–31, ramené au dernier jour des mois plus courts. */
export interface Recurrence {
  id: string; modele: ModeleOperation; jour: number; prochaineEcheance: DateISO; active: boolean;
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
