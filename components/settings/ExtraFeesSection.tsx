import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Switch, Alert, ScrollView } from 'react-native';
import { DollarSign, Plus, Trash2, CircleCheck as CheckCircle, Info, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useCompanySettings } from '@/hooks/useCompanySettings';

// Type definitions for extra fees
interface ExtraFee {
  id: string;
  label: string;
  price: number;
  enabled: boolean;
  unit?: string; // Optional unit for fees like fuel (per liter)
}

interface CustomFee {
  id: string;
  label: string;
  price: number;
}

export default function ExtraFeesSection() {
  const { colors } = useTheme();
  const { companyInfo, updateCompanyInfo } = useCompanySettings();
  
  // Default predefined fees if none exist
  const defaultPredefinedFees: ExtraFee[] = [
    { id: '1', label: 'Carburant manquant', price: 3, enabled: true, unit: '/litre' },
    { id: '2', label: 'Retard (par tranche de 30min)', price: 25, enabled: true },
    { id: '3', label: 'Jante frottée', price: 150, enabled: true },
    { id: '4', label: 'Nettoyage', price: 80, enabled: true },
  ];

  // Initialize state with saved fees or defaults
  const [predefinedFees, setPredefinedFees] = useState<ExtraFee[]>(
    companyInfo.frais_supplementaires?.predefined || defaultPredefinedFees
  );
  
  const [customFees, setCustomFees] = useState<CustomFee[]>(
    companyInfo.frais_supplementaires?.custom || []
  );
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Update local state when companyInfo changes
  useEffect(() => {
    if (companyInfo.frais_supplementaires) {
      // Ensure the unit property is preserved for predefined fees
      const updatedPredefinedFees = (companyInfo.frais_supplementaires.predefined || []).map(fee => {
        // Make sure the carburant fee has the unit property
        if (fee.id === '1' && fee.label === 'Carburant manquant') {
          return { ...fee, unit: '/litre' };
        }
        return fee;
      });
      
      setPredefinedFees(updatedPredefinedFees.length ? updatedPredefinedFees : defaultPredefinedFees);
      setCustomFees(companyInfo.frais_supplementaires.custom || []);
      setHasUnsavedChanges(false);
    }
  }, [companyInfo]);

  // Update predefined fee price
  const updatePredefinedFeePrice = (id: string, price: number) => {
    const updatedFees = predefinedFees.map(fee => 
      fee.id === id ? { ...fee, price } : fee
    );
    setPredefinedFees(updatedFees);
    setHasUnsavedChanges(true);
  };

  // Toggle predefined fee enabled state
  const togglePredefinedFeeEnabled = (id: string) => {
    const updatedFees = predefinedFees.map(fee => 
      fee.id === id ? { ...fee, enabled: !fee.enabled } : fee
    );
    setPredefinedFees(updatedFees);
    setHasUnsavedChanges(true);
  };

  // Add new custom fee
  const addCustomFee = () => {
    const newFee: CustomFee = {
      id: Date.now().toString(),
      label: '',
      price: 0
    };
    setCustomFees([...customFees, newFee]);
    setHasUnsavedChanges(true);
  };

  // Update custom fee
  const updateCustomFee = (id: string, field: 'label' | 'price', value: string | number) => {
    const updatedFees = customFees.map(fee => 
      fee.id === id ? { ...fee, [field]: value } : fee
    );
    setCustomFees(updatedFees);
    setHasUnsavedChanges(true);
  };

  // Delete custom fee
  const deleteCustomFee = (id: string) => {
    const updatedFees = customFees.filter(fee => fee.id !== id);
    setCustomFees(updatedFees);
    setHasUnsavedChanges(true);
  };

  // Save all fees
  const saveFees = async () => {
    try {
      // Filter out custom fees with empty labels
      const validCustomFees = customFees.filter(fee => fee.label.trim() !== '');
      
      const feesData = {
        predefined: predefinedFees,
        custom: validCustomFees
      };
      
      await updateCompanyInfo({
        ...companyInfo,
        frais_supplementaires: feesData
      });
      
      setHasUnsavedChanges(false);
      Alert.alert('Succès', 'Les frais supplémentaires ont été sauvegardés.');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder les frais. Veuillez réessayer.');
    }
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.header}> 
        <View style={styles.titleContainer}>
          <Text style={{ fontSize: 24 }}>💰</Text>
          <Text style={styles.sectionTitle}>Frais supplémentaires</Text>
        </View>
        {hasUnsavedChanges && (
          <View style={styles.unsavedIndicator}>
            <Text style={styles.unsavedText}>Non sauvegardé</Text>
          </View>
        )}
      </View>

      <Text style={styles.description}>
        Configurez les frais supplémentaires qui peuvent être appliqués lors des locations.
        Ces frais apparaîtront dans les contrats et pourront être sélectionnés lors des états des lieux de retour.
      </Text>

      {/* Predefined Fees */}
      <View style={styles.feesSection}>
        <Text style={styles.subsectionTitle}>📋 Frais prédéfinis</Text>
        
        {predefinedFees.map((fee) => (
          <View key={fee.id} style={styles.feeItem}>
            <View style={styles.feeDetails}>
              <View style={styles.feeLabelContainer}>
                <Text style={styles.feeLabel}>{fee.label}</Text>
              </View>
              <View style={styles.priceInputContainer}>
                <TextInput
                  style={styles.priceInput}
                  value={fee.price.toString()}
                  onChangeText={(text) => updatePredefinedFeePrice(fee.id, parseFloat(text) || 0)}
                  keyboardType="numeric"
                  placeholder="0"
                />
                {fee.unit && (
                  <Text style={styles.feeUnit}>{fee.unit}</Text>
                )}
                <Text style={styles.currencySymbol}>€</Text>
              </View>
            </View>
            <Switch
              value={fee.enabled}
              onValueChange={() => togglePredefinedFeeEnabled(fee.id)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.background}
            />
          </View>
        ))}
        
        {/* Info about fuel fee */}
        <View style={styles.infoBox}>
          <Info size={16} color={colors.info} />
          <Text style={styles.infoText}>
            Le prix du carburant manquant est facturé par litre.
          </Text>
        </View>
      </View>

      {/* Custom Fees */}
      <View style={styles.feesSection}>
        <View style={styles.customFeesHeader}>
          <Text style={styles.subsectionTitle}>✏️ Frais personnalisés</Text>
        </View>
        
        {customFees.length === 0 ? (
          <Text style={styles.emptyText}>Aucun frais personnalisé ajouté</Text>
        ) : (
          customFees.map((fee) => (
            <View key={fee.id} style={styles.feeItem}>
              <View style={styles.feeDetails}>
                <View style={styles.feeLabelContainer}>
                  <TextInput
                    style={styles.customFeeLabel}
                    value={fee.label}
                    onChangeText={(text) => updateCustomFee(fee.id, 'label', text)}
                    placeholder="Nom du frais"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
                <View style={styles.priceInputContainer}>
                  <TextInput
                    style={styles.priceInput}
                    value={fee.price.toString()}
                    onChangeText={(text) => updateCustomFee(fee.id, 'price', parseFloat(text) || 0)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  <Text style={styles.currencySymbol}>€</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.deleteCustomFeeButton}
                onPress={() => deleteCustomFee(fee.id)}
              >
                <X size={16} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))
        )}
        
        <TouchableOpacity 
          style={styles.addCustomFeeButton}
          onPress={addCustomFee}
        >
          <Plus size={16} color={colors.primary} />
          <Text style={styles.addCustomFeeText}>Ajouter un frais personnalisé</Text>
        </TouchableOpacity>
      </View>

      {/* Save Button */}
      <TouchableOpacity 
        style={[
          styles.saveButton,
          !hasUnsavedChanges && styles.saveButtonDisabled
        ]} 
        onPress={saveFees}
        disabled={!hasUnsavedChanges}
      >
        <CheckCircle size={20} color={hasUnsavedChanges ? colors.background : colors.textSecondary} />
        <Text style={[
          styles.saveButtonText,
          !hasUnsavedChanges && styles.saveButtonTextDisabled
        ]}>
          Sauvegarder les frais
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.background, 
    borderRadius: 28,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center', 
    gap: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  unsavedIndicator: {
    backgroundColor: colors.warning + '20',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  unsavedText: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  feesSection: {
    marginBottom: 20,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  feeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '40',
  },
  feeDetails: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 12,
  },
  feeLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, 
    marginRight: 8,
  },
  feeLabel: {
    fontSize: 14,
    color: colors.text, 
    fontWeight: '500',
  },
  feeUnit: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface, 
    borderRadius: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border + '60',
  },
  priceInput: {
    width: 60,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
    textAlign: 'right',
  },
  currencySymbol: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.info + '15',
    borderRadius: 28,
    padding: 14,
    marginTop: 16,
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    color: colors.info,
    flex: 1,
  },
  customFeesHeader: {
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  customFeeLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  deleteCustomFeeButton: {
    padding: 8,
  },
  addCustomFeeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', 
    paddingVertical: 14,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border + '40',
    gap: 8,
  },
  addCustomFeeText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: colors.primary + '50',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },
  saveButtonTextDisabled: {
    color: colors.textSecondary,
  },
});