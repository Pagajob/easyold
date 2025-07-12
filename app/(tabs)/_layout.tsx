import { Tabs } from 'expo-router';
import { Car, Users, Calendar, ChartBar as BarChart3, Settings } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { colors } = useTheme();
  const isIOS = Platform.OS === 'ios';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <StatusBar barStyle={colors.background === '#FFFFFF' ? 'dark-content' : 'light-content'} />
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: isIOS ? colors.border + '80' : colors.border,
          height: isIOS ? 85 : 60,
          paddingTop: isIOS ? 10 : 0,
          paddingBottom: isIOS ? 30 : 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarIconStyle: {
          marginBottom: -4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tableau de bord',
          tabBarIcon: ({ size, color }) => (
            <BarChart3 size={isIOS ? 22 : size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{
          title: 'Véhicules',
          tabBarIcon: ({ size, color }) => (
            <Car size={isIOS ? 22 : size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clients',
          tabBarIcon: ({ size, color }) => (
            <Users size={isIOS ? 22 : size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reservations"
        options={{
          title: 'Réservations',
          tabBarIcon: ({ size, color }) => (
            <Calendar size={isIOS ? 22 : size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Paramètres',
          tabBarIcon: ({ size, color }) => (
            <Settings size={isIOS ? 22 : size} color={color} />
          ),
        }}
      />
    </Tabs>
    </SafeAreaView>
  );
}