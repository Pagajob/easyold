import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { ArrowLeft, Save, Upload } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useData, Client } from '@/contexts/DataContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { ClientService } from '@/services/firebaseService';
import AddressAutocomplete from '@/components/AddressAutocomplete';

export default function EditClientScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  const { clients, updateClient } = useData();
  const [isLoading, setIsLoading] = useState(false);

  const client = clients.find(c => c.id === id);

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

  useEffect(() => {
    if (client) {
      setFormData({
        prenom: client.prenom || '',
        nom: client.nom || '',
        telephone: client.telephone || '',
        email: client.email || '',
        adresse: client.adresse || '',
        permisConduire: client.permisConduire || '',
        carteIdentite: client.carteIdentite || '',
        notes: client.notes || '',
      });
    }
  }, [client]);

  if (!client) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Client introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  const pickDocument = async (type: 'permis' | 'carte') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setFormData(prev => ({
          ...prev,
          [type === 'permis' ? 'permisConduire' : 'carteIdentite']: uri
        }));
      }
    } catch {
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
      const clientData: Partial<Client> = {
        prenom: formData.prenom,
        nom: formData.nom,
        telephone: formData.telephone,
        email: formData.email,
        adresse: formData.adresse,
        notes: formData.notes,
      };

      if (formData.permisConduire && formData.permisConduire !== client.permisConduire) {
        const blob = await uriToBlob(formData.permisConduire);
        clientData.permisConduire = await ClientService.uploadDocument(client.id, blob, 'permis');
      }

      if (formData.carteIdentite && formData.carteIdentite !== client.carteIdentite) {
        const blob = await uriToBlob(formData.carteIdentite);
        clientData.carteIdentite = await ClientService.uploadDocument(client.id, blob, 'carte');
      }

      await updateClient(client.id, clientData);
      router.back();
    } catch {
      Alert.alert('Erreur', 'Impossible de modifier le client. Veuillez réessayer.');
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
        <Text style={styles.title}>Modifier le client</Text>
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

          {['prenom', 'nom', 'telephone', 'email'].map(field => (
            <View style={styles.inputGroup} key={field}>
              <Text style={styles.label}>{field === 'prenom' ? 'Prénom *' : field === 'nom' ? 'Nom *' : field.charAt(0).toUpperCase() + field.slice(1)}</Text>
              <TextInput
                style={styles.input}
                value={formData[field]}
                onChangeText={(text) => setFormData(prev => ({ ...prev, [field]: text }))}
                placeholder={field === 'prenom' ? 'Prénom' : field === 'nom' ? 'Nom de famille' : field}
                placeholderTextColor={colors.textSecondary}
                keyboardType={field === 'telephone' ? 'phone-pad' : 'default'}
                autoCapitalize="none"
              />
            </View>
          ))}

          <AddressAutocomplete
            value={formData.adresse}
            onAddressSelect={handleAddressSelect}
            label="📍 Adresse complète"
            placeholder="Commencez à taper votre adresse..."
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📎 Documents</Text>

          {['permisConduire', 'carteIdentite'].map(type => (
            <View style={styles.inputGroup} key={type}>
              <Text style={styles.label}>{type === 'permisConduire' ? 'Permis de conduire' : "Carte d'identité"}</Text>
              <TouchableOpacity
                style={styles.documentButton}
                onPress={() => pickDocument(type === 'permisConduire' ? 'permis' : 'carte')}
              >
                <Upload size={20} color={colors.primary} />
                <Text style={styles.documentButtonText}>
                  {formData[type] ? 'Document modifié' : 'Modifier'}
                </Text>
              </TouchableOpacity>
              {client[type] && !formData[type] && (
                <Text style={styles.currentDocumentText}>Document actuel conservé</Text>
              )}
            </View>
          ))}
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '600', color: colors.text },
  saveButton: {
    backgroundColor: colors.primary, width: 40, height: 40, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  saveButtonDisabled: { backgroundColor: colors.border },
  content: { flex: 1, padding: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 8 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 28, padding: 16, fontSize: 16, color: colors.text,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  documentButton: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary,
    borderStyle: 'dashed', borderRadius: 28, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  documentButtonText: { fontSize: 14, color: colors.primary, fontWeight: '500' },
  currentDocumentText: { fontSize: 12, color: colors.success, marginTop: 4, fontStyle: 'italic' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 18, color: colors.error },
});
