import { Pressable, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { ajouterMois, libelleMois, type Mois } from '@/src/domaine/dates';
import { Texte } from './Texte';
import { useTheme } from './theme';

/** ‹ Novembre 2026 › */
export function SelecteurMois({ mois, onChange }: { mois: Mois; onChange: (m: Mois) => void }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 12 }}>
      <Pressable accessibilityLabel="Mois précédent" hitSlop={12} onPress={() => onChange(ajouterMois(mois, -1))}>
        <ChevronLeft color={t.accent} size={26} />
      </Pressable>
      <Texte variante="titre">{libelleMois(mois)}</Texte>
      <Pressable accessibilityLabel="Mois suivant" hitSlop={12} onPress={() => onChange(ajouterMois(mois, 1))}>
        <ChevronRight color={t.accent} size={26} />
      </Pressable>
    </View>
  );
}
