import { Text, type TextProps, type TextStyle } from 'react-native';
import { CHIFFRES, POLICE, useTheme } from './theme';

export type Variante = 'grandTitre' | 'titre' | 'corps' | 'secondaire' | 'petit' | 'montant';

const STYLES: Record<Variante, TextStyle> = {
  grandTitre: { fontSize: 34, fontWeight: '700', letterSpacing: 0.4 },
  titre: { fontSize: 17, fontWeight: '600' },
  corps: { fontSize: 17 },
  secondaire: { fontSize: 15 },
  petit: { fontSize: 13 },
  montant: { fontSize: 17, ...CHIFFRES },
};

interface Props extends TextProps {
  variante?: Variante;
  couleur?: string;
  chiffres?: boolean;
}

export function Texte({ variante = 'corps', couleur, chiffres, style, ...reste }: Props) {
  const t = useTheme();
  const defaut = variante === 'secondaire' || variante === 'petit' ? t.texte2 : t.texte;
  return (
    <Text
      {...reste}
      style={[{ fontFamily: POLICE, color: couleur ?? defaut }, STYLES[variante], chiffres && CHIFFRES, style]}
    />
  );
}
