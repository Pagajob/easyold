import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Car, Users, Calendar } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { router } from 'expo-router';

interface StatsCardsProps {
  vehiclesCount: number;
  clientsCount: number;
  activeReservationsCount: number;
}

export default function StatsCards({ vehiclesCount, clientsCount, activeReservationsCount }: StatsCardsProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.statCard}
        onPress={() => router.push('/vehicles')}
        activeOpacity={0.7}
      >
        <View style={styles.statIcon}>
          <Car size={22} color={colors.primary} /> 
        </View>
        <Text style={styles.statValue}>{vehiclesCount}</Text>
        <Text style={styles.statLabel}>Véhicules</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.statCard}
        onPress={() => router.push('/clients')}
        activeOpacity={0.7}
      >
        <View style={styles.statIcon}>
          <Users size={22} color={colors.accent} />
        </View>
        <Text style={styles.statValue}>{clientsCount}</Text>
        <Text style={styles.statLabel}>Clients</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.statCard}
        onPress={() => router.push('/reservations')}
        activeOpacity={0.7}
      >
        <View style={styles.statIcon}>
          <Calendar size={22} color={colors.warning} />
        </View>
        <Text style={styles.statValue}>{activeReservationsCount}</Text>
        <Text style={styles.statLabel}>Locations en cours</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 14,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    minHeight: 120,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 28,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});