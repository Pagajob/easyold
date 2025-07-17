import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { Mail, RefreshCw, LogOut } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface EmailVerificationMessageProps {
  onRefresh?: () => Promise<void>;
}

export default function EmailVerificationMessage({ onRefresh }: EmailVerificationMessageProps) {
  const { colors } = useTheme();
  const { user, resendVerificationEmail, refreshUser, logout } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      // Activer le cooldown
      setResendCooldown(60); // 60 secondes
      await resendVerificationEmail();
      
      // Afficher un message de succès
      if (Platform.OS === 'web') {
        alert('Email de vérification envoyé !');
      } else {
        Alert.alert('Succès', 'Email de vérification envoyé !');
      }
    } catch (error) {
      // Afficher un message d'erreur
      if (Platform.OS === 'web') {
        alert(error instanceof Error ? error.message : 'Erreur lors de l\'envoi');
      } else {
        Alert.alert('Erreur', error instanceof Error ? error.message : 'Erreur lors de l\'envoi');
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        await refreshUser();
      }
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      width: '100%',
      maxWidth: 400,
      alignItems: 'center',
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 16,
    },
    message: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 8,
    },
    email: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.primary,
      textAlign: 'center',
      marginBottom: 24,
    },
    instructions: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 32,
    },
    buttonsContainer: {
      width: '100%',
      gap: 16,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 28,
      width: '100%',
      gap: 8,
    },
    primaryButton: {
      backgroundColor: colors.primary,
    },
    primaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.background,
    },
    secondaryButton: {
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
    },
    logoutButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    logoutButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.error,
    },
    cooldownText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginLeft: 4,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Mail size={40} color={colors.primary} />
        </View>
        
        <Text style={styles.title}>Vérifiez votre adresse email</Text>

        <Text style={[styles.message, { fontWeight: 'bold', color: colors.error, marginBottom: 12 }]}>Pour vous connecter, veuillez valider votre compte via le lien envoyé par email.</Text>
        
        <Text style={styles.message}>
          Nous avons envoyé un lien de vérification à :
        </Text>
        
        <Text style={styles.email}>{user?.email}</Text>
        
        <Text style={styles.instructions}>
          Cliquez sur le lien dans l'email pour activer votre compte, puis revenez ici et actualisez.
        </Text>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]}
            onPress={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <RefreshCw size={20} color={colors.background} />
            )}
            <Text style={styles.primaryButtonText}>
              {isRefreshing ? 'Vérification...' : 'J\'ai vérifié mon email'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.button, 
              styles.secondaryButton, 
              (resendCooldown > 0 || isResending) && styles.buttonDisabled
            ]}
            onPress={handleResendEmail}
            disabled={resendCooldown > 0 || isResending}
          >
            {isResending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Mail size={20} color={colors.primary} />
            )}
            <Text style={styles.secondaryButtonText}>
              {isResending ? 'Envoi...' : 'Renvoyer l\'email'}
            </Text>
            {resendCooldown > 0 && (
              <Text style={styles.cooldownText}>({resendCooldown}s)</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.logoutButton]}
            onPress={handleLogout}
          >
            <LogOut size={20} color={colors.error} />
            <Text style={styles.logoutButtonText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}