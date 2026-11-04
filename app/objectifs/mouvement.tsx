import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Check } from 'lucide-react-native';
import { aujourdhui } from '@/src/domaine/dates';
import { nouvelId } from '@/src/domaine/id';
import { formatMontant, parseMontant } from '@/src/domaine/montant';
import {
  allouer, depenserObjectif, epargneLibre, erreurAllocation, erreurRetrait, retirer,
} from '@/src/domaine/objectifs';
import { useDonnees } from '@/src/stockage/DonneesProvider';
import { Champ } from '@/src/ui/Champ';
import { EnTeteFeuille } from '@/src/ui/Ecran';
import { Ligne, Section } from '@/src/ui/Liste';
import { retour } from '@/src/ui/navigation';
import { SelecteurCategorie } from '@/src/ui/SelecteurCategorie';
import { Texte } from '@/src/ui/Texte';
import { useTheme } from '@/src/ui/theme';

type Sens = 'allouer' | 'retirer' | 'depenser';
const TITRES: Record<Sens, string> = { allouer: 'Allouer', retirer: 'Retirer', depenser: 'Dépenser' };

export default function MouvementObjectif() {
  const t = useTheme();
  const { id, sens: sensParam } = useLocalSearchParams<{ id: string; sens?: string }>();
  const sens: Sens = sensParam === 'retirer' || sensParam === 'depenser' ? sensParam : 'allouer';
  const { donnees, enregistrer } = useDonnees();
  const objectif = donnees.objectifs.find((o) => o.id === id);
  const comptesEpargne = donnees.comptes.filter((c) => c.type === 'epargne' && !c.archive);

  const [texte, setTexte] = useState('');
  const [compteId, setCompteId] = useState<string | undefined>(comptesEpargne[0]?.id);
  const [categorieId, setCategorieId] = useState<string | undefined>();
  const fermer = () => retour(objectif ? `/objectifs/${objectif.id}` : '/objectifs');

  if (!objectif) {
    return (
      <View style={{ flex: 1, backgroundColor: t.fond }}>
        <EnTeteFeuille titre="Objectif" onGauche={fermer} />
        <Section pied="Cet objectif n'existe plus.">{null}</Section>
      </View>
    );
  }

  const montant = parseMontant(texte);
  const libre = epargneLibre(donnees.comptes, donnees.operations, donnees.objectifs);
  let erreur = sens === 'allouer' ? erreurAllocation(montant, libre) : erreurRetrait(objectif, montant);
  if (!erreur && sens === 'depenser') {
    if (!compteId) erreur = 'Choisissez un compte épargne';
    else if (!categorieId) erreur = 'Choisissez une catégorie';
  }

  async function valider() {
    if (erreur || montant === null || !objectif) return;
    if (sens === 'allouer') await enregistrer('objectifs', allouer(objectif, montant));
    else if (sens === 'retirer') await enregistrer('objectifs', retirer(objectif, montant));
    else {
      const r = depenserObjectif(objectif, montant, {
        id: nouvelId(), compteId: compteId as string, categorieId: categorieId as string, date: aujourdhui(),
      });
      await enregistrer('operations', r.operation);
      await enregistrer('objectifs', r.objectif);
    }
    fermer();
  }

  const aide = sens === 'allouer'
    ? `${formatMontant(Math.max(0, libre))} MAD libres sur vos comptes épargne`
    : `${formatMontant(objectif.reserve)} MAD dans cet objectif`;

  return (
    <View style={{ flex: 1, backgroundColor: t.fond }}>
      <EnTeteFeuille titre={`${TITRES[sens]} · ${objectif.nom}`} onGauche={fermer} droite="OK"
        droiteActive={!erreur} onDroite={valider} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
        <Section pied={aide}>
          <Champ etiquette="Montant" placeholder="0,00" value={texte} onChangeText={setTexte}
            keyboardType="decimal-pad" autoFocus chiffres />
        </Section>

        {sens === 'depenser' ? (
          <>
            <Section titre="Depuis le compte épargne"
              pied={comptesEpargne.length === 0 ? 'Aucun compte épargne actif.' : 'La dépense est enregistrée aujourd’hui sur ce compte.'}>
              {comptesEpargne.map((c) => (
                <Ligne key={c.id} icone="piggy-bank" couleurIcone={c.couleur} titre={c.nom} onPress={() => setCompteId(c.id)}
                  droite={c.id === compteId ? <Check color={t.accent} size={20} /> : undefined} />
              ))}
            </Section>
            <Texte variante="petit" style={{ marginHorizontal: 32, marginTop: 22, textTransform: 'uppercase' }}>Catégorie</Texte>
            <SelecteurCategorie nature="depense" valeur={categorieId} onChange={setCategorieId} />
          </>
        ) : null}

        {texte !== '' && erreur ? (
          <Texte variante="petit" couleur={t.erreur} style={{ marginHorizontal: 32, marginTop: 12 }}>{erreur}</Texte>
        ) : null}
      </ScrollView>
    </View>
  );
}
