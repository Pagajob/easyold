import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Image } from 'react-native';
import { X, Calendar, Clock, User, DollarSign, FileText } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useData } from '@/contexts/DataContext';
import { useClients } from '@/hooks/useClients';
import { Vehicle, Reservation } from '@/contexts/DataContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

interface VehicleHistoryModalProps {
  visible: boolean;
  vehicleId: string | null;
  onClose: () => void;
}

export default function VehicleHistoryModal({ 
  visible, 
  vehicleId, 
  onClose 
}: VehicleHistoryModalProps) {
  const { colors } = useTheme();
  const { reservations } = useData();
  const { getClientName } = useClients();
  
  if (!vehicleId) return null;
  
  // Get reservations for this vehicle
  const vehicleReservations = reservations
    .filter(r => r.vehiculeId === vehicleId)
    .sort((a, b) => new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime());
  
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
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateTotalRevenue = () => {
    return vehicleReservations
      .filter(r => r.statut !== 'Annulé')
      .reduce((sum, r) => sum + (r.montantLocation || 0), 0);
  };

  const calculateTotalDays = () => {
    return vehicleReservations
      .filter(r => r.statut !== 'Annulé')
      .reduce((sum, r) => {
        const days = calculateDuration(r.dateDebut, r.dateRetourPrevue);
        return sum + days;
      }, 0);
  };

  const handleViewReservation = (reservationId: string) => {
    onClose();
    router.push(`/reservations/details/${reservationId}`);
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
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Historique des locations</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Statistiques */}
          <View style={styles.statsSection}>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{vehicleReservations.length}</Text>
                <Text style={styles.statLabel}>Total locations</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: colors.success }]}>
                  {vehicleReservations.filter(r => r.statut === 'Terminé').length}
                </Text>
                <Text style={styles.statLabel}>Terminées</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {calculateTotalRevenue().toLocaleString('fr-FR')} €
                </Text>
                <Text style={styles.statLabel}>Revenus générés</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{calculateTotalDays()}</Text>
                <Text style={styles.statLabel}>Jours de location</Text>
              </View>
            </View>
          </View>

          {/* Liste des réservations */}
          <View style={styles.reservationsSection}>
            <Text style={styles.sectionTitle}>Historique des locations</Text>
            
            {vehicleReservations.length === 0 ? (
              <View style={styles.emptyState}>
                <Calendar size={48} color={colors.textSecondary} />
                <Text style={styles.emptyTitle}>Aucune location</Text>
                <Text style={styles.emptySubtitle}>
                  Ce véhicule n'a pas encore été loué
                </Text>
              </View>
            ) : (
              <View style={styles.reservationsList}>
                {vehicleReservations.map((reservation) => (
                  <TouchableOpacity 
                    key={reservation.id} 
                    style={styles.reservationCard}
                    onPress={() => handleViewReservation(reservation.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.reservationHeader}>
                      <View style={styles.reservationInfo}>
                        <View style={styles.clientInfo}>
                          <User size={16} color={colors.primary} />
                          <Text style={styles.clientName}>
                            {getClientName(reservation.clientId)}
                          </Text>
                        </View>
                        <View style={[
                          styles.statusBadge, 
                          { backgroundColor: getStatusColor(reservation.statut) + '20' }
                        ]}>
                          <Text style={[
                            styles.statusText, 
                            { color: getStatusColor(reservation.statut) }
                          ]}>
                            {reservation.statut}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.reservationDetails}>
                      <View style={styles.dateRow}>
                        <View style={styles.dateInfo}>
                          <Clock size={14} color={colors.textSecondary} />
                          <Text style={styles.dateLabel}>Du:</Text>
                          <Text style={styles.dateValue}>
                            {formatDate(reservation.dateDebut)}
                          </Text>
                        </View>
                        <View style={styles.dateInfo}>
                          <Clock size={14} color={colors.textSecondary} />
                          <Text style={styles.dateLabel}>Au:</Text>
                          <Text style={styles.dateValue}>
                            {formatDate(reservation.dateRetourPrevue)}
                          </Text>
                        </View>
                      </View>

                      {reservation.montantLocation && (
                        <View style={styles.amountRow}>
                          <Text style={styles.amountLabel}>Montant:</Text>
                          <Text style={styles.amountValue}>
                            {reservation.montantLocation.toLocaleString('fr-FR')} €
                          </Text>
                        </View>
                      )}

                      <View style={styles.contractTypeRow}>
                        <Text style={styles.contractLabel}>Type:</Text>
                        <Text style={styles.contractValue}>{reservation.typeContrat}</Text>
                      </View>
                    </View>

                    <View style={styles.reservationFooter}>
                      <View style={styles.edlStatus}>
                        {reservation.edlDepart && (
                          <View style={styles.edlBadge}>
                            <Text style={styles.edlText}>EDL Départ</Text>
                          </View>
                        )}
                        {reservation.edlRetour && (
                          <View style={styles.edlBadge}>
                            <Text style={styles.edlText}>EDL Retour</Text>
                          </View>
                        )}
                      </View>

                      {reservation.contratGenere && (
                        <TouchableOpacity
                          style={styles.contractButton}
                          onPress={() => handleViewReservation(reservation.id)}
                        >
                          <FileText size={16} color={colors.primary} />
                          <Text style={styles.contractButtonText}>Voir le contrat</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
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
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsSection: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  reservationsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  emptyState: {
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
  reservationsList: {
    gap: 16,
  },
  reservationCard: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  reservationHeader: {
    marginBottom: 12,
  },
  reservationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reservationDetails: {
    gap: 8,
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  dateValue: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  contractTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contractLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  contractValue: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
  },
  reservationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  edlStatus: {
    flexDirection: 'row',
    gap: 8,
  },
  edlBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  edlText: {
    fontSize: 10,
    color: colors.success,
    fontWeight: '500',
  },
  contractButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 28,
    gap: 6,
  },
  contractButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
});