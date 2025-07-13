import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  Platform,
  ActivityIndicator,
  Pressable,
  Animated
} from 'react-native';
import { 
  X, 
  Save, 
  Car, 
  User, 
  Calendar, 
  Clock, 
  DollarSign, 
  FileText,
  Check
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useData, Reservation, Vehicle, Client } from '@/contexts/DataContext';
import { useVehicles } from '@/hooks/useVehicles';
import { useClients } from '@/hooks/useClients';
import DualDatePicker from '@/components/DualDatePicker';

interface EditReservationModalProps {
  visible: boolean;
  reservation: Reservation | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditReservationModal({ 
  visible, 
  reservation, 
  onClose,
  onSuccess
}: EditReservationModalProps) {
  const { colors } = useTheme();
  const { vehicles } = useVehicles();
  const { clients } = useClients();
  const { updateReservation, reservations: allReservations } = useData();
  
  const [animation] = useState(new Animated.Value(0));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDualDatePicker, setShowDualDatePicker] = useState(false);
  const [formData, setFormData] = useState<Partial<Reservation>>({});
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // Animation d'entrée/sortie du modal
  useEffect(() => {
    if (visible) {
      Animated.spring(animation, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 40
      }).start();
    } else {
      Animated.timing(animation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }).start();
    }
  }, [visible]);
  
  // Initialiser les données du formulaire quand une réservation est sélectionnée
  useEffect(() => {
    if (reservation) {
      setFormData({
        vehiculeId: reservation.vehiculeId,
        clientId: reservation.clientId,
        typeContrat: reservation.typeContrat,
        dateDebut: reservation.dateDebut,
        heureDebut: reservation.heureDebut,
        dateRetourPrevue: reservation.dateRetourPrevue,
        heureRetourPrevue: reservation.heureRetourPrevue,
        statut: reservation.statut,
        montantLocation: reservation.montantLocation,
        notes: reservation.notes || '',
        kilometrageInclus: reservation.kilometrageInclus || 0
      });
      
      // Trouver le véhicule et le client sélectionnés
      const vehicle = vehicles.find(v => v.id === reservation.vehiculeId);
      const client = clients.find(c => c.id === reservation.clientId);
      
      setSelectedVehicle(vehicle || null);
      setSelectedClient(client || null);
    }
  }, [reservation, vehicles, clients]);
  
  // Obtenir les dates réservées pour le véhicule sélectionné
  const getReservedDatesForVehicle = () => {
    if (!selectedVehicle || !reservation) return [];
    
    // Filtrer les réservations pour ce véhicule, en excluant la réservation actuelle
    const vehicleReservations = allReservations
      .filter(r => 
        r.vehiculeId === selectedVehicle.id && 
        r.id !== reservation.id &&
        r.statut !== 'Annulé' && 
        r.statut !== 'Terminé'
      )
      .flatMap(r => {
        // Générer toutes les dates entre début et fin
        const dates = [];
        const start = new Date(r.dateDebut);
        const end = new Date(r.dateRetourPrevue);
        
        // Mettre à minuit pour une comparaison correcte
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        
        // Ajouter chaque date dans la plage
        const current = new Date(start);
        while (current <= end) {
          dates.push(current.toISOString().split('T')[0]);
          current.setDate(current.getDate() + 1);
        }
        
        return dates;
      });
    
    return vehicleReservations;
  };
  
  const reservedDates = getReservedDatesForVehicle();
  
  // Calculer le nombre de jours de location
  const calculateDays = () => {
    if (!formData.dateDebut || !formData.dateRetourPrevue) return 0;
    const start = new Date(formData.dateDebut);
    const end = new Date(formData.dateRetourPrevue);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };
  
  // Calculer le kilométrage inclus
  const calculateIncludedKm = () => {
    if (!selectedVehicle) return 0;
    return calculateDays() * selectedVehicle.kilometrageJournalier;
  };
  
  // Vérifier si c'est une location de week-end
  const isWeekendRental = () => {
    if (!formData.dateDebut || !formData.dateRetourPrevue) return false;
    
    const start = new Date(formData.dateDebut);
    const end = new Date(formData.dateRetourPrevue);
    
    // Vérifier si c'est un week-end (vendredi soir au dimanche soir)
    const startDay = start.getDay();
    const endDay = end.getDay();
    const startHour = parseInt(formData.heureDebut?.split(':')[0] || '0');
    const endHour = parseInt(formData.heureRetourPrevue?.split(':')[0] || '0');
    
    return (startDay === 5 && startHour >= 17) && (endDay === 0 && endHour <= 21);
  };
  
  // Calculer le prix automatiquement
  const calculateAutomaticPrice = () => {
    if (!selectedVehicle) return 0;
    
    const days = calculateDays();
    const isWeekend = isWeekendRental();
    
    if (isWeekend && selectedVehicle.prix_base_weekend) {
      return selectedVehicle.prix_base_weekend;
    } else if (selectedVehicle.prix_base_24h) {
      return selectedVehicle.prix_base_24h * days;
    }
    
    return 0;
  };
  
  // Gérer la sélection des dates
  const handleDualDateSelect = (startDate: string, startTime: string, endDate: string, endTime: string) => {
    setFormData(prev => ({
      ...prev,
      dateDebut: startDate,
      heureDebut: startTime,
      dateRetourPrevue: endDate,
      heureRetourPrevue: endTime
    }));
    setShowDualDatePicker(false);
    
    // Recalculer le prix automatiquement
    const automaticPrice = calculateAutomaticPrice();
    setFormData(prev => ({
      ...prev,
      montantLocation: automaticPrice
    }));
  };
  
  // Gérer la soumission du formulaire
  const handleSubmit = async () => {
    if (!reservation || !formData.vehiculeId || !formData.clientId) {
      Alert.alert('Erreur', 'Informations de réservation incomplètes');
      return;
    }
    
    if (!formData.dateDebut || !formData.dateRetourPrevue) {
      Alert.alert('Erreur', 'Veuillez remplir les dates de début et de retour');
      return;
    }
    
    // Vérifier que la date de retour est après la date de début
    const startDate = new Date(`${formData.dateDebut}T${formData.heureDebut}`);
    const endDate = new Date(`${formData.dateRetourPrevue}T${formData.heureRetourPrevue}`);
    
    if (endDate <= startDate) {
      Alert.alert('Erreur', 'La date de retour doit être postérieure à la date de départ');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await updateReservation(reservation.id, formData);
      
      // Afficher un message de succès
      Alert.alert(
        'Succès',
        'La réservation a été modifiée avec succès',
        [
          { 
            text: 'OK', 
            onPress: () => {
              onSuccess();
              onClose();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error updating reservation:', error);
      Alert.alert('Erreur', 'Impossible de modifier la réservation. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Vérifier si la réservation peut être modifiée
  const canEdit = () => {
    if (!reservation) return false;
    return reservation.statut !== 'Terminé' && reservation.statut !== 'Annulé';
  };
  
  // Animations
  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0]
  });
  
  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });
  
  const scale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1]
  });
  
  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      // backdropFilter supprimé car non supporté sur React Native
    },
    modalContainer: {
      width: '90%',
      maxWidth: 500,
      maxHeight: '85%',
      backgroundColor: colors.background,
      borderRadius: 20,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 10,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '30',
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
      textAlign: 'center',
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveButtonDisabled: {
      backgroundColor: colors.primary + '50',
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
    },
    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    infoIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    infoDetails: {
      flex: 1,
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    infoSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    inputGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border + '60',
      borderRadius: 28,
      padding: 14,
      fontSize: 16,
      color: colors.text,
    },
    dateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border + '60',
      borderRadius: 28,
      padding: 14,
      gap: 12,
    },
    dateButtonText: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
    },
    statusSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    statusOption: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: colors.border + '60',
    },
    statusOptionActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    statusText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    statusTextActive: {
      color: colors.background,
    },
    contractTypeSelector: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    contractTypeOption: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 28,
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border + '60',
    },
    contractTypeOptionActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    contractTypeText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    contractTypeTextActive: {
      color: colors.background,
    },
    summaryCard: {
      backgroundColor: colors.primary + '10',
      borderRadius: 28,
      padding: 16,
      marginTop: 16,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    summaryLabel: {
      fontSize: 14,
      color: colors.text,
    },
    summaryValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    footer: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border + '30',
    },
    submitButton: {
      backgroundColor: colors.primary,
      borderRadius: 28,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    submitButtonDisabled: {
      backgroundColor: colors.primary + '50',
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.background,
    },
    disabledOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
    disabledText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.error,
      textAlign: 'center',
      backgroundColor: colors.error + '20',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
      overflow: 'hidden',
      marginHorizontal: 20,
    },
    textArea: {
      height: 100,
      textAlignVertical: 'top',
    },
    successMessage: {
      position: 'absolute',
      top: 20,
      left: 20,
      right: 20,
      backgroundColor: colors.success + '20',
      borderRadius: 10,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    successText: {
      flex: 1,
      fontSize: 14,
      color: colors.success,
      fontWeight: '600',
    }
  });

  if (!reservation) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Animated.View 
          style={[
            styles.modalContainer, 
            { 
              opacity, 
              transform: [{ translateY }, { scale }] 
            }
          ]}
        >
          {/* Fin debug, on réintègre le vrai formulaire ci-dessous */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={18} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Modifier la réservation</Text>
            <TouchableOpacity 
              style={[
                styles.saveButton, 
                (isSubmitting || !canEdit()) && styles.saveButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || !canEdit()}
            >
              <Save size={18} color={colors.background} />
            </TouchableOpacity>
          </View>
          {!canEdit() && (
            <View style={styles.disabledOverlay}>
              <Text style={styles.disabledText}>
                Les réservations terminées ou annulées ne peuvent pas être modifiées
              </Text>
            </View>
          )}
          <ScrollView style={{flex: 1}} contentContainerStyle={styles.scrollContent}>
            {/* Informations véhicule */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Véhicule</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Sélectionner un véhicule</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                  {vehicles.map((v) => (
                    <TouchableOpacity
                      key={v.id}
                      style={[styles.infoCard, {
                        borderWidth: 2,
                        borderColor: formData.vehiculeId === v.id ? colors.primary : 'transparent',
                        backgroundColor: formData.vehiculeId === v.id ? colors.primary + '10' : colors.surface,
                        marginRight: 12,
                        minWidth: 180
                      }]}
                      onPress={() => {
                        setFormData(prev => ({ ...prev, vehiculeId: v.id }));
                        setSelectedVehicle(v);
                      }}
                      disabled={!canEdit()}
                    >
                      <View style={styles.infoIcon}>
                        <Car size={20} color={colors.primary} />
                      </View>
                      <View style={styles.infoDetails}>
                        <Text style={styles.infoTitle}>{v.marque} {v.modele}</Text>
                        <Text style={styles.infoSubtitle}>{v.immatriculation}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            
            {/* Informations client */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Client</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Sélectionner un client</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                  {clients.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.infoCard, {
                        borderWidth: 2,
                        borderColor: formData.clientId === c.id ? colors.primary : 'transparent',
                        backgroundColor: formData.clientId === c.id ? colors.primary + '10' : colors.surface,
                        marginRight: 12,
                        minWidth: 180
                      }]}
                      onPress={() => {
                        setFormData(prev => ({ ...prev, clientId: c.id }));
                        setSelectedClient(c);
                      }}
                      disabled={!canEdit()}
                    >
                      <View style={styles.infoIcon}>
                        <User size={20} color={colors.primary} />
                      </View>
                      <View style={styles.infoDetails}>
                        <Text style={styles.infoTitle}>{c.prenom} {c.nom}</Text>
                        <Text style={styles.infoSubtitle}>{c.telephone || c.email || ''}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            
            {/* Dates et heures */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dates et heures</Text>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowDualDatePicker(true)}
              >
                <Calendar size={20} color={colors.primary} />
                <Text style={styles.dateButtonText}>
                  {formData.dateDebut && formData.dateRetourPrevue
                    ? `Du ${new Date(formData.dateDebut).toLocaleDateString('fr-FR')} au ${new Date(formData.dateRetourPrevue).toLocaleDateString('fr-FR')}`
                    : 'Sélectionner les dates'
                  }
                </Text>
                <Clock size={20} color={colors.primary} />
              </TouchableOpacity>
              
              {formData.dateDebut && formData.dateRetourPrevue && (
                <View style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Durée:</Text>
                    <Text style={styles.summaryValue}>{calculateDays()} jour(s)</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Kilométrage inclus:</Text>
                    <TextInput
                      style={[styles.input, { width: 100, textAlign: 'right', paddingVertical: 4, fontSize: 14 }]}
                      value={formData.kilometrageInclus?.toString() || calculateIncludedKm().toString()}
                      onChangeText={text => setFormData(prev => ({ ...prev, kilometrageInclus: parseInt(text) || 0 }))}
                      keyboardType="numeric"
                      editable={canEdit()}
                    />
                    <Text style={styles.summaryLabel}>km</Text>
                  </View>
                  {isWeekendRental() && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Type:</Text>
                      <Text style={[styles.summaryValue, { color: colors.primary }]}>Week-end</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
            
            {/* Type de contrat */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Type de contrat</Text>
              <View style={styles.contractTypeSelector}>
                {['Location', 'Prêt'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.contractTypeOption,
                      formData.typeContrat === type && styles.contractTypeOptionActive
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, typeContrat: type as 'Location' | 'Prêt' }))}
                    disabled={!canEdit()}
                  >
                    <Text style={[
                      styles.contractTypeText,
                      formData.typeContrat === type && styles.contractTypeTextActive
                    ]}>
                      {type === 'Location' ? '💰 Location' : '🤝 Prêt'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Statut */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Statut</Text>
              <View style={styles.statusSelector}>
                {['Planifiée', 'Confirmé', 'En cours', 'Terminé', 'Annulé'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      formData.statut === status && styles.statusOptionActive
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, statut: status as any }))}
                    disabled={!canEdit()}
                  >
                    <Text style={[
                      styles.statusText,
                      formData.statut === status && styles.statusTextActive
                    ]}>
                      {status === 'Planifiée' ? '🗓️ ' : 
                       status === 'Confirmé' ? '✅ ' : 
                       status === 'En cours' ? '🚗 ' : 
                       status === 'Terminé' ? '✔️ ' : 
                       status === 'Annulé' ? '❌ ' : ''}{status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Prix */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Prix</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Montant de la location (€)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.montantLocation?.toString() || ''}
                  onChangeText={(text) => setFormData(prev => ({ 
                    ...prev, 
                    montantLocation: parseFloat(text) || 0 
                  }))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  editable={canEdit()}
                />
              </View>
            </View>
            
            {/* Notes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.notes?.toString() || ''}
                onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
                placeholder="Notes sur la réservation..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                editable={canEdit()}
              />
            </View>
          </ScrollView>
          
          <View style={styles.footer}>
            <TouchableOpacity 
              style={[
                styles.submitButton,
                (isSubmitting || !canEdit()) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || !canEdit()}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <>
                  <Save size={20} color={colors.background} />
                  <Text style={styles.submitButtonText}>Enregistrer les modifications</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Pressable>
      
      <DualDatePicker
        visible={showDualDatePicker}
        startDate={formData.dateDebut || ''}
        endDate={formData.dateRetourPrevue || ''}
        startTime={formData.heureDebut || ''}
        endTime={formData.heureRetourPrevue || ''}
        onDatesSelect={handleDualDateSelect}
        onClose={() => setShowDualDatePicker(false)}
        title="Modifier les dates de location"
        minDate={new Date()}
        reservedDates={reservedDates}
      />
    </Modal>
  );
}