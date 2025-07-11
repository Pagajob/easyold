import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Hook pour gérer le stockage sécurisé des données sensibles
 * Utilise SecureStore sur mobile et AsyncStorage sur web
 */
export function useSecureStorage() {
  /**
   * Enregistre une valeur de manière sécurisée
   * @param key - Clé de stockage
   * @param value - Valeur à stocker
   */
  const saveSecurely = async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        // Sur le web, utiliser AsyncStorage (moins sécurisé mais compatible)
        await AsyncStorage.setItem(`secure_${key}`, value);
      } else {
        // Sur mobile, utiliser SecureStore
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error(`Erreur lors de l'enregistrement sécurisé de ${key}:`, error);
      throw error;
    }
  };

  /**
   * Récupère une valeur stockée de manière sécurisée
   * @param key - Clé de stockage
   * @returns La valeur stockée ou null si non trouvée
   */
  const getSecurely = async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        // Sur le web, utiliser AsyncStorage
        return await AsyncStorage.getItem(`secure_${key}`);
      } else {
        // Sur mobile, utiliser SecureStore
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      console.error(`Erreur lors de la récupération sécurisée de ${key}:`, error);
      return null;
    }
  };

  /**
   * Supprime une valeur stockée de manière sécurisée
   * @param key - Clé de stockage à supprimer
   */
  const removeSecurely = async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        // Sur le web, utiliser AsyncStorage
        await AsyncStorage.removeItem(`secure_${key}`);
      } else {
        // Sur mobile, utiliser SecureStore
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error(`Erreur lors de la suppression sécurisée de ${key}:`, error);
      throw error;
    }
  };

  return {
    saveSecurely,
    getSecurely,
    removeSecurely
  };
}