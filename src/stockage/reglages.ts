import type { DateISO } from '@/src/domaine/dates';

const CLE_DERNIERE_SAUVEGARDE = 'wallet.derniereSauvegarde';

/** Stockage local de l'appareil (même durée de vie que les données) ; absent ou bloqué → null. */
function stockage(): Storage | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}

export function lireDerniereSauvegarde(): DateISO | null {
  try { return stockage()?.getItem(CLE_DERNIERE_SAUVEGARDE) ?? null; } catch { return null; }
}

export function noterSauvegarde(jour: DateISO): void {
  try { stockage()?.setItem(CLE_DERNIERE_SAUVEGARDE, jour); } catch { /* stockage indisponible : rappel conservé */ }
}
