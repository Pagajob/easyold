import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Linking, Modal, TextInput, Platform } from 'react-native';
import { ArrowLeft, Car, User, Calendar, Clock, FileText, Phone, Mail, DollarSign, CreditCard as Edit, Trash2, Download } from 'lucide-react-native';
import { useData } from '@/contexts/DataContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useContracts } from '@/hooks/useContracts';
import { useVehicles } from '@/hooks/useVehicles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import EDLRetourModal from '@/components/reservations/EDLRetourModal';

export default function ReservationDetailsScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  const { reservations, vehicles, clients, deleteReservation, updateReservation, loading, error } = useData();
  const { user } = useAuth();
  const { getVehicleById } = useVehicles();
  const { generateAndSendContract, getContractByReservationId, loading: contractLoading } = useContracts();
  
  const [isGeneratingContract, setIsGeneratingContract] = useState(false);
  const [contractUrl, setContractUrl] = useState<string | null>(null);
  const [edlRetourModalVisible, setEdlRetourModalVisible] = useState(false);

  const reservation = reservations.find(r => r.id === id);
  const vehicle = reservation ? vehicles.find(v => v.id === reservation.vehiculeId) : null;
  const client = reservation ? clients.find(c => c.id === reservation.clientId) : null;
  
  // Calculer le montant à reverser au propriétaire si c'est une mise à disposition
  const [showOwnerPaymentModal, setShowOwnerPaymentModal] = useState(false);
  const [ownerPaymentAmount, setOwnerPaymentAmount] = useState('0');
  
  useEffect(() => {
    if (reservation && vehicle && vehicle.financement === 'Mise à disposition') {
      // Calculer le montant par défaut si pas déjà défini
      if (reservation.montantReverseProprietaire === undefined) {
        const days = calculateDuration();
        const defaultAmount = (vehicle.prixReverse24h || 0) * days;
        setOwnerPaymentAmount(defaultAmount.toString());
      } else {
        setOwnerPaymentAmount(reservation.montantReverseProprietaire.toString());
      }
    }
  }, [reservation, vehicle]);
  
  // Load contract if exists
  useEffect(() => {
    const loadContract = async () => {
      if (reservation) {
        if (reservation.contratGenere) {
          setContractUrl(reservation.contratGenere);
        } else {
          const contract = await getContractByReservationId(reservation.id);
          if (contract) {
            setContractUrl(contract.contractUrl);
          }
        }
      }
    };
    
    loadContract();
  }, [reservation]);

  if (loading) {
    return <LoadingSpinner message="Chargement des détails..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!reservation || !vehicle || !client) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Réservation introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSaveOwnerPayment = async () => {
    if (!reservation) return;
    
    try {
      const amount = parseFloat(ownerPaymentAmount) || 0;
      await updateReservation(reservation.id, {
        montantReverseProprietaire: amount
      });
      
      // Créer une charge pour le paiement au propriétaire
      if (amount > 0) {
        const chargeData = {
          nom: `Paiement propriétaire - Réservation ${reservation.id.substring(0, 6)}`,
          montantMensuel: amount,
          type: 'Variable' as 'Variable',
          dateDebut: new Date().toISOString().split('T')[0],
          frequence: 'Mensuelle' as 'Mensuelle',
          vehiculeId: vehicle?.id,
          estPaiementProprietaire: true
        };
        
        // Ajouter la charge via le service
        try {
          const apiUrl = typeof window !== 'undefined'
            ? `${window.location.origin}/api/charges/add`
            : process.env.EXPO_PUBLIC_API_URL
              ? `${process.env.EXPO_PUBLIC_API_URL}/api/charges/add`
              : 'https://easygarage-app.vercel.app/api/charges/add';
              
          await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(chargeData)
          });
        } catch (error) {
          console.error('Error adding owner payment charge:', error);
        }
      }
      
      setShowOwnerPaymentModal(false);
      Alert.alert('Succès', 'Paiement au propriétaire enregistré');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer le paiement');
    }
  };

  const handleDeleteReservation = () => {
    Alert.alert(
      'Supprimer la réservation',
      'Êtes-vous sûr de vouloir supprimer cette réservation ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReservation(reservation.id);
              router.back();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la réservation');
            }
          }
        }
      ]
    );
  };

  const handleEditReservation = () => {
    // Navigate to edit reservation page (to be implemented)
    Alert.alert(
      'Modification de réservation',
      'La fonctionnalité de modification de réservation sera bientôt disponible.',
      [{ text: 'OK' }]
    );
  };

  const handleGenerateContract = async () => {
    if (!client.email) {
      Alert.alert(
        'Email manquant',
        'Le client n\'a pas d\'adresse email. Veuillez ajouter une adresse email au client pour pouvoir envoyer le contrat.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsGeneratingContract(true);
    
    try {
      const success = await generateAndSendContract(reservation.id);
      
      if (success) {
        // Refresh contract URL
        const contract = await getContractByReservationId(reservation.id);
        if (contract) {
          setContractUrl(contract.contractUrl);
        }
        
        Alert.alert(
          'Contrat généré',
          `Le contrat a été généré avec succès et envoyé à ${client.email}.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Erreur',
          'Impossible de générer ou d\'envoyer le contrat. Veuillez réessayer.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de la génération du contrat.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsGeneratingContract(false);
    }
  };

  const handleViewContract = async () => {
    if (contractUrl) {
      try {
        // Open contract URL in new tab or using Linking
        Platform.OS === 'web' 
          ? window.open(contractUrl, '_blank')
          : await Linking.openURL(contractUrl);
      } catch (error) {
        console.error('Error opening contract URL:', error);
        Alert.alert('Erreur', 'Impossible d\'ouvrir le contrat.');
      }
    } else {
      Alert.alert('Contrat non disponible', 'Aucun contrat n\'a été généré pour cette réservation.');
    }
  };

  const handleEDLRetourSave = async (edlData: any) => {
    try {
      const edlRetour = {
        type: 'Retour',
        kmDepart: reservation.edlDepart?.kmDepart || getKmDepart(), // Include departure km in return EDL
        kmRetour: edlData.kmRetour,
        carburantRetour: edlData.carburantRetour,
        dateHeure: new Date().toISOString(),
      };

      await updateReservation(reservation.id, {
        edlRetour,
        fraisKmSupp: edlData.fraisKmSupp,
        totalFraisRetour: edlData.totalFraisRetour,
        statut: 'Terminé',
      });

      Alert.alert(
        'État des lieux terminé',
        'L\'état des lieux de retour a été enregistré avec succès.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder l\'état des lieux de retour');
    }
  };

  // Helper function to get km departure from EDL
  const getKmDepart = () => {
    if (!reservation.edlDepart?.compteur) return 0;
    
    // First check if we have the kmDepart field directly
    if (reservation.edlDepart.kmDepart !== undefined) {
      return reservation.edlDepart.kmDepart;
    }
    
    // Try to extract a number from the compteur string
    const kmString = reservation.edlDepart.compteur.replace(/\D/g, '');
    return kmString ? parseInt(kmString) : 0;
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Planifiée': return colors.info;
      case 'Confirmé': return colors.success;
      case 'En cours': return colors.warning;
      case 'Terminé': return colors.textSecondary;
      case 'Annulé': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateDuration = () => {
    const start = new Date(reservation.dateDebut);
    const end = new Date(reservation.dateRetourPrevue);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Réservation</Text>
        <View style={styles.headerActions}> 
          <TouchableOpacity style={styles.actionButton} onPress={handleEditReservation}>
            <Edit size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDeleteReservation}>
            <Trash2 size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Statut et type */}
        <View style={styles.statusSection}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(reservation.statut) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(reservation.statut) }]}>
              {reservation.statut}
            </Text>
          </View>
          <View style={styles.contractTypeBadge}>
            <Text style={styles.contractTypeText}>{reservation.typeContrat}</Text>
          </View>
        </View>

        {/* Informations véhicule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚗 Véhicule loué</Text>
          <View style={styles.vehicleCard}>
            <View style={styles.vehicleHeader}>
              {vehicle.photo ? (
                <Image source={{ uri: vehicle.photo }} style={styles.vehicleImage} />
              ) : (
                <View style={styles.vehiclePlaceholder}>
                  <Car size={32} color={colors.textSecondary} />
                </View>
              )}
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleName}>
                  {vehicle.marque} {vehicle.modele}
                </Text>
                <Text style={styles.vehicleImmat}>{vehicle.immatriculation}</Text>
                <Text style={styles.vehicleDetails}>
                  {vehicle.carburant} • {vehicle.kilometrageJournalier} km/jour
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Informations client */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Client</Text>
          <View style={styles.clientCard}>
            <View style={styles.clientHeader}>
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
                  <View style={styles.contactRow}>
                    <Phone size={14} color={colors.textSecondary} />
                    <Text style={styles.contactText}>{client.telephone}</Text>
                  </View>
                )}
                {client.email && (
                  <View style={styles.contactRow}>
                    <Mail size={14} color={colors.textSecondary} />
                    <Text style={styles.contactText}>{client.email}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Dates et durée */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Période de location</Text>
          <View style={styles.datesCard}>
            <View style={styles.dateRow}>
              <View style={styles.dateInfo}>
                <Calendar size={20} color={colors.primary} />
                <View style={styles.dateDetails}>
                  <Text style={styles.dateLabel}>Départ</Text>
                  <Text style={styles.dateValue}>
                    {formatDate(reservation.dateDebut)}
                  </Text>
                  <Text style={styles.timeValue}>à {reservation.heureDebut}</Text>
                </View>
              </View>
            </View>

            <View style={styles.dateRow}>
              <View style={styles.dateInfo}>
                <Calendar size={20} color={colors.accent} />
                <View style={styles.dateDetails}>
                  <Text style={styles.dateLabel}>Retour</Text>
                  <Text style={styles.dateValue}>
                    {formatDate(reservation.dateRetourPrevue)}
                  </Text>
                  <Text style={styles.timeValue}>à {reservation.heureRetourPrevue}</Text>
                </View>
              </View>
            </View>

            <View style={styles.durationRow}>
              <Clock size={16} color={colors.textSecondary} />
              <Text style={styles.durationText}>
                Durée: {calculateDuration()} jour(s)
              </Text>
            </View>
          </View>
        </View>

        {/* Montant */}
        {reservation.montantLocation && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Montant de la location</Text>
            <View style={styles.amountCard}>
              <Text style={styles.amountValue}>
                {reservation.montantLocation.toLocaleString('fr-FR')} €
              </Text>
            </View>
          </View>
        )}

        {/* Frais supplémentaires */}
        {(reservation.fraisKmSupp || reservation.totalFraisRetour) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💸 Frais supplémentaires</Text>
            <View style={styles.feesCard}>
              {reservation.fraisKmSupp && (
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>Frais kilométrage:</Text>
                  <Text style={styles.feeValue}>{reservation.fraisKmSupp.toFixed(2)} €</Text>
                </View>
              )}
              {reservation.totalFraisRetour && (
                <View style={[styles.feeRow, styles.totalFeeRow]}>
                  <Text style={styles.totalFeeLabel}>Total frais retour:</Text>
                  <Text style={styles.totalFeeValue}>
                    {reservation.totalFraisRetour.toFixed(2)} €
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
        
        {/* Section Paiement au propriétaire (uniquement pour les véhicules en mise à disposition) */}
        {vehicle?.financement === 'Mise à disposition' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🤝 Paiement au propriétaire</Text>
            <View style={styles.ownerPaymentCard}>
              <View style={styles.ownerPaymentInfo}>
                <Text style={styles.ownerPaymentLabel}>
                  Propriétaire: {vehicle.nomProprietaire || 'Non spécifié'}
                </Text>
                <Text style={styles.ownerPaymentRate}>
                  Tarif: {vehicle.prixReverse24h || 0}€/jour
                </Text>
              </View>
              
              <View style={styles.ownerPaymentAmount}>
                <Text style={styles.ownerPaymentAmountLabel}>Montant reversé:</Text>
                <Text style={styles.ownerPaymentAmountValue}>
                  {reservation?.montantReverseProprietaire?.toFixed(2) || '0.00'} €
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.ownerPaymentButton}
                onPress={() => setShowOwnerPaymentModal(true)}
              >
                <Text style={styles.ownerPaymentButtonText}>
                  {reservation?.montantReverseProprietaire ? 'Modifier le paiement' : 'Enregistrer un paiement'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* États des lieux */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 États des lieux</Text>
          <View style={styles.edlContainer}>
            <View style={styles.edlItem}>
              <View style={styles.edlHeader}>
                <FileText size={20} color={colors.primary} />
                <Text style={styles.edlTitle}>État des lieux de départ</Text>
              </View>
              {reservation.edlDepart ? (
                <View style={styles.edlStatus}>
                  <Text style={[styles.edlStatusText, { color: colors.success }]}>
                    Effectué
                  </Text>
                </View>
              ) : (
                <View style={styles.edlStatus}>
                  <Text style={[styles.edlStatusText, { color: colors.warning }]}>
                    En attente
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.edlItem}>
              <View style={styles.edlHeader}>
                <FileText size={20} color={colors.accent} />
                <Text style={styles.edlTitle}>État des lieux de retour</Text>
              </View>
              {reservation.edlRetour ? (
                <View style={styles.edlStatus}>
                  <Text style={[styles.edlStatusText, { color: colors.success }]}>
                    Effectué
                  </Text>
                </View>
              ) : (
                <View style={styles.edlStatus}>
                  <Text style={[styles.edlStatusText, { color: colors.textSecondary }]}>
                    Non effectué
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Contrat */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📄 Contrat de location</Text>
          <View style={styles.contractContainer}>
            <View style={styles.contractStatus}>
              <FileText size={24} color={contractUrl ? colors.success : colors.textSecondary} />
              <View style={styles.contractInfo}>
                <Text style={styles.contractTitle}>Contrat PDF</Text>
                <Text style={styles.contractSubtitle}>
                  {contractUrl 
                    ? 'Contrat généré et disponible' 
                    : 'Aucun contrat généré pour cette réservation'}
                </Text>
              </View>
            </View>
            
            {contractUrl ? (
              <TouchableOpacity 
                style={styles.viewContractButton}
                onPress={handleViewContract}
              >
                <Download size={20} color={colors.background} />
                <Text style={styles.viewContractText}>Voir le contrat</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[
                  styles.generateContractButton,
                  isGeneratingContract && styles.generateContractButtonDisabled
                ]}
                onPress={handleGenerateContract}
                disabled={isGeneratingContract || contractLoading}
              >
                <FileText size={20} color={colors.background} />
                <Text style={styles.generateContractText}>
                  {isGeneratingContract ? 'Génération...' : 'Générer le contrat'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          {!reservation.edlDepart && (reservation.statut === 'Confirmé' || reservation.statut === 'Planifiée') && (
            <TouchableOpacity
              style={styles.primaryAction}
              onPress={() => router.push(`/reservations/edl/${reservation.id}`)}
            >
              <FileText size={20} color={colors.background} />
              <Text style={styles.primaryActionText}>Effectuer l'état des lieux de départ</Text>
            </TouchableOpacity>
          )}

          {reservation.edlDepart && !reservation.edlRetour && reservation.statut === 'En cours' && (
            <TouchableOpacity
              style={styles.primaryAction}
              onPress={() => setEdlRetourModalVisible(true)}
            >
              <FileText size={20} color={colors.background} />
              <Text style={styles.primaryActionText}>Effectuer l'état des lieux de retour</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      
      {/* Modal pour le paiement au propriétaire */}
      <Modal
        visible={showOwnerPaymentModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOwnerPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Paiement au propriétaire</Text>
            
            <Text style={styles.modalLabel}>Montant reversé (€)</Text>
            <TextInput
              style={styles.modalInput}
              value={ownerPaymentAmount}
              onChangeText={setOwnerPaymentAmount}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowOwnerPaymentModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveOwnerPayment}
              >
                <Text style={styles.modalSaveButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <EDLRetourModal
        visible={edlRetourModalVisible}
        reservation={reservation}
        vehicle={vehicle}
        onClose={() => setEdlRetourModalVisible(false)}
        onSave={handleEDLRetourSave}
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
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  contractTypeBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contractTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  vehicleCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  vehiclePlaceholder: {
    width: 80,
    height: 80,
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
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  vehicleImmat: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  vehicleDetails: {
    fontSize: 12,
    color: colors.accent,
  },
  clientCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientAvatar: {
    backgroundColor: colors.primary,
    width: 50,
    height: 50,
    borderRadius: 28,
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
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 28,
    gap: 6,
  },
  contactText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  datesCard: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 16,
  },
  dateRow: {
    marginBottom: 16,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateDetails: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  amountCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.success,
  },
  ownerPaymentCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  ownerPaymentInfo: {
    marginBottom: 12,
  },
  ownerPaymentLabel: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  ownerPaymentRate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  ownerPaymentAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  ownerPaymentAmountLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  ownerPaymentAmountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  ownerPaymentButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ownerPaymentButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    color: colors.text,
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  feesCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feeLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning,
  },
  totalFeeRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: 0,
  },
  totalFeeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  totalFeeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.error,
  },
  edlContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  edlItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  edlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  edlTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  edlStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  edlStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  contractContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  contractStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  contractInfo: {
    flex: 1,
  },
  contractTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  contractSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  viewContractButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  viewContractText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  generateContractButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  generateContractButtonDisabled: {
    backgroundColor: colors.border,
  },
  generateContractText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  actionsSection: {
    gap: 12,
    marginTop: 20,
  },
  primaryAction: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  secondaryAction: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  secondaryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 18,
    color: colors.error,
  },
});