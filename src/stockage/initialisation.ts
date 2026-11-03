import { CATEGORIES_PAR_DEFAUT, GROUPES_PAR_DEFAUT } from '@/src/domaine/categories';
import type { Donnees } from '@/src/domaine/types';
import type { Depot } from './depot';

export async function initialiserSiVide(depot: Depot): Promise<Donnees> {
  const d = await depot.toutLire();
  if (d.groupes.length > 0) return d;
  await depot.enregistrer('groupes', GROUPES_PAR_DEFAUT);
  await depot.enregistrer('categories', CATEGORIES_PAR_DEFAUT);
  return depot.toutLire();
}
