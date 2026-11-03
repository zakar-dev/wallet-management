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
