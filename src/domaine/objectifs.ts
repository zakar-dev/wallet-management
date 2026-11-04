import { soldeCompte } from './comptes';
import { estDateValide, moisDe, type DateISO } from './dates';
import { formatMontant, type Centimes } from './montant';
import type { Compte, Objectif, Operation } from './types';

/** Σ soldes des comptes épargne non archivés. */
export function epargneTotale(comptes: Compte[], ops: Operation[]): Centimes {
  return comptes
    .filter((c) => c.type === 'epargne' && !c.archive)
    .reduce((s, c) => s + soldeCompte(c, ops), 0);
}

/** Épargne non réservée par un objectif ; négative si l'épargne a baissé sous les réserves. */
export function epargneLibre(comptes: Compte[], ops: Operation[], objectifs: Objectif[]): Centimes {
  return epargneTotale(comptes, ops) - objectifs.reduce((s, o) => s + o.reserve, 0);
}

/** Σ réservés ≤ Σ épargne : une allocation au-delà est refusée, avec le montant encore libre. */
export function erreurAllocation(montant: Centimes | null, libre: Centimes): string | null {
  if (!montant || montant <= 0) return 'Saisissez un montant';
  if (montant > libre) {
    return `Il reste seulement ${formatMontant(Math.max(0, libre))} MAD libres sur vos comptes épargne`;
  }
  return null;
}

/** Retirer ou dépenser : jamais plus que le réservé. */
export function erreurRetrait(o: Objectif, montant: Centimes | null): string | null {
  if (!montant || montant <= 0) return 'Saisissez un montant';
  if (montant > o.reserve) return `Cet objectif ne contient que ${formatMontant(o.reserve)} MAD`;
  return null;
}

export function allouer(o: Objectif, montant: Centimes): Objectif {
  return { ...o, reserve: o.reserve + montant };
}

export function retirer(o: Objectif, montant: Centimes): Objectif {
  return { ...o, reserve: o.reserve - montant };
}

/** L'argent de l'objectif est dépensé : une vraie dépense sur un compte épargne, et la réserve baisse d'autant. */
export function depenserObjectif(
  o: Objectif, montant: Centimes,
  p: { id: string; compteId: string; categorieId: string; date: DateISO },
): { objectif: Objectif; operation: Operation } {
  return {
    objectif: retirer(o, montant),
    operation: {
      id: p.id, date: p.date, montant, type: 'depense', compteId: p.compteId, categorieId: p.categorieId, libelle: o.nom,
    },
  };
}

const indexMois = (date: DateISO) => {
  const [a, m] = moisDe(date).split('-').map(Number);
  return a * 12 + m;
};

/** Mois restants jusqu'à l'échéance, mois courant compris (au moins 1). */
export function moisRestants(aujourdhui: DateISO, echeance: DateISO): number {
  return Math.max(1, indexMois(echeance) - indexMois(aujourdhui) + 1);
}

/** Montant à mettre de côté chaque mois pour atteindre la cible à l'échéance. */
export function montantConseille(o: Objectif, aujourdhui: DateISO): Centimes | null {
  if (!o.echeance) return null;
  const reste = Math.max(0, o.cible - o.reserve);
  return Math.ceil(reste / moisRestants(aujourdhui, o.echeance));
}

export function estAtteint(o: Objectif): boolean {
  return o.reserve >= o.cible;
}

export function progression(o: Objectif): number {
  return o.cible > 0 ? Math.min(1, o.reserve / o.cible) : 0;
}

export function erreurObjectif(o: { nom: string; cible: Centimes | null; echeance: string }): string | null {
  if (!o.nom.trim()) return "Donnez un nom à l'objectif";
  if (!o.cible || o.cible <= 0) return 'Saisissez un montant cible';
  if (o.echeance.trim() && !estDateValide(o.echeance.trim())) return 'Date invalide';
  return null;
}

/** En cours d'abord (par échéance, sans échéance ensuite), atteints à la fin. */
export function trierObjectifs(objectifs: Objectif[]): Objectif[] {
  const rang = (o: Objectif) => (estAtteint(o) ? 2 : o.echeance ? 0 : 1);
  return [...objectifs].sort((a, b) =>
    rang(a) - rang(b) || (a.echeance ?? '').localeCompare(b.echeance ?? '') || a.nom.localeCompare(b.nom, 'fr'));
}
