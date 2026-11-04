import { useState } from 'react';
import { ScrollView, Switch, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Check } from 'lucide-react-native';
import { categorieUtilisee, COULEURS, erreurCategorie, groupesTries } from '@/src/domaine/categories';
import { nouvelId } from '@/src/domaine/id';
import type { Categorie } from '@/src/domaine/types';
import { useDonnees } from '@/src/stockage/DonneesProvider';
import { BoutonSupprimer } from '@/src/ui/BoutonSupprimer';
import { Champ } from '@/src/ui/Champ';
import { EnTeteFeuille } from '@/src/ui/Ecran';
import { IconeCarree } from '@/src/ui/IconeCarree';
import { GrilleIcones } from '@/src/ui/GrilleIcones';
import { Ligne, Section } from '@/src/ui/Liste';
import { retour } from '@/src/ui/navigation';
import { Nuancier } from '@/src/ui/Nuancier';
import { Texte } from '@/src/ui/Texte';
import { useTheme } from '@/src/ui/theme';

export default function FormulaireCategorie() {
  const t = useTheme();
  const { id, groupeId: groupeParam } = useLocalSearchParams<{ id: string; groupeId?: string }>();
  const { donnees, enregistrer, supprimer } = useDonnees();
  const existante = donnees.categories.find((c) => c.id === id);
  const groupes = groupesTries(donnees.groupes);

  const [nom, setNom] = useState(existante?.nom ?? '');
  const [groupeId, setGroupeId] = useState(existante?.groupeId ?? groupeParam ?? '');
  const [icone, setIcone] = useState(existante?.icone ?? 'tag');
  const [couleur, setCouleur] = useState(existante?.couleur ?? COULEURS[5]);
  const [favori, setFavori] = useState(existante?.favori ?? false);
  const erreur = erreurCategorie({ nom, groupeId });

  async function valider() {
    if (erreur) return;
    const c: Categorie = { id: existante?.id ?? nouvelId(), nom: nom.trim(), groupeId, icone, couleur, favori };
    await enregistrer('categories', c);
    retour('/categories');
  }

  async function effacer() {
    if (!existante) return;
    await supprimer('categories', existante.id);
    retour('/categories');
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.fond }}>
      <EnTeteFeuille
        titre={existante ? 'Modifier' : 'Nouvelle catégorie'}
        onGauche={() => retour('/categories')}
        droite="OK"
        droiteActive={!erreur}
        onDroite={valider}
      />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ alignItems: 'center', marginTop: 12 }}>
          <IconeCarree nom={icone} couleur={couleur} taille={64} />
        </View>
        <Section>
          <Champ placeholder="Nom" value={nom} onChangeText={setNom} autoFocus={!existante} />
          <Ligne titre="Favori" droite={<Switch value={favori} onValueChange={setFavori} />} />
        </Section>
        {nom.length > 0 && erreur && (
          <Texte variante="petit" couleur={t.erreur} style={{ marginHorizontal: 32, marginTop: 8 }}>{erreur}</Texte>
        )}
        <Section titre="Groupe">
          {groupes.map((g) => (
            <Ligne key={g.id} titre={g.nom} sousTitre={g.nature === 'revenu' ? 'Revenus' : 'Dépenses'}
              onPress={() => setGroupeId(g.id)}
              droite={g.id === groupeId ? <Check color={t.accent} size={20} /> : undefined} />
          ))}
        </Section>
        <Section titre="Couleur">
          <Nuancier valeur={couleur} onChange={setCouleur} />
        </Section>
        <Section titre="Icône">
          <GrilleIcones valeur={icone} couleur={couleur} onChange={setIcone} />
        </Section>
        {existante && (categorieUtilisee(existante.id, donnees.operations) ? (
          <Section pied="Catégorie utilisée par des opérations.">{null}</Section>
        ) : (
          <BoutonSupprimer libelle="Supprimer la catégorie" onConfirmer={effacer} />
        ))}
      </ScrollView>
    </View>
  );
}
