import { joursEntre, type DateISO } from './dates';
import { COLLECTIONS, type Donnees } from './types';

export const VERSION_SAUVEGARDE = 1;
const APPLICATION = 'wallet-management';

export interface Sauvegarde { application: string; version: number; date: string; donnees: Donnees }

export function creerSauvegarde(donnees: Donnees, date: string): Sauvegarde {
  return { application: APPLICATION, version: VERSION_SAUVEGARDE, date, donnees };
}

export function nomFichierSauvegarde(jour: DateISO): string {
  return `wallet-sauvegarde-${jour}.json`;
}

export type ResultatLecture = { ok: true; date: string; donnees: Donnees } | { ok: false; erreur: string };

const estObjet = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/** Contrôle le format et la version avant tout remplacement. */
export function lireSauvegarde(texte: string): ResultatLecture {
  let brut: unknown;
  try { brut = JSON.parse(texte); } catch { return { ok: false, erreur: 'Fichier illisible' }; }
  if (!estObjet(brut) || brut.application !== APPLICATION || typeof brut.version !== 'number') {
    return { ok: false, erreur: "Ce fichier n'est pas une sauvegarde Wallet" };
  }
  if (brut.version > VERSION_SAUVEGARDE) return { ok: false, erreur: "Sauvegarde trop récente : mettez l'app à jour" };
  const d = brut.donnees;
  const valide = estObjet(d) && COLLECTIONS.every((c) =>
    Array.isArray(d[c]) && (d[c] as unknown[]).every((e) => estObjet(e) && typeof e.id === 'string'));
  if (!valide) return { ok: false, erreur: 'Sauvegarde incomplète ou abîmée' };
  return { ok: true, date: String(brut.date ?? ''), donnees: d as unknown as Donnees };
}

/** Rappel si l'on a des données et aucune sauvegarde depuis plus de 7 jours. */
export function rappelSauvegarde(derniere: DateISO | null, aujourdhui: DateISO, aDesDonnees: boolean): boolean {
  if (!aDesDonnees) return false;
  return derniere === null || joursEntre(derniere, aujourdhui) > 7;
}
