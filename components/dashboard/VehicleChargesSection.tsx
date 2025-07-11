import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Car, DollarSign, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useVehicles } from '@/hooks/useVehicles';
import { useCharges } from '@/hooks/useCharges';
import VehicleChargesModal from './VehicleChargesModal';

export default function VehicleChargesSection() {
  const { colors } = useTheme();
  const { vehicles } = useVehicles();
  const { charges, getVehicleMonthlyCharge } = useCharges();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Calculate total monthly cost for each vehicle
  const calculateVehicleMonthlyCost = (vehicleId: string) => {
    // Get vehicle-specific charges
    const vehicleCharges = charges.filter(c => c.vehiculeId === vehicleId);
    
    // Calculate total monthly cost from charges (excluding owner payments)
    const chargesCost = vehicleCharges.filter(c => !c.estPaiementProprietaire).reduce((total, charge) => {
      const multiplier = charge.frequence === 'Trimestrielle' ? 1/3 : 
                        charge.frequence === 'Annuelle' ? 1/12 : 1;
      return total + (charge.montantMensuel * multiplier);
    }, 0);
    
    // Get the vehicle
    const vehicle = vehicles.find(v => v.id === vehicleId);
    
    // Add vehicle's own costs (assurance, leasing, etc.)
    let vehicleCost = 0;
    if (vehicle) {
      // Add assurance mensuelle if it exists
      if (vehicle.assuranceMensuelle) {
        vehicleCost += vehicle.assuranceMensuelle;
      }
      
      // Add costs based on financing type
      if (vehicle.financement === 'Leasing' && vehicle.mensualites !== undefined) {
        vehicleCost += vehicle.mensualites;
      } else if (vehicle.financement === 'LLD' && vehicle.loyerMensuel !== undefined) {
        vehicleCost += vehicle.loyerMensuel;
      }
    }
    
    return chargesCost + vehicleCost;
  };

  // Get vehicles with costs
  const vehiclesWithCosts = vehicles.map(vehicle => ({
    ...vehicle,
    monthlyCost: calculateVehicleMonthlyCost(vehicle.id)
  })).sort((a, b) => b.monthlyCost - a.monthlyCost);

  // Calculate total monthly cost for all vehicles
  const totalMonthlyCost = vehiclesWithCosts.reduce((total, vehicle) => {
    return total + vehicle.monthlyCost;
  }, 0);

  const openVehicleCharges = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedVehicleId(null);
  };

  const styles = createStyles(colors);

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            💸 Coûts mensuels par véhicule
          </Text>
          <View style={styles.totalCostBadge}>
            <Text style={styles.totalCostText} numberOfLines={1}>
              {totalMonthlyCost.toFixed(2)} €/mois
            </Text>
          </View>
        </View>

        {vehicles.length === 0 ? (
          <View style={styles.emptyState}>
            <Car size={32} color={colors.textSecondary} />
            <Text style={styles.emptyText}>Aucun véhicule</Text>
          </View>
        ) : (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.vehiclesContainer}
          >
            {vehiclesWithCosts.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.id}
                style={styles.vehicleCard}
                onPress={() => openVehicleCharges(vehicle.id)}
                activeOpacity={0.7}
              >
                <View style={styles.vehicleHeader}>
                  <Car size={20} color={colors.primary} />
                  <ChevronRight size={16} color={colors.textSecondary} style={styles.chevron} />
                </View>
                <Text style={styles.vehicleName} numberOfLines={1}>
                  {vehicle.marque} {vehicle.modele}
                </Text>
                <Text style={styles.vehicleImmat} numberOfLines={1}>
                  {vehicle.immatriculation}
                </Text>
                <View style={styles.costContainer}>
                  <DollarSign size={16} color={vehicle.monthlyCost > 0 ? colors.error : colors.success} />
                  <Text style={[
                    styles.costValue,
                    { color: vehicle.monthlyCost > 0 ? colors.error : colors.success }
                  ]}>
                    {vehicle.monthlyCost.toFixed(2)} €/mois
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <VehicleChargesModal
        visible={modalVisible}
        vehicleId={selectedVehicleId}
        onClose={closeModal}
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
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  totalCostBadge: {
    backgroundColor: colors.error + '20',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    minWidth: 80,
    maxWidth: 120,
    alignItems: 'center',
  },
  totalCostText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.error,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  vehiclesContainer: {
    paddingBottom: 8,
    paddingRight: 8,
    gap: 12,
  },
  vehicleCard: {
    backgroundColor: colors.background,
    borderRadius: 28,
    padding: 16,
    width: 180,
    borderWidth: 1,
    borderColor: colors.border,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chevron: {
    opacity: 0.5,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  vehicleImmat: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  costValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});