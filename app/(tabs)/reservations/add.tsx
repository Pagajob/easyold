import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useReservations } from '@/hooks/useReservations';
import { useClients } from '@/hooks/useClients';
import { useVehicles } from '@/hooks/useVehicles';
import { CalendarPicker } from '@/components/CalendarPicker';
import { DualDatePicker } from '@/components/DualDatePicker';
import { ArrowLeft, Calendar, User, Car, AlertCircle } from 'lucide-react-native';

export default function AddReservationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { addReservation, reservations } = useReservations();
  const { clients } = useClients();
  const { vehicles } = useVehicles();

  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showClientModal, setShowClientModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showRestrictionModal, setShowRestrictionModal] = useState(false);

  // Get user's plan limits
  const getUserLimits = () => {
    const plan = user?.plan || 'gratuit';
    switch (plan) {
      case 'essentiel':
        return { reservationsMax: 50 };
      case 'pro':
        return { reservationsMax: Infinity };
      case 'premium':
        return { reservationsMax: Infinity };
      default:
        return { reservationsMax: 3 };
    }
  };

  const { reservationsMax } = getUserLimits();

  useEffect(() => {
    if (reservations.length >= reservationsMax) {
      setShowRestrictionModal(true);
    }
  }, [reservations, reservationsMax]);

  const handleSave = async () => {
    if (!selectedClient || !selectedVehicle) {
      Alert.alert('Erreur', 'Veuillez sélectionner un client et un véhicule');
      return;
    }

    if (reservations.length >= reservationsMax) {
      setShowRestrictionModal(true);
      return;
    }

    try {
      await addReservation({
        clientId: selectedClient.id,
        vehicleId: selectedVehicle.id,
        dateDebut: startDate,
        dateFin: endDate,
        statut: 'confirmee',
      });
      
      Alert.alert('Succès', 'Réservation créée avec succès');
      router.back();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer la réservation');
    }
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvelle réservation</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Enregistrer</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container}>
        <TouchableOpacity
          style={styles.selectionCard}
          onPress={() => setShowClientModal(true)}
        >
          <User size={24} color={colors.primary} />
          <View style={styles.selectionContent}>
            <Text style={styles.selectionLabel}>Client</Text>
            <Text style={styles.selectionValue}>
              {selectedClient ? `${selectedClient.prenom} ${selectedClient.nom}` : 'Sélectionner un client'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.selectionCard}
          onPress={() => setShowVehicleModal(true)}
        >
          <Car size={24} color={colors.primary} />
          <View style={styles.selectionContent}>
            <Text style={styles.selectionLabel}>Véhicule</Text>
            <Text style={styles.selectionValue}>
              {selectedVehicle ? `${selectedVehicle.marque} ${selectedVehicle.modele}` : 'Sélectionner un véhicule'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.selectionCard}
          onPress={() => setShowDatePicker(true)}
        >
          <Calendar size={24} color={colors.primary} />
          <View style={styles.selectionContent}>
            <Text style={styles.selectionLabel}>Période</Text>
            <Text style={styles.selectionValue}>
              {`${startDate.toLocaleDateString('fr-FR')} - ${endDate.toLocaleDateString('fr-FR')}`}
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Client Selection Modal */}
      <Modal visible={showClientModal} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowClientModal(false)}>
              <Text style={styles.modalCancel}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Sélectionner un client</Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView style={styles.modalContent}>
            {clients.map((client) => (
              <TouchableOpacity
                key={client.id}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedClient(client);
                  setShowClientModal(false);
                }}
              >
                <Text style={styles.modalItemText}>
                  {client.prenom} {client.nom}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Vehicle Selection Modal */}
      <Modal visible={showVehicleModal} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowVehicleModal(false)}>
              <Text style={styles.modalCancel}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Sélectionner un véhicule</Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView style={styles.modalContent}>
            {vehicles.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.id}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedVehicle(vehicle);
                  setShowVehicleModal(false);
                }}
              >
                <Text style={styles.modalItemText}>
                  {vehicle.marque} {vehicle.modele}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Date Picker Modal */}
      <Modal visible={showDatePicker} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <DualDatePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onClose={() => setShowDatePicker(false)}
          />
        </SafeAreaView>
      </Modal>

      {/* Restriction Modal */}
      <Modal visible={showRestrictionModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.restrictionModal}>
            <AlertCircle size={48} color={colors.error} style={{ alignSelf: 'center', marginBottom: 16 }} />
            <Text style={styles.restrictionTitle}>Limite atteinte</Text>
            <Text style={styles.restrictionText}>
              Votre plan actuel vous limite à {reservationsMax} réservations.
              Mettez à niveau votre abonnement pour créer plus de réservations.
            </Text>
            <View style={styles.restrictionButtons}>
              <TouchableOpacity
                style={[styles.restrictionButton, { backgroundColor: colors.surface }]}
                onPress={() => setShowRestrictionModal(false)}
              >
                <Text style={[styles.restrictionButtonText, { color: colors.text }]}>Fermer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.restrictionButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setShowRestrictionModal(false);
                  router.push('/settings/subscription');
                }}
              >
                <Text style={[styles.restrictionButtonText, { color: '#fff' }]}>Mettre à niveau</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  selectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  selectionContent: {
    marginLeft: 16,
    flex: 1,
  },
  selectionLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  selectionValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalCancel: {
    color: colors.primary,
    fontSize: 16,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalItem: {
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalItemText: {
    fontSize: 16,
    color: colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  restrictionModal: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  restrictionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  restrictionText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  restrictionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  restrictionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  restrictionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});