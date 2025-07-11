import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { Mail, Lock, Eye, EyeOff, CircleCheck as CheckCircle, Apple } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import * as AppleAuthentication from 'expo-apple-authentication';

export default function RegisterWithInvitationScreen() {
  const { colors } = useTheme();
  const { signUp, signInWithApple } = useAuth();
  const params = useLocalSearchParams();
  const token = params.token as string;
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
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

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setTokenError('Token d\'invitation manquant');
      setIsValidatingToken(false);
      return;
    }
    
    validateToken();
  }, [token]);

  // Vérifier la force du mot de passe
  useEffect(() => {
    if (!password) {
      setPasswordStrength(null);
      setPasswordError(null);
      return;
    }

    if (password.length < 6) {
      setPasswordStrength('weak');
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (hasLetter && hasNumber && hasSpecial && password.length >= 8) {
      setPasswordStrength('strong');
      setPasswordError(null);
    } else if ((hasLetter && hasNumber) || (hasLetter && hasSpecial) || (hasNumber && hasSpecial)) {
      setPasswordStrength('medium');
      setPasswordError(null);
    } else {
      setPasswordStrength('weak');
      setPasswordError('Utilisez une combinaison de lettres, chiffres et caractères spéciaux');
    }
  }, [password]);

  const validateToken = async () => {
    setIsValidatingToken(true);
    try {
      // This is a placeholder for actual token validation
      // In a real app, you would validate the token against your backend
      setInvitation({ email: 'invited@example.com', companyName: 'Example Company' });
      setEmail('invited@example.com');
      setIsValidatingToken(false);
    } catch (error) {
      console.error('Error validating token:', error);
      setTokenError('Erreur lors de la validation de l\'invitation');
      setIsValidatingToken(false);
    }
  };

  const handleRegister = async () => {
    if (!password) {
      Alert.alert('Erreur', 'Veuillez saisir un mot de passe');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordStrength === 'weak' && passwordError) {
      Alert.alert('Mot de passe faible', passwordError);
      return;
    }

    setIsLoading(true);
    try {
      await signUp(email, password, invitation?.companyName || undefined);
      
      Alert.alert(
        'Compte créé !',
        'Un email de vérification a été envoyé à votre adresse. Veuillez vérifier votre boîte mail pour activer votre compte. Vous allez être redirigé vers la page de connexion.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Redirect to login page with registered=true parameter
              router.replace({
                pathname: '/(auth)/login',
                params: { registered: 'true' }
              });
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Erreur d\'inscription', error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignUp = async () => {
    try {
      setIsLoading(true);
      await signInWithApple();
      router.replace('/(tabs)');
    } catch (error) {
      if (error instanceof Error && error.message !== 'Sign in was canceled') {
        Alert.alert('Erreur d\'inscription', error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 'strong') return colors.success;
    if (passwordStrength === 'medium') return colors.warning;
    return colors.error;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      padding: 20,
      justifyContent: 'center',
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 28,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      maxWidth: 500,
      width: '100%',
      alignSelf: 'center',
    },
    header: {
      alignItems: 'center',
      marginBottom: 24,
    },
    logo: {
      width: 80, 
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    logoText: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.background,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 8,
    },
    companyName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 24,
    },
    errorContainer: {
      backgroundColor: colors.error + '20',
      borderRadius: 28,
      padding: 16,
      marginBottom: 24,
      borderLeftWidth: 4,
      borderLeftColor: colors.error,
    },
    errorText: {
      color: colors.error,
      fontSize: 14,
    },
    form: {
      gap: 16,
    },
    inputGroup: {
      gap: 8,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
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
      padding: 8,
    },
    passwordStrengthContainer: {
      marginTop: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    passwordStrengthBars: {
      flexDirection: 'row',
      gap: 4,
      flex: 1,
      marginRight: 8,
    },
    passwordStrengthBar: {
      flex: 1,
      height: 4,
      borderRadius: 2,
    },
    passwordStrengthText: {
      fontSize: 12,
      fontWeight: '500',
    },
    passwordErrorText: {
      fontSize: 12,
      color: colors.error,
      marginTop: 4,
    },
    registerButton: {
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      borderRadius: 28,
      gap: 8,
      marginTop: 16,
    },
    registerButtonDisabled: {
      backgroundColor: colors.border,
    },
    registerButtonText: {
      fontSize: 16,
      fontWeight: '600',
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.textSecondary,
    },
  });

  if (isValidatingToken) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Validation de l'invitation...</Text>
      </View>
    );
  }

  if (tokenError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>EG</Text>
              </View>
              <Text style={styles.title}>Invitation invalide</Text>
            </View>
            
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{tokenError}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.registerButton}
              onPress={() => router.replace('/(auth)/login')}
            >
              <Text style={styles.registerButtonText}>Retour à la connexion</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>EG</Text>
              </View>
              <Text style={styles.title}>Créer votre compte</Text>
              <Text style={styles.subtitle}>
                Vous avez été invité(e) à rejoindre
              </Text>
              <Text style={styles.companyName}>
                {invitation?.companyName || 'EasyGarage'}
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Adresse email</Text>
                <View style={styles.inputContainer}>
                  <Mail size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    editable={false}
                    placeholderTextColor={colors.textSecondary}
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
                    placeholder="Minimum 6 caractères"
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
                {password && (
                  <View style={styles.passwordStrengthContainer}>
                    <View style={styles.passwordStrengthBars}>
                      <View style={[
                        styles.passwordStrengthBar, 
                        { backgroundColor: getPasswordStrengthColor() }
                      ]} />
                      <View style={[
                        styles.passwordStrengthBar, 
                        { backgroundColor: passwordStrength !== 'weak' ? getPasswordStrengthColor() : colors.border }
                      ]} />
                      <View style={[
                        styles.passwordStrengthBar, 
                        { backgroundColor: passwordStrength === 'strong' ? getPasswordStrengthColor() : colors.border }
                      ]} />
                    </View>
                    <Text style={[styles.passwordStrengthText, { color: getPasswordStrengthColor() }]}>
                      {passwordStrength === 'strong' ? 'Fort' : passwordStrength === 'medium' ? 'Moyen' : 'Faible'}
                    </Text>
                  </View>
                )}
                {passwordError && (
                  <Text style={styles.passwordErrorText}>{passwordError}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirmer le mot de passe</Text>
                <View style={styles.inputContainer}>
                  <Lock size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Répétez votre mot de passe"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} color={colors.textSecondary} />
                    ) : (
                      <Eye size={20} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={[
                  styles.registerButton,
                  (isLoading || !password || password !== confirmPassword) && styles.registerButtonDisabled
                ]}
                onPress={handleRegister}
                disabled={isLoading || !password || password !== confirmPassword}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <>
                    <CheckCircle size={20} color={colors.background} />
                    <Text style={styles.registerButtonText}>
                      Créer mon compte
                    </Text>
                  </>
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
                onPress={handleAppleSignUp}
                disabled={isLoading}
              >
                <Apple size={20} color={colors.text} />
                <Text style={styles.appleButtonText}>Continuer avec Apple</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}