import { CATEGORIES_PAR_DEFAUT, GROUPES_PAR_DEFAUT } from '@/src/domaine/categories';
import type { DateISO } from '@/src/domaine/dates';
import { nouvelId as idParDefaut } from '@/src/domaine/id';
import { echeancesDues } from '@/src/domaine/recurrences';
import type { Donnees, Operation, Recurrence } from '@/src/domaine/types';
import type { Depot } from './depot';

export async function initialiserSiVide(depot: Depot): Promise<Donnees> {
  const d = await depot.toutLire();
  if (d.groupes.length > 0) return d;
  await depot.enregistrer('groupes', GROUPES_PAR_DEFAUT);
  await depot.enregistrer('categories', CATEGORIES_PAR_DEFAUT);
  return depot.toutLire();
}

/** Enregistre les occurrences arrivées à échéance de chaque récurrence active, puis relit les données. */
export async function rattraperRecurrences(
  depot: Depot, aujourdhui: DateISO, nouvelId: () => string = idParDefaut,
): Promise<Donnees> {
  const d = await depot.toutLire();
  const operations: Operation[] = [];
  const recurrences: Recurrence[] = [];
  for (const rec of d.recurrences) {
    const res = echeancesDues(rec, aujourdhui, nouvelId);
    if (res.operations.length === 0) continue;
    operations.push(...res.operations);
    recurrences.push(res.recurrence);
  }
  if (operations.length === 0) return d;
  await depot.enregistrer('operations', operations);
  await depot.enregistrer('recurrences', recurrences);
  return depot.toutLire();
}
