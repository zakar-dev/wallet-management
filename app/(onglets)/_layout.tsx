import { Platform, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { ChartPie, Ellipsis, House, List, Plus } from 'lucide-react-native';
import { POLICE, useTheme } from '@/src/ui/theme';

export default function Onglets() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.texte2,
        tabBarLabelStyle: { fontFamily: POLICE, fontSize: 10, fontWeight: '500' },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: t.barre,
          borderTopColor: t.separateur,
          borderTopWidth: 0.5,
          ...(Platform.OS === 'web' ? { backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } : {}),
        } as object,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: ({ color }) => <House color={color} size={24} /> }} />
      <Tabs.Screen name="operations" options={{ title: 'Opérations', tabBarIcon: ({ color }) => <List color={color} size={24} /> }} />
      <Tabs.Screen
        name="ajouter"
        options={{
          title: '',
          tabBarAccessibilityLabel: 'Ajouter une opération',
          tabBarButton: () => (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ajouter une opération"
                onPress={() => router.push('/ajout')}
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}
              >
                <Plus color="#ffffff" size={26} strokeWidth={2.5} />
              </Pressable>
            </View>
          ),
        }}
      />
      <Tabs.Screen name="budget" options={{ title: 'Budget', tabBarIcon: ({ color }) => <ChartPie color={color} size={24} /> }} />
      <Tabs.Screen name="plus" options={{ title: 'Plus', tabBarIcon: ({ color }) => <Ellipsis color={color} size={24} /> }} />
    </Tabs>
  );
}
