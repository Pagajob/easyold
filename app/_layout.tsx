import { useEffect } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, AppState, View } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { SettingsProvider } from '@/contexts/SettingsContext'; 
import { DataProvider } from '@/contexts/DataContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import SplashScreenComponent from '@/components/SplashScreen';
import { useSplashScreen } from '@/hooks/useSplashScreen';
import React from 'react';
import AuthGuard from '@/components/AuthGuard';
import ProfileGuard from '@/components/ProfileGuard';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function SplashScreenGate({ children }: { children: React.ReactNode }) {
  const { showSplash, finishSplash } = useSplashScreen();
  if (showSplash) {
    return <SplashScreenComponent onFinish={finishSplash} />;
  }
  return <>{children}</>;
}

export default function RootLayout() {
  useFrameworkReady();
  
  // État pour suivre si les polices sont chargées
  const [fontsLoaded, setFontsLoaded] = useState(true);
  
  // Gérer les changements d'état de l'application pour le rafraîchissement du token
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        // Lorsque l'application revient au premier plan, vérifier si nous devons rafraîchir le token d'authentification
        // Cela sera géré par l'AuthContext via refreshUser
        const { auth } = require('@/config/firebase');
        const currentUser = auth.currentUser;
        if (currentUser) {
          currentUser.getIdToken(true).catch(console.error);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);
  
  // Masquer le SplashScreen natif une fois que l'application est prête
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(console.error);
    }
  }, [fontsLoaded]);
  
  // Planifier le nettoyage des fichiers expirés
  useEffect(() => {
    const scheduleCleanup = async () => {
      // Ne pas exécuter sur le web en développement
      if (Platform.OS === 'web' && process.env.NODE_ENV === 'development') {
        return;
      }
      
      try {
        // Appeler l'API pour planifier le nettoyage
        const response = await fetch('/api/schedule-cleanup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        const result = await response.json();
        console.log('Cleanup scheduled:', result);
      } catch (error) {
        console.error('Error scheduling cleanup:', error);
      }
    };
    
    // Exécuter au démarrage de l'application
    scheduleCleanup();
    
    // Planifier l'exécution toutes les 24 heures
    const interval = setInterval(scheduleCleanup, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <SettingsProvider>
            <NotificationProvider>
              <SplashScreenGate>
                <ProfileGuard>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen 
                      name="(auth)" 
                      options={{ 
                        headerShown: false,
                        // Prevent going back to auth screens once logged in
                        gestureEnabled: false 
                      }} 
                    />
                    <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                    <Stack.Screen name="onboarding-profile" options={{ headerShown: false }} />
                    <Stack.Screen name="+not-found" />
                  </Stack>
                  <StatusBar style="auto" />
                </ProfileGuard>
              </SplashScreenGate>
            </NotificationProvider>
          </SettingsProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}