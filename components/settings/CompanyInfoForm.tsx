import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Image, Platform } from 'react-native';
import { Building2, Camera, Hash, CircleCheck as CheckCircle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useEntreprise } from '@/hooks/useEntreprise';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import * as ImagePicker from 'expo-image-picker';

export default function CompanyInfoForm() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { companyInfo, updateCompanyInfo, loading: companySettingsLoading } = useCompanySettings();
  const { uploadLogo, loading: entrepriseLoading } = useEntreprise();
  const [localCompanyInfo, setLocalCompanyInfo] = useState(companyInfo);
  const [defaultLogo, setDefaultLogo] = useState('https://images.pexels.com/photos/5717641/pexels-photo-5717641.jpeg?auto=compress&cs=tinysrgb&w=256&h=256&fit=crop');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setLocalCompanyInfo(companyInfo);
    setHasUnsavedChanges(false);
  }, [companyInfo]);

  const handleChange = (field: keyof typeof localCompanyInfo, value: string) => {
    setLocalCompanyInfo(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleAddressSelect = (address: string) => {
    handleChange('adresse', address);
  };

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
      handleChange('logo', result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    try {
      setIsUploading(true);
      
      let companyInfoToSave = { ...localCompanyInfo };
      let logoUrl = localCompanyInfo.logo;
      
      // Check if logo needs to be uploaded (local file URI)
      if (localCompanyInfo.logo && 
          (localCompanyInfo.logo.startsWith('file://') || 
           localCompanyInfo.logo.startsWith('data:') ||
           localCompanyInfo.logo.startsWith('blob:'))) {
        
        try {
          // Convert URI to blob for upload
          const response = await fetch(localCompanyInfo.logo);
          const blob = await response.blob();
          
          // Upload the blob to Firebase Storage
          const downloadUrl = await uploadLogo(blob);
          logoUrl = downloadUrl;
        } catch (uploadError) {
          console.error('Error uploading logo:', uploadError);
          Alert.alert('Erreur', 'Impossible de télécharger le logo. Veuillez réessayer.');
          return;
        }
      }
      
      // If logo was removed, ensure it's set to empty string
      if (!localCompanyInfo.logo && companyInfo.logo) {
        logoUrl = '';
      }
      
      // Update the company info with the new logo URL
      companyInfoToSave = {
        ...companyInfoToSave,
        logo: logoUrl
      };
      
      await updateCompanyInfo(companyInfoToSave);
      setHasUnsavedChanges(false);
      Alert.alert(
        'Succès', 
        'Les informations de l\'entreprise ont été sauvegardées.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving company info:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder les informations. Veuillez réessayer.');
    } finally {
      setIsUploading(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}> 
      <Text style={styles.sectionTitle}>Informations de l'entreprise</Text>
      
      {/* Logo de l'entreprise */}
      <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <Building2 size={24} color={colors.primary} />
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>Logo de l'entreprise</Text>
            <Text style={styles.settingSubtitle}>Ajoutez le logo de votre entreprise</Text>
          </View>
        </View>
        <TouchableOpacity onPress={pickLogo} style={styles.logoContainer}>
          {localCompanyInfo.logo ? (
            <Image source={{ uri: localCompanyInfo.logo }} style={styles.logoImage} />
          ) : (
            <Image source={require('@/assets/images/easygarage-icon.png')} style={styles.logoImage} />
          )}
        </TouchableOpacity>
      </View>

      {/* Nom de l'entreprise */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>✏️ Nom de l'entreprise</Text>
        <TextInput
          style={styles.input}
          value={localCompanyInfo.nom}
          onChangeText={(text) => handleChange('nom', text)}
          placeholder="Nom de votre entreprise"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      {/* Numéro SIRET */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>📃 Numéro SIRET (optionnel)</Text>
        <View style={styles.inputWithIcon}>
          <Hash size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.inputText}
            value={localCompanyInfo.siret}
            onChangeText={(text) => handleChange('siret', text)}
            placeholder="12345678901234"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            maxLength={14}
          />
        </View>
      </View>

      {/* Adresse du siège avec autocomplétion */}
      <AddressAutocomplete
        value={localCompanyInfo.adresse}
        onAddressSelect={adresse => handleChange('adresse', adresse)}
        label="📍 Adresse du siège social"
        placeholder="Commencez à taper votre adresse..."
      />

      <TouchableOpacity 
        style={[
          styles.saveButton,
          (!hasUnsavedChanges || isUploading || companySettingsLoading || !user || entrepriseLoading) && styles.saveButtonDisabled
        ]} 
        onPress={handleSave}
        disabled={!hasUnsavedChanges || isUploading || companySettingsLoading || !user || entrepriseLoading}
      >
        <CheckCircle size={20} color={(hasUnsavedChanges && !isUploading && !companySettingsLoading && user && !entrepriseLoading) ? colors.background : colors.textSecondary} />
        <Text style={[
          styles.saveButtonText,
          (!hasUnsavedChanges || isUploading || companySettingsLoading || !user || entrepriseLoading) && styles.saveButtonTextDisabled
        ]}>
          {companySettingsLoading
            ? 'Chargement des informations...'
            : entrepriseLoading
            ? 'Chargement de l\'entreprise...'
            : isUploading 
            ? 'Téléchargement en cours...' 
            : hasUnsavedChanges 
              ? 'Sauvegarder les modifications' 
              : 'Aucune modification à sauvegarder'
          }
        </Text>
      </TouchableOpacity>

      {hasUnsavedChanges && (
        <View style={styles.unsavedIndicator}>
          <Text style={styles.unsavedText}>Modifications non sauvegardées</Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
  },
  settingItem: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, 
  },
  settingTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  settingSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.border,
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
    borderColor: colors.border + '80', 
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: colors.text,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1, 
    borderColor: colors.border + '80',
    borderRadius: 10,
    paddingHorizontal: 14,
    gap: 8,
  },
  inputText: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14, 
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: colors.primary + '50',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },
  saveButtonTextDisabled: {
    color: colors.textSecondary,
  },
  unsavedIndicator: {
    backgroundColor: colors.warning + '20',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  unsavedText: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: '600',
  },
});