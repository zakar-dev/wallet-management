import { resteDette } from './comptes';
import { estDateValide, type DateISO } from './dates';
import { formatMontant, type Centimes } from './montant';
import type { Dette, Operation, SensDette } from './types';

export { resteDette };

export function libelleMouvement(sens: SensDette, personne: string, remboursement: boolean): string {
  if (remboursement) return sens === 'on_me_doit' ? `Remboursement de ${personne}` : `Remboursement à ${personne}`;
  return sens === 'on_me_doit' ? `Prêt à ${personne}` : `Emprunt à ${personne}`;
}

/** L'argent sort quand je prête ou quand je rembourse ; il entre quand j'emprunte ou qu'on me rembourse. */
function mouvement(
  d: Pick<Dette, 'id' | 'sens' | 'personne'>, remboursement: boolean,
  p: { operationId: string; compteId?: string; montant: Centimes; date: DateISO },
): Operation | undefined {
  if (!p.compteId) return undefined;
  const sortie = (d.sens === 'on_me_doit') !== remboursement;
  return {
    id: p.operationId, date: p.date, montant: p.montant, type: sortie ? 'depense' : 'revenu', compteId: p.compteId,
    libelle: libelleMouvement(d.sens, d.personne, remboursement), detteId: d.id,
  };
}

export function creerDette(p: {
  id: string; personne: string; sens: SensDette; montant: Centimes; date: DateISO; compteId?: string; operationId: string;
}): { dette: Dette; operation?: Operation } {
  const dette: Dette = {
    id: p.id, personne: p.personne.trim(), sens: p.sens, montant: p.montant, date: p.date, remboursements: [],
  };
  const operation = mouvement(dette, false, p);
  if (operation) dette.operationId = operation.id;
  return { dette, operation };
}

export function ajouterRemboursement(d: Dette, p: {
  id: string; date: DateISO; montant: Centimes; compteId?: string; operationId: string;
}): { dette: Dette; operation?: Operation } {
  const operation = mouvement(d, true, p);
  const r = { id: p.id, date: p.date, montant: p.montant, ...(operation ? { operationId: operation.id } : {}) };
  return { dette: { ...d, remboursements: [...d.remboursements, r] }, operation };
}

/** Retire un remboursement ; renvoie l'opération liée à supprimer, s'il y en a une. */
export function retirerRemboursement(d: Dette, id: string): { dette: Dette; operationId?: string } {
  const r = d.remboursements.find((x) => x.id === id);
  return { dette: { ...d, remboursements: d.remboursements.filter((x) => x.id !== id) }, operationId: r?.operationId };
}

/** Toutes les opérations créées pour cette dette (à supprimer avec elle). */
export function operationsDeDette(d: Dette): string[] {
  return [d.operationId, ...d.remboursements.map((r) => r.operationId)].filter((x): x is string => Boolean(x));
}

export function estSoldee(d: Dette): boolean {
  return resteDette(d) <= 0;
}

export function erreurDette(p: { personne: string; montant: Centimes | null; date: string }): string | null {
  if (!p.personne.trim()) return 'Indiquez la personne';
  if (!p.montant || p.montant <= 0) return 'Saisissez un montant';
  if (!estDateValide(p.date)) return 'Date invalide';
  return null;
}

export function erreurRemboursement(d: Dette, montant: Centimes | null, date: string): string | null {
  if (!montant || montant <= 0) return 'Saisissez un montant';
  const reste = resteDette(d);
  if (montant > reste) return `Il reste ${formatMontant(reste)} MAD à rembourser`;
  if (!estDateValide(date)) return 'Date invalide';
  return null;
}

export function totauxDettes(dettes: Dette[]): { onMeDoit: Centimes; jeDois: Centimes } {
  const total = (sens: SensDette) =>
    dettes.filter((d) => d.sens === sens).reduce((s, d) => s + Math.max(0, resteDette(d)), 0);
  return { onMeDoit: total('on_me_doit'), jeDois: total('je_dois') };
}

/** En cours d'abord (les plus récentes en tête), soldées ensuite. */
export function trierDettes(dettes: Dette[]): Dette[] {
  return [...dettes].sort((a, b) => Number(estSoldee(a)) - Number(estSoldee(b)) || b.date.localeCompare(a.date));
}
