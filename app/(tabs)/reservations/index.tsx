import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Animated, PanResponder } from 'react-native';
import { Plus, Calendar, Search, CreditCard as Edit, ChevronUp, ChevronDown } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useReservations } from '@/hooks/useReservations';
import { useVehicles } from '@/hooks/useVehicles';
import { useClients } from '@/hooks/useClients';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import EditReservationModal from '@/components/reservations/EditReservationModal';
import SuccessToast from '@/components/reservations/SuccessToast';
import ReservationCard from '@/components/reservations/ReservationCard';

const STATUS_FILTERS = [
  { key: 'all', label: 'Toutes', color: '#64748B' },
  { key: 'Planifiée', label: 'Planifiées', color: '#3B82F6' },
  { key: 'Confirmé', label: 'Confirmées', color: '#10B981' },
  { key: 'En cours', label: 'En cours', color: '#F59E0B' },
  { key: 'Terminé', label: 'Terminées', color: '#6B7280' },
  { key: 'Annulé', label: 'Annulées', color: '#EF4444' },
];

export default function ReservationsScreen() {
  const { colors } = useTheme();
  const { reservations, canStartEDL, loading, error } = useReservations();
  const { getVehicleName } = useVehicles();
  const { getClientName } = useClients();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [successToastVisible, setSuccessToastVisible] = useState(false);
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
    outputRange: [80, 260], // Collapsed height vs full height
  });

  if (loading) {
    return <LoadingSpinner message="Chargement des réservations..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  const handleEditReservation = (reservation) => {
    setSelectedReservation(reservation);
    setEditModalVisible(true);
  };

  const handleEditSuccess = () => {
    setSuccessToastVisible(true);
  };

  // Filtrage des réservations
  const filteredReservations = reservations.filter(reservation => {
    const vehicleName = getVehicleName(reservation.vehiculeId).toLowerCase();
    const clientName = getClientName(reservation.clientId).toLowerCase();
    
    const matchesSearch = 
      vehicleName.includes(searchQuery.toLowerCase()) ||
      clientName.includes(searchQuery.toLowerCase()) ||
      reservation.typeContrat.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = activeFilter === 'all' || reservation.statut === activeFilter;
    
    return matchesSearch && matchesFilter;
  });

  // Statistiques
  const stats = {
    total: reservations.length,
    planifiee: reservations.filter(r => r.statut === 'Planifiée').length,
    confirmee: reservations.filter(r => r.statut === 'Confirmé').length,
    enCours: reservations.filter(r => r.statut === 'En cours').length,
    terminee: reservations.filter(r => r.statut === 'Terminé').length,
    annulee: reservations.filter(r => r.statut === 'Annulé').length,
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
            <Text style={styles.title}>Réservations</Text>
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
                onPress={() => router.push('/reservations/add')}
              >
                <Plus size={24} color={colors.background} />
              </TouchableOpacity>
            </View>
          </View>

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
                <Text style={[styles.statNumber, { color: colors.info }]}>{stats.planifiee}</Text>
                <Text style={styles.statLabel}>Planifiées</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: colors.success }]}>{stats.confirmee}</Text>
                <Text style={styles.statLabel}>Confirmées</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: colors.warning }]}>{stats.enCours}</Text>
                <Text style={styles.statLabel}>En cours</Text>
              </View>
            </View>

            {/* Barre de recherche */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Search size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Rechercher par véhicule, client ou type..."
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
              {STATUS_FILTERS.map((filter) => (
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
                    <Text>
                      {filter.key === 'Planifiée' ? '🗓️ ' : 
                       filter.key === 'Confirmé' ? '✅ ' : 
                       filter.key === 'En cours' ? '🚗 ' : 
                       filter.key === 'Terminé' ? '✔️ ' : 
                       filter.key === 'Annulé' ? '❌ ' : 
                       '🔍 '}
                    {filter.label}
                    </Text>
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
                        {filter.key === 'Planifiée' ? stats.planifiee :
                         filter.key === 'Confirmé' ? stats.confirmee :
                         filter.key === 'En cours' ? stats.enCours :
                         filter.key === 'Terminé' ? stats.terminee :
                         stats.annulee}
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
                  placeholder="Rechercher par véhicule, client ou type..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>
          )}
        </View>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {filteredReservations.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>
              {searchQuery || activeFilter !== 'all' 
                ? 'Aucune réservation trouvée' 
                : 'Aucune réservation'
              }
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || activeFilter !== 'all'
                ? 'Essayez de modifier vos critères de recherche'
                : 'Commencez par créer votre première réservation'
              }
            </Text>
            {(!searchQuery && activeFilter === 'all') && (
              <TouchableOpacity 
                style={styles.emptyActionButton}
                onPress={() => router.push('/reservations/add')}
              >
                <Plus size={20} color={colors.background} />
                <Text style={styles.emptyActionText}>Nouvelle réservation</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.reservationsList}>
            {filteredReservations
              .sort((a, b) => new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime())
              .map((reservation) => (
                <ReservationCard
                  key={reservation.id}
                  reservation={reservation}
                  vehicleName={getVehicleName(reservation.vehiculeId)}
                  clientName={getClientName(reservation.clientId)}
                  onPress={() => router.push(`/reservations/details/${reservation.id}`)}
                  onEdit={() => handleEditReservation(reservation)}
                  onEDLPress={() => router.push(`/reservations/edl/${reservation.id}`)}
                  canStartEDL={canStartEDL(reservation)}
                />
              ))}
          </View>
        )}
      </ScrollView>
      
      {/* Modal de modification */}
      <EditReservationModal
        visible={editModalVisible}
        reservation={selectedReservation}
        onClose={() => setEditModalVisible(false)}
        onSuccess={handleEditSuccess}
      />
      
      {/* Toast de succès */}
      <SuccessToast
        visible={successToastVisible}
        message="Réservation modifiée avec succès"
        onClose={() => setSuccessToastVisible(false)}
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
    paddingVertical: 12,
    gap: 12,
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
    paddingHorizontal: 8,
    paddingVertical: 3,
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
  reservationsList: {
    padding: 20,
    gap: 16,
  },
});