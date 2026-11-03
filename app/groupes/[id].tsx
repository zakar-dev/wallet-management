import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { erreurGroupe, prochainOrdre } from '@/src/domaine/categories';
import { nouvelId } from '@/src/domaine/id';
import type { Groupe, Nature } from '@/src/domaine/types';
import { useDonnees } from '@/src/stockage/DonneesProvider';
import { BoutonSupprimer } from '@/src/ui/BoutonSupprimer';
import { Champ } from '@/src/ui/Champ';
import { EnTeteFeuille } from '@/src/ui/Ecran';
import { Section } from '@/src/ui/Liste';
import { retour } from '@/src/ui/navigation';
import { Segment } from '@/src/ui/Segment';
import { useTheme } from '@/src/ui/theme';

const NATURES: { valeur: Nature; libelle: string }[] = [
  { valeur: 'revenu', libelle: 'Revenus' },
  { valeur: 'depense', libelle: 'Dépenses' },
];

export default function FormulaireGroupe() {
  const t = useTheme();
  const { id, nature: natureParam } = useLocalSearchParams<{ id: string; nature?: Nature }>();
  const { donnees, enregistrer, supprimer } = useDonnees();
  const existant = donnees.groupes.find((g) => g.id === id);
  const vide = !existant || !donnees.categories.some((c) => c.groupeId === existant.id);

  const [nom, setNom] = useState(existant?.nom ?? '');
  const [nature, setNature] = useState<Nature>(existant?.nature ?? natureParam ?? 'depense');
  const erreur = erreurGroupe({ nom });

  async function valider() {
    if (erreur) return;
    const g: Groupe = {
      id: existant?.id ?? nouvelId(), nom: nom.trim(), nature,
      ordre: existant?.ordre ?? prochainOrdre(donnees.groupes),
    };
    await enregistrer('groupes', g);
    retour('/categories');
  }

  async function effacer() {
    if (!existant) return;
    await supprimer('groupes', existant.id);
    retour('/categories');
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.fond }}>
      <EnTeteFeuille
        titre={existant ? 'Modifier le groupe' : 'Nouveau groupe'}
        onGauche={() => retour('/categories')}
        droite="OK"
        droiteActive={!erreur}
        onDroite={valider}
      />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
        <Section>
          <Champ placeholder="Nom du groupe" value={nom} onChangeText={setNom} autoFocus={!existant} />
        </Section>
        <Section titre="Nature" pied={vide ? undefined : 'La nature ne change pas tant que le groupe contient des catégories.'}>
          {null}
        </Section>
        <Segment options={NATURES} valeur={nature} onChange={setNature} desactive={!vide} />
        {existant && vide && <BoutonSupprimer libelle="Supprimer le groupe" onConfirmer={effacer} />}
      </ScrollView>
    </View>
  );
}
