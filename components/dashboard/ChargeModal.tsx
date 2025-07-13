import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { Calendar, Clock } from 'lucide-react-native';
import { useCharges } from '@/hooks/useCharges';
import { useVehicles } from '@/hooks/useVehicles';
import { Charge } from '@/contexts/DataContext';
import CalendarPicker from '@/components/CalendarPicker';

interface ChargeModalProps {
  visible: boolean;
  charge: Charge | null;
  onClose: () => void;
}

export default function ChargeModal({ visible, charge, onClose }: ChargeModalProps) {
  const { colors } = useTheme();
  const { addCharge, updateCharge } = useCharges();
  const { vehicles } = useVehicles();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    montantMensuel: 0,
    type: 'Fixe' as 'Fixe' | 'Variable',
    dateDebut: '',
    frequence: 'Mensuelle' as 'Mensuelle' | 'Trimestrielle' | 'Annuelle',
    vehiculeId: null as string | null,
    estPaiementProprietaire: false,
  });

  useEffect(() => {
    if (charge) {
      setFormData({
        nom: charge.nom,
        montantMensuel: charge.montantMensuel,
        type: charge.type,
        dateDebut: charge.dateDebut,
        frequence: charge.frequence,
        vehiculeId: charge.vehiculeId || null,
        estPaiementProprietaire: charge.estPaiementProprietaire || false,
      });
    } else {
      setFormData({
        nom: '',
        montantMensuel: 0,
        type: 'Fixe',
        dateDebut: '',
        frequence: 'Mensuelle',
        vehiculeId: null,
        estPaiementProprietaire: false,
      });
    }
  }, [charge, visible]);

  const handleSubmit = async () => {
    if (!formData.nom || formData.montantMensuel <= 0) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setIsSubmitting(true);

    try {
      const chargeData: Omit<Charge, 'id'> = {
        nom: formData.nom,
        montantMensuel: formData.montantMensuel,
        type: formData.type,
        dateDebut: formData.dateDebut || new Date().toISOString().split('T')[0],
        frequence: formData.frequence,
        vehiculeId: formData.vehiculeId || null,
        estPaiementProprietaire: formData.estPaiementProprietaire,
      };

      if (charge) {
        await updateCharge(charge.id, chargeData);
      } else {
        await addCharge(chargeData);
      }

      onClose();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder la charge.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateSelect = (date: string, time: string) => {
    setFormData(prev => ({ ...prev, dateDebut: date }));
    setShowCalendarPicker(false);
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return 'Sélectionner une date';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  const styles = createStyles(colors);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Annuler</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {charge ? 'Modifier la charge' : 'Nouvelle charge'}
          </Text>
          <TouchableOpacity 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}>
              {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom de la charge *</Text>
            <TextInput
              style={styles.input}
              value={formData.nom}
              onChangeText={(text) => setFormData(prev => ({ ...prev, nom: text }))}
              placeholder="Ex: Assurance, Entretien, Carburant..."
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Montant *</Text>
            <TextInput
              style={styles.input}
              value={formData.montantMensuel.toString()}
              onChangeText={(text) => setFormData(prev => ({ 
                ...prev, 
                montantMensuel: parseFloat(text) || 0 
              }))}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Type de charge</Text>
            <View style={styles.optionsContainer}>
              {['Fixe', 'Variable'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.optionButton,
                    formData.type === type && styles.optionButtonActive
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, type: type as any }))}
                >
                  <Text style={[
                    styles.optionText,
                    formData.type === type && styles.optionTextActive
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fréquence</Text>
            <View style={styles.optionsContainer}>
              {['Mensuelle', 'Trimestrielle', 'Annuelle'].map((freq) => (
                <TouchableOpacity
                  key={freq}
                  style={[
                    styles.optionButton,
                    formData.frequence === freq && styles.optionButtonActive
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, frequence: freq as any }))}
                >
                  <Text style={[
                    styles.optionText,
                    formData.frequence === freq && styles.optionTextActive
                  ]}>
                    {freq}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Véhicule associé (optionnel)</Text>
            <View style={styles.vehicleSelector}>
              <TouchableOpacity
                style={[
                  styles.vehicleOption,
                  formData.vehiculeId === null && styles.vehicleOptionActive
                ]}
                onPress={() => setFormData(prev => ({ ...prev, vehiculeId: null }))}
              >
                <Text style={[
                  styles.vehicleOptionText,
                  formData.vehiculeId === null && styles.vehicleOptionTextActive
                ]}>
                  Charge générale
                </Text>
              </TouchableOpacity>
              
              {vehicles.map((vehicle) => (
                <TouchableOpacity
                  key={vehicle.id}
                  style={[
                    styles.vehicleOption,
                    formData.vehiculeId === vehicle.id && styles.vehicleOptionActive
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, vehiculeId: vehicle.id }))}
                >
                  <Text style={[
                    styles.vehicleOptionText,
                    formData.vehiculeId === vehicle.id && styles.vehicleOptionTextActive
                  ]}>
                    {vehicle.marque} {vehicle.modele}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ marginVertical: 16 }}></View>

          {/* Option pour marquer comme paiement au propriétaire */}
          {formData.vehiculeId && vehicles.find(v => v.id === formData.vehiculeId)?.financement === 'Mise à disposition' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Type de charge</Text>
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    !formData.estPaiementProprietaire && styles.optionButtonActive
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, estPaiementProprietaire: false }))}
                >
                  <Text style={[
                    styles.optionText,
                    !formData.estPaiementProprietaire && styles.optionTextActive
                  ]}>
                    Charge normale
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    formData.estPaiementProprietaire && styles.optionButtonActive
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, estPaiementProprietaire: true }))}
                >
                  <Text style={[
                    styles.optionText,
                    formData.estPaiementProprietaire && styles.optionTextActive
                  ]}>
                    Paiement au propriétaire
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.helpText}>
                Les paiements au propriétaire sont comptabilisés dans le total reversé
              </Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date de début</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowCalendarPicker(true)}
            >
              <Calendar size={20} color={colors.primary} />
              <Text style={styles.dateButtonText}>
                {formatDisplayDate(formData.dateDebut)}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        
        <CalendarPicker
          visible={showCalendarPicker}
          selectedDate={formData.dateDebut}
          selectedTime="00:00"
          onDateTimeSelect={handleDateSelect}
          onClose={() => setShowCalendarPicker(false)}
          title="Date de début de la charge"
          minDate={null}
        />
      </SafeAreaView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancelButton: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  saveButtonDisabled: {
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  optionButtonActive: { 
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 14,
    color: colors.text,
  },
  optionTextActive: {
    color: colors.background,
    fontWeight: '500',
  },
  vehicleSelector: {
    gap: 8,
  },
  vehicleOption: {
  backgroundColor: 'rgba(255,255,255,0.18)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.4)',
  borderRadius: 28,
  padding: 14,
  marginBottom: 8,
  shadowColor: '#000', 
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.06,
  shadowRadius: 12,
  elevation: 2,
},
vehicleOptionActive: {
  backgroundColor: 'rgba(52, 120, 246, 0.30)',
  borderColor: '#3478f6',
  shadowColor: '#3478f6',
  shadowOpacity: 0.18,
  shadowRadius: 20,
},
vehicleOptionText: {
  fontSize: 15,
  color: '#222',
  fontWeight: '500',
},
vehicleOptionTextActive: {
  color: '#222',
  fontWeight: '700',
},
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 28,
    padding: 12,
    gap: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: colors.text,
  },
});