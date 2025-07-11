import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { FileText, Download, Send, CircleAlert as AlertCircle, CircleCheck as CheckCircle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useContractAutomation } from '@/hooks/useContractAutomation';
import { Reservation, Client, Vehicle } from '@/contexts/DataContext';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';

interface ContractStatusIndicatorProps {
  reservation: Reservation;
  onViewContract?: () => void;
  compact?: boolean;
}

export default function ContractStatusIndicator({ 
  reservation, 
  onViewContract,
  compact = false 
}: ContractStatusIndicatorProps) {
  const { colors } = useTheme();
  const { clients, vehicles } = useData();
  const { user } = useAuth();
  const { manuallyGenerateContract, isProcessing, getError } = useContractAutomation();

  const hasContract = !!reservation.contratGenere;
  const processing = isProcessing(reservation.id);
  const error = getError(reservation.id);
  
  // Get client and vehicle data for better error messages
  const client = clients.find(c => c.id === reservation.clientId);
  const vehicle = vehicles.find(v => v.id === reservation.vehiculeId);

  const handleGenerateContract = async () => {
    // Check if client has email
    if (!client?.email) {
      if (Platform.OS === 'web') {
        window.alert('Email manquant: Le client n\'a pas d\'adresse email. Veuillez ajouter une adresse email au client pour pouvoir envoyer le contrat.');
        
        // Refresh contract URL
        const contract = await getContractByReservationId(reservationId);
        if (contract && contract.contractUrl) {
          // Update reservation with contract URL
          await updateReservation(reservationId, {
            contratGenere: contract.contractUrl
          });
        }
      } else {
        Alert.alert(
          'Email manquant',
          'Le client n\'a pas d\'adresse email. Veuillez ajouter une adresse email au client pour pouvoir envoyer le contrat.',
          [{ text: 'OK' }]
        );
      }
      return;
    }
    
    await manuallyGenerateContract(reservation.id);
  };

  const styles = createStyles(colors);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {processing ? (
          <View style={styles.compactStatus}>
            <ActivityIndicator size="small" color={colors.warning} />
            <Text style={styles.compactText}>Génération...</Text>
          </View>
        ) : hasContract ? (
          <TouchableOpacity 
            style={styles.compactStatus}
            onPress={onViewContract}
          >
            <CheckCircle size={16} color={colors.success} />
            <Text style={[styles.compactText, { color: colors.success }]}>Contrat</Text>
          </TouchableOpacity>
        ) : error ? (
          <TouchableOpacity 
            style={styles.compactStatus}
            onPress={handleGenerateContract}
          >
            <AlertCircle size={16} color={colors.error} />
            <Text style={[styles.compactText, { color: colors.error }]}>Erreur</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.compactStatus}
            onPress={handleGenerateContract}
          >
            <FileText size={16} color={colors.textSecondary} />
            <Text style={styles.compactText}>Générer</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <FileText size={20} color={hasContract ? colors.success : colors.primary} />
        <Text style={styles.title}>Contrat de location</Text>
      </View>

      {processing ? (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="small" color={colors.warning} />
          <Text style={styles.statusText}>Génération du contrat en cours...</Text>
        </View>
      ) : hasContract ? (
        <View style={styles.statusContainer}>
          <CheckCircle size={20} color={colors.success} />
          <Text style={[styles.statusText, { color: colors.success }]}>
            Contrat généré et disponible
          </Text>
          {onViewContract && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={onViewContract}
            >
              <Download size={16} color={colors.background} />
              <Text style={styles.actionButtonText}>Voir le contrat</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : error ? (
        <View style={styles.statusContainer}>
          <AlertCircle size={20} color={colors.error} />
          <View style={styles.errorContainer}>
            <Text style={[styles.statusText, { color: colors.error }]}>
              Erreur: {error}
            </Text>
            <Text style={styles.errorHint}>
              {!client?.email ? 'Le client n\'a pas d\'adresse email.' : 
               'Vérifiez la connexion internet et réessayez.'}
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.error }]}
            onPress={handleGenerateContract}
          >
            <FileText size={16} color={colors.background} />
            <Text style={styles.actionButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            Aucun contrat généré pour cette réservation
          </Text>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleGenerateContract}
          >
            <Send size={16} color={colors.background} />
            <Text style={styles.actionButtonText}>Générer le contrat</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  compactStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  compactText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
  },
  errorHint: {
    fontSize: 12,
    color: colors.error,
    fontStyle: 'italic',
    marginTop: 4
  },
  actionButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    marginTop: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
  },
});