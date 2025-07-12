import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Platform, Animated, PanResponder } from 'react-native';
import { Plus, Users, Search, ChevronUp, ChevronDown } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useClients } from '@/hooks/useClients';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import ClientDetailModal from '@/components/ClientDetailModal';
import ClientCard from '@/components/clients/ClientCard';

export default function ClientsScreen() {
  const { colors } = useTheme();
  const { clients, deleteClient, loading, error } = useClients();
  const [selectedClient, setSelectedClient] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterHeight] = useState(new Animated.Value(1));
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);

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
    outputRange: [60, 180], // Collapsed height vs full height
  });

  if (loading) {
    return <LoadingSpinner message="Chargement des clients..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  const handleDeleteClient = (clientId: string, clientName: string) => {
    Alert.alert(
      'Supprimer le client',
      `Êtes-vous sûr de vouloir supprimer ${clientName} ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteClient(clientId);
              Alert.alert('Succès', 'Le client a été supprimé avec succès');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le client. Veuillez réessayer.');
            }
          }
        }
      ]
    );
  };

  const handleClientPress = (client: any) => {
    setSelectedClient(client);
    setModalVisible(true);
  };

  const handleEditClient = (clientId: string) => {
    setModalVisible(false);
    router.push(`/clients/edit/${clientId}`);
  };

  // Filtrage des clients
  const filteredClients = clients.filter(client => {
    const searchTerm = searchQuery.toLowerCase();
    return client.prenom.toLowerCase().includes(searchTerm) ||
           client.nom.toLowerCase().includes(searchTerm) ||
           client.email?.toLowerCase().includes(searchTerm) ||
           client.telephone?.includes(searchTerm);
  });

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        style={[styles.header, { height: filterSectionHeight }]}
        {...panResponder.panHandlers}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Clients</Text>
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
                onPress={() => router.push('/clients/add')}
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
            {/* Barre de recherche */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Search size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Rechercher par nom, email ou téléphone..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>
          </Animated.View>

          {/* Always visible search bar when collapsed */}
          {isFilterCollapsed && (
            <View style={styles.collapsedSearchContainer}>
              <View style={styles.searchBar}>
                <Search size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Rechercher par nom, email ou téléphone..."
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
        {filteredClients.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'Aucun client trouvé' : 'Aucun client'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery 
                ? 'Essayez de modifier vos critères de recherche'
                : 'Commencez par ajouter votre premier client'
              }
            </Text>
            {!searchQuery && (
              <TouchableOpacity 
                style={styles.emptyActionButton}
                onPress={() => router.push('/clients/add')}
              >
                <Plus size={20} color={colors.background} />
                <Text style={styles.emptyActionText}>Ajouter un client</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.clientsList}>
            {filteredClients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onPress={() => handleClientPress(client)}
                onEdit={() => router.push(`/clients/edit/${client.id}`)}
                onDelete={() => handleDeleteClient(client.id, `${client.prenom} ${client.nom}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <ClientDetailModal
        visible={modalVisible}
        client={selectedClient}
        onClose={() => setModalVisible(false)}
        onEdit={handleEditClient}
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
    paddingBottom: 16,
    paddingBottom: 16,
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
    marginBottom: 16,
  },
  collapsedSearchContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    zIndex: 10,
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
    borderRadius: 48, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
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
  clientsList: {
    padding: 20,
    gap: 16,
  },
});