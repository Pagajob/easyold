import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, ArrowLeft, Apple } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext'; 
import { useTheme } from '@/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import * as AppleAuthentication from 'expo-apple-authentication';

export default function RegisterScreen() {
  const { signUp, signInWithApple } = useAuth();
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const token = params.token as string;
  
  const [name, setName] = useState('');
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

  // If token is provided, redirect to the dedicated invitation registration page
  useEffect(() => {
    if (token) {
      router.replace(`/register?token=${token}`);
    }
  }, [token]);

  const validateToken = async (token: string) => {
    setIsValidatingToken(true);
    try {
      // This is a placeholder for actual token validation
      // Dans une vraie application, vous valideriez le token auprès de votre backend
      setInvitation({ email: 'invited@example.com', companyName: 'Example Company' });
      setEmail('invited@example.com');
      setIsValidatingToken(false);
    } catch (error) {
      setTokenError('Token d\'invitation invalide ou expiré');
      setIsValidatingToken(false);
    }
  };

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

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir au minimum l\'email et le mot de passe');
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
      await signUp(email, password, name || undefined);
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
      
      // Rediriger vers le tableau de bord après une connexion réussie
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 500);
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

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <ArrowLeft size={24} color={colors.text} />
              </TouchableOpacity>
              
              <Text style={styles.title}>Créer un compte</Text>
              <Text style={styles.subtitle}>⚡️ Rejoignez EasyGararage gratuitement !</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nom complet (optionnel)</Text>
                <View style={styles.inputContainer}>
                  <User size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Votre nom complet"
                    placeholderTextColor={colors.textSecondary}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Adresse email *</Text>
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
                <Text style={styles.label}>Mot de passe *</Text>
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
                <Text style={styles.label}>Confirmer le mot de passe *</Text>
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
                style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 20, color: 'green' }}>✅</Text>
                    <Text style={styles.registerButtonText}>
                      Créer mon compte
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Vous avez déjà un compte ?</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.loginLink}>Se connecter</Text>
              </TouchableOpacity>
            </View>
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
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 20,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
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
    marginBottom: 14,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border + '80',
    borderRadius: 28,
    paddingHorizontal: 12,
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
    borderRadius: 4,
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  passwordErrorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  registerButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  registerButtonDisabled: {
    backgroundColor: colors.primary + '50',
  },
  registerButtonText: {
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
  loginLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
});