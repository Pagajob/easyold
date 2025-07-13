import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useSplashScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // Vérifier si c'est le premier lancement de l'application
    const checkFirstLaunch = async () => {
      try {
        const hasLaunched = await AsyncStorage.getItem('app_has_launched');
        
        if (user && hasLaunched === 'true') {
          // Si l'utilisateur est connecté et ce n'est pas le premier lancement, ne pas afficher le splash
          setShowSplash(false);
        } else {
          // Marquer l'application comme lancée
          await AsyncStorage.setItem('app_has_launched', 'true');
          // Afficher le splash screen
          setShowSplash(true);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du premier lancement:', error);
        // En cas d'erreur, afficher le splash par défaut
        setShowSplash(true);
      }
    };
    
    checkFirstLaunch();
  }, [user]);

  const finishSplash = async () => {
    setShowSplash(false);
    // Marquer l'application comme lancée
    await AsyncStorage.setItem('app_has_launched', 'true');
  };

  return {
    showSplash,
    finishSplash,
  };
} 