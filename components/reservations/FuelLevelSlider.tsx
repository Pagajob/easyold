import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Fuel } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface FuelLevelSliderProps {
  value: number;
  onChange?: (value: number) => void;
  onValueChange?: (value: number) => void;
  maxLevel?: number;
}

export default function FuelLevelSlider({
  value,
  onChange,
  onValueChange,
  maxLevel = 8,
}: FuelLevelSliderProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const handleChange = onValueChange || onChange;

  return (
    <View style={styles.container}>
      <View style={styles.iconsRow}>
        <Fuel size={18} color={colors.textSecondary} />
        <View style={styles.sliderContainer}>
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={0}
            maximumValue={maxLevel}
            step={1}
            value={value}
            onValueChange={handleChange}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
        </View>
        <Fuel size={18} color={colors.text} />
      </View>

      <View style={styles.labelRow}>
        <Text style={styles.label}>Vide</Text>
        <Text style={styles.valueLabel}>Niveau : {value}/{maxLevel}</Text>
        <Text style={styles.label}>Plein</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      marginVertical: 16,
      paddingHorizontal: 8,
    },
    iconsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sliderContainer: {
      flex: 1,
      marginHorizontal: 12,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
      paddingHorizontal: 4,
    },
    label: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    valueLabel: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.primary,
    },
  });
