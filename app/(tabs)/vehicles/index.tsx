import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Platform, Animated, PanResponder } from 'react-native';
import { Plus, Car, Search, ChevronUp, ChevronDown } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useVehicles } from '@/hooks/useVehicles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import VehicleHistoryModal from '@/components/vehicles/VehicleHistoryModal';
import VehicleChargesModal from '@/components/dashboard/VehicleChargesModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import VehicleDetailModal from '@/components/VehicleDetailModal';
import VehicleCard from '@/components/vehicles/VehicleCard';

const FILTER_OPTIONS = [
  { key: 'all', label: 'Tous', color: '#64748B' },
  { key: 'Disponible', label: 'Disponible', color: '#10B981' },
  { key: 'Loué', label: 'Loué', color: '#F59E0B' },
  { key: 'Maintenance', label: 'Maintenance', color: '#EF4444' },
  { key: 'Indisponible', label: 'Hors service', color: '#6B7280' },
];

export default function VehiclesScreen() {
  const { colors } = useTheme();
  const { 
    vehicles, 
    availableVehicles, 
    rentedVehicles, 
    maintenanceVehicles, 
    unavailableVehicles,
    deleteVehicle, 
    loading, 
    error 
  } = useVehicles();
  
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [costsModalVisible, setCostsModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedVehicleForCosts, setSelectedVehicleForCosts] = useState<string | null>(null);
  const [selectedVehicleForHistory, setSelectedVehicleForHistory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterHeight] = useState(new Animated.Value(1));
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  // Create pan responder for swipe gestures
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (evt, gestureState) => {
      // Only respond to vertical gestures
      if (Math.abs(gestureState.dx) < Math.abs(gestureState.dy)) {
        // Swipe up to collapse
        if (gestureState.dy < -20 && !isFilterCollapsed) {
          collapseFilter();
        }
        // Swipe down to expand
        else if (gestureState.dy > 20 && isFilterCollapsed) {
          expandFilter();
        }
      }
    },
  });

  // Animation functions
  const collapseFilter = () => {
    setIsFilterCollapsed(true);
    Animated.timing(filterHeight, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const expandFilter = () => {
    setIsFilterCollapsed(false);
    Animated.timing(filterHeight, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Calculate the height for the filter section
  const filterSectionHeight = filterHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [80, 280], // Collapsed height vs full height
  });

  if (loading) {
    return <LoadingSpinner message="Chargement des véhicules..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  const handleDeleteVehicle = (vehicleId: string, vehicleName: string) => {
    Alert.alert(
      'Supprimer le véhicule',
      `Êtes-vous sûr de vouloir supprimer ${vehicleName} ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVehicle(vehicleId);
              Alert.alert('Succès', 'Le véhicule a été supprimé avec succès');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le véhicule. Veuillez réessayer.');
            }
          }
        }
      ]
    );
  };

  const handleVehiclePress = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setModalVisible(true);
  };

  const handleEditVehicle = (vehicleId: string) => {
    setModalVisible(false);
    router.push(`/vehicles/edit/${vehicleId}`);
  };

  const handleViewCosts = (vehicleId: string) => {
    setModalVisible(false);
    setSelectedVehicleForCosts(vehicleId);
    setCostsModalVisible(true);
  };

  const handleHistoryPress = (vehicleId: string) => {
    setModalVisible(false);
    setSelectedVehicleForHistory(vehicleId);
    setHistoryModalVisible(true);
  };

  const handleEDLPress = (vehicleId: string, vehicleName: string) => {
    Alert.alert(
      'Dernier état des lieux',
      `État des lieux pour ${vehicleName}\n\nFonctionnalité en cours de développement.`,
      [{ text: 'OK' }]
    );
  };

  // Filtrage des véhicules
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = 
      vehicle.marque.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.modele.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.immatriculation.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = activeFilter === 'all' || vehicle.statut === activeFilter;
    
    return matchesSearch && matchesFilter;
  });

  // Statistiques
  const stats = {
    total: vehicles.length,
    disponible: availableVehicles.length,
    loue: rentedVehicles.length,
    maintenance: maintenanceVehicles.length,
    horsService: unavailableVehicles.length,
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        style={[styles.header, { height: filterSectionHeight }]}
        {...panResponder.panHandlers}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Parc automobile</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.collapseButton}
                onPress={isFilterCollapsed ? expandFilter : collapseFilter}
              >
                {isFilterCollapsed ? (
                  <ChevronDown size={20} color={colors.text} />
                ) : (
                  <ChevronUp size={20} color={colors.text} />
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => router.push('/vehicles/add')}
              >
                <Plus size={24} color={colors.background} />
              </TouchableOpacity>
            </View>
          </View>

          <>
          {/* Animated content that will collapse/expand */}
          <Animated.View pointerEvents={isFilterCollapsed ? 'none' : 'auto'} style={[
            styles.collapsibleContent,
            { opacity: filterHeight }
          ]}>
            {/* Statistiques rapides */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: colors.success }]}>{stats.disponible}</Text>
                <Text style={styles.statLabel}>Disponibles</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: colors.warning }]}>{stats.loue}</Text>
                <Text style={styles.statLabel}>Loués</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: colors.error }]}>{stats.maintenance}</Text>
                <Text style={styles.statLabel}>Maintenance</Text>
              </View>
            </View>

            {/* Barre de recherche */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Search size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Rechercher par marque, modèle ou plaque..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>

            {/* Filtres */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.filtersContainer}
              contentContainerStyle={styles.filtersContent}
            >
              {FILTER_OPTIONS.map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterButton,
                    activeFilter === filter.key && styles.filterButtonActive,
                    activeFilter === filter.key && { backgroundColor: filter.color }
                  ]}
                  onPress={() => setActiveFilter(filter.key)}
                >
                  <Text style={[
                    styles.filterText,
                    activeFilter === filter.key && styles.filterTextActive
                  ]}>
                    {filter.key === 'Disponible' ? '✅ ' : 
                     filter.key === 'Loué' ? '🔄 ' : 
                     filter.key === 'Maintenance' ? '🔧 ' : 
                     filter.key === 'Indisponible' ? '⛔ ' : 
                     '🔍 '}{filter.label}
                  </Text>
                  {filter.key !== 'all' && (
                    <View style={[
                      styles.filterBadge,
                      activeFilter === filter.key && styles.filterBadgeActive
                    ]}>
                      <Text style={[
                        styles.filterBadgeText,
                        activeFilter === filter.key && styles.filterBadgeTextActive
                      ]}>
                        {filter.key === 'Disponible' ? stats.disponible :
                         filter.key === 'Loué' ? stats.loue :
                         filter.key === 'Maintenance' ? stats.maintenance :
                         stats.horsService}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Always visible search bar when collapsed */}
          {isFilterCollapsed && (
            <View style={styles.collapsedSearchContainer}>
              <View style={styles.searchBar}>
                <Search size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Rechercher par marque, modèle ou plaque..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>
          )}
          </>
        </View>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {filteredVehicles.length === 0 ? (
          <View style={styles.emptyState}>
            <Car size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>
              {searchQuery || activeFilter !== 'all' 
                ? 'Aucun véhicule trouvé' 
                : 'Aucun véhicule'
              }
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || activeFilter !== 'all'
                ? 'Essayez de modifier vos critères de recherche'
                : 'Commencez par ajouter votre premier véhicule'
              }
            </Text>
            {(!searchQuery && activeFilter === 'all') && (
              <TouchableOpacity 
                style={styles.emptyActionButton}
                onPress={() => router.push('/vehicles/add')}
              >
                <Plus size={20} color={colors.background} />
                <Text style={styles.emptyActionText}>Ajouter un véhicule</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.vehiclesList}>
            {filteredVehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onPress={() => handleVehiclePress(vehicle)}
                onEdit={() => router.push(`/vehicles/edit/${vehicle.id}`)}
                onDelete={() => handleDeleteVehicle(vehicle.id, `${vehicle.marque} ${vehicle.modele}`)}
                onHistory={() => handleHistoryPress(vehicle.id)}
                onEDL={() => handleEDLPress(vehicle.id, `${vehicle.marque} ${vehicle.modele}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <VehicleDetailModal
        visible={modalVisible}
        vehicle={selectedVehicle}
        onClose={() => setModalVisible(false)}
        onViewCosts={handleViewCosts}
        onEdit={handleEditVehicle}
      />

      <VehicleHistoryModal
        visible={historyModalVisible}
        vehicleId={selectedVehicleForHistory}
        onClose={() => {
          setHistoryModalVisible(false);
          setSelectedVehicleForHistory(null);
        }}
      />
      
      <VehicleChargesModal
        visible={costsModalVisible}
        vehicleId={selectedVehicleForCosts}
        onClose={() => {
          setCostsModalVisible(false);
          setSelectedVehicleForCosts(null);
        }}
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
    backgroundColor: colors.surface,
    paddingTop: 16,
    borderBottomColor: colors.border + '60',
    overflow: 'hidden',
  },
  headerContent: {
    flex: 1,
  },
  collapsibleContent: {
    flex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 10, // Ensure buttons stay on top
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  collapseButton: {
    width: 40,
    height: 40,
    borderRadius: 28,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border + '60',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 48,
    height: 48,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  collapsedSearchContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border + '60',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  filtersContainer: {
    paddingLeft: 20,
    marginBottom: 16,
  },
  filtersContent: {
    paddingRight: 20,
    gap: 8,
    paddingBottom: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterButtonActive: {
    borderColor: 'transparent',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  filterTextActive: {
    color: colors.background,
  },
  filterBadge: {
    backgroundColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  filterBadgeTextActive: {
    color: colors.background,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center', 
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyActionButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center', 
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 28,
    gap: 8,
  },
  emptyActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },
  vehiclesList: {
    padding: 20,
    gap: 16,
  },
});