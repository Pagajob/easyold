import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search, Plus, DollarSign, Settings, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useCharges } from '@/hooks/useCharges';
import { useVehicles } from '@/hooks/useVehicles';
import { Charge } from '@/contexts/DataContext';
import { router } from 'expo-router';
import ChargeModal from '@/components/dashboard/ChargeModal';

export default function CostRecordsScreen() {
  const { colors } = useTheme();
  const { charges, deleteCharge } = useCharges();
  const { getVehicleName } = useVehicles();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCharge, setEditingCharge] = useState<Charge | null>(null);

  // Filter charges based on search query
  const filteredCharges = charges.filter(charge => {
    const searchTerm = searchQuery.toLowerCase();
    return charge.nom.toLowerCase().includes(searchTerm) ||
           (charge.vehiculeId && getVehicleName(charge.vehiculeId).toLowerCase().includes(searchTerm));
  });

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

  const openModal = (charge?: Charge) => {
    setEditingCharge(charge || null);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingCharge(null);
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
      textAlign: 'center',
    },
    addButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchContainer: {
      padding: 16,
      paddingTop: 0,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
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
      marginBottom: 24,
    },
    emptyActionButton: {
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      gap: 8,
    },
    emptyActionText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.background,
    },
    chargeCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
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
      alignItems: 'center',
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Liste des charges</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => openModal()}
        >
          <Plus size={20} color={colors.background} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher par nom ou véhicule..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.content}>
        {filteredCharges.length === 0 ? (
          <View style={styles.emptyState}>
            <DollarSign size={48} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'Aucun résultat trouvé' : 'Aucune charge'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery 
                ? 'Essayez de modifier vos critères de recherche' 
                : 'Ajoutez vos premières charges pour suivre vos dépenses'
              }
            </Text>
            {!searchQuery && (
              <TouchableOpacity 
                style={styles.emptyActionButton}
                onPress={() => openModal()}
              >
                <Plus size={20} color={colors.background} />
                <Text style={styles.emptyActionText}>Ajouter une charge</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredCharges}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const status = item.type === 'Fixe' ? colors.success : colors.warning;
              
              return (
                <View style={styles.chargeCard}>
                  <View style={styles.chargeHeader}>
                    <View style={styles.chargeInfo}>
                      <Text style={styles.chargeName}>{item.nom}</Text>
                      <Text style={styles.chargeVehicle}>
                        {getVehicleNameForCharge(item.vehiculeId)}
                      </Text>
                    </View>
                    
                    <View style={styles.chargeActions}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => openModal(item)}
                      >
                        <Settings size={14} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteCharge(item.id, item.nom)}
                      >
                        <Trash2 size={14} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.chargeDetails}>
                    <View style={styles.chargeAmount}>
                      <Text style={styles.amountValue}>
                        {item.montantMensuel.toLocaleString('fr-FR')} €
                      </Text>
                      <Text style={styles.amountFrequency}>
                        {getFrequencyLabel(item.frequence)}
                      </Text>
                    </View>

                    <View style={[styles.typeBadge, { 
                      backgroundColor: status + '20' 
                    }]}>
                      <Text style={[styles.typeText, { 
                        color: status 
                      }]}>
                        {item.type}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.chargeFooter}>
                    <Text style={styles.dateText}>
                      Depuis le {new Date(item.dateDebut).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                </View>
              );
            }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <ChargeModal
        visible={modalVisible}
        charge={editingCharge}
        onClose={closeModal}
      />
    </SafeAreaView>
  );
}