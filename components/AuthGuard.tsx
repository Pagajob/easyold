import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Mail, RefreshCw, LogOut } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useSegments, useRootNavigationState, useLocalSearchParams } from 'expo-router'; 
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import EmailVerificationMessage from '@/components/EmailVerificationMessage';
import LoadingSpinner from '@/components/LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, userProfile, loading, logout, resendVerificationEmail, refreshUser, authInitialized } = useAuth(); 
  const { colors } = useTheme();
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const params = useLocalSearchParams();
  
  // Get the segments and navigation state for protected routes
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  // Mark layout as ready after mount
  useEffect(() => {
    setIsLayoutReady(true);
     
    // Configurer un intervalle de rafraîchissement du token
    const refreshInterval = setInterval(() => {
      if (user) {
        refreshUser().catch(console.error);
      }
    }, 5 * 60 * 1000); // Rafraîchir le token toutes les 5 minutes
    
    return () => clearInterval(refreshInterval);
  }, [user]);

  // Check if user has completed onboarding
  useEffect(() => {
    if (user && user.emailVerified && authInitialized) {
      const checkOnboardingStatus = async () => {
        try {
          const entrepriseDoc = await getDoc(doc(db, 'entreprises', user.uid));
          setHasCompletedOnboarding(entrepriseDoc.exists());
        } catch (error) {
          console.error('Error checking onboarding status:', error);
          setHasCompletedOnboarding(false);
        }
      };
      
      checkOnboardingStatus().catch(console.error);
    }
  }, [user, authInitialized]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!navigationState?.key || !isLayoutReady || !authInitialized) return;
     
    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inOnboarding = segments[0] === 'onboarding';
    
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && user.emailVerified && hasCompletedOnboarding === false && !inOnboarding) {
      // User is authenticated but hasn't completed onboarding
      router.replace('/onboarding');
    } else if (user && user.emailVerified && hasCompletedOnboarding === true && (inAuthGroup || inOnboarding)) { 
      // User is authenticated and has completed onboarding, redirect to main app
      router.replace('/(tabs)');
    } else if (user && inAuthGroup && user.emailVerified) {
      // User is authenticated but email not verified yet, let AuthGuard handle it
      // or onboarding status is still loading
      if (hasCompletedOnboarding !== null) {
        router.replace('/(tabs)');
      }
    }
  }, [user, segments, navigationState?.key, isLayoutReady, hasCompletedOnboarding]);
  
  // Create styles at the top level so they're always available
  const styles = createStyles(colors);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Chargement...
        </Text>
      </View>
    );
  }

  // Si l'utilisateur n'est pas connecté ou est sur une page d'authentification, laisser le router gérer la redirection
  if ((!user && authInitialized) || (segments[0] === 'onboarding' && hasCompletedOnboarding === false)) {
    return null;
  }

  // If email is not verified, show the verification screen
  if (user && !user.emailVerified) {
    return <EmailVerificationMessage onRefresh={refreshUser} />;
  }

  // Si tout est OK, afficher l'application
  // Si l'utilisateur n'a pas complété l'onboarding, rediriger vers l'onboarding
  if (hasCompletedOnboarding === false && segments[0] !== 'onboarding') {
    router.replace('/onboarding');
    return <LoadingSpinner message="Redirection vers l'onboarding..." />;
  }

  // Si l'onboarding est complété ou en cours de vérification, afficher l'application
  return <>{children}</>;
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    color: colors.text,
    textAlign: 'center',
  },
});