import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Phone, Mail, Settings, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Client } from '@/contexts/DataContext';

interface ClientCardProps {
  client: Client;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ClientCard({ client, onPress, onEdit, onDelete }: ClientCardProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {client.prenom.charAt(0)}{client.nom.charAt(0)}
          </Text>
        </View>
        
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>
            {client.prenom} {client.nom}
          </Text>
          
          {client.telephone && (
            <View style={styles.contactItem}>
              <Phone size={14} color={colors.textSecondary} />
              <Text style={styles.contactText}>{client.telephone}</Text>
            </View>
          )}
          
          {client.email && (
            <View style={styles.contactItem}>
              <Mail size={14} color={colors.textSecondary} />
              <Text style={styles.contactText}>{client.email}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.documents}>
          {client.permisConduire && (
            <View style={styles.documentBadge}>
              <Text style={styles.documentText}>Permis</Text>
            </View>
          )}
          {client.carteIdentite && (
            <View style={styles.documentBadge}>
              <Text style={styles.documentText}>ID</Text>
            </View>
          )}
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
            onPress={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Settings size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.error + '20' }]}
            onPress={(e) => {
              e.stopPropagation(); // Prevent triggering the card's onPress
              onDelete();
            }}
            activeOpacity={0.7}
          >
            <Trash2 size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {client.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesText}>{client.notes}</Text>
        </View>
      )}

      <View style={styles.clickIndicator}>
        <Text style={styles.clickIndicatorText}>👆 Appuyez pour voir les détails</Text>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.background,
  },
  clientInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text, 
    marginBottom: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  documents: {
    flexDirection: 'row',
    gap: 8,
  },
  documentBadge: {
    backgroundColor: colors.accent + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 28,
  },
  documentText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.accent,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notesSection: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  clickIndicator: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  clickIndicatorText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '500',
  },
});