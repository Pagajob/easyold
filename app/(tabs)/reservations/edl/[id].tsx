import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Image } from 'react-native';
import { ArrowLeft, Save, User, Car, Clock, FileText, CheckCircle, Calendar } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useData, Reservation, Vehicle } from '@/contexts/DataContext'; 
import { useContracts } from '@/hooks/useContracts';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import SignaturePad from '@/components/SignaturePad';
import { ReservationService } from '@/services/firebaseService';
import DepartureEDLWizard from '@/components/reservations/DepartureEDLWizard';
import EnhancedEDLWizard from '@/components/reservations/EnhancedEDLWizard';
import { EDLData } from '@/services/edlValidation';
import { useNotificationContext } from '@/contexts/NotificationContext';
import ClientCard from '@/components/cards/ClientCard';
import VehicleCard from '@/components/cards/VehicleCard';
import DateCard from '@/components/cards/DateCard';

// Helper function to convert URI to Blob
const uriToBlob = async (uri: string): Promise<Blob> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  return blob;
};

export default function EtatLieuxDepartScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  const reservationId = (Array.isArray(id) ? id[0] : id) as string;
  const { reservations, vehicles, clients, updateReservation } = useData();
  const { autoGenerateContractOnEDL } = useContracts();
  const { showSuccess, showError, showWarning } = useNotificationContext();
  
  const reservation = reservations.find(r => r.id === reservationId);
  const vehicle = reservation ? vehicles.find(v => v.id === reservation.vehiculeId) : null;
  const client = reservation ? clients.find(c => c.id === reservation.clientId) : null;

  const [showWizard, setShowWizard] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [signature, setSignature] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [edlData, setEdlData] = useState<EDLData | null>(null);

  const styles = createStyles(colors);

  useEffect(() => {
    if (!reservation || !vehicle || !client) {
      Alert.alert('Erreur', 'Réservation introuvable');
      router.back();
    }
  }, [reservation, vehicle, client]);

  const handleSignature = (signature: string) => {
    setSignature(signature);
    setShowSignatureModal(false);
  };

  const handleSignatureEmpty = () => {
    Alert.alert('Erreur', 'Veuillez signer avant de valider.');
  };

  const uploadFileIfNeeded = async (uri: string, type: 'photo' | 'video', name: string): Promise<string> => {
    if (!uri || uri.startsWith('http')) {
      return uri; // Already uploaded or empty
    }

    try {
      const blob = await uriToBlob(uri);
      const downloadURL = await ReservationService.uploadEDLFile(reservation!.id, blob, type, name);
      return downloadURL;
    } catch (error) {
      console.error(`Error uploading ${name}:`, error);
      throw error;
    }
  };

  const handleEDLComplete = async (wizardData: EDLData) => {
    setEdlData(wizardData);
    setShowSignatureModal(true);
  };

  const handleSaveEDL = async () => {
    if (!edlData || !reservation) return;

    setIsUploading(true);

    try {
      // Upload all photos and video
      const uploadedPhotos: any = {};
      for (const [key, uri] of Object.entries(edlData.photos)) {
        if (Array.isArray(uri)) {
          // Si c'est un tableau, on upload chaque URI et on stocke le résultat dans un tableau
          uploadedPhotos[key] = await Promise.all(
            uri.map(u => u ? uploadFileIfNeeded(u, 'photo', key) : u)
          );
        } else if (uri) {
          // Si c'est une chaîne, on upload normalement
          uploadedPhotos[key] = await uploadFileIfNeeded(uri, 'photo', key);
        }
      }

      let uploadedVideo = undefined;
      if (edlData.video) {
        uploadedVideo = await uploadFileIfNeeded(edlData.video, 'video', 'video');
      }

      // Upload signature if it's a local URI
      let uploadedSignature = signature;
      if (signature && !signature.startsWith('http')) {
        try {
          const signatureBlob = await uriToBlob(signature);
          uploadedSignature = await ReservationService.uploadEDLFile(reservation.id, signatureBlob, 'photo', 'signature');
        } catch (error) {
          console.error('Error uploading signature:', error);
        }
      }

      // Convert EDL data to the format expected by the reservation
      const edlDepart = {
        type: (edlData.mode === 'photo' ? 'Photo' : 'Vidéo') as 'Photo' | 'Vidéo',
        compteur: uploadedPhotos.compteur || '',
        kmDepart: 0, // Will be extracted from compteur if needed
        photos: uploadedPhotos,
        video: uploadedVideo,
        carburant: 4, // Default value
        accessoires: '',
        degats: '',
        dateHeure: new Date().toISOString(),
        coordonnees: '',
      };

      await updateReservation(reservation.id, {
        edlDepart,
        signature: uploadedSignature,
        statut: 'En cours',
      });

      // Auto-generate contract after EDL completion
      await autoGenerateContractOnEDL(reservation.id);

      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error saving EDL:', error);
      Alert.alert('Erreur', 'Erreur lors de la sauvegarde de l\'état des lieux.');
    } finally {
      setIsUploading(false);
    }
  };

  const generatePDF = () => {
    setShowSuccessModal(false);
    router.push('/(tabs)');
  };

  const formatDateTime = () => { 
    const now = new Date();
    return now.toLocaleDateString('fr-FR') + ' à ' + now.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderClientInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Client</Text>
      <ClientCard
        nom={client?.nom || ''}
        prenom={client?.prenom || ''}
        telephone={client?.telephone}
        reservationId={reservation?.id}
        permisUrl={client?.permisConduire}
        cniUrl={client?.carteIdentite}
      />
    </View>
  );

  const renderVehicleInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Véhicule</Text>
      <VehicleCard
        marque={vehicle?.marque || ''}
        modele={vehicle?.modele || ''}
        immatriculation={vehicle?.immatriculation || ''}
        photoUrl={vehicle?.photo}
        carburant={vehicle?.carburant || ''}
        kilometrageJournalier={vehicle?.kilometrageJournalier}
        statut={vehicle?.statut || ''}
      />
    </View>
  );

  const renderDateTimeInfo = () => {
    const now = new Date();
    const currentDate = now.toLocaleDateString('fr-FR');
    const currentTime = now.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Date et heure de départ</Text>
        <DateCard
          date={currentDate}
          heure={currentTime}
          subtitle="Date et heure de début de l'état des lieux (automatique)"
          modifiable={false}
          iconType="clock"
        />
      </View>
    );
  };

  const renderSignatureModal = () => (
    <Modal
      visible={showSignatureModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Signature du client</Text>
          <TouchableOpacity onPress={() => setShowSignatureModal(false)}>
            <Text style={styles.closeButton}>Fermer</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.signatureContainer}>
          <Text style={styles.signatureInstruction}>
            Veuillez faire signer le client pour finaliser l'état des lieux
          </Text>
          
          <SignaturePad
            onOK={handleSignature}
            onEmpty={handleSignatureEmpty}
            style={styles.signaturePad}
          />
          
          <View style={styles.signatureActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowSignatureModal(false)}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.saveButton,
                !signature && styles.saveButtonDisabled
              ]}
              onPress={handleSaveEDL}
              disabled={!signature || isUploading}
            >
              <CheckCircle size={20} color={colors.background} />
              <Text style={styles.saveButtonText}>
                {isUploading ? 'Sauvegarde...' : 'Finaliser'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );

  const renderSuccessModal = () => (
    <Modal
      visible={showSuccessModal}
      animationType="fade"
      transparent={true}
    >
      <View style={styles.successModalOverlay}>
        <View style={styles.successModal}>
          <View style={styles.successIcon}>
            <CheckCircle size={60} color={colors.success} />
          </View>
          
          <Text style={styles.successTitle}>État des lieux terminé !</Text>
          <Text style={styles.successMessage}>
            L'état des lieux de départ a été enregistré avec succès.
          </Text>
          
          <View style={styles.successActions}>
            <TouchableOpacity
              style={styles.pdfButton}
              onPress={generatePDF}
            >
              <FileText size={20} color={colors.background} />
              <Text style={styles.pdfButtonText}>Générer PDF</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => {
                setShowSuccessModal(false);
                router.push('/(tabs)');
              }}
            >
              <Text style={styles.doneButtonText}>Terminé</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (showWizard) {
    return (
      <EnhancedEDLWizard
        reservationId={reservationId}
        onComplete={handleEDLComplete}
        onCancel={() => setShowWizard(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={styles.title}>État des lieux de départ</Text>
        
        <TouchableOpacity
          onPress={() => setShowWizard(true)}
          style={styles.startButton}
        >
          <FileText size={24} color={colors.background} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderClientInfo()}
        {renderVehicleInfo()}
        {renderDateTimeInfo()}

        <View style={styles.startSection}>
          <Text style={styles.startTitle}>Commencer l'état des lieux</Text>
          <Text style={styles.startDescription}>
            Utilisez le nouveau wizard amélioré pour effectuer l'état des lieux de départ
            avec validation stricte de toutes les étapes obligatoires.
          </Text>
          
          <TouchableOpacity
            style={styles.startWizardButton}
            onPress={() => setShowWizard(true)}
          >
            <FileText size={20} color={colors.background} />
            <Text style={styles.startWizardButtonText}>
              Commencer l'EDL
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {renderSignatureModal()}
      {renderSuccessModal()}
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  startButton: {
    backgroundColor: colors.primary,
    padding: 8,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 15,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
    marginRight: 10,
    minWidth: 80,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  startSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  startTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  startDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  startWizardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  startWizardButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    fontSize: 16,
    color: colors.primary,
  },
  signatureContainer: {
    flex: 1,
    padding: 20,
  },
  signatureInstruction: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  signaturePad: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginBottom: 20,
  },
  signatureActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.text,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: colors.border,
  },
  saveButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModal: {
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 30,
    margin: 20,
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  successActions: {
    flexDirection: 'row',
    gap: 15,
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  pdfButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  doneButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  doneButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  // Styles pour la carte véhicule améliorée
  vehicleCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  vehicleImageContainer: {
    height: 200,
    backgroundColor: colors.background,
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
  },
  vehicleImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleImageText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  vehicleInfo: {
    padding: 20,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  vehicleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  vehicleBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  vehicleBadgeText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  vehicleDetails: {
    gap: 12,
  },
  vehicleDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleDetailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
    marginRight: 10,
    minWidth: 100,
  },
  vehicleDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  // Styles pour la carte client améliorée
  clientCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  clientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  clientSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  reservationBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reservationBadgeText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  clientDetails: {
    gap: 12,
  },
  clientDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientDetailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
    marginRight: 10,
    minWidth: 80,
  },
  clientDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  // Styles pour la carte réservation améliorée
  reservationCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reservationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  reservationIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  reservationInfo: {
    flex: 1,
  },
  reservationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  reservationSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  reservationDetails: {
    gap: 12,
  },
  reservationDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reservationDetailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
    marginRight: 10,
    minWidth: 100,
  },
  reservationDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
});