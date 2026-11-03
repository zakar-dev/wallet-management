import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DonneesProvider } from '@/src/stockage/DonneesProvider';
import { useTheme } from '@/src/ui/theme';

export default function Racine() {
  const t = useTheme();
  return (
    <SafeAreaProvider>
      <DonneesProvider>
        <StatusBar style={t.sombre ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.fond } }}>
          <Stack.Screen name="(onglets)" />
          <Stack.Screen name="ajout" options={{ presentation: 'modal' }} />
        </Stack>
      </DonneesProvider>
    </SafeAreaProvider>
  );
}
