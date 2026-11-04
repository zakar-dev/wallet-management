import { ajouterMois, dateDuMois, moisDe, type DateISO } from './dates';
import type { ModeleOperation, Operation, Recurrence } from './types';

/** Première date « jour J du mois » strictement après `date`. */
export function prochaineEcheanceApres(jour: number, date: DateISO): DateISO {
  const ceMois = dateDuMois(moisDe(date), jour);
  return ceMois > date ? ceMois : dateDuMois(ajouterMois(moisDe(date), 1), jour);
}

/** L'opération saisie est la première occurrence : la suivante tombe après elle et après aujourd'hui. */
export function creerRecurrence(op: Operation, jour: number, id: string, aujourdhui: DateISO): Recurrence {
  const { id: _id, date, recurrenceId: _r, horsSolde: _h, ...modele } = op;
  const depart = date > aujourdhui ? date : aujourdhui;
  return { id, modele: modele as ModeleOperation, jour, prochaineEcheance: prochaineEcheanceApres(jour, depart), active: true };
}

/** Opérations à créer pour les échéances arrivées (rattrapage compris) et récurrence avancée. */
export function echeancesDues(
  rec: Recurrence, aujourdhui: DateISO, nouvelId: () => string,
): { operations: Operation[]; recurrence: Recurrence } {
  if (!rec.active || rec.prochaineEcheance > aujourdhui) return { operations: [], recurrence: rec };
  const operations: Operation[] = [];
  let echeance = rec.prochaineEcheance;
  while (echeance <= aujourdhui) {
    operations.push({ id: nouvelId(), date: echeance, ...rec.modele, recurrenceId: rec.id });
    echeance = prochaineEcheanceApres(rec.jour, echeance);
  }
  return { operations, recurrence: { ...rec, prochaineEcheance: echeance } };
}

/** Réactive sans rattraper les mois où elle était arrêtée. */
export function reactiver(rec: Recurrence, aujourdhui: DateISO): Recurrence {
  return { ...rec, active: true, prochaineEcheance: prochaineEcheanceApres(rec.jour, aujourdhui) };
}

export function libelleRecurrence(rec: Pick<Recurrence, 'jour'>): string {
  return `le ${rec.jour === 1 ? '1er' : rec.jour} de chaque mois`;
}

/** Jour du mois saisi (1–31), ou null si invalide. */
export function parseJour(texte: string): number | null {
  const t = texte.trim();
  if (!/^\d{1,2}$/.test(t)) return null;
  const n = Number(t);
  return n >= 1 && n <= 31 ? n : null;
}
