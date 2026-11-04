import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { aujourdhui } from '@/src/domaine/dates';
import { avecEntites, sansEntite } from '@/src/domaine/donnees';
import type { Collection, Donnees, EntiteDe } from '@/src/domaine/types';
import { useTheme } from '@/src/ui/theme';
import type { Depot } from './depot';
import { DepotMemoire } from './depotMemoire';
import { ouvrirDepotIndexedDb } from './depotIndexedDb';
import { initialiserSiVide, rattraperRecurrences } from './initialisation';

interface ContexteDonnees {
  donnees: Donnees;
  enregistrer: <C extends Collection>(c: C, ...entites: EntiteDe<C>[]) => Promise<void>;
  supprimer: (c: Collection, id: string) => Promise<void>;
  remplacer: (d: Donnees) => Promise<void>;
}

const Contexte = createContext<ContexteDonnees | null>(null);

async function ouvrirDepot(): Promise<Depot> {
  return typeof indexedDB !== 'undefined' ? ouvrirDepotIndexedDb() : new DepotMemoire();
}

export function DonneesProvider({ children, depot }: { children: ReactNode; depot?: Depot }) {
  const t = useTheme();
  const [etat, setEtat] = useState<{ depot: Depot; donnees: Donnees } | null>(null);

  useEffect(() => {
    let annule = false;
    (async () => {
      const d = depot ?? (await ouvrirDepot());
      await initialiserSiVide(d);
      // Crée les occurrences des récurrences arrivées à échéance depuis la dernière ouverture.
      const donnees = await rattraperRecurrences(d, aujourdhui());
      if (!annule) setEtat({ depot: d, donnees });
    })().catch((e) => console.error('Chargement des données impossible', e));
    return () => { annule = true; };
  }, [depot]);

  const enregistrer = useCallback(async <C extends Collection>(c: C, ...entites: EntiteDe<C>[]) => {
    if (!etat) return;
    try {
      await etat.depot.enregistrer(c, entites);
      setEtat((e) => e && { ...e, donnees: avecEntites(e.donnees, c, entites) });
    } catch (err) { console.error('Enregistrement impossible', err); }
  }, [etat]);

  const supprimer = useCallback(async (c: Collection, id: string) => {
    if (!etat) return;
    try {
      await etat.depot.supprimer(c, id);
      setEtat((e) => e && { ...e, donnees: sansEntite(e.donnees, c, id) });
    } catch (err) { console.error('Suppression impossible', err); }
  }, [etat]);

  const remplacer = useCallback(async (d: Donnees) => {
    if (!etat) return;
    try {
      await etat.depot.toutRemplacer(d);
      setEtat((e) => e && { ...e, donnees: d });
    } catch (err) { console.error('Remplacement impossible', err); }
  }, [etat]);

  const valeur = useMemo(
    () => etat && { donnees: etat.donnees, enregistrer, supprimer, remplacer },
    [etat, enregistrer, supprimer, remplacer],
  );

  if (!valeur) return <View style={{ flex: 1, backgroundColor: t.fond }} />;
  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useDonnees(): ContexteDonnees {
  const c = useContext(Contexte);
  if (!c) throw new Error('useDonnees hors de DonneesProvider');
  return c;
}
