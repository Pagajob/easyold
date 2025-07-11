import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { ArrowLeft, Users, UserPlus, Mail, Calendar, CircleAlert as AlertCircle, CircleCheck as CheckCircle, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { InvitationService } from '@/services/invitationService';

export default function CompanyUsersScreen() {
  const { colors } = useTheme();
  const { users, invitations, loading, error } = useCompanyUsers();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDeleteInvitation = async (invitationId: string, email: string) => {
    Alert.alert(
      'Supprimer l\'invitation',
      `Êtes-vous sûr de vouloir supprimer l'invitation pour ${email} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(invitationId);
            try {
              await InvitationService.delete(invitationId);
              Alert.alert('Succès', 'L\'invitation a été supprimée');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer l\'invitation');
            } finally {
              setIsDeleting(null);
            }
          }
        }
      ]
    );
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
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    addButton: {
      backgroundColor: colors.primary,
      borderRadius: 28,
      paddingHorizontal: 12,
      paddingVertical: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    addButtonText: {
      color: colors.background,
      fontSize: 14,
      fontWeight: '500',
    },
    userCard: {
      backgroundColor: colors.background,
      borderRadius: 28,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    userHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    userRole: {
      fontSize: 12,
      color: colors.background,
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      overflow: 'hidden',
    },
    userEmail: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    currentUserBadge: {
      fontSize: 12,
      color: colors.success,
      fontWeight: '500',
      marginTop: 4,
    },
    invitationCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
    },
    invitationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    invitationInfo: {
      flex: 1,
    },
    invitationEmail: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    invitationStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    invitationStatusText: {
      fontSize: 12,
      color: colors.warning,
    },
    invitationDate: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    deleteButton: {
      padding: 8,
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
    errorContainer: {
      backgroundColor: colors.error + '20',
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
    },
    errorText: {
      color: colors.error,
      fontSize: 14,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Utilisateurs de l'entreprise</Text>
      </View>

      <ScrollView style={styles.content}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Utilisateurs actifs</Text>
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => router.push('/settings/invite')}
                >
                  <UserPlus size={16} color={colors.background} />
                  <Text style={styles.addButtonText}>Inviter</Text>
                </TouchableOpacity>
              </View>

              {users.length === 0 ? (
                <View style={styles.emptyState}>
                  <Users size={48} color={colors.textSecondary} />
                  <Text style={styles.emptyStateText}>Aucun utilisateur</Text>
                </View>
              ) : (
                users.map((user) => (
                  <View key={user.id} style={styles.userCard}>
                    <View style={styles.userHeader}>
                      <Text style={styles.userName}>{user.name || 'Utilisateur'}</Text>
                      <Text style={styles.userRole}>{user.role === 'admin' ? 'Admin' : 'Utilisateur'}</Text>
                    </View>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    {user.isCurrentUser && (
                      <Text style={styles.currentUserBadge}>Vous</Text>
                    )}
                  </View>
                ))
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Invitations en attente</Text>

              {invitations.length === 0 ? (
                <View style={styles.emptyState}>
                  <Mail size={48} color={colors.textSecondary} />
                  <Text style={styles.emptyStateText}>Aucune invitation en attente</Text>
                </View>
              ) : (
                invitations.map((invitation) => (
                  <View key={invitation.id} style={styles.invitationCard}>
                    <View style={styles.invitationHeader}>
                      <View style={styles.invitationInfo}>
                        <Text style={styles.invitationEmail}>{invitation.email}</Text>
                        <View style={styles.invitationStatus}>
                          <AlertCircle size={14} color={colors.warning} />
                          <Text style={styles.invitationStatusText}>En attente d'acceptation</Text>
                        </View>
                        <Text style={styles.invitationDate}>
                          Envoyée le {formatDate(invitation.createdAt)}
                        </Text>
                        <Text style={styles.invitationDate}>
                          Expire le {formatDate(invitation.expiresAt)}
                        </Text>
                      </View>
                      
                      <TouchableOpacity 
                        style={styles.deleteButton}
                        onPress={() => handleDeleteInvitation(invitation.id, invitation.email)}
                        disabled={isDeleting === invitation.id}
                      >
                        {isDeleting === invitation.id ? (
                          <ActivityIndicator size="small" color={colors.error} />
                        ) : (
                          <X size={20} color={colors.error} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}