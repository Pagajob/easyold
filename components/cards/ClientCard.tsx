import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, Dimensions, Platform, Alert } from 'react-native';
import { User, FileText, X, Download } from 'lucide-react-native';
import * as MediaLibrary from 'expo-media-library';
import { useTheme } from '@/contexts/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ClientCardProps {
  nom: string;
  prenom: string;
  telephone?: string;
  reservationId?: string;
  permisUrl?: string;
  cniUrl?: string;
}

export default function ClientCard({
  nom,
  prenom,
  telephone,
  reservationId,
  permisUrl,
  cniUrl
}: ClientCardProps) {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [modalLabel, setModalLabel] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const styles = createStyles(colors);

  const getInitials = () => {
    if (!prenom && !nom) return '';
    return `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase();
  };

  const handleImagePress = (url: string, label: string) => {
    setModalImage(url);
    setModalLabel(label);
    setModalVisible(true);
  };

  const handleSaveToGallery = async () => {
    if (!modalImage) return;
    try {
      setSaving(true);
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Impossible d\'enregistrer l\'image sans accès à la galerie.');
        setSaving(false);
        return;
      }
      const asset = await MediaLibrary.createAssetAsync(modalImage);
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
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials()}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{prenom} {nom}</Text>
          {telephone && <Text style={styles.phone}>{telephone}</Text>}
        </View>
        {reservationId && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>#{reservationId.slice(-8)}</Text>
          </View>
        )}
      </View>

      <View style={styles.docsRow}>
        <TouchableOpacity
          style={styles.docItem}
          disabled={!permisUrl}
          onPress={() => permisUrl && handleImagePress(permisUrl, 'Permis de conduire')}
        >
          {permisUrl ? (
            <Image source={{ uri: permisUrl }} style={styles.docImage} resizeMode="cover" />
          ) : (
            <View style={styles.docPlaceholder}>
              <FileText size={28} color={colors.textSecondary} />
            </View>
          )}
          <Text style={styles.docLabel}>Permis de conduire</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.docItem}
          disabled={!cniUrl}
          onPress={() => cniUrl && handleImagePress(cniUrl, "Carte d'identité")}
        >
          {cniUrl ? (
            <Image source={{ uri: cniUrl }} style={styles.docImage} resizeMode="cover" />
          ) : (
            <View style={styles.docPlaceholder}>
              <FileText size={28} color={colors.textSecondary} />
            </View>
          )}
          <Text style={styles.docLabel}>Carte d'identité</Text>
        </TouchableOpacity>
      </View>

      {/* Modal d'agrandissement */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalLabel}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            {modalImage && (
              <Image
                source={{ uri: modalImage }}
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
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: colors.background,
    fontSize: 22,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  phone: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  docsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
  },
  docItem: {
    flex: 1,
    alignItems: 'center',
  },
  docImage: {
    width: 90,
    height: 60,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  docPlaceholder: {
    width: 90,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  docLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
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