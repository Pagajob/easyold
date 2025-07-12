import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, Dimensions, Alert } from 'react-native';
import { Car, Fuel, FileText, X, Download } from 'lucide-react-native';
import * as MediaLibrary from 'expo-media-library';
import { useTheme } from '@/contexts/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface VehicleCardProps {
  marque: string;
  modele: string;
  immatriculation: string;
  photoUrl?: string;
  carburant: string;
  kilometrageJournalier?: number;
  statut: string;
}

export default function VehicleCard({
  marque,
  modele,
  immatriculation,
  photoUrl,
  carburant,
  kilometrageJournalier,
  statut
}: VehicleCardProps) {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const styles = createStyles(colors);

  const handleImagePress = () => {
    if (photoUrl) setModalVisible(true);
  };

  const handleSaveToGallery = async () => {
    if (!photoUrl) return;
    try {
      setSaving(true);
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Impossible d\'enregistrer l\'image sans accès à la galerie.');
        setSaving(false);
        return;
      }
      const asset = await MediaLibrary.createAssetAsync(photoUrl);
      await MediaLibrary.createAlbumAsync('Téléchargements EDL', asset, false);
      Alert.alert('Succès', 'Image enregistrée dans la pellicule !');
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer l\'image.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.photoContainer} onPress={handleImagePress} disabled={!photoUrl}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Car size={40} color={colors.textSecondary} />
            <Text style={styles.photoPlaceholderText}>Aucune photo</Text>
          </View>
        )}
        <View style={styles.badgeCarburant}>
          <Fuel size={14} color={colors.background} />
          <Text style={styles.badgeCarburantText}>{carburant}</Text>
        </View>
      </TouchableOpacity>
      <View style={styles.infoSection}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{marque} {modele}</Text>
          <View style={styles.statutBadge}>
            <Text style={styles.statutBadgeText}>{statut}</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <FileText size={14} color={colors.primary} />
          <Text style={styles.detailLabel}>Immatriculation:</Text>
          <Text style={styles.detailValue}>{immatriculation}</Text>
        </View>
        <View style={styles.detailRow}>
          <Fuel size={14} color={colors.primary} />
          <Text style={styles.detailLabel}>Kilométrage journalier:</Text>
          <Text style={styles.detailValue}>{kilometrageJournalier ? `${kilometrageJournalier} km/jour` : 'Non spécifié'}</Text>
        </View>
      </View>

      {/* Modal d'agrandissement de la photo */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Photo du véhicule</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            {photoUrl && (
              <Image
                source={{ uri: photoUrl }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            )}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveToGallery}
              disabled={saving}
            >
              <Download size={20} color={colors.background} />
              <Text style={styles.saveButtonText}>{saving ? 'Enregistrement...' : 'Enregistrer dans la pellicule'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    overflow: 'hidden',
  },
  photoContainer: {
    width: '100%',
    height: 160,
    backgroundColor: colors.background,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.border,
  },
  photoPlaceholderText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  badgeCarburant: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeCarburantText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  infoSection: {
    padding: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  statutBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statutBadgeText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
    marginRight: 10,
    minWidth: 100,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    width: screenWidth * 0.85,
    maxHeight: screenHeight * 0.8,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 18,
    backgroundColor: colors.surface,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 