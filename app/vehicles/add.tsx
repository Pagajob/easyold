import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Save } from 'lucide-react-native';
import { useVehicles } from '../../hooks/useVehicles';
import { useTheme } from '../../contexts/ThemeContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { Vehicle } from '@/contexts/DataContext';

export default function AddVehicle() {
  const { colors } = useTheme();
  const { addVehicle } = useVehicles();
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    marque: '',
    modele: '',
    immatriculation: '',
    annee: '',
    couleur: '',
    carburant: 'Essence' as 'Essence' | 'Diesel' | 'Électrique' | 'Hybride',
    transmission: 'Manuelle',
    nombrePlaces: '5',
    prixJour: '',
    kilometrage: '',
    numeroSerie: '',
    statut: 'Disponible' as 'Disponible' | 'Loué' | 'Maintenance' | 'Indisponible',
    userId: user?.uid || '',
    financement: 'Achat comptant' as 'Achat comptant' | 'Leasing' | 'LLD' | 'Mise à disposition',
    assuranceMensuelle: '',
    notes: '',
    kilometrageJournalier: '',
    photo: undefined,
    prix_base_24h: 0,
  });

  const handleSave = async () => {
    if (!formData.marque || !formData.modele || !formData.immatriculation) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }
    // Contrôle de la valeur de statut
    const statutValide = ['Disponible', 'Loué', 'Maintenance', 'Indisponible'].includes(formData.statut) ? formData.statut : 'Disponible';
    // Contrôle de la valeur de carburant
    const carburantValide = ['Essence', 'Diesel', 'Électrique', 'Hybride'].includes(formData.carburant) ? formData.carburant : 'Essence';
    // Contrôle de la valeur de financement
    const financementValide = ['Achat comptant', 'Leasing', 'LLD', 'Mise à disposition'].includes(formData.financement) ? formData.financement : 'Achat comptant';
    setLoading(true);
    try {
      await addVehicle({
        ...formData,
        statut: statutValide,
        carburant: carburantValide,
        financement: financementValide,
        assuranceMensuelle: Number(formData.assuranceMensuelle) || 0,
        kilometrageJournalier: Number(formData.kilometrageJournalier) || 0,
        prix_base_24h: Number(formData.prix_base_24h) || 0,
      });
      Alert.alert('Succès', 'Véhicule ajouté avec succès', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ajouter le véhicule');
    } finally {
      setLoading(false);
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
      padding: 16,
      paddingTop: 16,
      paddingBottom: 16,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
      textAlign: 'center',
      marginRight: 24,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    formGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    saveButton: {
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 24,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajouter un véhicule</Text>
        <TouchableOpacity onPress={handleSave}>
          <Save size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Marque *</Text>
          <TextInput
            style={styles.input}
            value={formData.marque}
            onChangeText={(text) => setFormData({ ...formData, marque: text })}
            placeholder="Ex: Toyota"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Modèle *</Text>
          <TextInput
            style={styles.input}
            value={formData.modele}
            onChangeText={(text) => setFormData({ ...formData, modele: text })}
            placeholder="Ex: Corolla"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Immatriculation *</Text>
          <TextInput
            style={styles.input}
            value={formData.immatriculation}
            onChangeText={(text) => setFormData({ ...formData, immatriculation: text.toUpperCase() })}
            placeholder="Ex: AB-123-CD"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Année</Text>
          <TextInput
            style={styles.input}
            value={formData.annee}
            onChangeText={(text) => setFormData({ ...formData, annee: text })}
            placeholder="Ex: 2020"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Couleur</Text>
          <TextInput
            style={styles.input}
            value={formData.couleur}
            onChangeText={(text) => setFormData({ ...formData, couleur: text })}
            placeholder="Ex: Blanc"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Prix par jour (€)</Text>
          <TextInput
            style={styles.input}
            value={formData.prixJour}
            onChangeText={(text) => setFormData({ ...formData, prixJour: text })}
            placeholder="Ex: 50"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Kilométrage</Text>
          <TextInput
            style={styles.input}
            value={formData.kilometrage}
            onChangeText={(text) => setFormData({ ...formData, kilometrage: text })}
            placeholder="Ex: 50000"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Enregistrer</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}