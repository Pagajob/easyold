import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  Animated,
  Dimensions,
  StatusBar
} from 'react-native';
import { 
  X, 
  Save, 
  Fuel, 
  MapPin, 
  Calculator, 
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Clock,
  Shield,
  Zap,
  Camera,
  FileText
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import FuelLevelSlider from '@/components/reservations/FuelLevelSlider';
import { useData, Reservation, Vehicle } from '@/contexts/DataContext';

const { width: screenWidth } = Dimensions.get('window');

interface EnhancedEDLRetourModalProps {
  visible: boolean;
  reservation: Reservation | null;
  vehicle: Vehicle | null;
  onClose: () => void;
  onSave: (data: EDLRetourData) => void;
}

interface EDLRetourData {
  kmRetour: number;
  carburantRetour: number;
  fraisKmSupp: number;
  totalFraisRetour: number;
}

export default function EnhancedEDLRetourModal({ 
  visible, 
  reservation, 
  vehicle, 
  onClose, 
  onSave 
}: EnhancedEDLRetourModalProps) {
  const { colors } = useTheme();
  const [kmRetour, setKmRetour] = useState('');
  const [carburantRetour, setCarburantRetour] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Animations
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  // Get the correct departure mileage from the EDL
  const getKmDepart = () => {
    if (!reservation || !reservation.edlDepart) return 0;
    
    if (reservation.edlDepart.kmDepart !== undefined) {
      return reservation.edlDepart.kmDepart;
    }
    
    if (typeof reservation.edlDepart.compteur === 'string') {
      const kmString = reservation.edlDepart.compteur.replace(/\D/g, '');
      return kmString ? parseInt(kmString) : 0;
    }
    
    return 0;
  };
  
  const kmDepart = getKmDepart();
  
  if (!reservation || !vehicle) return null;

  // Animer l'ouverture du modal
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Animation de pulsation pour les alertes
  useEffect(() => {
    if (kmRetour && parseInt(kmRetour) < kmDepart) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.05,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnimation.setValue(1);
    }
  }, [kmRetour, kmDepart]);

  const calculateExtraFees = () => {
    const kmRetourNum = parseInt(kmRetour) || 0;
    const kmDriven = kmRetourNum - kmDepart;
    
    const startDate = new Date(reservation.dateDebut);
    const endDate = new Date(reservation.dateRetourPrevue);
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24)) || 1;
    
    const kmInclus = vehicle.kilometrageJournalier * durationDays;
    const kmExcess = Math.max(0, kmDriven - kmInclus);
    const prixKmSupp = vehicle.prixKmSupplementaire || 0;
    const fraisKmSupp = kmExcess * prixKmSupp;

    return {
      kmDriven,
      kmInclus,
      kmExcess,
      fraisKmSupp,
      durationDays
    };
  };

  const handleSubmit = () => {
    if (!kmRetour) {
      Alert.alert('Erreur', 'Veuillez saisir le kilométrage de retour');
      return;
    }

    const kmRetourNum = parseInt(kmRetour);
    if (kmRetourNum < kmDepart) {
      Alert.alert('Erreur', 'Le kilométrage de retour ne peut pas être inférieur au kilométrage de départ');
      return;
    }

    const calculations = calculateExtraFees();
    
    if (calculations.kmExcess > 0) {
      Alert.alert(
        'Dépassement de kilométrage',
        `Attention : dépassement de kilométrage de ${calculations.kmExcess} km\n\nFrais supplémentaires : ${calculations.fraisKmSupp.toFixed(2)} €`,
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Continuer', 
            onPress: () => submitEDL(calculations)
          }
        ]
      );
    } else {
      submitEDL(calculations);
    }
  };

  const submitEDL = (calculations: any) => {
    setIsSubmitting(true);

    const edlData: EDLRetourData = {
      kmRetour: parseInt(kmRetour),
      carburantRetour,
      fraisKmSupp: calculations.fraisKmSupp,
      totalFraisRetour: calculations.fraisKmSupp
    };

    onSave(edlData);
    setIsSubmitting(false);
    onClose();
    
    setKmRetour('');
    setCarburantRetour(4);
  };

  const calculations = kmRetour ? calculateExtraFees() : null;
  const styles = createStyles(colors);

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <X size={24} color={colors.text} />
      </TouchableOpacity>
      
      <View style={styles.headerCenter}>
        <Text style={styles.title}>📝 État des lieux de retour</Text>
        <Text style={styles.subtitle}>Finalisation de la location</Text>
      </View>
      
      <TouchableOpacity 
        onPress={handleSubmit} 
        style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
        disabled={isSubmitting}
      >
        <Save size={24} color={colors.background} />
      </TouchableOpacity>
    </View>
  );

  const renderDepartureInfo = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Shield size={20} color={colors.primary} />
        <Text style={styles.sectionTitle}>Informations de départ</Text>
      </View>
      
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <MapPin size={16} color={colors.primary} />
          <Text style={styles.infoLabel}>Kilométrage de départ:</Text>
          <Text style={styles.infoValue}>{kmDepart.toLocaleString()} km</Text>
        </View>
        
        {kmDepart === 0 && (
          <Animated.View 
            style={[
              styles.warningRow,
              { transform: [{ scale: pulseAnimation }] }
            ]}
          >
            <AlertCircle size={16} color={colors.warning} />
            <Text style={styles.warningText}>
              Attention: Le kilométrage de départ n'a pas été enregistré correctement.
            </Text>
          </Animated.View>
        )}
        
        <View style={styles.infoRow}>
          <Fuel size={16} color={colors.primary} />
          <Text style={styles.infoLabel}>Carburant de départ:</Text>
          <Text style={styles.infoValue}>{reservation.edlDepart?.carburant || 0}/8</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Calculator size={16} color={colors.primary} />
          <Text style={styles.infoLabel}>Kilométrage inclus:</Text>
          <Text style={styles.infoValue}>
            {calculations ? calculations.kmInclus.toLocaleString() : 0} km
          </Text>
        </View>
      </View>
    </View>
  );

  const renderKilometerInput = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <TrendingUp size={20} color={colors.accent} />
        <Text style={styles.sectionTitle}>Kilométrage de retour</Text>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Kilométrage actuel *</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input,
              parseInt(kmRetour) < kmDepart && styles.inputError
            ]}
            value={kmRetour}
            onChangeText={setKmRetour}
            placeholder={`Minimum: ${kmDepart.toLocaleString()} km`}
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />
          {kmRetour && parseInt(kmRetour) < kmDepart && (
            <AlertCircle size={16} color={colors.error} style={styles.inputIcon} />
          )}
        </View>
        
        <Text style={styles.helpText}>
          Saisissez le kilométrage affiché au compteur du véhicule
        </Text>
        
        {kmRetour && parseInt(kmRetour) < kmDepart && (
          <Text style={styles.errorText}>
            Le kilométrage de retour ne peut pas être inférieur au kilométrage de départ
          </Text>
        )}
      </View>
    </View>
  );

  const renderFuelLevel = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Fuel size={20} color={colors.warning} />
        <Text style={styles.sectionTitle}>Niveau de carburant</Text>
      </View>
      
      <View style={styles.fuelContainer}>
        <FuelLevelSlider 
          value={carburantRetour} 
          onValueChange={setCarburantRetour}
          maxLevel={8}
        />
        
        <View style={styles.fuelInfo}>
          <Text style={styles.fuelLabel}>Niveau actuel: {carburantRetour}/8</Text>
          <Text style={styles.fuelDescription}>
            {carburantRetour >= 6 ? 'Excellent' : 
             carburantRetour >= 4 ? 'Bon' : 
             carburantRetour >= 2 ? 'Faible' : 'Très faible'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderCalculations = () => {
    if (!calculations) return null;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Calculator size={20} color={colors.success} />
          <Text style={styles.sectionTitle}>Calculs automatiques</Text>
        </View>
        
        <View style={styles.calculationsCard}>
          <View style={styles.calculationRow}>
            <Text style={styles.calculationLabel}>Distance parcourue:</Text>
            <Text style={styles.calculationValue}>
              {calculations.kmDriven.toLocaleString()} km
            </Text>
          </View>
          
          <View style={styles.calculationRow}>
            <Text style={styles.calculationLabel}>Kilométrage inclus:</Text>
            <Text style={styles.calculationValue}>
              {calculations.kmInclus.toLocaleString()} km
            </Text>
          </View>
          
          <View style={[
            styles.calculationRow,
            calculations.kmExcess > 0 && styles.calculationRowWarning
          ]}>
            <Text style={styles.calculationLabel}>⚠️  Dépassement:</Text>
            <Text style={[
              styles.calculationValue,
              calculations.kmExcess > 0 ? { color: colors.warning } : { color: colors.success }
            ]}>
              {calculations.kmExcess > 0 ? `+${calculations.kmExcess} km` : 'Aucun'}
            </Text>
          </View>
          
          {calculations.kmExcess > 0 && (
            <View style={styles.calculationRow}>
              <Text style={styles.calculationLabel}>
                Frais km supplémentaire ({vehicle.prixKmSupplementaire}€/km):
              </Text>
              <Text style={[styles.calculationValue, { color: colors.error, fontWeight: 'bold' }]}>
                {calculations.fraisKmSupp.toFixed(2)} €
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderSummary = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <FileText size={20} color={colors.text} />
        <Text style={styles.sectionTitle}>Résumé</Text>
      </View>
      
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Durée de location:</Text>
          <Text style={styles.summaryValue}>
            {calculations ? calculations.durationDays : 0} jour{calculations && calculations.durationDays > 1 ? 's' : ''}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Statut:</Text>
          <View style={styles.statusContainer}>
            <CheckCircle size={16} color={colors.success} />
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              Prêt à finaliser
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="none"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <Animated.View 
        style={[
          styles.container,
          {
            opacity: fadeAnimation,
            transform: [{
              translateY: slideAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [screenWidth, 0]
              })
            }]
          }
        ]}
      >
        {renderHeader()}
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderDepartureInfo()}
          {renderKilometerInput()}
          {renderFuelLevel()}
          {renderCalculations()}
          {renderSummary()}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  saveButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  saveButtonDisabled: {
    backgroundColor: colors.border,
  },
  content: {
    flex: 1,
  },
  section: {
    marginHorizontal: 20,
    marginVertical: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 10,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '10',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  warningText: {
    fontSize: 12,
    color: colors.warning,
    marginLeft: 8,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: colors.error + '10',
  },
  inputIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  helpText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 5,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 5,
  },
  fuelContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fuelInfo: {
    marginTop: 15,
    alignItems: 'center',
  },
  fuelLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  fuelDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  calculationsCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  calculationRowWarning: {
    backgroundColor: colors.warning + '10',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  calculationLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  calculationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
}); 