import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform, Image, TouchableOpacity, Animated } from 'react-native';
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
import { ChevronRight } from 'lucide-react-native';
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
  
  // État pour l'animation du header
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const headerAnimation = useRef(new Animated.Value(1)).current;

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

  // Fonction pour gérer le scroll
  const handleScroll = (event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDelta = currentScrollY - lastScrollY;
    
    // Toujours montrer le header quand on est en haut de la page
    if (currentScrollY <= 0 && !showHeader) {
      setShowHeader(true);
      Animated.timing(headerAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (scrollDelta > 5 && showHeader && currentScrollY > 30) {
      // Scroll vers le bas - cacher le header plus rapidement
      setShowHeader(false);
      Animated.timing(headerAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else if (scrollDelta < -60 && !showHeader && currentScrollY > 100) {
      // Scroll vers le haut - montrer le header seulement si on remonte significativement
      // et qu'on n'est pas tout en bas de la page
      setShowHeader(true);
      Animated.timing(headerAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
    
    setLastScrollY(currentScrollY);
  };

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.header,
          {
            transform: [{
              translateY: headerAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [-300, 0],
              })
            }],
            opacity: headerAnimation.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0, 1],
            }),
          }
        ]}
      >
        <Text style={styles.title}>Tableau de bord</Text>
        <View style={styles.logoTitleContainer}>
          <Text style={styles.welcomeText}>Bienvenue</Text>
          <TouchableOpacity onPress={() => router.push('/settings')} style={styles.logoContainer}>
            {companyInfo.logo ? (
              <Image source={{ uri: companyInfo.logo }} style={styles.logo} />
            ) : (
              <Image source={require('@/assets/images/easygarage-icon.png')} style={styles.logo} />
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >

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


      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'ios' ? 60 : 30, // Ajout d'un padding pour compenser la suppression du SafeAreaView
  },
  headerSafe: { backgroundColor: colors.background },
  header: { 
    paddingTop: Platform.OS === 'ios' ? 80 : 90, 
    paddingBottom: 12, 
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: colors.text, 
    marginBottom: 20,
    textAlign: 'center',
  },
  scrollContent: { paddingBottom: 100, paddingTop: 0 },
  scrollView: { 
    paddingTop: 180,
  },
  headerContainer: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 12,
    alignItems: 'center',
  },
  logoTitleContainer: {
    alignItems: 'center',
    gap: 12,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30, 
    overflow: 'hidden',
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
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