import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, Platform, Animated } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Building2, Camera, Hash, ArrowRight, Flag, Check, ChevronRight } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Country options with flags
const COUNTRIES = [
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'CH', name: 'Suisse', flag: '🇨🇭' },
  { code: 'DE', name: 'Allemagne', flag: '🇩🇪' },
  { code: 'BE', name: 'Belgique', flag: '🇧🇪' },
  { code: 'ES', name: 'Espagne', flag: '🇪🇸' },
  { code: 'IT', name: 'Italie', flag: '🇮🇹' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
];

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [progress] = useState(new Animated.Value(0));
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirected, setIsRedirected] = useState(false);
  const [profilePicture, setProfilePicture] = useState('');
  
  const [formData, setFormData] = useState({
    companyName: '',
    logo: '',
    siret: '',
    address: '',
    country: 'FR',
  });

  // Déclaration des styles placée ici pour être accessible à tout moment
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.textSecondary,
    },
    header: {
      paddingTop: Platform.OS === 'ios' ? 60 : 20,
      paddingHorizontal: 20,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
    },
    stepIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 20,
      paddingHorizontal: 20,
    },
    stepContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    stepCircle: {
      width: 32, 
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepCircleActive: {
      backgroundColor: colors.primary,
    },
    stepText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    stepTextActive: {
      color: colors.background,
    },
    stepLine: {
      width: 40,
      height: 2,
      backgroundColor: colors.border + '60',
      marginHorizontal: 8,
    },
    stepLineActive: {
      backgroundColor: colors.primary,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    progressBarContainer: {
      position: 'absolute',
      bottom: 0,
      left: 20,
      right: 20,
      height: 4,
      backgroundColor: colors.border + '40',
      borderRadius: 2,
    },
    progressBar: {
      height: 4,
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    stepContent: {
      flex: 1,
    },
    stepTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 12,
    },
    stepDescription: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 28,
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text, 
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16, 
      fontSize: 16,
      color: colors.text,
    },
    inputWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12, 
      paddingHorizontal: 16,
      gap: 8,
    },
    inputText: {
      flex: 1,
      paddingVertical: 16,
      fontSize: 16,
      color: colors.text,
    },
    logoButton: {
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: 'dashed',
      borderRadius: 12, 
      padding: 32,
      alignItems: 'center',
      justifyContent: 'center',
      aspectRatio: 1,
      maxWidth: 300,
      alignSelf: 'center',
    },
    logoButtonText: {
      marginTop: 8,
      fontSize: 14,
      color: colors.textSecondary, 
      textAlign: 'center',
    },
    logoPreview: {
      width: '100%',
      height: '100%',
      borderRadius: 12,
    },
    countriesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    countryOption: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      width: '48%',
      marginBottom: 12,
    },
    countryOptionActive: {
      borderColor: colors.primary, 
      backgroundColor: colors.primary + '10',
    },
    countryFlag: {
      fontSize: 32,
      marginBottom: 8,
    },
    countryName: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500', 
    },
    countryNameActive: {
      color: colors.primary,
      fontWeight: '600',
    },
    navigationButtons: {
      flexDirection: 'row',
      padding: 20,
      gap: 12,
      borderTopWidth: 1, 
      borderTopColor: colors.border,
    },
    navButton: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center', 
      flexDirection: 'row',
      gap: 8,
    },
    prevButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    prevButtonText: {
      fontSize: 16,
      fontWeight: '500', 
      color: colors.text,
    },
    nextButton: {
      backgroundColor: colors.primary,
    },
    nextButtonDisabled: {
      backgroundColor: colors.border,
    },
    nextButtonText: {
      fontSize: 16,
      fontWeight: '500', 
      color: colors.background,
    },
    nextButtonTextDisabled: {
      color: colors.textSecondary,
    },
    finalButton: {
      backgroundColor: colors.success,
    },
    finalButtonText: {
      fontSize: 16,
      fontWeight: '600', 
      color: colors.background,
    },
  });

  // Check if user already completed onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user && !isRedirected) {
        setIsRedirected(true);
        router.replace('/(auth)/login');
        return; 
      }

      setIsLoading(true);
      try {
        if (!user) return;
        const entrepriseDoc = await getDoc(doc(db, 'entreprises', user.uid));
        if (entrepriseDoc.exists()) {
          // User already completed onboarding, redirect to dashboard
          router.replace('/(tabs)');
          return;
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally { 
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [user]);
  
  // Animate progress bar when step changes
  useEffect(() => {
    Animated.timing(progress, {
      toValue: currentStep / 5,
      duration: 300,
      useNativeDriver: false
    }).start();
  }, [currentStep]);
  
  const progressWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  const pickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Nous avons besoin de la permission pour accéder à vos photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData(prev => ({ ...prev, logo: result.assets[0].uri }));
    }
  };

  // Convert URI to Blob for upload
  const uriToBlob = async (uri: string): Promise<Blob> => {
    const response = await fetch(uri);
    return await response.blob();
  };

  const handleAddressSelect = (address: string) => {
    setFormData(prev => ({ ...prev, address }));
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return !!formData.companyName;
      case 2:
        return true; // Logo is optional
      case 3:
        return true; // SIRET is optional
      case 4:
        return !!formData.address;
      case 5:
        return !!formData.country;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 5) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    } else {
      Alert.alert('Champ requis', 'Veuillez remplir tous les champs obligatoires.');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté pour continuer.');
      console.error('Onboarding : utilisateur non connecté');
      return;
    }

    setIsSubmitting(true);

    try {
      let logoUrl = '';
      
      // Upload logo if exists
      if (formData.logo) {
        try {
          const logoBlob = await uriToBlob(formData.logo);
          const logoRef = ref(storage, `entreprises/${user.uid}/logo`);
          await uploadBytes(logoRef, logoBlob);
          logoUrl = await getDownloadURL(logoRef);
        } catch (error) {
          console.error('Failed to upload logo:', error);
          // Continue without logo
        }
      }

      // Save company data to Firestore
      const entrepriseData = {
        nom: formData.companyName,
        userId: user.uid, 
        logo: logoUrl,
        siret: formData.siret,
        adresse: formData.address,
        pays: COUNTRIES.find(c => c.code === formData.country)?.name || 'France',
        paysCode: formData.country,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      // Log des données envoyées
      console.log('Onboarding - Données envoyées à Firestore:', entrepriseData);
      // Use user.uid as document ID to ensure one company per user
      await setDoc(doc(db, 'entreprises', user.uid), entrepriseData);

      // Also update company info in local storage for settings
      const companyInfo = {
        nom: formData.companyName,
        logo: logoUrl,
        siret: formData.siret,
        adresse: formData.address,
        userId: user.uid,
        profilePicture: 'easygarage-icon.png'
      };

      await AsyncStorage.setItem(`companyInfo_${user.uid}`, JSON.stringify(companyInfo));
      
      // Redirection vers la page d'accueil (dashboard)
      router.replace('/');
    } catch (error) {
      console.error('Erreur Firestore onboarding:', error);
      Alert.alert('Erreur', `Impossible de sauvegarder les informations.\n${error instanceof Error ? error.message : JSON.stringify(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render step indicator with progress bar
  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4, 5].map((step) => (
        <View key={step} style={styles.stepContainer}>
          <View style={[
            styles.stepCircle,
            currentStep >= step && styles.stepCircleActive
          ]}>
            <Text style={[
              styles.stepText,
              currentStep >= step && styles.stepTextActive
            ]}>
              {step}
            </Text>
          </View>
          {step < 5 && (
            <View style={[
              styles.stepLine,
              currentStep > step && styles.stepLineActive
            ]} />
          )}
        </View>
      ))}
      
      <View style={styles.progressBarContainer}>
        <Animated.View 
          style={[
            styles.progressBar,
            { width: progressWidth }
          ]} 
        />
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Nom de votre entreprise</Text>
            <Text style={styles.stepDescription}>
              Comment s'appelle votre entreprise ?
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom de l'entreprise *</Text>
              <TextInput
                style={styles.input}
                value={formData.companyName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, companyName: text }))}
                placeholder="Ex: EasyGarage"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Logo de l'entreprise</Text>
            <Text style={styles.stepDescription}>
              Ajoutez le logo de votre entreprise pour personnaliser l'application
            </Text>
            
            <TouchableOpacity style={styles.logoButton} onPress={pickLogo}>
              {formData.logo ? (
                <Image source={{ uri: formData.logo }} style={styles.logoPreview} />
              ) : (
                <>
                  <Camera size={32} color={colors.textSecondary} />
                  <Text style={styles.logoButtonText}>Ajouter un logo (optionnel)</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Numéro SIRET</Text>
            <Text style={styles.stepDescription}>
              Ajoutez votre numéro SIRET pour l'afficher sur vos contrats et factures
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Numéro SIRET (optionnel)</Text>
              <View style={styles.inputWithIcon}>
                <Hash size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.inputText}
                  value={formData.siret}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, siret: text }))}
                  placeholder="Ex: 12345678901234"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  maxLength={14}
                />
              </View>
            </View>
          </View>
        );
      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Adresse de l'entreprise</Text>
            <Text style={styles.stepDescription}>
              Indiquez l'adresse de votre entreprise pour l'afficher sur les documents
            </Text>
            
            <AddressAutocomplete
              value={formData.address}
              onAddressSelect={address => setFormData(prev => ({ ...prev, address }))}
              label="Adresse complète *"
              placeholder="Commencez à taper votre adresse..."
            />
          </View>
        );
      case 5:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Pays d'activité</Text>
            <Text style={styles.stepDescription}>
              Sélectionnez le pays principal d'activité de votre entreprise
            </Text>
            
            <View style={styles.countriesGrid}>
              {COUNTRIES.map((country) => (
                <TouchableOpacity
                  key={country.code}
                  style={[
                    styles.countryOption,
                    formData.country === country.code && styles.countryOptionActive
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, country: country.code }))}
                >
                  <Text style={styles.countryFlag}>{country.flag}</Text>
                  <Text style={[
                    styles.countryName,
                    formData.country === country.code && styles.countryNameActive
                  ]}>
                    {country.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Configuration de votre compte</Text>
        <Text style={styles.subtitle}>Configurez votre entreprise pour commencer</Text>
      </View>

      {renderStepIndicator()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      <View style={styles.navigationButtons}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={[styles.navButton, styles.prevButton]}
            onPress={prevStep}
            >
            <Text style={styles.prevButtonText}>Précédent</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[
            styles.navButton,
            currentStep === 5 ? styles.finalButton : styles.nextButton,
            !validateStep(currentStep) && styles.nextButtonDisabled,
            isSubmitting && styles.nextButtonDisabled
          ]}
          onPress={currentStep < 5 ? nextStep : handleSubmit}
          disabled={!validateStep(currentStep) || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <>
              {currentStep === 5 ? (
                <>
                  <Check size={20} color={colors.background} />
                  <Text style={styles.finalButtonText}>Finaliser</Text>
                </>
              ) : (
                <>
                  <Text style={styles.nextButtonText}>Suivant</Text>
                  <ArrowRight size={20} color={colors.background} />
                </>
              )}
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}