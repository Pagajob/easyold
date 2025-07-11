import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Plus, DollarSign, Settings, Trash2, ChevronRight, List } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useCharges } from '@/hooks/useCharges';
import { useVehicles } from '@/hooks/useVehicles';
import { Charge } from '@/contexts/DataContext';
import ChargeModal from './ChargeModal';
import AllChargesModal from './AllChargesModal';
import { router } from 'expo-router';

export default function ChargesSection() {
  const { colors } = useTheme();
  const { charges, deleteCharge } = useCharges();
  const { getVehicleName } = useVehicles();
  const [modalVisible, setModalVisible] = useState(false);
  const [allChargesModalVisible, setAllChargesModalVisible] = useState(false);
  const [editingCharge, setEditingCharge] = useState<Charge | null>(null);

  const openModal = (charge?: Charge) => {
    setEditingCharge(charge || null);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingCharge(null);
  };

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
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la charge. Veuillez réessayer.');
            }
          }
        }
      ]
    );
  };

  const getVehicleNameForCharge = (vehicleId?: string) => {
    if (!vehicleId) return 'Charge générale';
    return getVehicleName(vehicleId);
  };

  const styles = createStyles(colors);

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>💼 Gestion des charges</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => openModal()}
          >
            <Plus size={20} color={colors.background} />
          </TouchableOpacity>
        </View>

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
            {charges.slice(0, 3).map((charge) => (
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
                      onPress={() => openModal(charge)}
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

                <View style={styles.chargeAmount}>
                  <Text style={styles.amountValue}>
                    {charge.montantMensuel.toLocaleString('fr-FR')} €
                  </Text>
                  <Text style={styles.amountFrequency}>
                    / {charge.frequence.toLowerCase()}
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
            ))}

            {charges.length > 3 && (
              <TouchableOpacity 
                style={styles.moreCharges}
                onPress={() => setAllChargesModalVisible(true)}
              >
                <Text style={styles.moreChargesText}>
                  +{charges.length - 3} autres charges
                </Text>
                <ChevronRight size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View> 
        )}

        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => router.push('/cost-records')}
        >
          <List size={16} color={colors.primary} />
          <Text style={styles.viewAllButtonText}>
            Voir la liste des charges
          </Text>
          <ChevronRight size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ChargeModal
        visible={modalVisible}
        charge={editingCharge}
        onClose={closeModal}
      />
      
      <AllChargesModal
        visible={allChargesModalVisible}
        onClose={() => setAllChargesModalVisible(false)}
        onEditCharge={(charge) => {
          setAllChargesModalVisible(false);
          openModal(charge);
        }}
        onDeleteCharge={handleDeleteCharge}
      />
    </>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  chargesList: {
    gap: 12,
  },
  chargeCard: {
    backgroundColor: colors.background,
    borderRadius: 28,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chargeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  chargeInfo: {
    flex: 1,
  },
  chargeName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  chargeVehicle: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  chargeActions: {
    flexDirection: 'row',
    gap: 6,
  },
  editButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.error + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chargeAmount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  amountFrequency: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  typeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  moreCharges: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 4,
  },
  moreChargesText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
    marginTop: 8,
  },
  viewAllButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
});