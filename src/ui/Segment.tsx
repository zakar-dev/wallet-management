import { Pressable, View } from 'react-native';
import { Texte } from './Texte';
import { useTheme } from './theme';

export interface Option<T> { valeur: T; libelle: string }

interface Props<T> {
  options: Option<T>[];
  valeur: T;
  onChange: (v: T) => void;
  desactive?: boolean;
}

export function Segment<T extends string>({ options, valeur, onChange, desactive }: Props<T>) {
  const t = useTheme();
  return (
    <View style={{
      flexDirection: 'row', backgroundColor: t.carte2, borderRadius: 9, padding: 2,
      marginHorizontal: 16, opacity: desactive ? 0.5 : 1,
    }}>
      {options.map((o) => {
        const actif = o.valeur === valeur;
        return (
          <Pressable
            key={o.valeur}
            disabled={desactive}
            onPress={() => onChange(o.valeur)}
            style={{
              flex: 1, paddingVertical: 6, borderRadius: 7, alignItems: 'center',
              backgroundColor: actif ? t.segmentActif : 'transparent',
            }}
          >
            <Texte variante="petit" couleur={t.texte} style={{ fontWeight: actif ? '600' : '500' }}>
              {o.libelle}
            </Texte>
          </Pressable>
        );
      })}
    </View>
  );
}
