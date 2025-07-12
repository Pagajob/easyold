import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Image } from 'react-native';
import { X, Car, Calendar, DollarSign, Settings, Fuel, MapPin, UserCheck, Clock, ChartBar as BarChart3 } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Vehicle, useData } from '@/contexts/DataContext';
import { Alert } from 'react-native';

interface VehicleDetailModalProps {
  visible: boolean;
  vehicle: Vehicle | null;
  onClose: () => void;
  onViewCosts?: (vehicleId: string) => void;
  onEdit: (vehicleId: string) => void;
}

export default function VehicleDetailModal({ visible, vehicle, onClose, onViewCosts, onEdit }: VehicleDetailModalProps) {
  const { colors } = useTheme();
  const { deleteVehicle } = useData();

  if (!vehicle) return null;

  const handleDeleteVehicle = () => {
    Alert.alert(
      'Supprimer le véhicule',
      `Êtes-vous sûr de vouloir supprimer ${vehicle.marque} ${vehicle.modele} ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVehicle(vehicle.id);
              Alert.alert(
                'Succès', 
                'Le véhicule a été supprimé avec succès',
                [{ text: 'OK', onPress: () => onClose() }]
              );
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le véhicule. Veuillez réessayer.');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Disponible': return colors.success;
      case 'Loué': return colors.warning;
      case 'Maintenance': return colors.error;
      case 'Indisponible': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  const formatPrice = (price: number | undefined) => {
    if (price === undefined || price === null) return '';
    return String(price.toLocaleString('fr-FR'));
  };

  const renderFinancementDetails = () => {
    switch (vehicle.financement) {
      case 'Achat comptant':
        return (
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Détails d'achat</Text>
            {vehicle.prixAchat && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Prix d'achat:</Text>
                <Text style={styles.detailValue}>{formatPrice(vehicle.prixAchat)} €</Text>
              </View>
            )}
            {vehicle.dateAchat && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date d'achat:</Text>
                <Text style={styles.detailValue}>{String(vehicle.dateAchat)}</Text>
              </View>
            )}
          </View>
        );

      case 'Leasing':
        return (
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Détails du leasing</Text>
            {vehicle.apportInitial && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Apport initial:</Text>
                <Text style={styles.detailValue}>{formatPrice(vehicle.apportInitial)} €</Text>
              </View>
            )}
            {vehicle.loyerMensuel && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Loyer mensuel:</Text>
                <Text style={styles.detailValue}>{formatPrice(vehicle.loyerMensuel)} €</Text>
              </View>
            )}
            {vehicle.dureeContrat && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Durée:</Text>
                <Text style={styles.detailValue}>{String(vehicle.dureeContrat)} mois</Text>
              </View>
            )}
            {vehicle.valeurResiduelle && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Valeur résiduelle:</Text>
                <Text style={styles.detailValue}>{formatPrice(vehicle.valeurResiduelle)} €</Text>
              </View>
            )}
          </View>
        );

      case 'LLD':
        return (
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Détails LLD</Text>
            {vehicle.loyerMensuel && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Loyer mensuel:</Text>
                <Text style={styles.detailValue}>{formatPrice(vehicle.loyerMensuel)} €</Text>
              </View>
            )}
            {vehicle.dureeContrat && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Durée:</Text>
                <Text style={styles.detailValue}>{String(vehicle.dureeContrat)} mois</Text>
              </View>
            )}
            {vehicle.kilometrageAutorise && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Kilométrage autorisé:</Text>
                <Text style={styles.detailValue}>{formatPrice(vehicle.kilometrageAutorise)} km</Text>
              </View>
            )}
          </View>
        );

      case 'Mise à disposition':
        return (
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Détails mise à disposition</Text>
            {vehicle.nomProprietaire && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Propriétaire:</Text>
                <Text style={styles.detailValue}>{String(vehicle.nomProprietaire)}</Text>
              </View>
            )}
            {vehicle.montantMensuel && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Montant mensuel:</Text>
                <Text style={styles.detailValue}>{formatPrice(vehicle.montantMensuel)} €</Text>
              </View>
            )}
            {vehicle.duree && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Durée:</Text>
                <Text style={styles.detailValue}>{String(vehicle.duree)} mois</Text>
              </View>
            )}
            {vehicle.conditionsParticulieres && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Conditions:</Text>
                <Text style={styles.detailValue}>{String(vehicle.conditionsParticulieres)}</Text>
              </View>
            )}
          </View>
        );

      default:
        return null;
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
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Détails du véhicule</Text>
          <TouchableOpacity 
            onPress={() => onEdit(vehicle.id)} 
            style={styles.editButton}
          >
            <Settings size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Photo et informations principales */}
          <View style={styles.mainSection}>
            {vehicle.photo ? (
              <Image source={{ uri: vehicle.photo }} style={styles.vehicleImage} />
            ) : (
              <View style={styles.vehiclePlaceholder}>
                <Car size={48} color={colors.textSecondary} />
              </View>
            )}
            
            <View style={styles.vehicleMainInfo}>
              <Text style={styles.vehicleName}>
                {String(vehicle.marque)} {String(vehicle.modele)}
              </Text>
              <Text style={styles.vehicleImmat}>{String(vehicle.immatriculation)}</Text>
              
              <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(vehicle.statut) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(vehicle.statut) }]}>
                    {String(vehicle.statut)}
                  </Text>
                </View>
                <View style={styles.carburantBadge}>
                  <Fuel size={14} color={colors.textSecondary} />
                  <Text style={styles.carburantText}>{String(vehicle.carburant)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Informations détaillées */}
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Informations générales</Text>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <MapPin size={16} color={colors.primary} />
              </View>
              <Text style={styles.detailLabel}>Kilométrage journalier:</Text>
              <Text style={styles.detailValue}>{String(vehicle.kilometrageJournalier)} km/jour</Text>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <DollarSign size={16} color={colors.primary} />
              </View>
              <Text style={styles.detailLabel}>Assurance mensuelle:</Text>
              <Text style={styles.detailValue}>{String(vehicle.assuranceMensuelle)} €/mois</Text>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Calendar size={16} color={colors.primary} />
              </View>
              <Text style={styles.detailLabel}>Type de financement:</Text>
              <Text style={styles.detailValue}>{String(vehicle.financement)}</Text>
            </View>
          </View>

          {/* Section Exigences Conducteur */}
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Exigences conducteur</Text>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <UserCheck size={16} color={colors.primary} />
              </View>
              <Text style={styles.detailLabel}>Âge minimal:</Text>
              <Text style={styles.detailValue}>{vehicle.ageMinimal || 21} ans</Text>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Clock size={16} color={colors.primary} />
              </View>
              <Text style={styles.detailLabel}>Années de permis requises:</Text>
              <Text style={styles.detailValue}>{vehicle.anneesPermis || 2} ans</Text>
            </View>
          </View>

          {/* Section Tarification */}
          {(vehicle.prix_base_24h || vehicle.prix_base_weekend) && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Tarification</Text>
              
              {vehicle.prix_base_24h && (
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <DollarSign size={16} color={colors.primary} /> 
                  </View>
                  <Text style={styles.detailLabel}>Prix de base (24h):</Text>
                  <Text style={styles.detailValue}>{String(vehicle.prix_base_24h)} €</Text>
                </View>
              )}

              {vehicle.prix_base_weekend && (
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <DollarSign size={16} color={colors.primary} />
                  </View>
                  <Text style={styles.detailLabel}>Prix de base (week-end):</Text>
                  <Text style={styles.detailValue}>{String(vehicle.prix_base_weekend)} €</Text>
                </View>
              )}

              {vehicle.prixKmSupplementaire && (
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <DollarSign size={16} color={colors.primary} />
                  </View>
                  <Text style={styles.detailLabel}>Prix km supplémentaire:</Text>
                  <Text style={styles.detailValue}>{String(vehicle.prixKmSupplementaire)} €/km</Text>
                </View>
              )}

              {vehicle.cautionDepart && (
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <DollarSign size={16} color={colors.primary} />
                  </View>
                  <Text style={styles.detailLabel}>Caution de départ:</Text>
                  <Text style={styles.detailValue}>{String(vehicle.cautionDepart)} €</Text>
                </View>
              )}

              {vehicle.cautionRSV && (
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <DollarSign size={16} color={colors.primary} />
                  </View>
                  <Text style={styles.detailLabel}>Caution RSV:</Text>
                  <Text style={styles.detailValue}>{String(vehicle.cautionRSV)} €</Text>
                </View>
              )}
            </View>
          )}

          {/* Détails du financement */}
          {renderFinancementDetails()}

          {/* Notes */}
          {vehicle.notes && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Notes</Text>
              <Text style={styles.notesText}>{String(vehicle.notes)}</Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.footer, { gap: 12 }]}>
          <View style={styles.footerButtons}>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDeleteVehicle}
          >
            <Text style={styles.deleteButtonText}>Supprimer</Text>
          </TouchableOpacity>
          
          {onViewCosts && (
            <TouchableOpacity 
              style={styles.costsButton}
              onPress={() => onViewCosts(vehicle.id)}
            >
              <BarChart3 size={20} color={colors.background} />
              <Text style={styles.costsButtonText}>Voir les coûts</Text>
            </TouchableOpacity>
          )}
          </View>

          <TouchableOpacity 
            style={styles.editButtonLarge}
            onPress={() => onEdit(vehicle.id)}
          >
            <Settings size={20} color={colors.background} />
            <Text style={styles.editButtonText}>Modifier le véhicule</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  editButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  mainSection: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vehicleImage: {
    width: '100%',
    height: 200,
    borderRadius: 28,
    marginBottom: 16,
  },
  vehiclePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 28,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  vehicleMainInfo: {
    alignItems: 'center',
  },
  vehicleName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  vehicleImmat: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 28,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  carburantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 28,
    gap: 6,
  },
  carburantText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  detailSection: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 16,
    marginBottom: 16,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  detailIcon: {
    width: 24,
    alignItems: 'center',
  },
  detailLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  notesText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12
  },
  deleteButton: {
    flex: 1,
    backgroundColor: colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 28
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background
  },
  costsButton: {
    flex: 1,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 28,
    gap: 8
  },
  costsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  editButtonLarge: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 28,
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
});