import { idAssignation } from './budget';
import { CATEGORIES_PAR_DEFAUT, GROUPES_PAR_DEFAUT } from './categories';
import { ajouterJours, ajouterMois, dateDuMois, moisDe, type DateISO } from './dates';
import { prochaineEcheanceApres } from './recurrences';
import type { Donnees, Operation } from './types';

/** Jeu d'exemple sur les 3 derniers mois, relatif à `aujourdhui`. Chargé seulement depuis Réglages. */
export function donneesDemo(aujourdhui: DateISO): Donnees {
  const mois = moisDe(aujourdhui);
  const operations: Operation[] = [];
  const ajouter = (o: Omit<Operation, 'id'>, id?: string) => {
    if (o.date <= aujourdhui) operations.push({ id: id ?? `demo-o${operations.length + 1}`, ...o });
  };

  for (const k of [-2, -1, 0]) {
    const m = ajouterMois(mois, k);
    const jour = (j: number) => dateDuMois(m, j);
    ajouter({ date: jour(1), montant: 900000, type: 'revenu', compteId: 'demo-cih', categorieId: 'c-salaire', libelle: 'Salaire', recurrenceId: 'demo-r-salaire' });
    ajouter({ date: jour(5), montant: 350000, type: 'depense', compteId: 'demo-cih', categorieId: 'c-loyer', libelle: 'Loyer', recurrenceId: 'demo-r-loyer' });
    ajouter({ date: jour(2), montant: 100000, type: 'transfert', compteId: 'demo-cih', compteDestId: 'demo-ep', libelle: 'Épargne du mois' });
    ajouter({ date: jour(3), montant: 30000, type: 'transfert', compteId: 'demo-cih', compteDestId: 'demo-esp', libelle: 'Retrait' });
    const courses: [number, number, string][] = [[4, 62000, 'Marjane'], [11, 48500, 'Carrefour'], [18, 71000, 'Marjane'], [25, 39000, 'Acima']];
    for (const [j, montant, libelle] of courses) {
      ajouter({ date: jour(j), montant, type: 'depense', compteId: 'demo-cih', categorieId: 'c-courses', libelle });
    }
    for (const j of [6, 13, 20, 27]) {
      ajouter({ date: jour(j), montant: 2500 + j * 50, type: 'depense', compteId: 'demo-esp', categorieId: 'c-cafe', libelle: 'Café du coin' });
    }
    ajouter({ date: jour(9), montant: 40000, type: 'depense', compteId: 'demo-cih', categorieId: 'c-carburant', libelle: 'Afriquia' });
    ajouter({ date: jour(22), montant: 38000, type: 'depense', compteId: 'demo-cih', categorieId: 'c-carburant', libelle: 'Shell' });
    ajouter({ date: jour(15), montant: 27000, type: 'depense', compteId: 'demo-cih', categorieId: 'c-internet', libelle: 'Maroc Telecom' });
    ajouter({ date: jour(16), montant: 8000, type: 'depense', compteId: 'demo-esp', categorieId: 'c-hammam', libelle: 'Hammam' });
    ajouter({ date: jour(19), montant: 45000, type: 'depense', compteId: 'demo-cih', categorieId: 'c-restaurants', libelle: 'Dîner' });
  }

  const debutDette = ajouterJours(aujourdhui, -40);
  const rembDette = ajouterJours(aujourdhui, -10);
  ajouter({ date: debutDette, montant: 200000, type: 'depense', compteId: 'demo-cih', libelle: 'Prêt à Karim', detteId: 'demo-d1' }, 'demo-o-pret');
  ajouter({ date: rembDette, montant: 50000, type: 'revenu', compteId: 'demo-cih', libelle: 'Remboursement de Karim', detteId: 'demo-d1' }, 'demo-o-remb');

  const assigner = (categorieId: string, montant: number) => ({ id: idAssignation(mois, categorieId), mois, categorieId, montant });

  return {
    comptes: [
      { id: 'demo-cih', nom: 'CIH', type: 'courant', soldeOuverture: 800000, couleur: '#0a84ff', archive: false, parDefaut: true },
      { id: 'demo-ep', nom: 'Épargne', type: 'epargne', soldeOuverture: 2000000, couleur: '#30d158', archive: false, parDefaut: false },
      { id: 'demo-esp', nom: 'Espèces', type: 'especes', soldeOuverture: 50000, couleur: '#ff9f0a', archive: false, parDefaut: false },
    ],
    groupes: GROUPES_PAR_DEFAUT,
    categories: CATEGORIES_PAR_DEFAUT.map((c) => (c.id === 'c-courses' || c.id === 'c-cafe' ? { ...c, favori: true } : c)),
    operations,
    assignations: [
      assigner('c-loyer', 350000), assigner('c-courses', 250000), assigner('c-carburant', 80000),
      assigner('c-cafe', 15000), assigner('c-restaurants', 50000), assigner('c-internet', 27000),
    ],
    recurrences: [
      { id: 'demo-r-salaire', jour: 1, active: true, prochaineEcheance: prochaineEcheanceApres(1, aujourdhui),
        modele: { montant: 900000, type: 'revenu', compteId: 'demo-cih', categorieId: 'c-salaire', libelle: 'Salaire' } },
      { id: 'demo-r-loyer', jour: 5, active: true, prochaineEcheance: prochaineEcheanceApres(5, aujourdhui),
        modele: { montant: 350000, type: 'depense', compteId: 'demo-cih', categorieId: 'c-loyer', libelle: 'Loyer' } },
    ],
    objectifs: [
      { id: 'demo-obj1', nom: 'Voyage', icone: 'plane', cible: 1500000, echeance: dateDuMois(ajouterMois(mois, 6), 15), reserve: 500000 },
    ],
    dettes: [
      { id: 'demo-d1', personne: 'Karim', sens: 'on_me_doit', montant: 200000, date: debutDette, operationId: 'demo-o-pret',
        remboursements: [{ id: 'demo-rb1', date: rembDette, montant: 50000, operationId: 'demo-o-remb' }] },
    ],
  };
}
