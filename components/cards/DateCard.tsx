import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, Calendar } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface DateCardProps {
  date: string; // format: '12/07/2025'
  heure: string; // format: '04:14'
  subtitle?: string;
  modifiable?: boolean;
  onPressEdit?: () => void;
  iconType?: 'clock' | 'calendar';
}

export default function DateCard({
  date,
  heure,
  subtitle = 'Date et heure automatiquement renseignées (modifiables)',
  modifiable = false,
  onPressEdit,
  iconType = 'clock',
}: DateCardProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconContainer}>
          {iconType === 'clock' ? (
            <Clock size={24} color={colors.primary} />
          ) : (
            <Calendar size={24} color={colors.primary} />
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.dateText}>{date} à {heure}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {modifiable && (
          <TouchableOpacity style={styles.editButton} onPress={onPressEdit}>
            <Text style={styles.editButtonText}>Modifier</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  editButton: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  editButtonText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
}); 