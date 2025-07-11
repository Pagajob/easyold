import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { ArrowLeft, Save, Upload } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useData, Client } from '@/contexts/DataContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import * as DocumentPicker from 'expo-document-picker';
import { ClientService } from '@/services/firebaseService';

export default function AddClientScreen() {
  const { colors } = useTheme();
  const { addClient } = useData();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    email: '',
    adresse: '',
    permisConduire: '',
    carteIdentite: '',
    notes: '',
  });

  const pickDocument = async (type: 'permis' | 'carte') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        if (type === 'permis') {
          setFormData(prev => ({ ...prev, permisConduire: result.assets[0].uri }));
        } else {
          setFormData(prev => ({ ...prev, carteIdentite: result.assets[0].uri }));
        }
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner le document.');
    }
  };

  const uriToBlob = async (uri: string): Promise<Blob> => {
    const response = await fetch(uri);
    return await response.blob();
  };

  const handleAddressSelect = (address: string) => {
    setFormData(prev => ({ ...prev, adresse: address }));
  };

  const handleSave = async () => {
    if (!formData.prenom || !formData.nom) {
      Alert.alert('Erreur', 'Veuillez remplir au minimum le prénom et le nom.');
      return;
    }

    setIsLoading(true);

    try {
      const clientData: Omit<Client, 'id'> = {
        prenom: formData.prenom,
        nom: formData.nom,
        telephone: formData.telephone,
        email: formData.email,
        adresse: formData.adresse,
        permisConduire: '',
        carteIdentite: '',
        notes: formData.notes,
      };

      const tempClientId = Date.now().toString();

      if (formData.permisConduire) {
        const permisBlob = await uriToBlob(formData.permisConduire);
        const permisUrl = await ClientService.uploadDocument(tempClientId, permisBlob, 'permis');
        clientData.permisConduire = permisUrl;
      }

      if (formData.carteIdentite) {
        const carteBlob = await uriToBlob(formData.carteIdentite);
        const carteUrl = await ClientService.uploadDocument(tempClientId, carteBlob, 'carte');
        clientData.carteIdentite = carteUrl;
      }

      await addClient(clientData);
      router.back();
    } catch (error) {
      console.error('Error saving client:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder le client. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Nouveau client</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          disabled={isLoading}
        >
          <Save size={24} color={colors.background} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Informations personnelles</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>✏️ Prénom *</Text>
            <TextInput
              style={styles.input}
              value={formData.prenom}
              onChangeText={(text) => setFormData(prev => ({ ...prev, prenom: text }))}
              placeholder="Prénom"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>✏️ Nom *</Text>
            <TextInput
              style={styles.input}
              value={formData.nom}
              onChangeText={(text) => setFormData(prev => ({ ...prev, nom: text }))}
              placeholder="Nom de famille"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>📱 Téléphone</Text>
            <TextInput
              style={styles.input}
              value={formData.telephone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, telephone: text }))}
              placeholder="06 12 34 56 78"
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>📧 Email</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              placeholder="email@exemple.com"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <AddressAutocomplete
            value={formData.adresse}
            onAddressSelect={handleAddressSelect}
            label="📍 Adresse complète"
            placeholder="Commencez à taper votre adresse..."
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>🪪 Permis de conduire</Text>
            <TouchableOpacity 
              style={styles.documentButton}
              onPress={() => pickDocument('permis')}
            >
              <Upload size={20} color={colors.primary} />
              <Text style={styles.documentButtonText}>
                {formData.permisConduire ? 'Document ajouté' : 'Ajouter le permis'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>🪪 Carte d'identité</Text>
            <TouchableOpacity 
              style={styles.documentButton}
              onPress={() => pickDocument('carte')}
            >
              <Upload size={20} color={colors.primary} />
              <Text style={styles.documentButtonText}>
                {formData.carteIdentite ? 'Document ajouté' : 'Ajouter la carte d\'identité'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
            placeholder="Notes sur le client..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '600', color: colors.text },
  saveButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: { backgroundColor: colors.border },
  content: { flex: 1, padding: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 8 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 28,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  documentButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 28,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  documentButtonText: { fontSize: 14, color: colors.primary, fontWeight: '500' },
});
