import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { X, DollarSign, Settings, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useCharges } from '@/hooks/useCharges';
import { useVehicles } from '@/hooks/useVehicles';
import { Charge, useData } from '@/contexts/DataContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert } from 'react-native';

interface AllChargesModalProps {
  visible: boolean;
  onClose: () => void;
  onEditCharge?: (charge: Charge) => void;
  onDeleteCharge?: (chargeId: string, chargeName: string) => void;
}

export default function AllChargesModal({ 
  visible, 
  onClose, 
  onEditCharge, 
  onDeleteCharge 
}: AllChargesModalProps) {
  const { colors } = useTheme();
  const { charges, deleteCharge } = useCharges();
  const { getVehicleName } = useVehicles();

  const handleDeleteCharge = (chargeId: string, chargeName: string) => {
    Alert.alert(
      'Supprimer la charge',
      `Êtes-vous sûr de vouloir supprimer "${chargeName}" ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCharge(chargeId);
              Alert.alert('Succès', 'La charge a été supprimée avec succès');
              if (onDeleteCharge) {
                onDeleteCharge(chargeId, chargeName);
              }
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la charge. Veuillez réessayer.');
            }
          }
        }
      ]
    );
  };

  const getVehicleNameForCharge = (vehicleId?: string | null) => {
    if (!vehicleId) return 'Charge générale';
    return getVehicleName(vehicleId);
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'Mensuelle': return 'par mois';
      case 'Trimestrielle': return 'par trimestre';
      case 'Annuelle': return 'par an';
      default: return '';
    }
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
          <Text style={styles.title}>Toutes les charges</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {charges.length === 0 ? (
            <View style={styles.emptyState}>
              <DollarSign size={48} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>Aucune charge</Text>
              <Text style={styles.emptySubtitle}>
                Ajoutez vos premières charges pour suivre vos dépenses
              </Text>
            </View>
          ) : (
            <View style={styles.chargesList}>
              {charges.map((charge) => (
                <View key={charge.id} style={styles.chargeCard}>
                  <View style={styles.chargeHeader}>
                    <View style={styles.chargeInfo}>
                      <Text style={styles.chargeName}>{charge.nom}</Text>
                      <Text style={styles.chargeVehicle}>
                        {getVehicleNameForCharge(charge.vehiculeId)}
                      </Text>
                    </View>
                    
                    <View style={styles.chargeActions}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => onEditCharge(charge)}
                      >
                        <Settings size={14} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteCharge(charge.id, charge.nom)}
                      >
                        <Trash2 size={14} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.chargeDetails}>
                    <View style={styles.chargeAmount}>
                      <Text style={styles.amountValue}>
                        {charge.montantMensuel.toLocaleString('fr-FR')} €
                      </Text>
                      <Text style={styles.amountFrequency}>
                        {getFrequencyLabel(charge.frequence)}
                      </Text>
                    </View>

                    <View style={[styles.typeBadge, { 
                      backgroundColor: charge.type === 'Fixe' ? colors.success + '20' : colors.warning + '20' 
                    }]}>
                      <Text style={[styles.typeText, { 
                        color: charge.type === 'Fixe' ? colors.success : colors.warning 
                      }]}>
                        {charge.type}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.chargeFooter}>
                    <Text style={styles.dateText}>
                      Depuis le {new Date(charge.dateDebut).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
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
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
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
  chargesList: {
    gap: 16,
  },
  chargeCard: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chargeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  chargeInfo: {
    flex: 1,
  },
  chargeName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  chargeVehicle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  chargeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
    borderRadius: 28,
    justifyContent: 'center',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.error + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chargeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chargeAmount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  amountFrequency: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chargeFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});