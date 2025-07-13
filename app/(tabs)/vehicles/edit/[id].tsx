import React, { useState, useEffect } from 'react';
import {
  View,
  Text, 
  TextInput, 
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Switch, 
  Image,
  Platform,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Camera, Save, Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useVehicles } from '@/hooks/useVehicles'; 
import { VehicleService } from '@/services/firebaseService';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import * as ImagePicker from 'expo-image-picker';

// Get current year for permit year dropdown
const currentYear = new Date().getFullYear();
// Generate age options (18-100)
const ageOptions = Array.from({ length: 83 }, (_, i) => i + 18);

// Generate experience options (0-50 years)
const experienceOptions = Array.from({ length: 51 }, (_, i) => i);

export default function EditVehicleScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  const { vehicles, updateVehicle, loading, error } = useVehicles();
  
  const [formData, setFormData] = useState({
    marque: '',
    modele: '',
    immatriculation: '',
    photo: '',
    carburant: 'Essence' as 'Essence' | 'Diesel' | 'Électrique' | 'Hybride',
    financement: 'Achat comptant' as 'Achat comptant' | 'Leasing' | 'LLD' | 'Mise à disposition',
    statut: 'Disponible' as 'Disponible' | 'Loué' | 'Maintenance' | 'Indisponible',
    notes: '',
    kilometrageJournalier: 200,
    prix_base_24h: 0,
    prix_base_weekend: 0,
    prixKmSupplementaire: 0,
    cautionDepart: 0,
    cautionRSV: 0,
    ageMinimal: 21,
    anneesPermis: 2,
    assuranceMensuelle: 0,
    prixAchat: 0,
    apportInitial: 0,
    mensualites: 0,
    valeurResiduelle: 0,
    loyerMensuel: 0,
    cautionDeposee: 0,
    nomProprietaire: '',
    prixReverse24h: 0,
    prixReverseWeekend: 0,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (id && vehicles.length > 0) {
      const vehicle = vehicles.find(v => v.id === id);
      if (vehicle) {
        // Initialiser le formulaire avec les données du véhicule
        setFormData({
          marque: vehicle.marque || '',
          modele: vehicle.modele || '',
          immatriculation: vehicle.immatriculation || '',
          photo: vehicle.photo || '',
          carburant: vehicle.carburant || 'Essence',
          financement: vehicle.financement || 'Achat comptant',
          statut: vehicle.statut || 'Disponible',
          notes: vehicle.notes || '',
          kilometrageJournalier: vehicle.kilometrageJournalier || 200,
          prix_base_24h: vehicle.prix_base_24h || 0,
          prix_base_weekend: vehicle.prix_base_weekend || 0,
          prixKmSupplementaire: vehicle.prixKmSupplementaire || 0,
          cautionDepart: vehicle.cautionDepart || 0,
          cautionRSV: vehicle.cautionRSV || 0,
          ageMinimal: vehicle.ageMinimal || 21,
          anneesPermis: vehicle.anneesPermis || 0,
          assuranceMensuelle: vehicle.assuranceMensuelle || 0,
          prixAchat: vehicle.prixAchat || 0,
          apportInitial: vehicle.apportInitial || 0,
          mensualites: vehicle.mensualites || 0,
          valeurResiduelle: vehicle.valeurResiduelle || 0,
          loyerMensuel: vehicle.loyerMensuel || 0,
          cautionDeposee: vehicle.cautionDeposee || 0,
          nomProprietaire: vehicle.nomProprietaire || '',
          prixReverse24h: vehicle.prixReverse24h || 0,
          prixReverseWeekend: vehicle.prixReverseWeekend || 0,
        });
      }
    }
  }, [id, vehicles]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Nous avons besoin de la permission pour accéder à vos photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData(prev => ({ ...prev, photo: result.assets[0].uri }));
    }
  };

  // Convert URI to Blob for upload
  const uriToBlob = async (uri: string): Promise<Blob> => {
    const response = await fetch(uri);
    return await response.blob();
  };

  const handleSubmit = async () => {
    if (!formData.marque || !formData.modele || !formData.immatriculation) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setIsSubmitting(true);
    try {
      let vehicleData: any = { ...formData };
      
      // Si la photo a été modifiée (URI local), la télécharger
      if (formData.photo && (
          formData.photo.startsWith('file://') || 
          formData.photo.startsWith('data:') ||
          formData.photo.startsWith('blob:')
      )) {
        setIsUploading(true);
        try {
          const photoBlob = await uriToBlob(formData.photo);
          const photoUrl = await VehicleService.uploadPhoto(id as string, photoBlob);
          vehicleData.photo = photoUrl;
        } catch (error) {
          console.warn('Failed to upload photo:', error);
          // Continue without updating photo
          delete vehicleData.photo;
        } finally {
          setIsUploading(false);
        }
      }
      
      await updateVehicle(id as string, vehicleData);
      Alert.alert('Succès', 'Véhicule modifié avec succès');
      router.back();
    } catch (error) {
      console.error('Error updating vehicle:', error);
      Alert.alert('Erreur', 'Impossible de modifier le véhicule. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFinancementDetails = () => {
    switch (formData.financement) {
      case 'Achat comptant':
        return (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Prix d'achat (€)</Text>
            <TextInput
              style={styles.input}
              value={formData.prixAchat.toString()}
              onChangeText={(text) => setFormData(prev => ({ ...prev, prixAchat: parseFloat(text) || 0 }))}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        );

      case 'Leasing':
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Apport initial (€)</Text>
              <TextInput
                style={styles.input}
                value={formData.apportInitial.toString()}
                onChangeText={(text) => setFormData(prev => ({ ...prev, apportInitial: parseFloat(text) || 0 }))}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mensualités (€)</Text>
              <TextInput
                style={styles.input}
                value={formData.mensualites.toString()}
                onChangeText={(text) => setFormData(prev => ({ ...prev, mensualites: parseFloat(text) || 0 }))}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Valeur résiduelle (€)</Text>
              <TextInput
                style={styles.input}
                value={formData.valeurResiduelle.toString()}
                onChangeText={(text) => setFormData(prev => ({ ...prev, valeurResiduelle: parseFloat(text) || 0 }))}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </>
        );

      case 'LLD':
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Loyer mensuel (€)</Text>
              <TextInput
                style={styles.input}
                value={formData.loyerMensuel.toString()}
                onChangeText={(text) => setFormData(prev => ({ ...prev, loyerMensuel: parseFloat(text) || 0 }))}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Caution déposée (€)</Text>
              <TextInput
                style={styles.input}
                value={formData.cautionDeposee.toString()}
                onChangeText={(text) => setFormData(prev => ({ ...prev, cautionDeposee: parseFloat(text) || 0 }))}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </>
        );

      case 'Mise à disposition':
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom du propriétaire</Text>
              <TextInput
                style={styles.input}
                value={formData.nomProprietaire}
                onChangeText={(text) => setFormData(prev => ({ ...prev, nomProprietaire: text }))}
                placeholder="Nom du propriétaire"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Prix reversé 24H (€)</Text>
              <TextInput
                style={styles.input}
                value={formData.prixReverse24h.toString()}
                onChangeText={(text) => setFormData(prev => ({ ...prev, prixReverse24h: parseFloat(text) || 0 }))}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Prix reversé weekend 48H (€)</Text>
              <TextInput
                style={styles.input}
                value={formData.prixReverseWeekend.toString()}
                onChangeText={(text) => setFormData(prev => ({ ...prev, prixReverseWeekend: parseFloat(text) || 0 }))}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}> 
      <View style={styles.header}> 
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}> 
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Modifier le véhicule</Text> 
        <TouchableOpacity 
          onPress={handleSubmit} 
          style={[styles.saveButton, (isSubmitting || isUploading) && styles.saveButtonDisabled]}
          disabled={isSubmitting || isUploading}
        >
          {isSubmitting || isUploading ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Save size={24} color={colors.background} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📸 Photo du véhicule</Text>
          <TouchableOpacity 
            style={styles.photoButton} 
            onPress={pickImage}
          >
            {formData.photo ? (
              <Image 
                source={{ uri: formData.photo }} 
                style={styles.photoPreview} 
                resizeMode="cover"
              />
            ) : (
              <>
                <Camera size={32} color={colors.textSecondary} />
                <Text style={styles.photoButtonText}>Ajouter une photo (4x5)</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ Informations générales</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Marque *</Text>
            <TextInput
              style={styles.input}
              value={formData.marque}
              onChangeText={(text) => setFormData(prev => ({ ...prev, marque: text }))}
              placeholder="Ex: Audi"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Modèle *</Text>
            <TextInput
              style={styles.input}
              value={formData.modele}
              onChangeText={(text) => setFormData(prev => ({ ...prev, modele: text }))}
              placeholder="Ex: A3"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Immatriculation *</Text>
            <TextInput
              style={styles.input}
              value={formData.immatriculation}
              onChangeText={(text) => setFormData(prev => ({ ...prev, immatriculation: text.toUpperCase() }))}
              placeholder="Ex: AB-123-CD"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Type de carburant</Text>
            <View style={styles.optionsContainer}>
              {['Essence', 'Diesel', 'Électrique', 'Hybride'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    formData.carburant === option && styles.optionButtonActive
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, carburant: option as any }))}
                >
                  <Text style={[
                    styles.optionText,
                    formData.carburant === option && styles.optionTextActive
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Statut</Text>
            <View style={styles.optionsContainer}>
              {['Disponible', 'Loué', 'Maintenance', 'Indisponible'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    formData.statut === option && styles.optionButtonActive
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, statut: option as any }))}
                >
                  <Text style={[
                    styles.optionText,
                    formData.statut === option && styles.optionTextActive
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kilométrage journalier inclus</Text>
            <TextInput
              style={styles.input}
              value={formData.kilometrageJournalier.toString()}
              onChangeText={(text) => setFormData(prev => ({ ...prev, kilometrageJournalier: parseInt(text) || 0 }))}
              keyboardType="numeric"
              placeholder="200"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Prix du km supplémentaire (€)</Text>
            <TextInput
              style={styles.input}
              value={formData.prixKmSupplementaire.toString()}
              onChangeText={(text) => setFormData(prev => ({ ...prev, prixKmSupplementaire: parseFloat(text) || 0 }))}
              keyboardType="numeric"
              placeholder="0.50"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        {/* Section Tarification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tarification</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tarif 24H *</Text>
            <TextInput
              style={styles.input}
              value={formData.prix_base_24h.toString()}
              onChangeText={(text) => setFormData(prev => ({ ...prev, prix_base_24h: parseFloat(text) || 0 }))}
              keyboardType="numeric"
              placeholder="49.99"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tarif weekend 48H</Text>
            <TextInput
              style={styles.input}
              value={formData.prix_base_weekend?.toString() || ''}
              onChangeText={(text) => setFormData(prev => ({ ...prev, prix_base_weekend: parseFloat(text) || 0 }))}
              keyboardType="numeric"
              placeholder="89.99"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Caution de départ (€)</Text>
            <TextInput
              style={styles.input}
              value={formData.cautionDepart.toString()}
              onChangeText={(text) => setFormData(prev => ({ ...prev, cautionDepart: parseFloat(text) || 0 }))}
              keyboardType="numeric"
              placeholder="500"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Caution RSV (€)</Text>
            <TextInput
              style={styles.input}
              value={formData.cautionRSV.toString()}
              onChangeText={(text) => setFormData(prev => ({ ...prev, cautionRSV: parseFloat(text) || 0 }))}
              keyboardType="numeric"
              placeholder="1000"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type de financement</Text>
          <View style={styles.optionsContainer}>
            {['Achat comptant', 'Leasing', 'LLD', 'Mise à disposition'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  formData.financement === option && styles.optionButtonActive
                ]}
                onPress={() => setFormData(prev => ({ ...prev, financement: option as any }))}
              >
                <Text style={[
                  styles.optionText,
                  formData.financement === option && styles.optionTextActive
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Assurance mensuelle - toujours affichée */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Assurance mensuelle (€)</Text>
            <TextInput
              style={styles.input}
              value={formData.assuranceMensuelle.toString()}
              onChangeText={(text) => setFormData(prev => ({ ...prev, assuranceMensuelle: parseFloat(text) || 0 }))}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Champs conditionnels selon le financement */}
          {renderFinancementDetails()}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exigences conducteur</Text>
          
          <View style={styles.inputGroup}> 
            <Text style={styles.label}>Âge minimal du conducteur</Text> 
            <View style={styles.pickerContainer}>
              <View style={styles.glassmorphicContainer}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.pickerContent}
                >
                  {ageOptions.map((age) => (
                    <TouchableOpacity
                      key={`age-${age}`}
                      style={[
                        styles.glassmorphicOption,
                        formData.ageMinimal === age && styles.glassmorphicOptionSelected
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, ageMinimal: age }))}
                      activeOpacity={0.8}
                    >
                      <Text 
                        style={[
                          styles.glassmorphicOptionText,
                          formData.ageMinimal === age && styles.glassmorphicOptionTextSelected
                        ]}
                      >
                        {age}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}> 
            <Text style={styles.label}>Années de permis requises</Text>
            <View style={styles.pickerContainer}>
              <View style={styles.glassmorphicContainer}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.pickerContent}
                >
                  {experienceOptions.map((years) => (
                    <TouchableOpacity
                      key={`exp-${years}`}
                      style={[
                        styles.glassmorphicOption,
                        formData.anneesPermis === years && styles.glassmorphicOptionSelected
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, anneesPermis: years }))}
                      activeOpacity={0.8}
                    >
                      <Text 
                        style={[
                          styles.glassmorphicOptionText,
                          formData.anneesPermis === years && styles.glassmorphicOptionTextSelected
                        ]}
                      >
                        {years}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
            placeholder="Notes libres sur le véhicule..."
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'ios' ? 0 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.primary + '50',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 32,
    backgroundColor: colors.surface,
    borderRadius: 12, 
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  photoButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border + '60',
    borderRadius: 12, 
    padding: 32,
    alignItems: 'center', 
    justifyContent: 'center', 
    overflow: 'hidden',
    aspectRatio: 4/5,
  },
  photoButtonText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.primary,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border + '60',
    borderRadius: 28,
    padding: 14,
    fontSize: 16,
    color: colors.text,
  },
  helpText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  spacer: {
    height: 20,
  },
  optionsContainer: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: 16,
  },
  optionButton: {
    backgroundColor: 'transparent',
    borderRadius: 15, 
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 0,
  },
  optionButtonActive: {
    backgroundColor: colors.primary + '15',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary, 
  },
  optionText: {
    fontSize: 16,
    color: colors.text,
  },
  optionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  pickerContainer: {
    backgroundColor: 'transparent',
    borderRadius: 15, 
    padding: 0,
    marginBottom: 4,
  },
  glassmorphicContainer: {
    borderRadius: 0, 
    overflow: 'hidden',
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 10,
  },
  pickerContent: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 12,
  },
  glassmorphicOption: {
    backgroundColor: colors.background,
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border + '60',
    position: 'relative',
  },
  glassmorphicOptionSelected: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary + '50',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    transform: [{ scale: 1.05 }],
  },
  checkIconContainer: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: 'transparent',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    borderColor: 'transparent',
  },
  glassmorphicOptionText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  glassmorphicOptionTextSelected: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 16,
  },
});