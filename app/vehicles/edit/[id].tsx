import React, { useState, useEffect } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Save } from 'lucide-react-native';
import { useVehicles } from '../../../hooks/useVehicles';
import { useTheme } from '../../../contexts/ThemeContext';
import LoadingSpinner from '../../../components/LoadingSpinner';

export default function EditVehicle() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  const { vehicles, updateVehicle } = useVehicles();
  const [loading, setLoading] = useState(false);
  const [vehicle, setVehicle] = useState(null);
  
  const [formData, setFormData] = useState({
    marque: '',
    modele: '',
    immatriculation: '',
    annee: '',
    couleur: '',
    carburant: 'Essence',
    transmission: 'Manuelle',
    nombrePlaces: '5',
    prixJour: '',
    kilometrage: '',
    numeroSerie: '',
    statut: 'Disponible',
  });

  useEffect(() => {
    const foundVehicle = vehicles.find(v => v.id === id);
    if (foundVehicle) {
      setVehicle(foundVehicle);
      setFormData({
        marque: foundVehicle.marque || '',
        modele: foundVehicle.modele || '',
        immatriculation: foundVehicle.immatriculation || '',
        annee: foundVehicle.annee?.toString() || '',
        couleur: foundVehicle.couleur || '',
        carburant: foundVehicle.carburant || 'Essence',
        transmission: foundVehicle.transmission || 'Manuelle',
        nombrePlaces: foundVehicle.nombrePlaces?.toString() || '5',
        prixJour: foundVehicle.prixJour?.toString() || '',
        kilometrage: foundVehicle.kilometrage?.toString() || '',
        numeroSerie: foundVehicle.numeroSerie || '',
        statut: foundVehicle.statut || 'Disponible',
      });
    }
  }, [id, vehicles]);

  const handleSave = async () => {
    if (!formData.marque || !formData.modele || !formData.immatriculation) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      await updateVehicle(id, formData);
      Alert.alert('Succès', 'Véhicule modifié avec succès', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier le véhicule');
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
      backgroundColor: colors.card,
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

  if (loading || !vehicle) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier le véhicule</Text>
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