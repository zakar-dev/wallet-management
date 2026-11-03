import { TextInput, View } from 'react-native';
import { Search } from 'lucide-react-native';
import { POLICE, useTheme } from './theme';

export function Recherche({ valeur, onChange }: { valeur: string; onChange: (v: string) => void }) {
  const t = useTheme();
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 16, marginTop: 12,
      paddingHorizontal: 10, borderRadius: 10, backgroundColor: t.carte2,
    }}>
      <Search color={t.texte2} size={17} />
      <TextInput
        value={valeur}
        onChangeText={onChange}
        placeholder="Rechercher"
        placeholderTextColor={t.texte2}
        style={{ flex: 1, fontSize: 17, paddingVertical: 8, color: t.texte, fontFamily: POLICE, outlineStyle: 'none' } as object}
      />
    </View>
  );
}
