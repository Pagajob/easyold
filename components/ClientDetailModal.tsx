import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { X, Phone, Mail, FileText, Settings, CreditCard, MapPin } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useData, Client } from '@/contexts/DataContext';
import DocumentViewer from './DocumentViewer';
import ClientReservationsModal from './ClientReservationsModal';

interface ClientDetailModalProps {
  visible: boolean;
  client: Client | null;
  onClose: () => void;
  onEdit: (clientId: string) => void;
}

export default function ClientDetailModal({ visible, client, onClose, onEdit }: ClientDetailModalProps) {
  const { colors } = useTheme();
  const { reservations, deleteClient } = useData();
  const [documentViewerVisible, setDocumentViewerVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{ url: string; title: string } | null>(null);
  const [reservationsModalVisible, setReservationsModalVisible] = useState(false);

  if (!client) return null;

  const handleDeleteClient = () => {
    Alert.alert(
      'Supprimer le client',
      `Êtes-vous sûr de vouloir supprimer ${client.prenom} ${client.nom} ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteClient(client.id);
              Alert.alert('Succès', 'Le client a été supprimé avec succès', [{ text: 'OK', onPress: onClose }]);
            } catch {
              Alert.alert('Erreur', 'Impossible de supprimer le client. Veuillez réessayer.');
            }
          },
        },
      ]
    );
  };

  const clientReservations = reservations.filter(r => r.clientId === client.id);
  const totalSpent = clientReservations
    .filter(r => r.statut !== 'Annulé' && r.montantLocation)
    .reduce((sum, r) => sum + (r.montantLocation || 0), 0);

  const openDocument = (url: string, title: string) => {
    setSelectedDocument({ url, title });
    setDocumentViewerVisible(true);
  };

  const closeDocumentViewer = () => {
    setDocumentViewerVisible(false);
    setSelectedDocument(null);
  };

  const openReservationsModal = () => setReservationsModalVisible(true);
  const closeReservationsModal = () => setReservationsModalVisible(false);
  const styles = createStyles(colors);

  return (
    <>
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Détails du client</Text>
            <TouchableOpacity onPress={() => onEdit(client.id)} style={styles.editButton}>
              <Settings size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Main Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Avatar & Name */}
            <View style={styles.mainSection}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{client.prenom[0]}{client.nom[0]}</Text>
              </View>
              <Text style={styles.clientName}>{client.prenom} {client.nom}</Text>
            </View>

            {/* Contact */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Informations de contact</Text>
              {client.telephone ? (
                <View style={styles.detailRow}>
                  <Phone size={16} color={colors.primary} />
                  <Text style={styles.detailLabel}>Téléphone :</Text>
                  <Text style={styles.detailValue}>{client.telephone}</Text>
                </View>
              ) : null}
              {client.email ? (
                <View style={styles.detailRow}>
                  <Mail size={16} color={colors.primary} />
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{client.email}</Text>
                </View>
              ) : null}
              {client.adresse ? (
                <View style={styles.detailRow}>
                  <MapPin size={16} color={colors.primary} />
                  <Text style={styles.detailLabel}>Adresse:</Text>
                  <Text style={styles.detailValue}>{client.adresse}</Text>
                </View>
              ) : null}
              {!client.telephone && !client.email && !client.adresse && (
                <Text style={styles.noDataText}>Aucune information de contact</Text>
              )}
            </View>

            {/* Documents */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Documents</Text>
              <View style={styles.documentsGrid}>
                {client.permisConduire ? (
                  <View style={styles.documentCard}>
                    <Image source={{ uri: client.permisConduire }} style={styles.documentThumbnail} resizeMode="cover" />
                    <CreditCard size={20} color={colors.primary} />
                    <Text style={styles.documentTitle}>Permis de conduire</Text>
                    <TouchableOpacity onPress={() => openDocument(client.permisConduire!, 'Permis de conduire')} style={styles.viewDocumentButton}>
                      <Text style={styles.viewDocumentText}>Voir en grand</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {client.carteIdentite ? (
                  <View style={styles.documentCard}>
                    <Image source={{ uri: client.carteIdentite }} style={styles.documentThumbnail} resizeMode="cover" />
                    <FileText size={20} color={colors.primary} />
                    <Text style={styles.documentTitle}>Carte d'identité</Text>
                    <TouchableOpacity onPress={() => openDocument(client.carteIdentite!, 'Carte d\'identité')} style={styles.viewDocumentButton}>
                      <Text style={styles.viewDocumentText}>Voir en grand</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {!client.permisConduire && !client.carteIdentite && (
                  <Text style={styles.noDataText}>Aucun document ajouté</Text>
                )}
              </View>
            </View>

            {/* Notes */}
            {client.notes ? (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Notes</Text>
                <Text style={styles.notesText}>{client.notes}</Text>
              </View>
            ) : null}

            {/* Statistics */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Statistiques</Text>
              <View style={styles.statsGrid}>
                <TouchableOpacity style={[styles.statCard, styles.clickableStatCard]} onPress={openReservationsModal} activeOpacity={0.7}>
                  <Text style={styles.statValue}>{clientReservations.length}</Text>
                  <Text style={styles.statLabel}>Locations</Text>
                  <Text style={styles.clickHint}>Voir l'historique</Text>
                </TouchableOpacity>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{totalSpent.toLocaleString('fr-FR')} €</Text>
                  <Text style={styles.statLabel}>Total dépensé</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Footer in Modal */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => onEdit(client.id)} style={styles.editButtonLarge}>
              <Settings size={20} color={colors.background} />
              <Text style={styles.editButtonText}>Modifier le client</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Nested Modals */}
      <ClientReservationsModal
        visible={reservationsModalVisible}
        clientId={client.id}
        clientName={`${client.prenom} ${client.nom}`}
        onClose={closeReservationsModal}
      />

      {selectedDocument && (
        <DocumentViewer
          visible={documentViewerVisible}
          documentUrl={selectedDocument.url}
          documentTitle={selectedDocument.title}
          onClose={closeDocumentViewer}
        />
      )}
    </>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  closeButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '600', color: colors.text },
  editButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, padding: 20 },
  mainSection: { backgroundColor: colors.surface, borderRadius: 28, padding: 20, alignItems: 'center', marginBottom: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: colors.background },
  clientName: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  detailSection: { marginBottom: 16, backgroundColor: colors.surface, borderRadius: 12, padding: 16 },
  detailSectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 8 },
  detailLabel: { width: 80, fontSize: 14, color: colors.textSecondary },
  detailValue: { flex: 1, fontSize: 14, fontWeight: '500', color: colors.text, textAlign: 'right' },
  noDataText: { fontSize: 14, color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center' },
  documentsGrid: { gap: 16 },
  documentCard: { backgroundColor: colors.background, borderRadius: 28, padding: 16, alignItems: 'center', marginBottom: 12 },
  documentThumbnail: { width: '100%', height: 120, borderRadius: 8, marginBottom: 8 },
  documentTitle: { fontSize: 14, color: colors.text, marginBottom: 8 },
  viewDocumentButton: { backgroundColor: colors.primary, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 28 },
  viewDocumentText: { fontSize: 12, color: colors.background },
  notesText: { fontSize: 14, fontStyle: 'italic', color: colors.text },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 16, alignItems: 'center' },
  clickableStatCard: { borderWidth: 1, borderColor: colors.primary },
  statValue: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textSecondary },
  clickHint: { fontSize: 10, fontStyle: 'italic', color: colors.primary },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: colors.border },
  deleteButton: { flex: 1, backgroundColor: colors.error, paddingVertical: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  deleteButtonText: { color: colors.background, fontSize: 16, fontWeight: '600' },
  editButtonLarge: { flex: 1, backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  editButtonText: { color: colors.background, fontSize: 16, fontWeight: '600' },
});