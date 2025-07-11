import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { ArrowLeft, Mail, Send, Users, UserPlus } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { doc, collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase'; 
import { InvitationService } from '@/services/invitationService';

// Generate a random token
const generateToken = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default function InviteUserScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { companyInfo } = useCompanySettings();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(true);

  // Load existing invitations using the InvitationService
  React.useEffect(() => {
    if (!user) return;
    
    const loadInvitations = async () => {
      setIsLoadingInvitations(true);
      try {
        const invitationData = await InvitationService.getByInviter(user.uid);
        setInvitations(invitationData);
      } catch (error) {
        console.error('Error loading invitations:', error);
      } finally {
        setIsLoadingInvitations(false);
      }
    };
    
    loadInvitations();
  }, [user]);

  const handleSendInvitation = async () => {
    if (!email.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir une adresse email');
      return;
    }

    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté pour inviter un utilisateur');
      return;
    }

    if (!companyInfo.nom) {
      Alert.alert('Erreur', 'Veuillez configurer les informations de votre entreprise avant d\'inviter des utilisateurs');
      return;
    }

    setIsLoading(true);
    try {
      // Generate a unique token
      const token = generateToken();
      
      // Calculate expiration date (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      // Create invitation record
      const invitationData: Omit<any, 'id'> = {
        email: email.trim().toLowerCase(),
        token,
        expiresAt: Timestamp.fromDate(expiresAt),
        createdAt: Timestamp.now(),
        inviterId: user.uid,
        companyId: user.uid, // Using user.uid as companyId since that's how we store company info
        companyName: companyInfo.nom,
        status: 'pending'
      };
      
      const invitationId = await InvitationService.create(invitationData);
      
      // Send invitation email
      await sendInvitationEmail(email, token, companyInfo.nom, user.uid);
      
      // Add to local state
      setInvitations([...invitations, { id: invitationId, ...invitationData }]);
      
      // Clear form
      setEmail('');
      
      Alert.alert(
        'Invitation envoyée',
        `Un email d'invitation a été envoyé à ${email}`
      );
    } catch (error) {
      console.error('Error sending invitation:', error);
      Alert.alert(
        'Erreur',
        'Impossible d\'envoyer l\'invitation. Veuillez réessayer.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const sendInvitationEmail = async (email: string, token: string, companyName: string, userId: string) => {
    try {
      // Get the base URL for the app
      const baseUrl = Platform.OS === 'web' 
        ? window.location.origin 
        : 'https://easygarage-app.vercel.app'; // Replace with your production URL
      
      const inviteUrl = `${baseUrl}/register?token=${token}`;
      
      // Use the send-email API route
      const apiUrl = Platform.OS === 'web'
        ? `${window.location.origin}/api/send-email`
        : process.env.EXPO_PUBLIC_API_URL 
          ? `${process.env.EXPO_PUBLIC_API_URL}/api/send-email` 
          : 'https://easygarage-app.vercel.app/api/send-email';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: `Invitation à rejoindre ${companyName} sur EasyGarage`,
          userId: userId,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563EB;">Invitation à rejoindre EasyGarage</h2>
              <p>Bonjour,</p>
              <p>Vous avez été invité(e) à rejoindre <strong>${companyName}</strong> sur la plateforme EasyGarage.</p>
              <p>Pour accepter cette invitation, veuillez cliquer sur le lien ci-dessous :</p>
              <p><a href="${inviteUrl}" style="background-color: #2563EB; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accepter l'invitation</a></p>
              <p>Ce lien expirera dans 7 jours.</p>
              <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 12px;">
                EasyGarage - Application de gestion de location de véhicules<br>
                Cet email a été généré automatiquement, merci de ne pas y répondre.
              </p>
            </div>
          `
        })
      });
      
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error sending invitation email:', error);
      throw new Error('Failed to send invitation email');
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Date invalide';
    }
  };

  const getInvitationStatus = (invitation: any) => {
    if (invitation.acceptedAt) {
      return { label: 'Acceptée', color: colors.success };
    }
    
    const expiresAt = invitation.expiresAt?.toDate ? invitation.expiresAt.toDate() : new Date(invitation.expiresAt);
    if (expiresAt < new Date()) {
      return { label: 'Expirée', color: colors.error };
    }
    
    return { label: 'En attente', color: colors.warning };
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      marginRight: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    inputGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 28,
      padding: 12,
      fontSize: 16,
      color: colors.text,
    },
    sendButton: {
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 28,
      gap: 8,
    },
    sendButtonDisabled: {
      backgroundColor: colors.border,
    },
    sendButtonText: {
      color: colors.background,
      fontSize: 16,
      fontWeight: '600',
    },
    invitationsSection: {
      marginTop: 24,
    },
    invitationsList: {
      marginTop: 16,
    },
    invitationCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    invitationEmail: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    invitationDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    invitationDate: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 30,
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 12,
    },
    loadingContainer: {
      padding: 20,
      alignItems: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Inviter des utilisateurs</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Inviter un nouvel utilisateur</Text>
            <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>
              Invitez un membre de votre équipe à rejoindre votre compte EasyGarage. 
              Un email d'invitation sera envoyé avec un lien pour créer un compte.
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Adresse email</Text>
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center',
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 28,
                paddingHorizontal: 12,
              }}>
                <Mail size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  style={{ 
                    flex: 1,
                    paddingVertical: 12,
                    fontSize: 16,
                    color: colors.text,
                  }}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="email@exemple.com"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[
                styles.sendButton,
                (isLoading || !email) && styles.sendButtonDisabled
              ]}
              onPress={handleSendInvitation}
              disabled={isLoading || !email}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <>
                  <Send size={20} color={colors.background} />
                  <Text style={styles.sendButtonText}>Envoyer l'invitation</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.invitationsSection}>
            <Text style={styles.sectionTitle}>Invitations envoyées</Text>
            
            {isLoadingInvitations ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : invitations.length === 0 ? (
              <View style={styles.emptyState}>
                <Users size={48} color={colors.textSecondary} />
                <Text style={styles.emptyStateText}>Aucune invitation envoyée</Text>
              </View>
            ) : (
              <View style={styles.invitationsList}>
                {invitations.map((invitation) => {
                  const status = getInvitationStatus(invitation);
                  
                  return (
                    <View key={invitation.id} style={styles.invitationCard}>
                      <Text style={styles.invitationEmail}>{invitation.email}</Text>
                      <View style={styles.invitationDetails}>
                        <Text style={styles.invitationDate}>
                          Envoyée le {formatDate(invitation.createdAt)}
                        </Text>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: status.color + '20' }
                        ]}>
                          <Text style={[
                            styles.statusText,
                            { color: status.color }
                          ]}>
                            {status.label}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}