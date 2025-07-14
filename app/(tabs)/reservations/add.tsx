import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image, Modal } from 'react-native';
import { ArrowLeft, Save, Car, User, Calendar, Clock, Plus, Upload, Camera, DollarSign } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useData, Reservation, Client } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import DualDatePicker from '@/components/DualDatePicker';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { ClientService } from '@/services/firebaseService';
import CalendarPicker from '@/components/CalendarPicker';

export default function AddReservationScreen() {
  const { colors } = useTheme();
  const { vehicles, clients, reservations, addReservation, addClient } = useData();
  const { user, userProfile } = useAuth();
  const [showRestrictionModal, setShowRestrictionModal] = useState(false);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showDualDatePicker, setShowDualDatePicker] = useState(false);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [calendarType, setCalendarType] = useState<'start' | 'end'>('start');
  
  // Get reserved dates for the selected vehicle
  const getReservedDatesForVehicle = () => {
    if (!selectedVehicle) return [];
    
    return reservations
      .filter(r => 
        r.vehiculeId === selectedVehicle && 
        r.statut !== 'Annulé' && 
        r.statut !== 'Terminé'
      )
      .flatMap(r => {
        // Generate all dates between start and end date
        const dates = [];
        const start = new Date(r.dateDebut);
        const end = new Date(r.dateRetourPrevue);
        
        // Set to midnight for proper comparison
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        
        // Add each date in the range
        const current = new Date(start);
        while (current <= end) {
          dates.push(current.toISOString().split('T')[0]);
          current.setDate(current.getDate() + 1);
        }
        
        return dates;
      });
  };
  
  const reservedDates = getReservedDatesForVehicle();
  
  const [reservationData, setReservationData] = useState({
    typeContrat: 'Location' as 'Location' | 'Prêt',
    dateDebut: '',
    heureDebut: '18:00',
    dateRetourPrevue: '',
    heureRetourPrevue: '18:00',
    montantLocation: 0,
    montantCalcule: 0,
  });

  const [newClientData, setNewClientData] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    email: '',
    adresse: '',
    permisConduire: '',
    carteIdentite: '',
    notes: '',
  });

  const availableVehicles = vehicles.filter(v => v.statut === 'Disponible');
  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle);

  const calculateDays = () => {
    if (!reservationData.dateDebut || !reservationData.dateRetourPrevue) return 0;
    const start = new Date(reservationData.dateDebut);
    const end = new Date(reservationData.dateRetourPrevue);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  const calculateIncludedKm = () => {
    if (!selectedVehicleData) return 0;
    return calculateDays() * selectedVehicleData.kilometrageJournalier;
  };

  const isWeekendRental = () => {
    if (!reservationData.dateDebut || !reservationData.dateRetourPrevue) return false;
    const start = new Date(reservationData.dateDebut);
    const end = new Date(reservationData.dateRetourPrevue);
    
    // Vérifier si c'est un week-end (vendredi soir au dimanche soir)
    const startDay = start.getDay();
    const endDay = end.getDay();
    const startHour = parseInt(reservationData.heureDebut.split(':')[0]);
    const endHour = parseInt(reservationData.heureRetourPrevue.split(':')[0]);
    
    return (startDay === 5 && startHour >= 17) && (endDay === 0 && endHour <= 21);
  };

  const calculateAutomaticPrice = () => {
    if (!selectedVehicleData) return 0;
    
    const days = calculateDays();
    const isWeekend = isWeekendRental();
    
    if (isWeekend && selectedVehicleData.prix_base_weekend) {
      return selectedVehicleData.prix_base_weekend;
    } else if (selectedVehicleData.prix_base_24h) {
      return selectedVehicleData.prix_base_24h * days;
    }
    
    return 0;
  };

  const handleDualDateSelect = (startDate: string, startTime: string, endDate: string, endTime: string) => {
    setReservationData(prev => ({
      ...prev,
      dateDebut: startDate,
      heureDebut: startTime,
      dateRetourPrevue: endDate,
      heureRetourPrevue: endTime
    }));
    setShowDualDatePicker(false);
  };

  // Recalculer le prix automatiquement quand les données changent
  React.useEffect(() => {
    const automaticPrice = calculateAutomaticPrice();
    setReservationData(prev => ({
      ...prev,
      montantCalcule: automaticPrice,
      montantLocation: prev.montantLocation === 0 ? automaticPrice : prev.montantLocation
    }));
  }, [selectedVehicle, reservationData.dateDebut, reservationData.dateRetourPrevue, reservationData.heureDebut, reservationData.heureRetourPrevue]);

  const openCalendarPicker = (type: 'start' | 'end') => {
    setCalendarType(type);
    setShowCalendarPicker(true);
  };

  const handleDateTimeSelect = (date: string, time: string) => {
    if (calendarType === 'start') {
      setReservationData(prev => ({
        ...prev,
        dateDebut: date,
        heureDebut: time
      }));
    } else {
      setReservationData(prev => ({
        ...prev,
        dateRetourPrevue: date,
        heureRetourPrevue: time
      }));
    }
    setShowCalendarPicker(false);
  };

  const formatDisplayDate = (dateString: string, timeString: string) => {
    if (!dateString) return 'Sélectionner';
    const date = new Date(dateString);
    return `${date.toLocaleDateString('fr-FR')} à ${timeString}`;
  };

  const pickDocument = async (type: 'permis' | 'carte') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        if (type === 'permis') {
          setNewClientData(prev => ({ ...prev, permisConduire: result.assets[0].uri }));
        } else {
          setNewClientData(prev => ({ ...prev, carteIdentite: result.assets[0].uri }));
        }
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner le document.');
    }
  };

  // Convert URI to Blob for upload
  const uriToBlob = async (uri: string): Promise<Blob> => {
    const response = await fetch(uri);
    return await response.blob();
  };

  const handleCreateClient = async () => {
    if (!newClientData.prenom || !newClientData.nom) {
      Alert.alert('Erreur', 'Veuillez remplir au minimum le prénom et le nom.');
      return;
    }

    setIsCreatingClient(true);

    try {
      const clientData: Omit<Client, 'id'> = {
        userId: user?.uid || '',
        prenom: newClientData.prenom,
        nom: newClientData.nom,
        telephone: newClientData.telephone,
        email: newClientData.email,
        adresse: newClientData.adresse,
        permisConduire: '',
        carteIdentite: '',
        notes: newClientData.notes,
      };

      // Créer d'abord le client pour obtenir son ID
      const newClientId = await ClientService.create(clientData);

      // Upload documents to Firebase Storage if they exist
      if (newClientData.permisConduire || newClientData.carteIdentite) {
        const updateData: Partial<Client> = {};

        if (newClientData.permisConduire) {
          try {
            const permisBlob = await uriToBlob(newClientData.permisConduire);
            const permisUrl = await ClientService.uploadDocument(newClientId, permisBlob, 'permis');
            updateData.permisConduire = permisUrl;
          } catch (error) {
            console.warn('Failed to upload driving license:', error);
            // Continue without document
          }
        }

        if (newClientData.carteIdentite) {
          try {
            const carteBlob = await uriToBlob(newClientData.carteIdentite);
            const carteUrl = await ClientService.uploadDocument(newClientId, carteBlob, 'carte');
            updateData.carteIdentite = carteUrl;
          } catch (error) {
            console.warn('Failed to upload ID card:', error);
            // Continue without document
          }
        }

        // Mettre à jour le client avec les URLs des documents
        if (Object.keys(updateData).length > 0) {
          await ClientService.update(newClientId, updateData);
        }
      }
      
      // Fermer le modal
      setShowNewClientModal(false);
      
      // Reset form
      setNewClientData({
        prenom: '',
        nom: '',
        telephone: '',
        email: '',
        adresse: '',
        permisConduire: '',
        carteIdentite: '',
        notes: '',
      });

      // Afficher un message de succès
      Alert.alert('Succès', 'Client créé avec succès ! Vous pouvez maintenant le sélectionner dans la liste.');

    } catch (error) {
      console.error('Error creating client:', error);
      Alert.alert('Erreur', 'Impossible de créer le client. Veuillez réessayer.');
    } finally {
      setIsCreatingClient(false);
    }
  };

  const handleSaveReservation = () => {
    if (!selectedVehicle || !selectedClient) {
      Alert.alert('Erreur', 'Veuillez sélectionner un véhicule et un client.');
      return;
    }

    if (!reservationData.dateDebut || !reservationData.dateRetourPrevue) {
      Alert.alert('Erreur', 'Veuillez remplir les dates de début et de retour.');
      return;
    }

    // Vérifier que la date de retour est après la date de début
    const startDate = new Date(`${reservationData.dateDebut}T${reservationData.heureDebut}`);
    const endDate = new Date(`${reservationData.dateRetourPrevue}T${reservationData.heureRetourPrevue}`);
    
    if (endDate <= startDate) {
      Alert.alert('Erreur', 'La date de retour doit être postérieure à la date de départ.');
      return;
    }

    const reservation: Omit<Reservation, 'id'> = {
      userId: user?.uid || '',
      vehiculeId: selectedVehicle,
      clientId: selectedClient,
      typeContrat: reservationData.typeContrat,
      dateDebut: reservationData.dateDebut,
      heureDebut: reservationData.heureDebut,
      dateRetourPrevue: reservationData.dateRetourPrevue,
      heureRetourPrevue: reservationData.heureRetourPrevue,
      statut: 'Planifiée',
      montantLocation: reservationData.montantLocation,
    };

    addReservation(reservation);
    Alert.alert('Succès', 'Votre réservation a bien été créée');
    router.back();
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((step) => (
        <View key={step} style={styles.stepContainer}>
          <View style={[
            styles.stepCircle,
            currentStep >= step && styles.stepCircleActive
          ]}>
            <Text style={[
              styles.stepText,
              currentStep >= step && styles.stepTextActive
            ]}>
              {step}
            </Text>
          </View>
          {step < 3 && (
            <View style={[
              styles.stepLine,
              currentStep > step && styles.stepLineActive
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderVehicleSelection = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>🏎️ Sélectionner un véhicule</Text>
      
      {availableVehicles.length === 0 ? (
        <View style={styles.emptyState}>
          <Car size={48} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>Aucun véhicule disponible</Text>
          <Text style={styles.emptySubtitle}>
            Tous les véhicules sont actuellement loués ou en maintenance
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.vehiclesList} showsVerticalScrollIndicator={false}>
          {availableVehicles.map((vehicle) => (
            <TouchableOpacity
              key={vehicle.id}
              style={[
                styles.vehicleCard,
                selectedVehicle === vehicle.id && styles.vehicleCardSelected
              ]}
              onPress={() => setSelectedVehicle(vehicle.id)}
            >
              {vehicle.photo ? (
                <Image source={{ uri: vehicle.photo }} style={styles.vehicleImage} />
              ) : (
                <View style={styles.vehiclePlaceholder}>
                  <Car size={24} color={colors.textSecondary} />
                </View>
              )}
              
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleName}>
                  {vehicle.marque} {vehicle.modele}
                </Text>
                <Text style={styles.vehicleImmat}>{vehicle.immatriculation}</Text>
                <Text style={styles.vehicleKm}>
                  {vehicle.kilometrageJournalier} km/jour inclus
                </Text>
                {vehicle.prix_base_24h && (
                  <Text style={styles.vehiclePrice}>
                    À partir de {vehicle.prix_base_24h}€/jour
                  </Text>
                )}
              </View>
              
              <View style={styles.vehicleStatus}>
                <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
                  <Text style={[styles.statusText, { color: colors.success }]}>
                    Disponible
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderDateTimeSelection = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Dates et heures de location</Text>
      
      <View style={styles.dateTimeContainer}>
        <TouchableOpacity 
          style={styles.dualDateButton}
          onPress={() => setShowDualDatePicker(true)}
        >
          <Calendar size={24} color={colors.primary} />
          <View style={styles.dualDateButtonContent}>
            <Text style={styles.dualDateButtonTitle}>Sélectionner les dates de location</Text>
            {reservationData.dateDebut && reservationData.dateRetourPrevue ? (
              <View style={styles.selectedDatesContainer}>
                <Text style={styles.selectedDateText}>
                  🚀 Départ: {formatDisplayDate(reservationData.dateDebut, reservationData.heureDebut)}
                </Text>
                <Text style={styles.selectedDateText}>
                  🔙 Retour: {formatDisplayDate(reservationData.dateRetourPrevue, reservationData.heureRetourPrevue)}
                </Text>
              </View>
            ) : (
              <Text style={styles.dualDateButtonSubtitle}>
                Choisissez les dates et heures de départ et de retour
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {reservationData.dateDebut && reservationData.dateRetourPrevue && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>📋 Résumé de la location</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Durée:</Text>
            <Text style={styles.summaryValue}>{calculateDays()} jour(s)</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Kilométrage inclus:</Text>
            <Text style={styles.summaryValue}>{calculateIncludedKm()} km</Text>
          </View>
          {isWeekendRental() && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Type:</Text>
              <Text style={[styles.summaryValue, { color: colors.accent }]}>Week-end</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.contractSection}>
        <Text style={styles.sectionTitle}>📄 Type de contrat</Text>
        
        <View style={styles.contractOptions}>
          {['Location', 'Prêt'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.contractOption,
                reservationData.typeContrat === type && styles.contractOptionActive
              ]}
              onPress={() => setReservationData(prev => ({ 
                ...prev, 
                typeContrat: type as 'Location' | 'Prêt'
              }))}
            >
              <Text style={[
                styles.contractOptionText,
                reservationData.typeContrat === type && styles.contractOptionTextActive
              ]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Section Prix */}
        <View style={styles.pricingSection}>
          <View style={styles.pricingSectionHeader}>
            <Text style={{ fontSize: 18 }}>💰</Text>
            <Text style={styles.pricingSectionTitle}>Prix de la location</Text>
          </View>
          
          {reservationData.montantCalcule > 0 && (
            <View style={styles.calculatedPriceRow}>
              <Text style={styles.calculatedPriceLabel}>Prix calculé automatiquement:</Text>
              <Text style={styles.calculatedPriceValue}>
                {reservationData.montantCalcule.toLocaleString('fr-FR')} €
              </Text>
            </View>
          )}
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Prix final (€)</Text>
            <TextInput
              style={styles.input}
              value={reservationData.montantLocation.toString()}
              onChangeText={(text) => setReservationData(prev => ({ 
                ...prev, 
                montantLocation: parseFloat(text) || 0 
              }))}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={styles.helpText}>
              Vous pouvez modifier le prix calculé automatiquement
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderClientSelection = () => (
    <View style={styles.stepContent}>
      <View style={styles.clientHeader}>
        <Text style={styles.stepTitle}>Sélectionner un client</Text>
        <TouchableOpacity
          style={styles.newClientButton}
          onPress={() => setShowNewClientModal(true)}
        >
          <Plus size={20} color={colors.background} />
          <Text style={styles.newClientButtonText}>Nouveau</Text>
        </TouchableOpacity>
      </View>
      
      {clients.length === 0 ? (
        <View style={styles.emptyState}>
          <User size={48} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>Aucun client</Text>
          <Text style={styles.emptySubtitle}>
            Créez votre premier client pour continuer
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.clientsList} showsVerticalScrollIndicator={false}>
          {clients.map((client) => (
            <TouchableOpacity
              key={client.id}
              style={[
                styles.clientCard,
                selectedClient === client.id && styles.clientCardSelected
              ]}
              onPress={() => setSelectedClient(client.id)}
            >
              <View style={styles.clientAvatar}>
                <Text style={styles.clientAvatarText}>
                  {client.prenom.charAt(0)}{client.nom.charAt(0)}
                </Text>
              </View>
              
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>
                  {client.prenom} {client.nom}
                </Text>
                {client.telephone && (
                  <Text style={styles.clientContact}>{client.telephone}</Text>
                )}
                {client.email && (
                  <Text style={styles.clientContact}>{client.email}</Text>
                )}
              </View>
              
              <View style={styles.clientDocuments}>
                {client.permisConduire && (
                  <View style={styles.documentBadge}>
                    <Text style={styles.documentText}>Permis</Text>
                  </View>
                )}
                {client.carteIdentite && (
                  <View style={styles.documentBadge}>
                    <Text style={styles.documentText}>ID</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderNewClientModal = () => (
    <Modal
      visible={showNewClientModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowNewClientModal(false)}>
            <Text style={styles.modalCancel}>Annuler</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Nouveau client</Text>
          <TouchableOpacity 
            onPress={handleCreateClient}
            disabled={isCreatingClient}
          >
            <Text style={[styles.modalSave, isCreatingClient && styles.modalSaveDisabled]}>
              {isCreatingClient ? 'Création...' : 'Créer'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Prénom *</Text>
            <TextInput
              style={styles.input}
              value={newClientData.prenom}
              onChangeText={(text) => setNewClientData(prev => ({ ...prev, prenom: text }))}
              placeholder="Prénom"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom *</Text>
            <TextInput
              style={styles.input}
              value={newClientData.nom}
              onChangeText={(text) => setNewClientData(prev => ({ ...prev, nom: text }))}
              placeholder="Nom de famille"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Téléphone</Text>
            <TextInput
              style={styles.input}
              value={newClientData.telephone}
              onChangeText={(text) => setNewClientData(prev => ({ ...prev, telephone: text }))}
              placeholder="06 12 34 56 78"
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={newClientData.email}
              onChangeText={(text) => setNewClientData(prev => ({ ...prev, email: text }))}
              placeholder="email@exemple.com"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Adresse</Text>
            <TextInput
              style={styles.input}
              value={newClientData.adresse}
              onChangeText={(text) => setNewClientData(prev => ({ ...prev, adresse: text }))}
              placeholder="Adresse complète"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Permis de conduire</Text>
            <TouchableOpacity 
              style={styles.documentButton}
              onPress={() => pickDocument('permis')}
            >
              <Upload size={20} color={colors.primary} />
              <Text style={styles.documentButtonText}>
                {newClientData.permisConduire ? 'Document ajouté' : 'Ajouter le permis'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Carte d'identité</Text>
            <TouchableOpacity 
              style={styles.documentButton}
              onPress={() => pickDocument('carte')}
            >
              <Upload size={20} color={colors.primary} />
              <Text style={styles.documentButtonText}>
                {newClientData.carteIdentite ? 'Document ajouté' : 'Ajouter la carte d\'identité'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newClientData.notes}
              onChangeText={(text) => setNewClientData(prev => ({ ...prev, notes: text }))}
              placeholder="Notes sur le client..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return selectedVehicle !== '';
      case 2:
        return reservationData.dateDebut && reservationData.dateRetourPrevue;
      case 3:
        return selectedClient !== '';
      default:
        return false;
    }
  };

  const styles = createStyles(colors);

  // Contrôle de la limite d'abonnement
  const reservationsMax = userProfile?.plan === 'essentiel' ? 50 : 
                         userProfile?.plan === 'pro' ? 999 : 
                         userProfile?.plan === 'premium' ? 999 : 3;
                         
  useEffect(() => {
    if (reservations.length >= reservationsMax) {
    if (typeof reservationsMax === 'number' && reservations.length >= reservationsMax) {
      setShowRestrictionModal(true);
    }
  }, [reservations, reservationsMax]);

  if (showRestrictionModal) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 32, alignItems: 'center', margin: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16, textAlign: 'center' }}>
            Fonctionnalité réservée aux abonnés
          </Text>
          <Text style={{ fontSize: 16, color: colors.textSecondary, marginBottom: 24, textAlign: 'center' }}>
            Vous avez atteint la limite de réservations de votre abonnement ({reservationsMax} réservation{reservationsMax > 1 ? 's' : ''}). Abonnez-vous via l'App Store pour continuer.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: colors.primary, borderRadius: 28, paddingVertical: 14, paddingHorizontal: 32 }}
            onPress={() => router.push('/(tabs)/settings/subscription')}
          >
            <Text style={{ color: colors.background, fontWeight: '700', fontSize: 16 }}>Voir les abonnements</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
  <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <ArrowLeft size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.title, { flex: 1, textAlign: 'center' }]}>Nouvelle réservation</Text>
        {currentStep === 3 && (
          <TouchableOpacity onPress={handleSaveReservation} style={styles.saveButton}>
            <Save size={24} color={colors.background} />
          </TouchableOpacity> 
        )}
      </View>

      {renderStepIndicator()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 1 && renderVehicleSelection()}
        {currentStep === 2 && renderDateTimeSelection()}
        {currentStep === 3 && renderClientSelection()}
      </ScrollView>

      <View style={styles.navigationButtons}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={[styles.navButton, styles.prevButton]}
            onPress={() => setCurrentStep(currentStep - 1)}
          >
            <Text style={styles.prevButtonText}>Précédent</Text>
          </TouchableOpacity>
        )}
        
        {currentStep < 3 && (
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.nextButton,
              !canProceedToNextStep() && styles.nextButtonDisabled
            ]}
            onPress={() => canProceedToNextStep() && setCurrentStep(currentStep + 1)}
            disabled={!canProceedToNextStep()}
          >
            <Text style={[
              styles.nextButtonText,
              !canProceedToNextStep() && styles.nextButtonTextDisabled
            ]}>
              Suivant
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <DualDatePicker
        visible={showDualDatePicker}
        startDate={reservationData.dateDebut}
        endDate={reservationData.dateRetourPrevue}
        startTime={reservationData.heureDebut}
        endTime={reservationData.heureRetourPrevue}
        onDatesSelect={handleDualDateSelect}
        onClose={() => setShowDualDatePicker(false)}
        title="Dates et heures de location"
        minDate={new Date()}
        reservedDates={reservedDates}
      />

      {renderNewClientModal()}
      
      <CalendarPicker
        visible={showCalendarPicker}
        selectedDate={calendarType === 'start' ? reservationData.dateDebut : reservationData.dateRetourPrevue}
        selectedTime={calendarType === 'start' ? reservationData.heureDebut : reservationData.heureRetourPrevue}
        onDateTimeSelect={handleDateTimeSelect}
        onClose={() => setShowCalendarPicker(false)}
        title={calendarType === 'start' ? 'Date et heure de départ' : 'Date et heure de retour'}
        minDate={calendarType === 'start' ? new Date() : new Date(reservationData.dateDebut)}
      />
    </SafeAreaView>
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
  backButton: {
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
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  stepTextActive: {
    color: colors.background,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  vehiclesList: {
    flex: 1,
  },
  vehicleCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  vehicleCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  vehicleImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  vehiclePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  vehicleImmat: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  vehicleKm: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '500',
    marginBottom: 4,
  },
  vehiclePrice: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  vehicleStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dateTimeContainer: {
    gap: 20,
  },
  dateTimeSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  dualDateButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 28,
    padding: 16,
    gap: 12,
  },
  dualDateButtonContent: {
    flex: 1,
  },
  dualDateButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  dualDateButtonSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  selectedDatesContainer: {
    gap: 8,
  },
  selectedDateText: {
    fontSize: 14,
    color: colors.text,
  },
  dateTimeButtonText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
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
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  helpText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  summaryCard: {
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 12,
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
  contractSection: {
    marginTop: 20,
  },
  contractOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  contractOption: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 28,
    padding: 12,
    alignItems: 'center',
  },
  contractOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  contractOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  contractOptionTextActive: {
    color: colors.background,
  },
  pricingSection: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 16,
    marginTop: 16,
  },
  pricingSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  pricingSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  calculatedPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.accent + '10',
    padding: 12,
    borderRadius: 28,
    marginBottom: 16,
  },
  calculatedPriceLabel: {
    fontSize: 14,
    color: colors.text,
  },
  calculatedPriceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.accent,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  newClientButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  newClientButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '500',
  },
  clientsList: {
    flex: 1,
  },
  clientCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  clientCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  clientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  clientAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  clientContact: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  clientDocuments: {
    flexDirection: 'row',
    gap: 4,
  },
  documentBadge: {
    backgroundColor: colors.accent + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  documentText: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.accent,
  },
  navigationButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  navButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  prevButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  prevButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  nextButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
    gap: 8,
  },
  nextButtonDisabled: {
    backgroundColor: colors.border,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.background,
  },
  nextButtonTextDisabled: {
    color: colors.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCancel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  modalSaveDisabled: {
    color: colors.textSecondary,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  documentButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  documentButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
});