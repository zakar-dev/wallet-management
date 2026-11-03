import { Pressable, View } from 'react-native';
import { COULEURS } from '@/src/domaine/categories';
import { useTheme } from './theme';

export function Nuancier({ valeur, onChange }: { valeur: string; onChange: (c: string) => void }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 16 }}>
      {COULEURS.map((c) => (
        <Pressable key={c} accessibilityLabel={`Couleur ${c}`} onPress={() => onChange(c)}
          style={{
            width: 34, height: 34, borderRadius: 17, backgroundColor: c,
            borderWidth: 3, borderColor: c === valeur ? t.texte : 'transparent',
          }} />
      ))}
    </View>
  );
}
