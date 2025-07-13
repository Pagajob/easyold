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
        
        if (user) {
          // Si l'utilisateur est connecté, ne pas afficher le splash
          setShowSplash(false);
        } else if (hasLaunched === 'true') {
          // Si ce n'est pas le premier lancement et l'utilisateur n'est pas connecté
          // On peut quand même afficher le splash pour une meilleure expérience
          setShowSplash(true);
        } else {
          // Premier lancement, afficher le splash et marquer comme lancé
          setShowSplash(true);
          await AsyncStorage.setItem('app_has_launched', 'true');
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du premier lancement:', error);
        setShowSplash(true);
      }
    };
    
    checkFirstLaunch();
  }, [user]);

  const finishSplash = () => {
    setShowSplash(false);
  };

  return {
    showSplash,
    finishSplash,
  };
} 