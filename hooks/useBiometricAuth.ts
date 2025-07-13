import { useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export interface BiometricAuthState {
  isAvailable: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
  isEnabled: boolean;
}

export function useBiometricAuth() {
  const [biometricState, setBiometricState] = useState<BiometricAuthState>({
    isAvailable: false,
    isEnrolled: false,
    supportedTypes: [],
    isEnabled: false,
  });

  const [isLoading, setIsLoading] = useState(true);

  // Vérifier la disponibilité de la biométrie
  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      setIsLoading(true);
      
      // Vérifier si la biométrie est disponible sur l'appareil
      const isAvailable = await LocalAuthentication.hasHardwareAsync();
      
      // Vérifier si l'utilisateur a configuré la biométrie
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      // Obtenir les types d'authentification supportés
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      // Vérifier si la biométrie est activée pour cette app
      const isEnabled = await SecureStore.getItemAsync('biometric_enabled') === 'true';
      
      setBiometricState({
        isAvailable,
        isEnrolled,
        supportedTypes,
        isEnabled,
      });
    } catch (error) {
      console.error('Erreur lors de la vérification de la biométrie:', error);
      setBiometricState({
        isAvailable: false,
        isEnrolled: false,
        supportedTypes: [],
        isEnabled: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Activer la biométrie pour l'utilisateur
  const enableBiometric = async (userId: string) => {
    try {
      // Demander l'authentification biométrique pour activer
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authentifiez-vous pour activer Face ID',
        fallbackLabel: 'Utiliser le code',
        cancelLabel: 'Annuler',
      });

      if (result.success) {
        // Sauvegarder l'ID utilisateur de manière sécurisée
        await SecureStore.setItemAsync('biometric_user_id', userId);
        await SecureStore.setItemAsync('biometric_enabled', 'true');
        
        setBiometricState(prev => ({
          ...prev,
          isEnabled: true,
        }));
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de l\'activation de la biométrie:', error);
      return false;
    }
  };

  // Désactiver la biométrie
  const disableBiometric = async () => {
    try {
      await SecureStore.deleteItemAsync('biometric_user_id');
      await SecureStore.deleteItemAsync('biometric_enabled');
      
      setBiometricState(prev => ({
        ...prev,
        isEnabled: false,
      }));
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la désactivation de la biométrie:', error);
      return false;
    }
  };

  // Authentifier avec la biométrie
  const authenticateWithBiometric = async (): Promise<string | null> => {
    try {
      // Vérifier si la biométrie est activée
      const isEnabled = await SecureStore.getItemAsync('biometric_enabled');
      if (isEnabled !== 'true') {
        throw new Error('Biométrie non activée');
      }

      // Demander l'authentification biométrique
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authentifiez-vous pour vous connecter',
        fallbackLabel: 'Utiliser le code',
        cancelLabel: 'Annuler',
      });

      if (result.success) {
        // Récupérer l'ID utilisateur stocké
        const userId = await SecureStore.getItemAsync('biometric_user_id');
        return userId;
      }
      
      return null;
    } catch (error) {
      console.error('Erreur lors de l\'authentification biométrique:', error);
      return null;
    }
  };

  // Vérifier si l'utilisateur peut utiliser la biométrie
  const canUseBiometric = () => {
    return biometricState.isAvailable && 
           biometricState.isEnrolled && 
           biometricState.isEnabled;
  };

  // Obtenir le nom du type d'authentification
  const getBiometricTypeName = () => {
    if (Platform.OS === 'ios') {
      if (biometricState.supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return 'Face ID';
      } else if (biometricState.supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return 'Touch ID';
      }
    } else if (Platform.OS === 'android') {
      if (biometricState.supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return 'Reconnaissance faciale';
      } else if (biometricState.supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return 'Empreinte digitale';
      }
    }
    return 'Biométrie';
  };

  return {
    ...biometricState,
    isLoading,
    enableBiometric,
    disableBiometric,
    authenticateWithBiometric,
    canUseBiometric,
    getBiometricTypeName,
    checkBiometricAvailability,
  };
} 