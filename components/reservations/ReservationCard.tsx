import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert, Platform } from 'react-native';
import { Car, User, Clock, FileText, Download, CreditCard as Edit } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Reservation } from '@/contexts/DataContext';
import ContractStatusIndicator from './ContractStatusIndicator';
import { useData } from '@/contexts/DataContext';

interface ReservationCardProps {
  reservation: Reservation;
  vehicleName: string;
  clientName: string;
  onPress: () => void;
  onEdit?: () => void;
  onEDLPress?: () => void;
  canStartEDL?: boolean;
}

export default function ReservationCard({ 
  reservation, 
  vehicleName, 
  clientName,
  onPress, 
  onEdit,
  onEDLPress,
  canStartEDL = false
}: ReservationCardProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { clients } = useData();

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

  // Send contract by email to client
  const sendContractByEmail = async (contractUrl: string, reservationId: string): Promise<boolean> => {
    const client = clients.find(c => c.id === reservation.clientId);
    if (!client?.email || !user?.uid) {
      console.error('Missing client email or user ID');
      return false;
    }

    try {
      const response = await fetch('/api/send-contract-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientEmail: client.email,
          clientName: client.nom,
          contractUrl,
          reservationId,
          userId: user.uid
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      console.log('Contract email sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending contract email:', error);
      return false;
    }
  };

  const handleViewContract = async () => {
    if (reservation.contratGenere) {
      // Get the client object
      const client = clients.find(c => c.id === reservation.clientId);
      
      try {
        // Send email to client
        if (client?.email) {
          try {
            await sendContractByEmail(reservation.contratGenere, reservation.id);
          } catch (error) {
            console.error('Error sending contract email:', error);
          }
        }
        
        // For web, open in new tab
        if (Platform.OS === 'web') {
          window.open(reservation.contratGenere, '_blank');
        } else {
          // For mobile, use Linking
          const supported = await Linking.canOpenURL(reservation.contratGenere);
          if (supported) {
            await Linking.openURL(reservation.contratGenere);
          } else {
            if (Platform.OS === 'web') {
              window.alert('Impossible d\'ouvrir le contrat. URL non supportée.');
            } else {
              Alert.alert('Erreur', 'Impossible d\'ouvrir le contrat. URL non supportée.');
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors de l\'ouverture du contrat:', error);
        if (Platform.OS === 'web') {
          window.alert('Impossible d\'ouvrir le contrat. Veuillez réessayer.');
        } else {
          Alert.alert('Erreur', 'Impossible d\'ouvrir le contrat. Veuillez réessayer.');
        }
      }
    }
  };

  const styles = createStyles(colors);

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(reservation.statut) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(reservation.statut) }]}>
            {reservation.statut === 'Planifiée' ? '🗓️ ' : 
             reservation.statut === 'Confirmé' ? '✅ ' : 
             reservation.statut === 'En cours' ? '🚗 ' : 
             reservation.statut === 'Terminé' ? '✔️ ' : 
             reservation.statut === 'Annulé' ? '❌ ' : ''}{reservation.statut}
          </Text>
        </View>
        <Text style={styles.contractType}>
          {reservation.typeContrat === 'Location' ? '💰 ' : '🤝 '}{reservation.typeContrat}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.infoRow}>
          <Car size={16} color={colors.primary} />
          <Text style={styles.infoText}>{vehicleName}</Text>
        </View>

        <View style={styles.infoRow}>
          <User size={16} color={colors.accent} />
          <Text style={styles.infoText}>{clientName}</Text>
        </View>

        <View style={styles.datesContainer}>
          <View style={styles.dateInfo}>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={styles.dateLabel}>Début:</Text>
            <Text style={styles.dateValue}>
              {formatDate(reservation.dateDebut)} à {reservation.heureDebut}
            </Text>
          </View>
          <View style={styles.dateInfo}>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={styles.dateLabel}>Retour:</Text>
            <Text style={styles.dateValue}>
              {formatDate(reservation.dateRetourPrevue)} à {reservation.heureRetourPrevue}
            </Text>
          </View>
        </View>

        {reservation.montantLocation && (
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Montant:</Text>
            <Text style={styles.amountValue}>{reservation.montantLocation}€</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
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

        <View style={styles.actionButtons}>
          {/* Bouton Modifier */}
          {onEdit && reservation.statut !== 'Terminé' && reservation.statut !== 'Annulé' && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Edit size={16} color={colors.background} />
              <Text style={styles.editButtonText}>Modifier</Text>
            </TouchableOpacity>
          )}
          
          {/* Contract Status */}
          {reservation.contratGenere ? (
            <TouchableOpacity
              style={styles.contractButton}
              onPress={handleViewContract}
            >
              <Download size={16} color={colors.background} />
              <Text style={styles.contractButtonText}>Contrat</Text>
            </TouchableOpacity>
          ) : (
            <ContractStatusIndicator
              reservation={reservation}
              onViewContract={handleViewContract}
              compact={true}
            />
          )}

          {canStartEDL && !reservation.edlDepart && onEDLPress && (
            <TouchableOpacity
              style={styles.edlButton}
              onPress={(e) => {
                e.stopPropagation();
                onEDLPress();
              }}
            >
              <FileText size={16} color={colors.background} />
              <Text style={styles.edlButtonText}>EDL de départ</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
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
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 28,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  contractType: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  content: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  datesContainer: {
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
    color: colors.text,
    fontWeight: '500',
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  amountLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  amountValue: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  edlStatus: {
    flexDirection: 'row',
    gap: 8,
  },
  edlBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 28,
  },
  edlText: {
    fontSize: 10,
    color: colors.success,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contractButton: {
    backgroundColor: colors.success,
    flexDirection: 'row',
    alignItems: 'center', 
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 28,
    gap: 6,
  },
  contractButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background,
  },
  edlButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center', 
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 28,
    gap: 6,
  },
  edlButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.background,
  },
  editButton: {
    backgroundColor: colors.info,
    flexDirection: 'row',
    alignItems: 'center', 
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 28,
    gap: 6,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.background,
  },
});