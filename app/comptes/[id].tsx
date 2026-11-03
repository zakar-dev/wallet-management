import { useState } from 'react';
import { ScrollView, Switch, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { retour } from '@/src/ui/navigation';
import { COULEURS } from '@/src/domaine/categories';
import { compteUtilise, definirParDefaut, erreurCompte } from '@/src/domaine/comptes';
import { nouvelId } from '@/src/domaine/id';
import { formatMontant, parseMontant } from '@/src/domaine/montant';
import type { Compte, TypeCompte } from '@/src/domaine/types';
import { useDonnees } from '@/src/stockage/DonneesProvider';
import { BoutonSupprimer } from '@/src/ui/BoutonSupprimer';
import { Champ } from '@/src/ui/Champ';
import { EnTeteFeuille } from '@/src/ui/Ecran';
import { Ligne, Section } from '@/src/ui/Liste';
import { Nuancier } from '@/src/ui/Nuancier';
import { Segment } from '@/src/ui/Segment';
import { Texte } from '@/src/ui/Texte';
import { useTheme } from '@/src/ui/theme';

const TYPES: { valeur: TypeCompte; libelle: string }[] = [
  { valeur: 'courant', libelle: 'Courant' },
  { valeur: 'epargne', libelle: 'Épargne' },
  { valeur: 'especes', libelle: 'Espèces' },
];

export default function FormulaireCompte() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { donnees, enregistrer, supprimer } = useDonnees();
  const existant = donnees.comptes.find((c) => c.id === id);
  const premier = donnees.comptes.length === 0;

  const [nom, setNom] = useState(existant?.nom ?? '');
  const [type, setType] = useState<TypeCompte>(existant?.type ?? 'courant');
  const [solde, setSolde] = useState(existant ? formatMontant(existant.soldeOuverture) : '');
  const [couleur, setCouleur] = useState(existant?.couleur ?? COULEURS[5]);
  const [parDefaut, setParDefaut] = useState(existant?.parDefaut ?? premier);
  const [archive, setArchive] = useState(existant?.archive ?? false);

  const soldeOuverture = solde.trim() === '' ? 0 : parseMontant(solde);
  const erreur = erreurCompte({ nom }) ?? (soldeOuverture === null ? 'Montant invalide' : null);

  async function valider() {
    if (erreur) return;
    const compte: Compte = {
      id: existant?.id ?? nouvelId(), nom: nom.trim(), type, soldeOuverture: soldeOuverture as number,
      couleur, archive, parDefaut,
    };
    const tous = [...donnees.comptes.filter((c) => c.id !== compte.id), compte];
    await enregistrer('comptes', ...(parDefaut ? definirParDefaut(tous, compte.id) : [compte]));
    retour('/comptes');
  }

  async function effacer() {
    if (!existant) return;
    await supprimer('comptes', existant.id);
    retour('/comptes');
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.fond }}>
      <EnTeteFeuille
        titre={existant ? 'Modifier le compte' : 'Nouveau compte'}
        onGauche={() => retour('/comptes')}
        droite="OK"
        droiteActive={!erreur}
        onDroite={valider}
      />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
        <Section>
          <Champ placeholder="Nom (ex. CIH, Épargne…)" value={nom} onChangeText={setNom} autoFocus={!existant} />
          <Champ etiquette="Solde d'ouverture" placeholder="0,00" value={solde} onChangeText={setSolde}
            keyboardType="decimal-pad" chiffres />
        </Section>
        {nom.length > 0 && erreur && (
          <Texte variante="petit" couleur={t.erreur} style={{ marginHorizontal: 32, marginTop: 8 }}>{erreur}</Texte>
        )}
        <View style={{ marginTop: 22 }}>
          <Segment options={TYPES} valeur={type} onChange={setType} />
        </View>
        <Section titre="Couleur">
          <Nuancier valeur={couleur} onChange={setCouleur} />
        </Section>
        <Section>
          <Ligne titre="Compte par défaut" droite={<Switch value={parDefaut} onValueChange={setParDefaut} />} />
          {existant ? (
            <Ligne titre="Archivé" droite={<Switch value={archive} onValueChange={setArchive} />} />
          ) : null}
        </Section>
        {existant && (compteUtilise(existant.id, donnees.operations) ? (
          <Section pied="Ce compte a des opérations : archivez-le plutôt.">{null}</Section>
        ) : (
          <BoutonSupprimer libelle="Supprimer le compte" onConfirmer={effacer} />
        ))}
      </ScrollView>
    </View>
  );
}
