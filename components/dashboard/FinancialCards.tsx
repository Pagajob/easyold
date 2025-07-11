import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DollarSign, TrendingUp, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface FinancialCardsProps {
  monthlyRevenue: number;
  monthlyCharges: number;
  ownerPayments: number;
  netProfit: number;
}

export default function FinancialCards({ monthlyRevenue, monthlyCharges, ownerPayments, netProfit }: FinancialCardsProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={[styles.financialCard, { backgroundColor: colors.success + '20' }]}>
        <Text style={{ fontSize: 24, marginBottom: 4 }}>💰</Text>
        <Text style={styles.financialLabel}>Revenus du mois</Text>
        <Text style={[styles.financialValue, { color: colors.success }]}>
          {monthlyRevenue.toLocaleString('fr-FR')} €
        </Text>
      </View>
 
      <View style={[styles.financialCard, { backgroundColor: colors.error + '20' }]}>
        <Text style={{ fontSize: 24, marginBottom: 4 }}>📉</Text>
        <Text style={styles.financialLabel}>Charges du mois</Text>
        <Text style={[styles.financialValue, { color: colors.error }]}>
          {monthlyCharges.toLocaleString('fr-FR')} €
        </Text>
      </View>

      <View style={[styles.financialCard, { backgroundColor: colors.warning + '20' }]}>
        <Text style={{ fontSize: 24, marginBottom: 4 }}>🤝</Text>
        <Text style={styles.financialLabel}>Reversé aux propriétaires</Text>
        <Text style={[styles.financialValue, { color: colors.warning }]}>
          {ownerPayments.toLocaleString('fr-FR')} €
        </Text>
      </View>

      <View style={[styles.financialCard, { backgroundColor: colors.primary + '20' }]}>
        <Text style={{ fontSize: 24, marginBottom: 4 }}>📈</Text>
        <Text style={styles.financialLabel}>Bénéfice du mois</Text>
        <Text style={[styles.financialValue, { color: netProfit >= 0 ? colors.success : colors.error }]}>
          {netProfit.toLocaleString('fr-FR')} €
        </Text>
      </View>
    </View>
  ); 
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  financialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 28,
    gap: 12,
  },
  financialLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.text, 
    fontWeight: '600',
  },
  financialValue: {
    fontSize: 18,
    fontWeight: '700',
  },
});