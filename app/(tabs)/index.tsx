import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform, Image, TouchableOpacity } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useTheme } from '@/contexts/ThemeContext';
import { useVehicles } from '@/hooks/useVehicles';
import { useClients } from '@/hooks/useClients';
import { useReservations } from '@/hooks/useReservations'; 
import { useCharges } from '@/hooks/useCharges'; 
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import StatsCards from '@/components/dashboard/StatsCards';
import FinancialCards from '@/components/dashboard/FinancialCards';
import ChargesSection from '@/components/dashboard/ChargesSection';
import VehicleChargesSection from '@/components/dashboard/VehicleChargesSection';
import TodayDeparturesSection from '@/components/dashboard/TodayDeparturesSection';
import NotificationDemo from '@/components/NotificationDemo';
import { router } from 'expo-router';
import { ChevronRight, Bell } from 'lucide-react-native';
import { useNotificationContext } from '@/contexts/NotificationContext';

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { vehicles, availableVehicles, rentedVehicles, maintenanceVehicles, loading: vehiclesLoading, error: vehiclesError } = useVehicles();
  const { clients } = useClients();
  const { getActiveReservations, calculateTotalRevenue } = useReservations();
  const { charges, calculateMonthlyCharges } = useCharges();
  const { companyInfo } = useCompanySettings();
  const { calculateVehicleOwnerPayments } = useReservations();
  const { showSuccess, showError, showWarning, showInfo } = useNotificationContext();
  
  const screenWidth = Dimensions.get('window').width;

  if (vehiclesLoading) {
    return <LoadingSpinner message="Chargement du tableau de bord..." />;
  }

  if (vehiclesError) {
    return <ErrorMessage message={vehiclesError} />;
  }

  // Calculs statistiques
  const activeReservations = getActiveReservations();
  const monthlyRevenue = calculateTotalRevenue(); 
  
  // Calculate total monthly charges (excluding owner payments)
  // This includes all vehicle-specific charges and fixed costs
  let totalMonthlyCharges = 0;
  
  // Add all charges that are not owner payments
  totalMonthlyCharges += charges
    .filter(c => !c.estPaiementProprietaire)
    .reduce((sum, c) => {
      const multiplier = c.frequence === 'Trimestrielle' ? 1/3 : c.frequence === 'Annuelle' ? 1/12 : 1;
      return sum + (c.montantMensuel * multiplier);
    }, 0);
  
  // Add vehicle fixed costs (assurance, leasing, LLD)
  vehicles.forEach(vehicle => {
    // Add assurance mensuelle
    if (vehicle.assuranceMensuelle) {
      totalMonthlyCharges += vehicle.assuranceMensuelle;
    }
    
    // Add costs based on financing type
    if (vehicle.financement === 'Leasing' && vehicle.mensualites) {
      totalMonthlyCharges += vehicle.mensualites;
    } else if (vehicle.financement === 'LLD' && vehicle.loyerMensuel) {
      totalMonthlyCharges += vehicle.loyerMensuel;
    }
  });
  
  // Calculate total owner payments for all vehicles with "Mise à disposition" financing
  const totalOwnerPayments = vehicles
    .filter(v => v.financement === 'Mise à disposition')
    .reduce((total, vehicle) => {
      return total + calculateVehicleOwnerPayments(vehicle.id);
    }, 0);
  
  const netProfit = monthlyRevenue - totalMonthlyCharges - totalOwnerPayments;

  // Données pour les graphiques
  const chartData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
    datasets: [
      {
        data: [1200, 1800, 2400, 2100, 2700, 3200],
        color: () => colors.primary,
        strokeWidth: 3,
      },
    ],
  };

  const barData = {
    labels: ['Disponibles', 'Loués', 'Maintenance'],
    datasets: [
      {
        data: [availableVehicles.length, rentedVehicles.length, maintenanceVehicles.length],
      },
    ],
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Tableau de bord</Text>
            <Text style={styles.subtitle}>Bienvenue, {companyInfo.nom || 'EasyGarage'}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={() => {
                showSuccess('Test réussi !', 'Cette notification fonctionne parfaitement.');
              }} 
              style={styles.notificationButton}
            >
              <Bell size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/settings')} style={styles.logoContainer}>
              {companyInfo.logo ? (
                <Image source={{ uri: companyInfo.logo }} style={styles.logo} />
              ) : (
                <View style={[styles.logoContainer, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={{ color: colors.primary, fontSize: 18, fontWeight: 'bold' }}>
                    {companyInfo.nom ? companyInfo.nom.charAt(0) : 'E'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <StatsCards
          vehiclesCount={vehicles.length}
          clientsCount={clients.length}
          activeReservationsCount={activeReservations.length}
        />

        <FinancialCards
          monthlyRevenue={monthlyRevenue}
          monthlyCharges={totalMonthlyCharges}
          ownerPayments={totalOwnerPayments}
          netProfit={netProfit}
        />

        <TodayDeparturesSection />

        <VehicleChargesSection />

        <ChargesSection />

        <NotificationDemo />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'ios' ? 0 : 0,
  },
  headerContainer: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  logoContainer: {
    width: 50,
    height: 50,
    borderRadius: 30, 
    overflow: 'hidden',
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  logo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  chartContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: colors.background,
    borderRadius: 28, 
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 28,
  },
});