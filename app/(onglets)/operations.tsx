import { View } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { libelleJour } from '@/src/domaine/dates';
import { formatMontant } from '@/src/domaine/montant';
import {
  categoriesUtilisees, filtrerOperations, FILTRE_VIDE, grouperParJour, type FiltreOperations,
} from '@/src/domaine/operations';
import { useDonnees } from '@/src/stockage/DonneesProvider';
import { Ecran } from '@/src/ui/Ecran';
import { LigneOperation } from '@/src/ui/LigneOperation';
import { Section } from '@/src/ui/Liste';
import { Puces } from '@/src/ui/Puces';
import { Recherche } from '@/src/ui/Recherche';
import { Segment } from '@/src/ui/Segment';
import { Texte } from '@/src/ui/Texte';

const TYPES: { valeur: FiltreOperations['type']; libelle: string }[] = [
  { valeur: 'tout', libelle: 'Tout' },
  { valeur: 'depense', libelle: 'Dépenses' },
  { valeur: 'revenu', libelle: 'Revenus' },
  { valeur: 'transfert', libelle: 'Transferts' },
];

export default function Operations() {
  const { donnees } = useDonnees();
  const [filtre, setFiltre] = useState<FiltreOperations>(FILTRE_VIDE);
  const maj = (p: Partial<FiltreOperations>) => setFiltre((f) => ({ ...f, ...p }));
  const jours = grouperParJour(filtrerOperations(donnees.operations, filtre, donnees.categories));

  return (
    <Ecran titre="Opérations" onglet>
      <Recherche valeur={filtre.texte} onChange={(texte) => maj({ texte })} />
      <View style={{ marginTop: 12 }}>
        <Segment options={TYPES} valeur={filtre.type} onChange={(type) => maj({ type })} />
      </View>
      <Puces
        options={donnees.comptes.map((c) => ({ valeur: c.id, libelle: c.nom }))}
        valeur={filtre.compteId}
        onChange={(compteId) => maj({ compteId })}
      />
      <Puces
        options={categoriesUtilisees(donnees.categories, donnees.operations).map((c) => ({ valeur: c.id, libelle: c.nom }))}
        valeur={filtre.categorieId}
        onChange={(categorieId) => maj({ categorieId })}
      />
      {jours.length === 0 ? (
        <Section pied="Aucune opération">{null}</Section>
      ) : (
        jours.map((j) => (
          <Section
            key={j.date}
            titre={libelleJour(j.date)}
            droiteTitre={<Texte variante="petit" chiffres>{formatMontant(j.total, { signe: true })}</Texte>}
          >
            {j.operations.map((o) => (
              <LigneOperation key={o.id} operation={o} donnees={donnees}
                onPress={() => router.push(`/ajout?id=${o.id}`)} />
            ))}
          </Section>
        ))
      )}
    </Ecran>
  );
}
