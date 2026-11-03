import { TextInput, View, type TextInputProps } from 'react-native';
import { Texte } from './Texte';
import { CHIFFRES, POLICE, useTheme } from './theme';

interface Props extends TextInputProps {
  etiquette?: string;
  chiffres?: boolean;
}

/** Ligne de liste groupée contenant un champ de saisie. */
export function Champ({ etiquette, chiffres, style, ...reste }: Props) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44, paddingHorizontal: 16, gap: 12 }}>
      {etiquette && <Texte style={{ minWidth: 110 }}>{etiquette}</Texte>}
      <TextInput
        placeholderTextColor={t.texte2}
        {...reste}
        style={[
          { flex: 1, fontSize: 17, color: t.texte, fontFamily: POLICE, paddingVertical: 10,
            textAlign: etiquette ? 'right' : 'left', outlineStyle: 'none' } as object,
          chiffres && CHIFFRES,
          style,
        ]}
      />
    </View>
  );
}
