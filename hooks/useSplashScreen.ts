import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function useSplashScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // Afficher le splash screen seulement si l'utilisateur n'est pas connecté
    // ou lors du premier lancement de l'application
    if (user) {
      // Si l'utilisateur est connecté, ne pas afficher le splash
      setShowSplash(false);
    }
    // Si l'utilisateur n'est pas connecté, afficher le splash
  }, [user]);

  const finishSplash = () => {
    setShowSplash(false);
  };

  return {
    showSplash,
    finishSplash,
  };
} 