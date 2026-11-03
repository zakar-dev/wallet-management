import { View } from 'react-native';
import { iconeDe } from './icones';

export function IconeCarree({ nom, couleur, taille = 28 }: { nom: string; couleur: string; taille?: number }) {
  const Icone = iconeDe(nom);
  return (
    <View style={{
      width: taille, height: taille, borderRadius: taille / 4, backgroundColor: couleur,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Icone color="#ffffff" size={taille * 0.6} strokeWidth={2.2} />
    </View>
  );
}
