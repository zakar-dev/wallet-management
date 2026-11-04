import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { aujourdhui } from '@/src/domaine/dates';
import { nouvelId } from '@/src/domaine/id';
import { formatMontant, parseMontant } from '@/src/domaine/montant';
import { erreurObjectif, progression } from '@/src/domaine/objectifs';
import type { Objectif } from '@/src/domaine/types';
import { useDonnees } from '@/src/stockage/DonneesProvider';
import { BoutonSupprimer } from '@/src/ui/BoutonSupprimer';
import { Champ } from '@/src/ui/Champ';
import { EnTeteFeuille } from '@/src/ui/Ecran';
import { GrilleIcones } from '@/src/ui/GrilleIcones';
import { IconeCarree } from '@/src/ui/IconeCarree';
import { Jauge } from '@/src/ui/Jauge';
import { Ligne, Section } from '@/src/ui/Liste';
import { retour } from '@/src/ui/navigation';
import { COULEUR_OBJECTIF, detailObjectif } from '@/src/ui/objectif';
import { Texte } from '@/src/ui/Texte';
import { useTheme } from '@/src/ui/theme';

export default function FormulaireObjectif() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { donnees, enregistrer, supprimer } = useDonnees();
  const existant = donnees.objectifs.find((o) => o.id === id);

  const [nom, setNom] = useState(existant?.nom ?? '');
  const [cibleTexte, setCibleTexte] = useState(existant ? formatMontant(existant.cible) : '');
  const [echeance, setEcheance] = useState(existant?.echeance ?? '');
  const [icone, setIcone] = useState(existant?.icone ?? 'piggy-bank');

  const cible = parseMontant(cibleTexte);
  const erreur = erreurObjectif({ nom, cible, echeance });
  const fermer = () => retour('/objectifs');

  async function valider() {
    if (erreur) return;
    const o: Objectif = {
      id: existant?.id ?? nouvelId(), nom: nom.trim(), icone, cible: cible as number, reserve: existant?.reserve ?? 0,
    };
    if (echeance.trim()) o.echeance = echeance.trim();
    await enregistrer('objectifs', o);
    fermer();
  }

  async function effacer() {
    if (!existant) return;
    await supprimer('objectifs', existant.id);
    fermer();
  }

  const action = (sens: 'allouer' | 'retirer' | 'depenser') =>
    existant && router.push(`/objectifs/mouvement?id=${existant.id}&sens=${sens}`);

  return (
    <View style={{ flex: 1, backgroundColor: t.fond }}>
      <EnTeteFeuille
        titre={existant ? existant.nom : 'Nouvel objectif'}
        onGauche={fermer}
        droite="OK"
        droiteActive={!erreur}
        onDroite={valider}
      />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ alignItems: 'center', marginTop: 12, gap: 6, marginHorizontal: 32 }}>
          <IconeCarree nom={icone} couleur={COULEUR_OBJECTIF} taille={56} />
          {existant ? (
            <>
              <Texte chiffres style={{ fontSize: 26, fontWeight: '700' }}>
                {formatMontant(existant.reserve)} MAD
              </Texte>
              <Texte variante="petit" chiffres>sur {formatMontant(existant.cible)} MAD</Texte>
              <View style={{ alignSelf: 'stretch' }}>
                <Jauge ratio={progression(existant)} etat="ok" />
              </View>
              <Texte variante="petit" chiffres>{detailObjectif(existant, aujourdhui())}</Texte>
            </>
          ) : null}
        </View>

        {existant ? (
          <Section>
            <Ligne titre="Allouer" icone="circle-plus" couleurIcone={COULEUR_OBJECTIF} onPress={() => action('allouer')} chevron />
            <Ligne titre="Retirer" icone="arrow-left-right" couleurIcone="#8e8e93" onPress={() => action('retirer')}
              chevron desactivee={existant.reserve === 0} />
            <Ligne titre="Dépenser" icone="shopping-bag" couleurIcone="#ff9f0a" onPress={() => action('depenser')}
              chevron desactivee={existant.reserve === 0} />
          </Section>
        ) : null}

        <Section titre={existant ? 'Réglages' : undefined}>
          <Champ placeholder="Nom (ex. Voyage, Voiture…)" value={nom} onChangeText={setNom} autoFocus={!existant} />
          <Champ etiquette="Cible" placeholder="0,00" value={cibleTexte} onChangeText={setCibleTexte}
            keyboardType="decimal-pad" chiffres />
          <Champ etiquette="Échéance" placeholder="AAAA-MM-JJ (facultatif)" value={echeance} onChangeText={setEcheance} chiffres />
        </Section>
        {(nom || cibleTexte) && erreur ? (
          <Texte variante="petit" couleur={t.erreur} style={{ marginHorizontal: 32, marginTop: 8 }}>{erreur}</Texte>
        ) : null}

        <Section titre="Icône">
          <GrilleIcones valeur={icone} couleur={COULEUR_OBJECTIF} onChange={setIcone} />
        </Section>

        {existant ? (
          <>
            <BoutonSupprimer libelle="Supprimer l'objectif" onConfirmer={effacer} />
            <Section pied="Supprimer l'objectif libère son argent réservé ; vos comptes ne changent pas.">{null}</Section>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
