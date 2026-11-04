import { estDateValide, type DateISO } from './dates';
import type { Centimes } from './montant';
import { normaliser } from './texte';
import type { Categorie, Operation, TypeOperation } from './types';

export interface Brouillon {
  type: TypeOperation; montant: Centimes | null; compteId?: string; compteDestId?: string;
  categorieId?: string; date: DateISO; libelle: string; horsSolde: boolean;
  /** Conservé quand on modifie une occurrence de récurrence. */
  recurrenceId?: string;
  /** Opération liée à une dette : pas de catégorie exigée. */
  detteId?: string;
}

export function erreurOperation(b: Brouillon): string | null {
  if (!b.montant || b.montant <= 0) return 'Saisissez un montant';
  if (!b.compteId) return 'Choisissez un compte';
  if (b.type === 'transfert') {
    if (!b.compteDestId) return 'Choisissez le compte de destination';
    if (b.compteDestId === b.compteId) return 'Choisissez deux comptes différents';
  } else if (!b.categorieId && !b.detteId) {
    return 'Choisissez une catégorie';
  }
  if (!estDateValide(b.date)) return 'Date invalide';
  return null;
}

/** Suppose `erreurOperation(b) === null`. */
export function versOperation(b: Brouillon, id: string): Operation {
  const o: Operation = {
    id, type: b.type, montant: b.montant as Centimes, compteId: b.compteId as string,
    date: b.date, libelle: b.libelle.trim(),
  };
  if (b.type === 'transfert') o.compteDestId = b.compteDestId;
  else if (b.categorieId) o.categorieId = b.categorieId;
  if (b.horsSolde) o.horsSolde = true;
  if (b.recurrenceId) o.recurrenceId = b.recurrenceId;
  if (b.detteId) o.detteId = b.detteId;
  return o;
}

export function versBrouillon(o: Operation): Brouillon {
  return {
    type: o.type, montant: o.montant, compteId: o.compteId, compteDestId: o.compteDestId,
    categorieId: o.categorieId, date: o.date, libelle: o.libelle, horsSolde: Boolean(o.horsSolde),
    recurrenceId: o.recurrenceId, detteId: o.detteId,
  };
}

/** Montant signé selon le type (revenu +, dépense −, transfert 0), même hors solde : pour l'affichage. */
export function montantSigne(o: Operation): Centimes {
  if (o.type === 'revenu') return o.montant;
  if (o.type === 'depense') return -o.montant;
  return 0;
}

/** Effet sur les soldes : nul pour une opération hors solde. */
export function effetNet(o: Operation): Centimes {
  return o.horsSolde ? 0 : montantSigne(o);
}

/** Valeur par défaut de « Déjà incluse dans le solde » : vrai pour une date passée. */
export function horsSoldeSelonDate(date: DateISO, aujourdhui: DateISO): boolean {
  return date < aujourdhui;
}

/** Plus récentes d'abord ; à date égale, l'ordre de saisie le plus récent d'abord. */
export function trierOperations(ops: Operation[]): Operation[] {
  return ops
    .map((o, i) => ({ o, i }))
    .sort((a, b) => b.o.date.localeCompare(a.o.date) || b.i - a.i)
    .map(({ o }) => o);
}

export interface JourOperations { date: DateISO; operations: Operation[]; total: Centimes }

export function grouperParJour(ops: Operation[]): JourOperations[] {
  const jours: JourOperations[] = [];
  const parDate = new Map<DateISO, Operation[]>();
  for (const o of [...ops].sort((a, b) => b.date.localeCompare(a.date))) {
    if (!parDate.has(o.date)) parDate.set(o.date, []);
    parDate.get(o.date)!.push(o);
  }
  for (const [date, operations] of parDate) {
    jours.push({ date, operations, total: operations.reduce((s, o) => s + effetNet(o), 0) });
  }
  return jours;
}

export interface FiltreOperations {
  texte: string; type: TypeOperation | 'tout'; compteId?: string; categorieId?: string;
}
export const FILTRE_VIDE: FiltreOperations = { texte: '', type: 'tout' };

export function filtrerOperations(
  ops: Operation[], f: FiltreOperations, categories: Categorie[],
): Operation[] {
  const q = normaliser(f.texte);
  const nomCat = new Map(categories.map((c) => [c.id, normaliser(c.nom)]));
  return ops.filter((o) =>
    (f.type === 'tout' || o.type === f.type)
    && (!f.compteId || o.compteId === f.compteId || o.compteDestId === f.compteId)
    && (!f.categorieId || o.categorieId === f.categorieId)
    && (!q || normaliser(o.libelle).includes(q) || (nomCat.get(o.categorieId ?? '') ?? '').includes(q)));
}

export function operationsRecentes(ops: Operation[], n: number): Operation[] {
  return trierOperations(ops).slice(0, n);
}

export function categoriesUtilisees(categories: Categorie[], ops: Operation[]): Categorie[] {
  const ids = new Set(ops.map((o) => o.categorieId));
  return categories.filter((c) => ids.has(c.id)).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
}
