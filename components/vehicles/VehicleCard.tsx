import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Car, Settings, Trash2, History, Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Vehicle } from '@/contexts/DataContext';

interface VehicleCardProps {
  vehicle: Vehicle;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onHistory: () => void;
  onEDL: () => void;
}

export default function VehicleCard({ 
  vehicle, 
  onPress, 
  onEdit, 
  onDelete, 
  onHistory, 
  onEDL 
}: VehicleCardProps) {
  const { colors } = useTheme();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Disponible': return colors.success;
      case 'Loué': return colors.warning;
      case 'Maintenance': return colors.error;
      case 'Indisponible': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  const styles = createStyles(colors);

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        {vehicle.photo ? (
          <Image source={{ uri: vehicle.photo }} style={styles.vehicleImage} />
        ) : (
          <View style={styles.vehiclePlaceholder}>
            <Car size={32} color={colors.textSecondary} />
          </View>
        )}
        <View style={styles.vehicleInfo}>
          <View style={styles.vehicleNameRow}>
            <Text style={styles.vehicleName} numberOfLines={1}>
              {vehicle.marque} {vehicle.modele}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(vehicle.statut) + '20' }]}>  
              <Text style={[styles.statusText, { color: getStatusColor(vehicle.statut) }]}>  
                {vehicle.statut}
              </Text>
            </View>
          </View>
          <Text style={styles.vehicleImmat}>{vehicle.immatriculation}</Text>
          <View style={styles.vehicleDetails}>
            <Text style={styles.vehicleCarburant}>{vehicle.carburant}</Text>
            <Text style={styles.vehicleKm}>
              {vehicle.kilometrageJournalier} km/jour
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.info + '20' }]}
            onPress={e => { e.stopPropagation(); onHistory(); }}
          >
            <History size={16} color={colors.info} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
            onPress={e => { e.stopPropagation(); onEdit(); }}
          >
            <Settings size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.error + '20' }]}
            onPress={e => { e.stopPropagation(); onDelete(); }}
            activeOpacity={0.7}
          >
            <Trash2 size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.clickIndicator}>
        <Text style={styles.clickIndicatorText}>👆 Appuyez pour voir les détails</Text>
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
    marginBottom: 16,
  },
  vehicleImage: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginRight: 16,
  },
  vehiclePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text, 
    flex: 1,
    marginRight: 8,
  },
  vehicleImmat: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  vehicleDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vehicleCarburant: {
    fontSize: 12,
    color: colors.textSecondary,
    backgroundColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 28,
  },
  vehicleKm: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 28,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clickIndicator: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  clickIndicatorText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '500',
  },
});
