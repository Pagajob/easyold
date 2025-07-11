import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { ArrowLeft, Save, User, Car, Clock, FileText, CheckCircle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useData, Reservation, Vehicle } from '@/contexts/DataContext'; 
import { useContracts } from '@/hooks/useContracts';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import SignaturePad from '@/components/SignaturePad';
import { ReservationService } from '@/services/firebaseService';
import DepartureEDLWizard from '@/components/reservations/DepartureEDLWizard';
import { EDLData } from '@/services/edlValidation';
import { useNotificationContext } from '@/contexts/NotificationContext';

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
        if (uri) {
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
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <User size={16} color={colors.primary} />
          <Text style={styles.infoLabel}>Nom:</Text>
          <Text style={styles.infoValue}>{client?.nom} {client?.prenom}</Text>
        </View>
        <View style={styles.infoRow}>
          <FileText size={16} color={colors.primary} />
          <Text style={styles.infoLabel}>Réservation:</Text>
          <Text style={styles.infoValue}>#{reservation?.id.slice(-8)}</Text>
        </View>
      </View>
    </View>
  );

  const renderVehicleInfo = () => ( 
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Véhicule</Text>
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Car size={16} color={colors.primary} />
          <Text style={styles.infoLabel}>Véhicule:</Text>
          <Text style={styles.infoValue}>{vehicle?.marque} {vehicle?.modele}</Text>
        </View>
        <View style={styles.infoRow}>
          <FileText size={16} color={colors.primary} />
          <Text style={styles.infoLabel}>Immatriculation:</Text>
          <Text style={styles.infoValue}>{vehicle?.immatriculation}</Text>
        </View>
      </View>
    </View>
  );

  const renderDateTimeInfo = () => ( 
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Date et heure</Text>
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Clock size={16} color={colors.primary} />
          <Text style={styles.infoLabel}>Date:</Text>
          <Text style={styles.infoValue}>{formatDateTime()}</Text>
        </View>
      </View>
    </View>
  );

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
      <DepartureEDLWizard
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
});