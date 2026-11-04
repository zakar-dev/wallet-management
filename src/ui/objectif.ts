import { libelleMois, moisDe } from '@/src/domaine/dates';
import { formatMontant } from '@/src/domaine/montant';
import { estAtteint, montantConseille } from '@/src/domaine/objectifs';
import type { Objectif } from '@/src/domaine/types';

export const COULEUR_OBJECTIF = '#30d158';

/** « 1 750,00 / mois jusqu'à février 2027 », « Sans échéance » ou « Atteint ». */
export function detailObjectif(o: Objectif, aujourdhui: string): string {
  if (estAtteint(o)) return 'Atteint';
  const conseil = montantConseille(o, aujourdhui);
  if (conseil === null || !o.echeance) return 'Sans échéance';
  return `${formatMontant(conseil)} / mois jusqu'à ${libelleMois(moisDe(o.echeance)).toLowerCase()}`;
}
