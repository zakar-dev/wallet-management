import { retour } from '@/src/ui/navigation';
import { View } from 'react-native';
import { EnTeteFeuille } from '@/src/ui/Ecran';
import { useTheme } from '@/src/ui/theme';

export default function Ajout() {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.fond }}>
      <EnTeteFeuille titre="Nouvelle opération" onGauche={() => retour()} />
    </View>
  );
}
