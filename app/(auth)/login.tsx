import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from 'react-native';
import { Mail, Lock, Eye, EyeOff, LogIn, Apple } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext'; 
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';

export default function LoginScreen() {
  const { signIn, signInWithApple } = useAuth();
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [isAppleAuthAvailable, setIsAppleAuthAvailable] = useState(false);

  // Check if Apple authentication is available
  useEffect(() => {
    const checkAppleAuthAvailability = async () => {
      try {
        const available = await AppleAuthentication.isAvailableAsync();
        setIsAppleAuthAvailable(available);
      } catch (error) {
        console.log('Apple authentication not available:', error);
        setIsAppleAuthAvailable(false);
      }
    };
    
    checkAppleAuthAvailability();
  }, []);

  useEffect(() => {
    if (params.verified === 'true') {
      setStatusMessage({
        type: 'success',
        message: 'Email vérifié avec succès ! Vous pouvez maintenant vous connecter.'
      });
    } else if (params.registered === 'true') {
      setStatusMessage({
        type: 'success',
        message: 'Compte créé avec succès ! Veuillez vérifier votre email pour activer votre compte.'
      });
    } else if (params.passwordReset === 'true') {
      setStatusMessage({
        type: 'success',
        message: 'Votre mot de passe a été réinitialisé avec succès.'
      });
    } else if (params.error) {
      setStatusMessage({
        type: 'error',
        message: decodeURIComponent(params.error as string)
      });
    }
  }, [params]);

  // Vérifier s'il y a un email sauvegardé
  useEffect(() => {
    const loadSavedEmail = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem('auth_last_email');
        if (savedEmail) {
          setEmail(savedEmail);
        }
      } catch (error) {
        console.error('Error loading saved email:', error);
      }
    };
    
    loadSavedEmail();
  }, []);

  const handleLogin = async () => { 
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await signIn(email, password);
      
      // Sauvegarder l'email pour les futures connexions si "Se souvenir de moi" est coché
      if (rememberMe) {
        await AsyncStorage.setItem('auth_last_email', email);
      } else {
        // Si "Se souvenir de moi" n'est pas coché, supprimer l'email sauvegardé
        try {
          await AsyncStorage.removeItem('auth_last_email');
        } catch (error) {}
      }
      
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Erreur de connexion', error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithApple();
      
      // Rediriger vers le tableau de bord après une connexion réussie
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 500);
    } catch (error) {
      if (error instanceof Error && error.message !== 'Sign in was canceled') {
        Alert.alert('Erreur de connexion', error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Image source={require('@/assets/images/lucid.png')} style={{ width: 60, height: 60, marginBottom: 8 }} resizeMode="contain" />
          </View>
          <View style={styles.header}>
            <Text style={styles.title}>Connexion</Text>
            <Text style={styles.subtitle}>Connectez-vous à votre compte EasyGarage</Text>
          </View>

          {statusMessage && (
            <View style={[
              styles.statusMessage, 
              statusMessage.type === 'success' ? styles.successMessage : styles.errorMessage
            ]}>
              <Text style={[
                styles.statusMessageText,
                statusMessage.type === 'success' ? styles.successMessageText : styles.errorMessageText
              ]}>{statusMessage.message}</Text>
            </View>
          )}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Adresse email</Text>
              <View style={styles.inputContainer}>
                <Mail size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="votre@email.com"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.inputContainer}>
                <Lock size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Votre mot de passe"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={colors.textSecondary} />
                  ) : (
                    <Eye size={20} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.rememberMeContainer}>
              <TouchableOpacity 
                style={styles.checkboxContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[
                  styles.checkbox,
                  rememberMe && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}>
                  {rememberMe && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <Text style={styles.rememberMeText}>Se souvenir de moi</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.forgotPassword}
                onPress={() => router.push('/(auth)/forgot-password')}
              >
                <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 20 }}>🚀</Text>
                  <Text style={styles.loginButtonText}>Se connecter</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.divider} />
          </View>
          
          {isAppleAuthAvailable && (
            <TouchableOpacity 
              style={styles.appleButton}
              onPress={handleAppleLogin}
              disabled={isLoading}
            >
              <Apple size={20} color={colors.text} />
              <Text style={styles.appleButtonText}>Continuer avec Apple</Text>
            </TouchableOpacity>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Vous n'avez pas de compte ?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.registerLink}>Créer un compte</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  statusMessage: {
    padding: 16,
    borderRadius: 28,
    marginBottom: 24,
  },
  successMessage: {
    backgroundColor: colors.success + '20',
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  errorMessage: {
    backgroundColor: colors.error + '20',
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  statusMessageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  successMessageText: {
    color: colors.success,
  },
  errorMessageText: {
    color: colors.error,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border + '80',
    borderRadius: 28,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.text,
  },
  eyeIcon: {
    padding: 4,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4, 
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: colors.background,
    fontSize: 14,
    fontWeight: 'bold',
  },
  rememberMeText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  forgotPassword: {
    padding: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
  },
  loginButtonDisabled: {
    backgroundColor: colors.primary + '50',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background, 
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    paddingHorizontal: 10,
    color: colors.textSecondary,
    fontSize: 14,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 28,
    paddingVertical: 14,
    marginBottom: 20,
    gap: 8,
  },
  appleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  registerLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
});