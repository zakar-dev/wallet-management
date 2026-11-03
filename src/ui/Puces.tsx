import { Pressable, ScrollView } from 'react-native';
import { Texte } from './Texte';
import { useTheme } from './theme';

export interface Puce<T> { valeur: T; libelle: string }

interface Props<T> {
  options: Puce<T>[];
  valeur?: T;
  /** Re-toucher la puce active la désélectionne. */
  onChange: (v: T | undefined) => void;
}

export function Puces<T extends string>({ options, valeur, onChange }: Props<T>) {
  const t = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }} style={{ marginTop: 10, flexGrow: 0 }}>
      {options.map((o) => {
        const actif = o.valeur === valeur;
        return (
          <Pressable key={o.valeur} onPress={() => onChange(actif ? undefined : o.valeur)}
            style={{
              paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
              backgroundColor: actif ? t.accent : t.carte,
            }}>
            <Texte variante="petit" couleur={actif ? '#ffffff' : t.texte}>{o.libelle}</Texte>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
