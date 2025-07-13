import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { X, Car, DollarSign, Calendar, Clock, Plus, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useVehicles } from '@/hooks/useVehicles';
import { useCharges } from '@/hooks/useCharges';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReservations } from '@/hooks/useReservations';
import ChargeModal from './ChargeModal';

interface VehicleChargesModalProps {
  visible: boolean;
  vehicleId: string | null;
  onClose: () => void;
}

export default function VehicleChargesModal({ 
  visible, 
  vehicleId, 
  onClose 
}: VehicleChargesModalProps) {
  const { colors } = useTheme();
  const { getVehicleById } = useVehicles();
  const { charges, deleteCharge } = useCharges();
  const { getReservationsByVehicle, calculateVehicleOwnerPayments } = useReservations();
  const [chargeModalVisible, setChargeModalVisible] = useState(false);
  const [editingCharge, setEditingCharge] = useState<any>(null);
  
  if (!vehicleId) return null;
  
  const vehicle = getVehicleById(vehicleId);
  if (!vehicle) {
    console.log('Véhicule non trouvé pour vehicleId:', vehicleId);
    return null;
  }

  // Get vehicle-specific charges
  const vehicleCharges = charges.filter(c => c.vehiculeId === vehicleId);
  
  // Get reservations for this vehicle
  const vehicleReservations = getReservationsByVehicle(vehicleId);
  
  // Calculate payments to owner for the current month
  const ownerPayments = calculateVehicleOwnerPayments(vehicleId);
  
  // Calculate costs from vehicle properties
  const vehicleCosts = [];
  
  // Add assurance mensuelle
  if (vehicle.assuranceMensuelle) {
    vehicleCosts.push({
      id: 'assurance',
      nom: 'Assurance mensuelle',
      montantMensuel: vehicle.assuranceMensuelle,
      type: 'Fixe',
      frequence: 'Mensuelle',
      isBuiltIn: true
    });
  }
  
  // Add costs based on financing type
  if (vehicle.financement === 'Leasing' && vehicle.mensualites) {
    vehicleCosts.push({
      id: 'leasing',
      nom: 'Mensualité leasing',
      montantMensuel: vehicle.mensualites,
      type: 'Fixe',
      frequence: 'Mensuelle',
      isBuiltIn: true
    });
  } else if (vehicle.financement === 'LLD' && vehicle.loyerMensuel) {
    vehicleCosts.push({
      id: 'lld',
      nom: `Loyer LLD`,
      montantMensuel: vehicle.loyerMensuel,
      type: 'Fixe',
      frequence: 'Mensuelle',
      isBuiltIn: true
    });
  } else if (vehicle.financement === 'Mise à disposition' && vehicle.prixReverse24h) {
    vehicleCosts.push({
      id: 'reversement-proprietaire',
      nom: `Reversé au propriétaire`,
      montantMensuel: ownerPayments,
      type: 'Variable',
      frequence: 'Mensuelle',
      isBuiltIn: true
    });
  }
  
  // Combine all costs
  const allCosts = [...vehicleCosts, ...vehicleCharges];
  
  // Calculate total monthly cost
  const totalMonthlyCost = allCosts.reduce((total, cost) => {
    const multiplier = cost.frequence === 'Trimestrielle' ? 1/3 : 
                       cost.frequence === 'Annuelle' ? 1/12 : 1;
    return total + (cost.montantMensuel * multiplier);
  }, 0);
  
  // Calculate total annual cost
  const totalAnnualCost = totalMonthlyCost * 12;

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'Mensuelle': return '/mois';
      case 'Trimestrielle': return '/trimestre';
      case 'Annuelle': return '/an';
      default: return '';
    }
  };

  const handleAddCharge = () => {
    setEditingCharge(null);
    setChargeModalVisible(true);
  };

  const handleEditCharge = (charge: any) => {
    if (charge.isBuiltIn) {
      Alert.alert(
        'Modification impossible',
        'Ce coût est directement lié aux propriétés du véhicule. Modifiez les détails du véhicule pour changer ce montant.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setEditingCharge(charge);
    setChargeModalVisible(true);
  };

  const handleDeleteCharge = (chargeId: string, chargeName: string) => {
    Alert.alert(
      'Supprimer la charge',
      `Êtes-vous sûr de vouloir supprimer "${chargeName}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCharge(chargeId);
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la charge');
            }
          }
        }
      ]
    );
  };

  const closeChargeModal = () => {
    setChargeModalVisible(false);
    setEditingCharge(null);
  };

  const styles = createStyles(colors);

  return (
    <>
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
            <Text style={styles.title}>Coûts du véhicule</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddCharge}
            >
              <Plus size={20} color={colors.background} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Vehicle Info */}
            <View style={styles.vehicleInfo}>
              <View style={styles.vehicleIcon}>
                <Car size={24} color={colors.background} />
              </View>
              <View style={styles.vehicleDetails}>
                <Text style={styles.vehicleName}>{vehicle.marque} {vehicle.modele}</Text>
                <Text style={styles.vehicleImmat}>{vehicle.immatriculation}</Text>
                <Text style={styles.vehicleFinancement}>{vehicle.financement}</Text>
              </View>
            </View>

            {/* Cost Summary */}
            <View style={styles.costSummary}>
              <View style={styles.costCard}>
                <DollarSign size={20} color={colors.error} />
                <Text style={styles.costLabel}>Coût mensuel</Text>
                <Text style={styles.costValue}>{totalMonthlyCost.toFixed(2)} €</Text>
              </View>
              <View style={styles.costCard}>
                <Calendar size={20} color={colors.error} />
                <Text style={styles.costLabel}>Coût annuel</Text>
                <Text style={styles.costValue}>{totalAnnualCost.toFixed(2)} €</Text>
              </View>
            </View>

            {/* Costs List */}
            <View style={styles.costsSection}>
              <Text style={styles.sectionTitle}>Détail des coûts</Text>
              
              {allCosts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>Aucun coût enregistré pour ce véhicule</Text>
                </View>
              ) : (
                <View style={styles.costsList}>
                  {allCosts.map((cost, index) => (
                    <TouchableOpacity 
                      key={cost.id + index} 
                      style={[
                        styles.costItem,
                        index === allCosts.length - 1 && styles.lastCostItem
                      ]}
                      onPress={() => handleEditCharge(cost)}
                      activeOpacity={cost.isBuiltIn ? 1 : 0.7}
                    >
                      <View style={styles.costItemHeader}>
                        <Text style={styles.costItemName}>{cost.nom}</Text>
                        <View style={styles.costItemActions}>
                          <View style={[
                            styles.costItemType,
                            { backgroundColor: cost.type === 'Fixe' ? colors.success + '20' : colors.warning + '20' }
                          ]}>
                            <Text style={[
                              styles.costItemTypeText,
                              { color: cost.type === 'Fixe' ? colors.success : colors.warning }
                            ]}>
                              {cost.type}
                            </Text>
                          </View>
                          
                          {!cost.isBuiltIn && (
                            <TouchableOpacity
                              style={styles.deleteButton}
                              onPress={() => {
                                if (!cost.isBuiltIn) {
                                  handleDeleteCharge(cost.id, cost.nom);
                                }
                              }}
                              disabled={cost.isBuiltIn}
                              opacity={cost.isBuiltIn ? 0.5 : 1}
                            >
                              <Trash2 size={16} color={colors.error} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                      
                      <View style={styles.costItemDetails}>
                        <View style={styles.costItemFrequency}>
                          <Clock size={14} color={colors.textSecondary} />
                          <Text style={styles.costItemFrequencyText}>
                            {cost.frequence}
                          </Text>
                        </View>
                        
                        <Text style={styles.costItemAmount}>
                          {cost.montantMensuel.toFixed(2)} €{getFrequencyLabel(cost.frequence)}
                        </Text>
                      </View>
                      
                      {cost.isBuiltIn && (
                        <Text style={styles.builtInNote}>
                          Coût lié aux propriétés du véhicule
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            
            {/* Add Charge Button */}
            <TouchableOpacity 
              style={styles.addChargeButton}
              onPress={handleAddCharge}
            >
              <Plus size={20} color={colors.background} />
              <Text style={styles.addChargeText}>Ajouter une charge</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
      
      <ChargeModal
        visible={chargeModalVisible}
        charge={editingCharge}
        onClose={closeChargeModal}
        defaultVehicleId={vehicleId}
      />
    </>
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
  addButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 16,
    marginBottom: 20,
  },
  vehicleIcon: {
    width: 50,
    height: 50,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  vehicleDetails: {
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
  vehicleFinancement: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '500',
  },
  costSummary: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  costCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 16,
    alignItems: 'center',
  },
  costLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginVertical: 8,
  },
  costValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.error,
  },
  costsSection: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  costsList: {
    gap: 12,
  },
  costItem: {
    backgroundColor: colors.background,
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lastCostItem: {
    marginBottom: 0,
  },
  costItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  costItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  costItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  costItemType: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  costItemTypeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.error + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  costItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costItemFrequency: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  costItemFrequencyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  costItemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  builtInNote: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 8,
  },
  addChargeButton: {
    backgroundColor: colors.primary,
    borderRadius: 28,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  addChargeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
});