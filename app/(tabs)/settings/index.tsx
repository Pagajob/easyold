import React from 'react';
import {
  View,
  Text,
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  SafeAreaView,
  Modal,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Palette, Moon, Sun, Download, FileText, TrendingUp, Users, Plus, UserPlus, User, LogOut, ChevronRight, ChartBar as BarChart, Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import CompanyInfoForm from '@/components/settings/CompanyInfoForm';
import ExtraFeesSection from '@/components/settings/ExtraFeesSection'; 
import { router } from 'expo-router'; 
import { useState } from 'react';
import { useData } from '@/contexts/DataContext';

export const unstable_settings = {
  title: 'Paramètres',
};

const COLOR_PRESETS = [
  { name: 'Bleu', color: '#2563EB' },
  { name: 'Vert', color: '#10B981' },
  { name: 'Violet', color: '#8B5CF6' },
  { name: 'Rose', color: '#EC4899' },
  { name: 'Orange', color: '#F97316' },
  { name: 'Rouge', color: '#EF4444' },
];

export default function SettingsScreen() {
  const { colors, isDark, updatePrimaryColor, toggleTheme } = useTheme();
  const { user, userProfile, logout } = useAuth(); 
  const { vehicles, clients, reservations } = useData();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const displayName =
    userProfile?.name ||
    user?.email?.split('@')[0] ||
    user?.email ||
    'Utilisateur';

  const handleColorChange = (color: string) => updatePrimaryColor(color);

  const exportData = async () => {
    setIsExporting(true);
    try {
      // Generate CSV content for each table
      const vehiclesCSV = generateVehiclesCSV();
      const clientsCSV = generateClientsCSV();
      const reservationsCSV = generateReservationsCSV();
      const edlCSV = generateEDLCSV();
      
      // Combine all CSVs into a single file with sections
      const combinedCSV = `# VÉHICULES\n${vehiclesCSV}\n\n# CLIENTS\n${clientsCSV}\n\n# RÉSERVATIONS\n${reservationsCSV}\n\n# ÉTATS DES LIEUX\n${edlCSV}`;
      
      // Create a Blob with the CSV content
      const blob = new Blob([combinedCSV], { type: 'text/csv;charset=utf-8;' });
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `easygarage_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      Alert.alert('Succès', 'Vos données ont été exportées avec succès au format CSV.');
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'export des données.');
    } finally {
      setIsExporting(false);
    }
  };

  const generateVehiclesCSV = () => {
    // Header row
    const header = 'ID,Marque,Modèle,Immatriculation,Carburant,Statut,Financement,Prix 24h,Prix Weekend,Km Journalier\n';
    
    // Data rows
    const rows = vehicles.map(v => {
      return `${v.id},"${v.marque}","${v.modele}","${v.immatriculation}","${v.carburant}","${v.statut}","${v.financement}",${v.prix_base_24h || 0},${v.prix_base_weekend || 0},${v.kilometrageJournalier || 0}`;
    }).join('\n');
    
    return header + rows;
  };
  
  const generateClientsCSV = () => {
    // Header row
    const header = 'ID,Prénom,Nom,Téléphone,Email,Adresse\n';
    
    // Data rows
    const rows = clients.map(c => {
      return `${c.id},"${c.prenom}","${c.nom}","${c.telephone || ''}","${c.email || ''}","${c.adresse || ''}"`;
    }).join('\n');
    
    return header + rows;
  };
  
  const generateReservationsCSV = () => {
    // Header row
    const header = 'ID,Véhicule,Client,Date Début,Date Fin,Statut,Montant\n';
    
    // Data rows
    const rows = reservations.map(r => {
      const vehicle = vehicles.find(v => v.id === r.vehiculeId);
      const client = clients.find(c => c.id === r.clientId);
      const vehicleName = vehicle ? `${vehicle.marque} ${vehicle.modele}` : 'Inconnu';
      const clientName = client ? `${client.prenom} ${client.nom}` : 'Inconnu';
      
      return `${r.id},"${vehicleName}","${clientName}","${r.dateDebut} ${r.heureDebut}","${r.dateRetourPrevue} ${r.heureRetourPrevue}","${r.statut}",${r.montantLocation || 0}`;
    }).join('\n');
    
    return header + rows;
  };
  
  const generateEDLCSV = () => {
    // Header row
    const header = 'ID Réservation,Type,Date,Km Départ,Km Retour,Carburant Départ,Carburant Retour\n';
    
    // Data rows
    const rows = reservations
      .filter(r => r.edlDepart || r.edlRetour)
      .map(r => {
        const kmDepart = r.edlDepart?.kmDepart || 0;
        const kmRetour = r.edlRetour?.kmRetour || 0;
        const carburantDepart = r.edlDepart?.carburant || 0;
        const carburantRetour = r.edlRetour?.carburantRetour || 0;
        
        return `${r.id},"${r.edlDepart ? 'Départ+' : ''}${r.edlRetour ? 'Retour' : ''}","${r.dateDebut}",${kmDepart},${kmRetour},${carburantDepart},${carburantRetour}`;
      }).join('\n');
    
    return header + rows;
  };

  const generateReport = async () => {
    setIsGeneratingReport(true);
    try {
      // Calculate statistics for the report
      const totalVehicles = vehicles.length;
      const activeVehicles = vehicles.filter(v => v.statut === 'Disponible' || v.statut === 'Loué').length;
      const totalClients = clients.length;
      const totalReservations = reservations.length;
      const completedReservations = reservations.filter(r => r.statut === 'Terminé').length;
      
      // Calculate total revenue
      const totalRevenue = reservations
        .filter(r => r.statut !== 'Annulé')
        .reduce((sum, r) => sum + (r.montantLocation || 0), 0);
      
      // Calculate revenue by vehicle
      const revenueByVehicle = vehicles.map(vehicle => {
        const vehicleReservations = reservations.filter(r => 
          r.vehiculeId === vehicle.id && r.statut !== 'Annulé'
        );
        
        const revenue = vehicleReservations.reduce((sum, r) => sum + (r.montantLocation || 0), 0);
        const reservationCount = vehicleReservations.length;
        
        return {
          id: vehicle.id,
          name: `${vehicle.marque} ${vehicle.modele}`,
          revenue,
          reservationCount
        };
      }).sort((a, b) => b.revenue - a.revenue);
      
      // Generate HTML content for the report
      const reportHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Rapport de Rentabilité</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #2563EB;
              padding-bottom: 20px;
            }
            .header h1 {
              color: #2563EB;
              margin-bottom: 5px;
            }
            .header p {
              color: #666;
              margin: 5px 0;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 15px;
              color: #2563EB;
              border-bottom: 1px solid #eee;
              padding-bottom: 5px;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
              gap: 15px;
              margin-bottom: 20px;
            }
            .stat-card {
              background-color: #f8fafc;
              border-radius: 8px;
              padding: 15px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.05);
              text-align: center;
            }
            .stat-value {
              font-size: 24px;
              font-weight: bold;
              color: #2563EB;
              margin-bottom: 5px;
            }
            .stat-label {
              font-size: 14px;
              color: #64748B;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Rapport de Rentabilité</h1>
            <p>EasyGarage - ${new Date().toLocaleDateString('fr-FR')}</p>
          </div>
          
          <div class="section">
            <h2 class="section-title">Statistiques Générales</h2>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">${totalVehicles}</div>
                <div class="stat-label">Véhicules</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${activeVehicles}</div>
                <div class="stat-label">Véhicules actifs</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${totalClients}</div>
                <div class="stat-label">Clients</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${totalReservations}</div>
                <div class="stat-label">Réservations totales</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${completedReservations}</div>
                <div class="stat-label">Réservations terminées</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${totalRevenue.toLocaleString('fr-FR')} €</div>
                <div class="stat-label">Chiffre d'affaires total</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h2 class="section-title">Rentabilité par Véhicule</h2>
            <table>
              <thead>
                <tr>
                  <th>Véhicule</th>
                  <th>Nombre de locations</th>
                  <th>Chiffre d'affaires</th>
                </tr>
              </thead>
              <tbody>
                ${revenueByVehicle.map(v => `
                  <tr>
                    <td>${v.name}</td>
                    <td>${v.reservationCount}</td>
                    <td>${v.revenue.toLocaleString('fr-FR')} €</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="footer">
            <p>Rapport généré le ${new Date().toLocaleString('fr-FR')}</p>
            <p>EasyGarage - Application de gestion de location de véhicules</p>
          </div>
        </body>
        </html>
      `;
      
      // Create a Blob with the HTML content
      const blob = new Blob([reportHTML], { type: 'text/html' });
      
      // Convert HTML to PDF (in a real implementation, this would use a proper HTML-to-PDF library)
      // For this example, we'll just download the HTML file
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rapport_rentabilite_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      Alert.alert('Succès', 'Le rapport de rentabilité a été généré avec succès.');
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la génération du rapport.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const inviteUser = () => {
    Alert.alert(
      'Inviter un utilisateur',
      "Cette fonctionnalité sera bientôt disponible. Vous pourrez inviter d'autres utilisateurs à collaborer.",
      [{ text: 'OK' }]
    );
  };

  const handleLogoutPress = () => {
    setLogoutModalVisible(true);
  };

  const handleConfirmLogout = async () => {
    setLogoutModalVisible(false);
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Erreur', 'Impossible de se déconnecter. Veuillez réessayer.');
    }
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={{ backgroundColor: colors.primary + '10', borderRadius: 20, padding: 18, marginBottom: 24, alignItems: 'center' }}
          onPress={() => router.push('/(tabs)/settings/subscription')}
        >
          <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 18 }}>Gérer mon abonnement</Text>
        </TouchableOpacity>
        <View style={styles.formContainer}>
          <CompanyInfoForm />
        </View>
        
        <View style={styles.formContainer}>
          <ExtraFeesSection />
        </View>

        <View style={[styles.section, styles.sectionCard]}>
          <Text style={styles.sectionTitle}>👥 Gestion des utilisateurs</Text>
          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/settings/users')}>
            <View style={styles.settingLeft}>
              <Users size={24} color={colors.primary} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Gérer les utilisateurs</Text>
                <Text style={styles.settingSubtitle}>
                  Voir et gérer les invitations
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.section, styles.sectionCard]}>
          <Text style={styles.sectionTitle}>🎨 Apparence</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              {isDark ? (
                <Moon size={24} color={colors.primary} />
              ) : (
                <Sun size={24} color={colors.primary} />
              )}
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Thème sombre</Text>
                <Text style={styles.settingSubtitle}>
                  {isDark ? 'Mode sombre activé' : 'Mode clair activé'}
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.background}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Palette size={24} color={colors.primary} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Couleur principale</Text>
                <Text style={styles.settingSubtitle}>
                  Personnalisez l'accent de l'application
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.colorGrid}>
            {COLOR_PRESETS.map(preset => (
              <TouchableOpacity
                key={preset.color}
                style={[
                  styles.colorOption,
                  { backgroundColor: preset.color },
                  colors.primary === preset.color && {
                    borderWidth: 3,
                    borderColor: '#222',
                    overflow: 'hidden',
                  },
                ]}
                onPress={() => handleColorChange(preset.color)}
              >
                {colors.primary === preset.color && (
                  <Check size={20} color="#fff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, styles.sectionCard]}>
          <Text style={styles.sectionTitle}>📊 Rapports et analyses</Text>
          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/settings/profit-report')}>
            <View style={styles.settingLeft}>
              <BarChart size={24} color={colors.primary} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Rapport de rentabilité</Text>
                <Text style={styles.settingSubtitle}>
                  Visualisez les performances financières par véhicule
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.section, styles.sectionCard]}>
          <Text style={styles.sectionTitle}>📊 Export et rapports</Text>
          <TouchableOpacity style={styles.settingItem} onPress={exportData}>
            <View style={styles.settingLeft}>
              <FileText size={24} color={isExporting ? colors.textSecondary : colors.primary} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Exporter les données</Text>
                <Text style={styles.settingSubtitle}>
                  Télécharger véhicules, clients, réservations et EDL en CSV
                </Text>
              </View>
            </View>
            {isExporting ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Download size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={generateReport}>
            <View style={styles.settingLeft}>
              <TrendingUp size={24} color={isGeneratingReport ? colors.textSecondary : colors.primary} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Rapport de rentabilité</Text>
                <Text style={styles.settingSubtitle}>
                  Générer un rapport détaillé au format PDF
                </Text>
              </View>
            </View>
            {isGeneratingReport ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Download size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.section, styles.sectionCard]}>
          <Text style={styles.sectionTitle}>👤 Utilisateur</Text>
          <View style={styles.userCard}>
            <View style={styles.userAvatar}>
              <User size={24} color={colors.primary} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>

          <View style={[styles.userCard, { marginTop: 16 }]}> 
            <View style={styles.userInfo}>
              <Text style={styles.settingTitle}>Informations utilisateur</Text>
              <Text style={styles.settingSubtitle}>Email: {user?.email}</Text>
              {userProfile?.name && (
                <Text style={styles.settingSubtitle}>
                  Nom: {userProfile.name}
                </Text>
              )}
              <Text style={styles.settingSubtitle}>
                Vérifié: {user?.emailVerified ? 'Oui' : 'Non'}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={[styles.logoutButton, { marginTop: 24 }]} onPress={handleLogoutPress}>
            <LogOut size={20} color={colors.background} />
            <Text style={styles.logoutButtonText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Logout Confirmation Modal */}
      <Modal
        visible={logoutModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Voulez-vous vous déconnecter ?</Text>
            <Text style={styles.modalMessage}>
              Vous devrez vous reconnecter pour accéder à votre compte.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalConfirmButton}
                onPress={handleConfirmLogout}
              >
                <Text style={styles.modalConfirmText}>Se déconnecter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { 
      flex: 1,
      backgroundColor: colors.background,
      position: 'relative',
      paddingTop: Platform.OS === 'ios' ? 60 : 30, // Ajout d'un padding pour compenser la suppression du SafeAreaView
    },
    headerSafe: {
      backgroundColor: colors.background,
    },
    header: { 
      paddingTop: Platform.OS === 'ios' ? 8 : 12,
      paddingBottom: 12,
      paddingHorizontal: 24,
    },
    title: { 
      fontSize: 28, 
      fontWeight: '800', 
      color: colors.text,
      marginTop: 0,
    },
    scrollContent: {
      paddingBottom: 100,
      paddingTop: 8,
    },
    formContainer: {
      marginHorizontal: 16,
      marginBottom: 24,
    },
    section: { 
      marginBottom: 24, 
      paddingHorizontal: 20 
    },
    sectionCard: {
      marginHorizontal: 16,
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 20,
    },
    userCard: {
      backgroundColor: colors.background,
      borderRadius: 10,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center', 
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 1,
      elevation: 1,
    },
    userAvatar: {
      width: 50, 
      height: 50,
      borderRadius: 50,
      backgroundColor: colors.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    userInfo: { flex: 1 }, 
    userName: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    userEmail: { fontSize: 14, color: colors.textSecondary },
    footer: {
      width: '100%',
      backgroundColor: colors.background,
      paddingBottom: Platform.OS === 'ios' ? 30 : 0,
    },
    footerContent: {
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border + '60',
    },
    logoutButton: { 
      backgroundColor: colors.error,
      flexDirection: 'row',
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8, 
      width: '100%',
    },
    logoutButtonText: {
      color: colors.background,
      fontSize: 16,
      fontWeight: '700',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContainer: {
      backgroundColor: colors.background,
      borderRadius: 14,
      padding: 24,
      width: '100%',
      maxWidth: 400,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    modalMessage: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 24,
      textAlign: 'center',
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    modalCancelButton: {
      flex: 1,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border + '80',
      borderRadius: 28,
      paddingVertical: 14,
      alignItems: 'center',
    },
    modalCancelText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    modalConfirmButton: {
      flex: 1,
      backgroundColor: colors.error,
      borderRadius: 28,
      paddingVertical: 14,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    modalConfirmText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.background,
    },
    settingItem: {
      backgroundColor: colors.surface,
      borderRadius: 28,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    settingTextContainer: { marginLeft: 16, flex: 1 },
    settingTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
    settingSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 20,
    },
    colorOption: {
      width: 50,
      height: 50,
      borderRadius: 50,
      alignItems: 'center',
      justifyContent: 'center', 
    },
    colorOptionSelected: { 
      transform: [{ scale: 1.1 }],
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
    colorCheckmark: {
      width: 20,
      height: 20,
      borderRadius: 20,
      backgroundColor: 'white',
    },
  });