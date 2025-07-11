import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Platform, 
  Image,
  ActivityIndicator,
  Dimensions,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Download, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Car, 
  Users, 
  ChevronDown,
  ChevronRight,
  ChevronLeft
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useVehicles } from '@/hooks/useVehicles';
import { useClients } from '@/hooks/useClients';
import { useReservations } from '@/hooks/useReservations';
import { useCharges } from '@/hooks/useCharges';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { router } from 'expo-router';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import ExportSuccessModal from '@/components/ExportSuccessModal';

// Mois en français
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function ProfitReportScreen() {
  const { colors } = useTheme();
  const { vehicles } = useVehicles();
  const { clients } = useClients();
  const { reservations, calculateTotalRevenue } = useReservations();
  const { charges, calculateMonthlyCharges } = useCharges();
  const { companyInfo } = useCompanySettings();
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportedFileName, setExportedFileName] = useState('');
  
  // État pour le mois et l'année sélectionnés
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  
  const screenWidth = Dimensions.get('window').width;
  
  // Fonction pour filtrer les données par mois/année
  const filterDataByMonth = (data, dateField) => {
    return data.filter(item => {
      const date = new Date(item[dateField]);
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
    });
  };
  
  // Réservations du mois sélectionné
  const monthlyReservations = filterDataByMonth(reservations, 'dateDebut');
  
  // Calcul des statistiques
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(v => v.statut === 'Disponible' || v.statut === 'Loué').length;
  const totalClients = clients.length;
  const totalReservations = monthlyReservations.length;
  const completedReservations = monthlyReservations.filter(r => r.statut === 'Terminé').length;
  
  // Calcul des revenus et charges
  const totalRevenue = monthlyReservations
    .filter(r => r.statut !== 'Annulé')
    .reduce((sum, r) => sum + (r.montantLocation || 0), 0);
  
  const totalCharges = calculateMonthlyCharges();
  const netProfit = totalRevenue - totalCharges;
  
  // Données par véhicule
  const vehicleData = vehicles.map(vehicle => {
    const vehicleReservations = monthlyReservations.filter(r => r.vehiculeId === vehicle.id);
    const revenue = vehicleReservations
      .filter(r => r.statut !== 'Annulé')
      .reduce((sum, r) => sum + (r.montantLocation || 0), 0);
    
    // Charges spécifiques au véhicule
    const vehicleCharges = charges
      .filter(c => c.vehiculeId === vehicle.id)
      .reduce((sum, c) => {
        const multiplier = c.frequence === 'Trimestrielle' ? 1/3 : c.frequence === 'Annuelle' ? 1/12 : 1;
        return sum + (c.montantMensuel * multiplier);
      }, 0);
    
    // Ajout des coûts fixes du véhicule
    let fixedCosts = 0;
    if (vehicle.assuranceMensuelle) fixedCosts += vehicle.assuranceMensuelle;
    if (vehicle.financement === 'Leasing' && vehicle.mensualites) fixedCosts += vehicle.mensualites;
    if (vehicle.financement === 'LLD' && vehicle.loyerMensuel) fixedCosts += vehicle.loyerMensuel;
    
    const totalCosts = vehicleCharges + fixedCosts;
    const profit = revenue - totalCosts;
    
    return {
      id: vehicle.id,
      name: `${vehicle.marque} ${vehicle.modele}`,
      immatriculation: vehicle.immatriculation,
      reservations: vehicleReservations.length,
      revenue,
      charges: totalCosts,
      profit
    };
  }).sort((a, b) => b.revenue - a.revenue);
  
  // Données pour les graphiques
  const revenueData = {
    labels: vehicleData.slice(0, 5).map(v => v.name.split(' ')[1] || v.name.split(' ')[0]),
    datasets: [
      {
        data: vehicleData.slice(0, 5).map(v => v.revenue),
        color: (opacity = 1) => colors.primary,
      }
    ]
  };
  
  const profitData = {
    labels: vehicleData.slice(0, 5).map(v => v.name.split(' ')[1] || v.name.split(' ')[0]),
    datasets: [
      {
        data: vehicleData.slice(0, 5).map(v => v.profit),
        color: (opacity = 1) => v => v > 0 ? colors.success : colors.error,
      }
    ]
  };
  
  // Données pour le graphique en camembert
  const pieData = vehicleData
    .filter(v => v.revenue > 0)
    .slice(0, 5)
    .map((vehicle, index) => {
      const colorOptions = [
        colors.primary, 
        colors.success, 
        colors.warning, 
        colors.info, 
        colors.accent
      ];
      
      return {
        name: vehicle.name,
        revenue: vehicle.revenue,
        color: colorOptions[index % colorOptions.length],
        legendFontColor: colors.text,
        legendFontSize: 12
      };
    });
  
  // Fonction pour exporter le rapport
  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      // Simuler un délai d'exportation pour l'exemple
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Générer un nom de fichier
      const fileName = `rapport_rentabilite_${MONTHS[selectedMonth].toLowerCase()}_${selectedYear}.pdf`;
      setExportedFileName(fileName);
      
      // Afficher le modal de succès
      setExportModalVisible(true);
    } catch (error) {
      console.error('Erreur lors de l\'exportation:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'exportation du rapport');
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleDownload = () => {
    // Logique pour ouvrir ou télécharger le fichier
    console.log('Téléchargement du fichier:', exportedFileName);
    
    // Fermer le modal après le téléchargement
    setTimeout(() => {
      setExportModalVisible(false);
    }, 500);
  };
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 60 : 20,
      paddingBottom: 16,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '30',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
    },
    exportButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      gap: 8,
    },
    exportButtonText: {
      color: colors.background,
      fontSize: 14,
      fontWeight: '600',
    },
    companyInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      gap: 12,
    },
    logoContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    logo: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    companyName: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    companyAddress: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    dateSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginHorizontal: 20,
      marginVertical: 16,
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 1,
    },
    dateText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    dateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    monthPicker: {
      position: 'absolute',
      top: 60,
      left: 20,
      right: 20,
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5,
      zIndex: 1000,
    },
    monthGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginTop: 12,
    },
    monthItem: {
      width: '30%',
      paddingVertical: 12,
      paddingHorizontal: 8,
      marginBottom: 10,
      alignItems: 'center',
      borderRadius: 8,
    },
    monthItemSelected: {
      backgroundColor: colors.primary + '20',
    },
    monthText: {
      fontSize: 14,
      color: colors.text,
    },
    monthTextSelected: {
      color: colors.primary,
      fontWeight: '600',
    },
    yearSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 12,
      gap: 16,
    },
    yearButton: {
      padding: 8,
    },
    yearText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginHorizontal: 20,
      marginBottom: 20,
    },
    statCard: {
      width: '48%',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 1,
    },
    statIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    statValue: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginVertical: 4,
    },
    statLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    financialSummary: {
      marginHorizontal: 20,
      marginBottom: 24,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 1,
    },
    summaryTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    summaryLabel: {
      fontSize: 15,
      color: colors.text,
    },
    summaryValue: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    summaryTotal: {
      marginTop: 8,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border + '40',
    },
    summaryTotalLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    summaryTotalValue: {
      fontSize: 20,
      fontWeight: '800',
      color: netProfit >= 0 ? colors.success : colors.error,
    },
    chartContainer: {
      marginHorizontal: 20,
      marginBottom: 24,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 1,
    },
    chartTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
    },
    tableContainer: {
      marginHorizontal: 20,
      marginBottom: 24,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 1,
    },
    tableHeader: {
      flexDirection: 'row',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '40',
      marginBottom: 8,
    },
    tableHeaderCell: {
      fontWeight: '700',
      fontSize: 14,
      color: colors.text,
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '20',
    },
    tableCell: {
      fontSize: 14,
      color: colors.text,
    },
    vehicleNameCell: {
      width: '30%',
      paddingRight: 8,
    },
    reservationsCell: {
      width: '15%',
      textAlign: 'center',
    },
    revenueCell: {
      width: '20%',
      textAlign: 'right',
    },
    chargesCell: {
      width: '20%',
      textAlign: 'right',
    },
    profitCell: {
      width: '15%',
      textAlign: 'right',
      fontWeight: '600',
    },
    profitPositive: {
      color: colors.success,
    },
    profitNegative: {
      color: colors.error,
    },
    noDataContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    },
    noDataText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    loadingContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.3)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    loadingCard: {
      backgroundColor: colors.background,
      borderRadius: 28,
      padding: 20,
      alignItems: 'center',
      width: '80%',
      maxWidth: 300,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.text,
      fontWeight: '600',
    },
    pieChartContainer: {
      alignItems: 'center',
      marginTop: 20,
    },
    chartLegend: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginTop: 16,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 16,
      marginBottom: 8,
    },
    legendColor: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 6,
    },
    legendText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Rapport de Rentabilité</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.exportButton}
          onPress={handleExportReport}
          disabled={isExporting}
        >
          {isExporting ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <>
              <Download size={16} color={colors.background} />
              <Text style={styles.exportButtonText}>Télécharger</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Informations de l'entreprise */}
        <View style={styles.companyInfo}>
          <View style={styles.logoContainer}>
            {companyInfo.logo ? (
              <Image source={{ uri: companyInfo.logo }} style={styles.logo} />
            ) : (
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.primary }}>
                {companyInfo.nom ? companyInfo.nom.charAt(0) : 'E'}
              </Text>
            )}
          </View>
          <View>
            <Text style={styles.companyName}>{companyInfo.nom || 'EasyGarage'}</Text>
            <Text style={styles.companyAddress}>{companyInfo.adresse || 'Adresse non spécifiée'}</Text>
          </View>
        </View>
        
        {/* Sélecteur de date */}
        <View style={styles.dateSelector}>
          <Text style={styles.dateText}>Période du rapport</Text>
          <TouchableOpacity 
            style={styles.dateButton}
            onPress={() => setMonthPickerVisible(!monthPickerVisible)}
          >
            <Text style={styles.dateText}>{MONTHS[selectedMonth]} {selectedYear}</Text>
            <ChevronDown size={20} color={colors.text} />
          </TouchableOpacity>
          
          {monthPickerVisible && (
            <View style={styles.monthPicker}>
              <View style={styles.yearSelector}>
                <TouchableOpacity 
                  style={styles.yearButton}
                  onPress={() => setSelectedYear(selectedYear - 1)}
                >
                  <ChevronLeft size={20} color={colors.primary} />
                </TouchableOpacity>
                <Text style={styles.yearText}>{selectedYear}</Text>
                <TouchableOpacity 
                  style={styles.yearButton}
                  onPress={() => setSelectedYear(selectedYear + 1)}
                >
                  <ChevronRight size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.monthGrid}>
                {MONTHS.map((month, index) => (
                  <TouchableOpacity
                    key={month}
                    style={[
                      styles.monthItem,
                      selectedMonth === index && styles.monthItemSelected
                    ]}
                    onPress={() => {
                      setSelectedMonth(index);
                      setMonthPickerVisible(false);
                    }}
                  >
                    <Text 
                      style={[
                        styles.monthText,
                        selectedMonth === index && styles.monthTextSelected
                      ]}
                    >
                      {month}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
        
        {/* Statistiques principales */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Car size={20} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>{totalVehicles}</Text>
            <Text style={styles.statLabel}>Véhicules</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Car size={20} color={colors.success} />
            </View>
            <Text style={styles.statValue}>{activeVehicles}</Text>
            <Text style={styles.statLabel}>Véhicules actifs</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Users size={20} color={colors.info} />
            </View>
            <Text style={styles.statValue}>{totalClients}</Text>
            <Text style={styles.statLabel}>Clients</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Calendar size={20} color={colors.warning} />
            </View>
            <Text style={styles.statValue}>{totalReservations}</Text>
            <Text style={styles.statLabel}>Réservations</Text>
          </View>
        </View>
        
        {/* Résumé financier */}
        <View style={styles.financialSummary}>
          <Text style={styles.summaryTitle}>Résumé Financier</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Chiffre d'affaires</Text>
            <Text style={styles.summaryValue}>{totalRevenue.toLocaleString('fr-FR')} €</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Charges totales</Text>
            <Text style={styles.summaryValue}>{totalCharges.toLocaleString('fr-FR')} €</Text>
          </View>
          
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryTotalLabel}>Bénéfice net</Text>
            <Text style={styles.summaryTotalValue}>{netProfit.toLocaleString('fr-FR')} €</Text>
          </View>
        </View>
        
        {/* Graphique des revenus */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Chiffre d'affaires par véhicule</Text>
          
          {vehicleData.length > 0 ? (
            <BarChart
              data={revenueData}
              width={screenWidth - 60}
              height={220}
              yAxisLabel="€"
              chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFrom: colors.surface,
                backgroundGradientTo: colors.surface,
                decimalPlaces: 0,
                color: (opacity = 1) => colors.primary,
                labelColor: (opacity = 1) => colors.text,
                style: {
                  borderRadius: 16,
                },
                propsForLabels: {
                  fontSize: 10,
                },
              }}
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>Aucune donnée disponible pour cette période</Text>
            </View>
          )}
        </View>
        
        {/* Graphique en camembert */}
        {pieData.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Répartition du chiffre d'affaires</Text>
            
            <View style={styles.pieChartContainer}>
              <PieChart
                data={pieData}
                width={screenWidth - 60}
                height={200}
                chartConfig={{
                  color: (opacity = 1) => colors.text,
                }}
                accessor="revenue"
                backgroundColor="transparent"
                paddingLeft="0"
                absolute
              />
            </View>
            
            <View style={styles.chartLegend}>
              {pieData.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                  <Text style={styles.legendText}>{item.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Tableau détaillé */}
        <View style={styles.tableContainer}>
          <Text style={styles.summaryTitle}>Détail par véhicule</Text>
          
          {vehicleData.length > 0 ? (
            <>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.vehicleNameCell]}>Véhicule</Text>
                <Text style={[styles.tableHeaderCell, styles.reservationsCell]}>Rés.</Text>
                <Text style={[styles.tableHeaderCell, styles.revenueCell]}>C.A.</Text>
                <Text style={[styles.tableHeaderCell, styles.chargesCell]}>Charges</Text>
                <Text style={[styles.tableHeaderCell, styles.profitCell]}>Bénéfice</Text>
              </View>
              
              {vehicleData.map((vehicle) => (
                <View key={vehicle.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.vehicleNameCell]} numberOfLines={1}>
                    {vehicle.name}
                  </Text>
                  <Text style={[styles.tableCell, styles.reservationsCell]}>
                    {vehicle.reservations}
                  </Text>
                  <Text style={[styles.tableCell, styles.revenueCell]}>
                    {vehicle.revenue.toLocaleString('fr-FR')} €
                  </Text>
                  <Text style={[styles.tableCell, styles.chargesCell]}>
                    {vehicle.charges.toLocaleString('fr-FR')} €
                  </Text>
                  <Text 
                    style={[
                      styles.tableCell, 
                      styles.profitCell,
                      vehicle.profit >= 0 ? styles.profitPositive : styles.profitNegative
                    ]}
                  >
                    {vehicle.profit.toLocaleString('fr-FR')} €
                  </Text>
                </View>
              ))}
            </>
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>Aucune donnée disponible pour cette période</Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      {isExporting && (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Génération du rapport...</Text>
          </View>
        </View>
      )}
      
      {/* Modal de succès d'exportation */}
      <ExportSuccessModal
        visible={exportModalVisible}
        onClose={() => setExportModalVisible(false)}
        onDownload={handleDownload}
        fileName={exportedFileName}
        period={`${MONTHS[selectedMonth]} ${selectedYear}`}
      />
    </SafeAreaView>
  );
}