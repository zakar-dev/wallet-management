import { Pressable, View } from 'react-native';
import { ICONES_CATEGORIES } from '@/src/domaine/categories';
import { iconeDe } from './icones';
import { useTheme } from './theme';

interface Props {
  valeur: string;
  couleur: string;
  onChange: (nom: string) => void;
}

/** Grille de choix d'icône Lucide ; l'icône choisie prend la couleur donnée. */
export function GrilleIcones({ valeur, couleur, onChange }: Props) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 14 }}>
      {ICONES_CATEGORIES.map((nom) => {
        const Icone = iconeDe(nom);
        const choisie = nom === valeur;
        return (
          <Pressable key={nom} accessibilityLabel={`Icône ${nom}`} onPress={() => onChange(nom)}
            style={{
              width: 44, height: 44, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
              backgroundColor: choisie ? couleur : t.carte2,
            }}>
            <Icone color={choisie ? '#ffffff' : t.texte} size={22} />
          </Pressable>
        );
      })}
    </View>
  );
}
