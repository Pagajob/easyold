import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSecureStorage } from './useSecureStorage';
import { auth } from '@/config/firebase';
import { User } from 'firebase/auth';

/**
 * Hook pour gérer la persistance de l'authentification
 */
export function useAuthPersistence() {
  const [persistedUser, setPersistedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getSecurely, saveSecurely, removeSecurely } = useSecureStorage();

  // Charger l'utilisateur persisté au démarrage
  useEffect(() => {
    const loadPersistedUser = async () => {
      try {
        // Vérifier si nous avons un utilisateur stocké
        const storedUser = await AsyncStorage.getItem('auth_user');
        
        if (storedUser) {
          // Si nous avons un utilisateur stocké, le définir comme utilisateur persisté
          const parsedUser = JSON.parse(storedUser);
          setPersistedUser(parsedUser);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'utilisateur persisté:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPersistedUser();
  }, []);

  /**
   * Persiste l'utilisateur actuel
   * @param user - L'utilisateur à persister
   */
  const persistUser = async (user: User | null) => {
    try {
      if (user) {
        // Stocker les informations minimales de l'utilisateur
        const userToStore = {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
        };
        
        await AsyncStorage.setItem('auth_user', JSON.stringify(userToStore));
        setPersistedUser(user);
      } else {
        // Si pas d'utilisateur, effacer les données stockées
        await AsyncStorage.removeItem('auth_user');
        setPersistedUser(null);
      }
    } catch (error) {
      console.error('Erreur lors de la persistance de l\'utilisateur:', error);
    }
  };

  /**
   * Efface l'utilisateur persisté
   */
  const clearPersistedUser = async () => {
    try {
      await AsyncStorage.removeItem('auth_user');
      setPersistedUser(null);
    } catch (error) {
      console.error('Erreur lors de l\'effacement de l\'utilisateur persisté:', error);
    }
  };

  /**
   * Vérifie si l'utilisateur est persisté
   */
  const hasPersistedUser = (): boolean => {
    return persistedUser !== null;
  };

  return {
    persistedUser,
    isLoading,
    persistUser,
    clearPersistedUser,
    hasPersistedUser
  };
}