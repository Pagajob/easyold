import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { X, Save, Fuel, MapPin, Calculator } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import FuelLevelSlider from '@/components/reservations/FuelLevelSlider';
import { useData, Reservation, Vehicle } from '@/contexts/DataContext';

interface EDLRetourModalProps {
  visible: boolean;
  reservation: Reservation | null;
  vehicle: Vehicle | null;
  onClose: () => void;
  onSave: (data: EDLRetourData) => void;
}

interface EDLRetourData {
  kmRetour: number;
  carburantRetour: number;
  fraisKmSupp: number;
  totalFraisRetour: number;
}

export default function EDLRetourModal({ 
  visible, 
  reservation, 
  vehicle, 
  onClose, 
  onSave 
}: EDLRetourModalProps) {
  const { colors } = useTheme();
  const [kmRetour, setKmRetour] = useState('');
  const [carburantRetour, setCarburantRetour] = useState(4); // Default to 4/5 (80%)
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get the correct departure mileage from the EDL
  const getKmDepart = () => {
    if (!reservation || !reservation.edlDepart) return 0;
    
    // First check if we have the kmDepart field directly
    if (reservation.edlDepart.kmDepart !== undefined) {
      return reservation.edlDepart.kmDepart;
    }
    
    // If we have a compteur string, try to extract a number
    if (typeof reservation.edlDepart.compteur === 'string') {
      const kmString = reservation.edlDepart.compteur.replace(/\D/g, '');
      return kmString ? parseInt(kmString) : 0;
    }
    
    return 0;
  };
  
  const kmDepart = getKmDepart();
  
  if (!reservation || !vehicle) return null;

  const calculateExtraFees = () => {
    const kmRetourNum = parseInt(kmRetour) || 0;
    const kmDriven = kmRetourNum - kmDepart;
    
    // Calculate duration in days
    const startDate = new Date(reservation.dateDebut);
    const endDate = new Date(reservation.dateRetourPrevue);
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24)) || 1;
    
    const kmInclus = vehicle.kilometrageJournalier * durationDays;
    const kmExcess = Math.max(0, kmDriven - kmInclus);
    const prixKmSupp = vehicle.prixKmSupplementaire || 0;
    const fraisKmSupp = kmExcess * prixKmSupp;

    return {
      kmDriven,
      kmInclus,
      kmExcess,
      fraisKmSupp,
      durationDays
    };
  };

  const handleSubmit = () => {
    if (!kmRetour) {
      Alert.alert('Erreur', 'Veuillez saisir le kilométrage de retour');
      return;
    }

    const kmRetourNum = parseInt(kmRetour);
    if (kmRetourNum < kmDepart) {
      Alert.alert('Erreur', 'Le kilométrage de retour ne peut pas être inférieur au kilométrage de départ');
      return;
    }

    const calculations = calculateExtraFees();
    
    if (calculations.kmExcess > 0) {
      Alert.alert(
        'Dépassement de kilométrage',
        `Attention : dépassement de kilométrage de ${calculations.kmExcess} km\n\nFrais supplémentaires : ${calculations.fraisKmSupp.toFixed(2)} €`,
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Continuer', 
            onPress: () => submitEDL(calculations)
          }
        ]
      );
    } else {
      submitEDL(calculations);
    }
  };

  const submitEDL = (calculations: any) => {
    setIsSubmitting(true);

    const edlData: EDLRetourData = {
      kmRetour: parseInt(kmRetour),
      carburantRetour,
      fraisKmSupp: calculations.fraisKmSupp,
      totalFraisRetour: calculations.fraisKmSupp // Will be updated with manual fees later
    };

    onSave(edlData);
    setIsSubmitting(false);
    onClose();
    
    // Reset form
    setKmRetour('');
    setCarburantRetour(4);
  };

  const calculations = kmRetour ? calculateExtraFees() : null;
  const styles = createStyles(colors);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>📝 État des lieux de retour</Text>
          <TouchableOpacity 
            onPress={handleSubmit} 
            style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
            disabled={isSubmitting}
          >
            <Save size={24} color={colors.background} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Informations de référence */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations de départ</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <MapPin size={16} color={colors.primary} />
                <Text style={styles.infoLabel}>Kilométrage de départ:</Text>
                <Text style={styles.infoValue}>{kmDepart.toLocaleString()} km</Text>
              </View>
              {kmDepart === 0 && (
                <View style={styles.warningRow}>
                  <Text style={styles.warningText}>
                    Attention: Le kilométrage de départ n'a pas été enregistré correctement lors de l'état des lieux de départ.
                  </Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Fuel size={16} color={colors.primary} />
                <Text style={styles.infoLabel}>Carburant de départ:</Text>
                <Text style={styles.infoValue}>{reservation.edlDepart?.carburant || 0}/8</Text>
              </View>
              <View style={styles.infoRow}>
                <Calculator size={16} color={colors.primary} />
                <Text style={styles.infoLabel}>Kilométrage inclus:</Text>
                <Text style={styles.infoValue}>
                  {calculations ? calculations.kmInclus.toLocaleString() : 0} km
                </Text>
              </View>
            </View>
          </View>

          {/* Saisie kilométrage retour */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kilométrage de retour</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kilométrage actuel *</Text>
              <TextInput
                style={styles.input}
                value={kmRetour}
                onChangeText={setKmRetour}
                placeholder={`Minimum: ${kmDepart.toLocaleString()} km`}
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
              <Text style={styles.helpText}>
                Saisissez le kilométrage affiché au compteur du véhicule
              </Text>
            </View>
          </View>

          {/* Niveau de carburant */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Niveau de carburant</Text>
            <FuelLevelSlider 
              value={carburantRetour} 
              onValueChange={setCarburantRetour}
              maxLevel={8}
            />
          </View>

          {/* Calculs automatiques */}
          {calculations && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Calculs automatiques</Text>
              <View style={styles.calculationsCard}>
                <View style={styles.calculationRow}>
                  <Text style={styles.calculationLabel}>Distance parcourue:</Text>
                  <Text style={styles.calculationValue}>
                    {calculations.kmDriven.toLocaleString()} km
                  </Text>
                </View>
                <View style={styles.calculationRow}>
                  <Text style={styles.calculationLabel}>Kilométrage inclus:</Text>
                  <Text style={styles.calculationValue}>
                    {calculations.kmInclus.toLocaleString()} km
                  </Text>
                </View>
                <View style={styles.calculationRow}>
                  <Text style={styles.calculationLabel}>⚠️  Dépassement:</Text>
                  <Text style={[
                    styles.calculationValue,
                    calculations.kmExcess > 0 ? { color: colors.warning } : { color: colors.success }
                  ]}>
                    {calculations.kmExcess > 0 ? `+${calculations.kmExcess} km` : 'Aucun'}
                  </Text>
                </View>
                {calculations.kmExcess > 0 && (
                  <View style={styles.calculationRow}>
                    <Text style={styles.calculationLabel}>
                      Frais km supplémentaire ({vehicle.prixKmSupplementaire}€/km):
                    </Text>
                    <Text style={[styles.calculationValue, { color: colors.error, fontWeight: 'bold' }]}>
                      {calculations.fraisKmSupp.toFixed(2)} €
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Résumé */}
          {calculations && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Résumé</Text>
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Durée de location:</Text>
                  <Text style={styles.summaryValue}>{calculations.durationDays} jour(s)</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Kilométrage utilisé:</Text>
                  <Text style={styles.summaryValue}>
                    {calculations.kmDriven} / {calculations.kmInclus} km
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Carburant retour:</Text>
                  <Text style={styles.summaryValue}>{carburantRetour}/8</Text>
                </View>
                <View style={[styles.summaryRow, styles.summaryTotal]}>
                  <Text style={styles.summaryTotalLabel}>Frais supplémentaires:</Text>
                  <Text style={styles.summaryTotalValue}>
                    {calculations.fraisKmSupp.toFixed(2)} €
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.submitButton,
              (!kmRetour || parseInt(kmRetour) < kmDepart || isSubmitting) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!kmRetour || parseInt(kmRetour) < kmDepart || isSubmitting}
          >
            <Save size={20} color={colors.background} />
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Enregistrement...' : 'Finaliser l\'état des lieux'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.border,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  warningRow: {
    backgroundColor: colors.warning + '20',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 12,
    color: colors.warning,
    fontStyle: 'italic',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 28,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  helpText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  calculationsCard: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 16,
    gap: 12,
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calculationLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  calculationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  summaryCard: {
    backgroundColor: colors.primary + '10',
    borderRadius: 28,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  summaryTotal: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.primary + '30',
  },
  summaryTotalLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  submitButton: {
    flex: 2,
    backgroundColor: colors.success,
    borderRadius: 28,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: colors.border,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
});