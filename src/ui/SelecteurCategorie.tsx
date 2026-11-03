import { useState } from 'react';
import { View } from 'react-native';
import { Check, Star } from 'lucide-react-native';
import { categoriesParGroupe, rechercherCategories } from '@/src/domaine/categories';
import type { Categorie, Nature } from '@/src/domaine/types';
import { useDonnees } from '@/src/stockage/DonneesProvider';
import { Ligne, Section } from './Liste';
import { Recherche } from './Recherche';
import { useTheme } from './theme';

interface Props {
  nature: Nature;
  valeur?: string;
  onChange: (id: string) => void;
}

/** Recherche + liste groupée des catégories d'une nature (revenu ou dépense). */
export function SelecteurCategorie({ nature, valeur, onChange }: Props) {
  const t = useTheme();
  const { donnees } = useDonnees();
  const [texte, setTexte] = useState('');
  const groupes = categoriesParGroupe(donnees.groupes, donnees.categories, nature);

  const ligne = (c: Categorie) => (
    <Ligne
      key={c.id}
      icone={c.icone}
      couleurIcone={c.couleur}
      titre={c.nom}
      onPress={() => onChange(c.id)}
      droite={
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {c.favori && <Star color={t.alerte} fill={t.alerte} size={16} />}
          {c.id === valeur && <Check color={t.accent} size={20} />}
        </View>
      }
    />
  );

  const resultats = texte.trim()
    ? rechercherCategories(groupes.flatMap((g) => g.categories), texte)
    : null;

  return (
    <View>
      <Recherche valeur={texte} onChange={setTexte} />
      {resultats ? (
        <Section pied={resultats.length === 0 ? 'Aucune catégorie' : undefined}>{resultats.map(ligne)}</Section>
      ) : (
        groupes.map((g) => (
          <Section key={g.groupe.id} titre={g.groupe.nom}>{g.categories.map(ligne)}</Section>
        ))
      )}
    </View>
  );
}
