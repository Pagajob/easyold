import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image, Platform, Switch } from 'react-native';
import { ArrowLeft, Camera, Save, DollarSign, Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useData, Vehicle } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { VehicleService } from '@/services/firebaseService';

const CARBURANT_OPTIONS = ['Essence', 'Diesel', 'Électrique', 'Hybride'];
const FINANCEMENT_OPTIONS = ['Achat comptant', 'Leasing', 'LLD', 'Mise à disposition'];
const STATUT_OPTIONS = ['Disponible', 'Loué', 'Maintenance', 'Indisponible'];

export default function AddVehicleScreen() {
  const { colors } = useTheme();
  const { addVehicle } = useData();
  const { user, userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showRestrictionModal, setShowRestrictionModal] = useState(false);
  
  const [formData, setFormData] = useState({
    marque: '',
    modele: '',
    immatriculation: '',
    photo: '',
    carburant: 'Essence' as any,
    financement: 'Achat comptant' as any,
    statut: 'Disponible' as any,
    notes: '',
    kilometrageJournalier: 200,
    
    // Nouveaux champs de prix
    prix_base_24h: 0,
    prix_base_weekend: 0,
    prixKmSupplementaire: 0,
    cautionDepart: 0,
    cautionRSV: 0,
    
    // Assurance (maintenant dans financement)
    assuranceMensuelle: 0,
    
    // Champs conditionnels selon financement
    prixAchat: 0,
    apportInitial: 0,
    mensualites: 0,
    valeurResiduelle: 0,
    loyerMensuel: 0,
    cautionDeposee: 0,
    nomProprietaire: '',
    prixReverse24h: 0,
    prixReverseWeekend: 0,
    
    // Nouveaux champs pour les exigences conducteur
    ageMinimal: 21,
    anneesPermis: 2,
  });

  const [isKmIllimite, setIsKmIllimite] = useState(false);
  const [previousKm, setPreviousKm] = useState(200);

  // Get current year for permit year dropdown
  const currentYear = new Date().getFullYear();
  
  // Generate age options (18-100)
  const ageOptions = Array.from({ length: 83 }, (_, i) => i + 18);
  
  // Generate years of experience options (0-10)
  const experienceOptions = Array.from({ length: 11 }, (_, i) => i);

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

  const validatePricing = () => {
    if (formData.prix_base_24h <= 0) {
      Alert.alert('Erreur', 'Le prix de base 24h doit être supérieur à 0.');
      return false;
    }
    
    if (formData.prix_base_weekend && formData.prix_base_weekend <= 0) {
      Alert.alert('Erreur', 'Le prix de base week-end doit être supérieur à 0 ou laissé vide.');
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!formData.marque || !formData.modele || !formData.immatriculation) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (!validatePricing()) {
      return;
    }

    setIsLoading(true);

    try {
      const vehicleData: Omit<Vehicle, 'id'> = {
        userId: user?.uid || '',
        marque: formData.marque,
        modele: formData.modele,
        immatriculation: formData.immatriculation,
        photo: '',
        carburant: formData.carburant,
        financement: formData.financement,
        assuranceMensuelle: formData.assuranceMensuelle,
        statut: formData.statut,
        notes: formData.notes,
        kilometrageJournalier: formData.kilometrageJournalier,
        prix_base_24h: formData.prix_base_24h,
        prix_base_weekend: formData.prix_base_weekend || undefined,
        prixKmSupplementaire: formData.prixKmSupplementaire,
        cautionDepart: formData.cautionDepart,
        cautionRSV: formData.cautionRSV,
        ageMinimal: formData.ageMinimal,
        anneesPermis: formData.anneesPermis,
      };

      // Upload photo to Firebase Storage if exists
      if (formData.photo) {
        try {
          const photoBlob = await uriToBlob(formData.photo);
          const tempVehicleId = Date.now().toString();
          const photoUrl = await VehicleService.uploadPhoto(tempVehicleId, photoBlob);
          vehicleData.photo = photoUrl;
        } catch (error) {
          console.warn('Failed to upload photo:', error);
          // Continue without photo
        }
      }

      // Ajouter les champs conditionnels selon le type de financement
      switch (formData.financement) {
        case 'Achat comptant':
          vehicleData.prixAchat = formData.prixAchat;
          break;
        case 'Leasing':
          vehicleData.apportInitial = formData.apportInitial;
          vehicleData.mensualites = formData.mensualites;
          vehicleData.valeurResiduelle = formData.valeurResiduelle;
          break;
        case 'LLD':
          vehicleData.loyerMensuel = formData.loyerMensuel;
          vehicleData.cautionDeposee = formData.cautionDeposee;
          break;
        case 'Mise à disposition':
          vehicleData.nomProprietaire = formData.nomProprietaire;
          vehicleData.prixReverse24h = formData.prixReverse24h;
          vehicleData.prixReverseWeekend = formData.prixReverseWeekend;
          break;
      }

      await addVehicle(vehicleData);
      router.back();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder le véhicule. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
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

  const styles = createStyles(colors);

  // Contrôle de la limite d'abonnement
  const { vehicles } = useData();
  const vehiculesMax = userProfile?.plan === 'essentiel' ? 5 : 
                      userProfile?.plan === 'pro' ? 30 : 
                      userProfile?.plan === 'premium' ? 999 : 1;
                      
  useEffect(() => {
    if (vehicles.length >= vehiculesMax) {
      setShowRestrictionModal(true);
    }
  }, [vehicles, vehiculesMax]);

  if (showRestrictionModal) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 32, alignItems: 'center', margin: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16, textAlign: 'center' }}>
            Fonctionnalité réservée aux abonnés
          </Text>
          <Text style={{ fontSize: 16, color: colors.textSecondary, marginBottom: 24, textAlign: 'center' }}>
            Vous avez atteint la limite de véhicules de votre abonnement ({vehiculesMax} véhicule{vehiculesMax > 1 ? 's' : ''}). Abonnez-vous via l'App Store pour continuer.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: colors.primary, borderRadius: 28, paddingVertical: 14, paddingHorizontal: 32 }}
            onPress={() => router.push('/(tabs)/settings/subscription')}
          >
            <Text style={{ color: colors.background, fontWeight: '700', fontSize: 16 }}>Voir les abonnements</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}> 
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Nouveau véhicule</Text>
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
              {CARBURANT_OPTIONS.map((option) => (
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
              {STATUT_OPTIONS.map((option) => (
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TextInput
                style={[styles.input, { flex: 1, backgroundColor: isKmIllimite ? colors.surface : colors.background, opacity: isKmIllimite ? 0.5 : 1 }]}
                value={isKmIllimite ? 'Illimité' : formData.kilometrageJournalier.toString()}
                onChangeText={(text) => {
                  const val = parseInt(text) || 0;
                  setFormData(prev => ({ ...prev, kilometrageJournalier: val }));
                  setPreviousKm(val);
                }}
                keyboardType="numeric"
                placeholder="200"
                placeholderTextColor={colors.textSecondary}
                editable={!isKmIllimite}
              />
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Switch
                  value={isKmIllimite}
                  onValueChange={(value) => {
                    setIsKmIllimite(value);
                    if (value) {
                      setPreviousKm(formData.kilometrageJournalier);
                      setFormData(prev => ({ ...prev, kilometrageJournalier: -1 }));
                    } else {
                      setFormData(prev => ({ ...prev, kilometrageJournalier: previousKm || 200 }));
                    }
                  }}
                  thumbColor={isKmIllimite ? colors.primary : colors.border}
                  trackColor={{ false: colors.border, true: colors.primary + '60' }}
                />
                <Text style={{ marginLeft: 8, color: colors.text }}>km illimités</Text>
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Prix du km supplémentaire (€)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isKmIllimite ? colors.surface : colors.background, opacity: isKmIllimite ? 0.5 : 1 }]}
              value={formData.prixKmSupplementaire.toString()}
              onChangeText={(text) => setFormData(prev => ({ ...prev, prixKmSupplementaire: parseFloat(text) || 0 }))}
              keyboardType="numeric"
              placeholder="0.50"
              placeholderTextColor={colors.textSecondary}
              editable={!isKmIllimite}
            />
          </View>
        </View>

        {/* Section Exigences Conducteur */}
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
            <Text style={styles.helpText}>Âge minimum requis pour louer ce véhicule</Text> 
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
            <Text style={styles.helpText}>
              Expérience de conduite minimale requise (années)
            </Text>
          </View>
        </View>

        {/* Section Tarification */}
        <View style={styles.section}>
          <View style={styles.pricingSectionHeader}>
            <DollarSign size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Tarification</Text>
          </View>
          
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
            <Text style={styles.helpText}>Tarif standard pour une location de 24h</Text>
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
            <Text style={styles.helpText}>Tarif pour une location du vendredi soir au dimanche soir (optionnel)</Text>
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
            {FINANCEMENT_OPTIONS.map((option) => (
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
          
          <View style={styles.spacer}></View>

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

        <View style={styles.spacer}></View>

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
    backgroundColor: colors.primary + '15',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.border,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 32,
    backgroundColor: colors.surface,
    borderRadius: 28,
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
  pricingSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  photoButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border + '60',
    borderRadius: 28,
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
    height: 24,
  },
  optionsContainer: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: 16,
  },
  optionButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
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