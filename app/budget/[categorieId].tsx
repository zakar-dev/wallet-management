import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { avecAssigne, enveloppe, versAssignation } from '@/src/domaine/budget';
import { aujourdhui, libelleMois, moisDe } from '@/src/domaine/dates';
import { formatMontant, parseMontant } from '@/src/domaine/montant';
import { useDonnees } from '@/src/stockage/DonneesProvider';
import { Champ } from '@/src/ui/Champ';
import { EnTeteFeuille } from '@/src/ui/Ecran';
import { IconeCarree } from '@/src/ui/IconeCarree';
import { Ligne, Section } from '@/src/ui/Liste';
import { retour } from '@/src/ui/navigation';
import { Texte } from '@/src/ui/Texte';
import { useTheme } from '@/src/ui/theme';

export default function AssignerEnveloppe() {
  const t = useTheme();
  const { categorieId, mois: moisParam } = useLocalSearchParams<{ categorieId: string; mois?: string }>();
  const mois = moisParam && /^\d{4}-\d{2}$/.test(moisParam) ? moisParam : moisDe(aujourdhui());
  const { donnees, enregistrer } = useDonnees();
  const categorie = donnees.categories.find((c) => c.id === categorieId);
  const env = enveloppe(donnees.assignations, donnees.operations, mois, categorieId);

  const [texte, setTexte] = useState(env.assigne ? formatMontant(env.assigne) : '');
  const montant = texte.trim() === '' ? 0 : parseMontant(texte);
  const fermer = () => retour('/budget');

  async function valider() {
    if (montant === null) return;
    await enregistrer('assignations', versAssignation(mois, categorieId, montant));
    fermer();
  }

  if (!categorie) {
    return (
      <View style={{ flex: 1, backgroundColor: t.fond }}>
        <EnTeteFeuille titre="Enveloppe" onGauche={fermer} />
        <Section pied="Cette catégorie n'existe plus.">{null}</Section>
      </View>
    );
  }

  const resteApres = avecAssigne(env, montant ?? 0).reste;

  return (
    <View style={{ flex: 1, backgroundColor: t.fond }}>
      <EnTeteFeuille titre={libelleMois(mois)} onGauche={fermer} droite="OK" droiteActive={montant !== null} onDroite={valider} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ alignItems: 'center', marginTop: 12, gap: 6 }}>
          <IconeCarree nom={categorie.icone} couleur={categorie.couleur} taille={56} />
          <Texte variante="titre">{categorie.nom}</Texte>
        </View>
        <Section>
          <Champ etiquette="Assigné ce mois" value={texte} onChangeText={setTexte} placeholder="0,00"
            keyboardType="decimal-pad" autoFocus chiffres />
        </Section>
        {montant === null && (
          <Texte variante="petit" couleur={t.erreur} style={{ marginHorizontal: 32, marginTop: 8 }}>Montant invalide</Texte>
        )}
        <Section>
          <Ligne titre="Reporté du mois précédent" valeur={formatMontant(env.report)} />
          <Ligne titre="Dépensé ce mois" valeur={formatMontant(env.depense)} />
          <Ligne titre="Reste" valeur={formatMontant(resteApres)} couleurValeur={resteApres < 0 ? t.erreur : t.succes} />
        </Section>
      </ScrollView>
    </View>
  );
}
