import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  Image, 
  Modal, 
  Platform,
  Animated,
  Dimensions,
  StatusBar,
  TextInput
} from 'react-native';
import { 
  ArrowLeft, 
  Save, 
  Camera, 
  Video, 
  CheckCircle, 
  Circle, 
  ChevronRight, 
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Shield,
  Clock,
  Star,
  Fuel,
  Gauge
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import CameraView from '@/components/CameraView';
import { 
  EDLData, 
  validateEDL, 
  isStepCompleted, 
  calculateProgress, 
  getRemainingSteps,
  PHOTO_MODE_OBLIGATORY_KEYS,
  ERROR_MESSAGES
} from '@/services/edlValidation';
import FuelLevelSlider from '@/components/reservations/FuelLevelSlider';
import DateCard from '@/components/cards/DateCard';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Composant GlassCard pour effet glassy iOS
function GlassCard({ children, style }: { children: React.ReactNode, style?: any }) {
  return (
    <View style={[{
      backgroundColor: '#F6F7FB',
      borderRadius: 24,
      padding: 20,
      marginBottom: 18,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 2,
    }, style]}>
      {children}
    </View>
  );
}

// Composant PhotoCard glassy pour chaque étape photo
function PhotoCard({ label, image, onPress, completed }: { label: string, image?: string, onPress: () => void, completed?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={{ flex: 1, margin: 6 }}>
      <View style={{
        backgroundColor: '#F6F7FB',
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        aspectRatio: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 1,
        borderWidth: completed ? 2 : 1,
        borderColor: completed ? '#4CD964' : '#E0E3ED',
        position: 'relative',
      }}>
        {image ? (
          <Image source={{ uri: image }} style={{ width: '100%', height: '100%', borderRadius: 16 }} resizeMode="cover" />
        ) : (
          <Camera size={36} color="#B0B3C6" />
        )}
        {completed && (
          <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: '#4CD964', borderRadius: 12, padding: 2 }}>
            <CheckCircle size={18} color="#fff" />
          </View>
        )}
      </View>
      <Text style={{ textAlign: 'center', marginTop: 8, fontSize: 13, color: '#222', fontWeight: '500' }}>{label}</Text>
    </TouchableOpacity>
  );
}

// Étapes de l'EDL avec leurs descriptions améliorées
export const ENHANCED_EDL_STEPS = [
  {
    key: 'kilometrage',
    title: 'Kilométrage de départ',
    description: 'Saisissez le kilométrage actuel du véhicule',
    icon: '🛣️',
    tip: 'Vérifiez le compteur kilométrique et saisissez la valeur exacte',
    obligatory: true,
    category: 'essentiel',
    type: 'input'
  },
  {
    key: 'carburant',
    title: 'Niveau de carburant',
    description: 'Indiquez le niveau de carburant de départ',
    icon: '⛽',
    tip: 'Estimez le niveau de carburant (1/4, 1/2, 3/4, plein)',
    obligatory: true,
    category: 'essentiel',
    type: 'slider'
  },
  {
    key: 'compteur',
    title: 'Photo du compteur',
    description: 'Photographiez le compteur kilométrique du véhicule',
    icon: '📊',
    tip: 'Assurez-vous que les chiffres sont bien visibles et lisibles',
    obligatory: true,
    category: 'essentiel',
    type: 'photo'
  },
  {
    key: 'face_avant',
    title: 'Face avant',
    description: 'Photo complète de la face avant du véhicule',
    icon: '🚗',
    tip: 'Incluez les phares, pare-chocs et calandre',
    obligatory: true,
    category: 'extérieur',
    type: 'photo'
  },
  {
    key: 'avg',
    title: 'Côté avant gauche',
    description: 'Photo du côté avant gauche (AVG)',
    icon: '↖️',
    tip: 'Montrez bien la portière avant et l\'aile',
    obligatory: true,
    category: 'extérieur',
    type: 'photo'
  },
  {
    key: 'arg',
    title: 'Côté arrière gauche',
    description: 'Photo du côté arrière gauche (ARG)',
    icon: '↙️',
    tip: 'Incluez la portière arrière et le pare-choc',
    obligatory: true,
    category: 'extérieur',
    type: 'photo'
  },
  {
    key: 'face_arriere',
    title: 'Face arrière',
    description: 'Photo complète de la face arrière',
    icon: '🚗',
    tip: 'Montrez les feux arrière et le pare-choc',
    obligatory: true,
    category: 'extérieur',
    type: 'photo'
  },
  {
    key: 'ard',
    title: 'Côté arrière droit',
    description: 'Photo du côté arrière droit (ARD)',
    icon: '↘️',
    tip: 'Incluez la portière arrière et l\'aile',
    obligatory: true,
    category: 'extérieur',
    type: 'photo'
  },
  {
    key: 'avd',
    title: 'Côté avant droit',
    description: 'Photo du côté avant droit (AVD)',
    icon: '↗️',
    tip: 'Montrez bien la portière avant et l\'aile',
    obligatory: true,
    category: 'extérieur',
    type: 'photo'
  },
  {
    key: 'sieges',
    title: 'Habitacle',
    description: 'Photo de l\'habitacle et des sièges',
    icon: '💺',
    tip: 'Montrez l\'état des sièges et du tableau de bord',
    obligatory: true,
    category: 'intérieur',
    type: 'photo'
  }
];

interface EnhancedEDLWizardProps {
  reservationId: string;
  onComplete: (data: EDLData) => void;
  onCancel: () => void;
}

export default function EnhancedEDLWizard({ 
  reservationId, 
  onComplete, 
  onCancel 
}: EnhancedEDLWizardProps) {
  const { colors } = useTheme();
  const [edlData, setEdlData] = useState<EDLData>({
    mode: 'photo',
    photos: {},
    video: undefined
  });

  // États pour la caméra et animations
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<'photo' | 'video'>('photo');
  const [currentCaptureTarget, setCurrentCaptureTarget] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(0);
  const [showTips, setShowTips] = useState(false);
  const [kilometrage, setKilometrage] = useState('');
  const [carburant, setCarburant] = useState(4);
  const [accessoires, setAccessoires] = useState('');
  
  // Animations
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const stepAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  
  // Permissions
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaLibraryPermission, requestMediaLibraryPermission] = MediaLibrary.usePermissions();

  const styles = createStyles(colors);

  // Calculer la progression
  const progress = calculateProgress(edlData);
  const remainingSteps = getRemainingSteps(edlData);
  const validation = validateEDL(edlData);

  // Animer la barre de progression
  useEffect(() => {
    Animated.timing(progressAnimation, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // Animation de pulsation pour les étapes importantes
  useEffect(() => {
    if (remainingSteps.length > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [remainingSteps]);

  const openCamera = async (target: string) => {
    if (!cameraPermission?.granted) {
      try {
        const permission = await requestCameraPermission();
        if (!permission.granted) {
          Alert.alert('Permission requise', 'Nous avons besoin de la permission pour accéder à votre caméra');
          return;
        }
      } catch (error) {
        Alert.alert('Erreur de permission', 'Impossible d\'accéder à la caméra');
        return;
      }
    }

    setCurrentCaptureTarget(target);
    setCameraMode('photo');
    setShowCamera(true);
  };

  const handleCapture = (uri: string) => {
    if (currentCaptureTarget) {
      setEdlData(prev => ({
        ...prev,
        photos: {
          ...prev.photos,
          [currentCaptureTarget]: uri
        }
      }));
    }
    setShowCamera(false);
  };

  const handleKilometrageChange = (value: string) => {
    setKilometrage(value);
    const numValue = parseInt(value) || 0;
    setEdlData(prev => ({
      ...prev,
      kilometrage: numValue
    }));
  };

  const handleCarburantChange = (value: number) => {
    setCarburant(value);
    setEdlData(prev => ({
      ...prev,
      carburant: value
    }));
  };

  const handleModeChange = (mode: 'photo' | 'video') => {
    setEdlData(prev => ({
      ...prev,
      mode,
      photos: mode === 'video' ? { compteur: prev.photos.compteur } : prev.photos,
      video: mode === 'photo' ? undefined : prev.video
    }));
  };

  const handleComplete = () => {
    if (!validation.isValid) {
      Alert.alert(
        'Étapes manquantes',
        `Veuillez compléter toutes les étapes obligatoires avant de finaliser l'état des lieux.\n\nÉtapes manquantes : ${remainingSteps.length}`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Finaliser l\'état des lieux',
      'Êtes-vous sûr de vouloir finaliser l\'état des lieux ? Cette action ne peut pas être annulée.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Finaliser', onPress: () => onComplete(edlData) }
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={onCancel} style={styles.backButton}>
        <ArrowLeft size={24} color={colors.text} />
      </TouchableOpacity>
      
      <View style={styles.headerCenter}>
        <Text style={styles.title}>État des lieux</Text>
        <Text style={styles.subtitle}>Étape {currentStep + 1} sur {ENHANCED_EDL_STEPS.length}</Text>
      </View>
      
      <TouchableOpacity
        onPress={handleComplete}
        style={[
          styles.completeButton,
          !validation.isValid && styles.completeButtonDisabled
        ]}
        disabled={!validation.isValid}
      >
        <Save size={24} color={colors.background} />
      </TouchableOpacity>
    </View>
  );

  const renderProgressSection = () => (
    <View style={styles.progressSection}>
      <View style={styles.progressHeader}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressTitle}>Progression</Text>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>
        <View style={styles.progressStats}>
          <Text style={styles.progressStatsText}>
            {ENHANCED_EDL_STEPS.length - remainingSteps.length}/{ENHANCED_EDL_STEPS.length} étapes
          </Text>
        </View>
      </View>
      
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <Animated.View 
            style={[
              styles.progressFill, 
              { width: progressAnimation.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%']
              })}
            ]} 
          />
        </View>
      </View>
      
      {remainingSteps.length > 0 && (
        <View style={styles.remainingSection}>
          <AlertCircle size={16} color={colors.warning} />
          <Text style={styles.remainingText}>
            {remainingSteps.length} étape{remainingSteps.length > 1 ? 's' : ''} restante{remainingSteps.length > 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </View>
  );

  const renderModeSelection = () => (
    <View style={styles.modeContainer}>
      <TouchableOpacity
        style={[
          styles.modeButton,
          edlData.mode === 'photo' && styles.modeButtonActive
        ]}
        onPress={() => handleModeChange('photo')}
      >
        <Camera size={24} color={edlData.mode === 'photo' ? colors.background : colors.text} />
        <Text style={[
          styles.modeButtonText,
          edlData.mode === 'photo' && styles.modeButtonTextActive
        ]}>
          Mode Photo
        </Text>
        <Text style={styles.modeDescription}>
          Photos détaillées de chaque partie
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.modeButton,
          edlData.mode === 'video' && styles.modeButtonActive
        ]}
        onPress={() => handleModeChange('video')}
      >
        <Video size={24} color={edlData.mode === 'video' ? colors.background : colors.text} />
        <Text style={[
          styles.modeButtonText,
          edlData.mode === 'video' && styles.modeButtonTextActive
        ]}>
          Mode Vidéo
        </Text>
        <Text style={styles.modeDescription}>
          Vidéo complète du véhicule
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStepItem = (step: any, index: number) => {
    const isCompleted = isStepCompleted(edlData, step.key);
    const isMissing = remainingSteps.includes(step.key);
    const isCurrent = currentStep === index;
    
    return (
      <Animated.View
        key={step.key}
        style={[
          styles.stepItem,
          isCompleted && styles.stepItemCompleted,
          isMissing && styles.stepItemMissing,
          isCurrent && styles.stepItemCurrent,
          isMissing && { transform: [{ scale: pulseAnimation }] }
        ]}
      >
        <View style={styles.stepTouchable}>
          <View style={styles.stepIcon}>
            {isCompleted ? (
              <CheckCircle size={24} color={colors.success} />
            ) : (
              <Text style={styles.stepEmoji}>{step.icon}</Text>
            )}
          </View>
          
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Text style={[
                styles.stepTitle,
                isCompleted && styles.stepTitleCompleted
              ]}>
                {step.title}
              </Text>
              <View style={[
                styles.stepCategory,
                { backgroundColor: getCategoryColor(step.category) }
              ]}>
                <Text style={styles.stepCategoryText}>
                  {step.category}
                </Text>
              </View>
            </View>
            
            <Text style={styles.stepDescription}>
              {step.description}
            </Text>
            
            {/* Champ de saisie direct pour le kilométrage */}
            {step.type === 'input' && (
              <View style={styles.inputFieldContainer}>
                <View style={styles.inputField}>
                  <TextInput
                    style={styles.inputFieldText}
                    value={kilometrage}
                    onChangeText={handleKilometrageChange}
                    placeholder="Ex: 125000"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <Text style={styles.inputFieldUnit}>km</Text>
                </View>
              </View>
            )}
            
            {/* Slider direct pour le carburant */}
            {step.type === 'slider' && (
              <View style={styles.sliderContainer}>
                <FuelLevelSlider
                  value={carburant}
                  onValueChange={handleCarburantChange}
                  style={styles.inlineFuelSlider}
                />
              </View>
            )}
            
            {step.type === 'input' && isCompleted && (
              <Text style={styles.stepValue}>
                Kilométrage : {edlData.kilometrage} km
              </Text>
            )}
            
            {step.type === 'slider' && isCompleted && (
              <Text style={styles.stepValue}>
                Carburant : {edlData.carburant}/4
              </Text>
            )}
            
            {isMissing && (
              <View style={styles.stepMissing}>
                <AlertCircle size={14} color={colors.warning} />
                <Text style={styles.stepMissingText}>
                  {ERROR_MESSAGES[step.key as keyof typeof ERROR_MESSAGES]}
                </Text>
              </View>
            )}
            
            {step.tip && (
              <TouchableOpacity
                style={styles.tipButton}
                onPress={() => setShowTips(!showTips)}
              >
                <Text style={styles.tipButtonText}>💡 Conseils</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.stepAction}>
            {step.type === 'photo' && edlData.photos[step.key as keyof typeof edlData.photos] ? (
              <Image 
                source={{ uri: edlData.photos[step.key as keyof typeof edlData.photos] as string }}
                style={styles.stepThumbnail}
              />
            ) : step.type === 'photo' ? (
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={() => openCamera(step.key)}
              >
                <Camera size={20} color={colors.primary} />
              </TouchableOpacity>
            ) : step.type === 'input' ? (
              <Gauge size={20} color={isCompleted ? colors.success : colors.primary} />
            ) : step.type === 'slider' ? (
              <Fuel size={20} color={isCompleted ? colors.success : colors.primary} />
            ) : null}
          </View>
        </View>
        
        {showTips && step.tip && (
          <View style={styles.tipContainer}>
            <Text style={styles.tipText}>{step.tip}</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'essentiel': return colors.error;
      case 'extérieur': return colors.primary;
      case 'intérieur': return colors.accent;
      default: return colors.textSecondary;
    }
  };

  // Remplacer renderPhotoSteps par une grille 3 colonnes de PhotoCard
  const renderPhotoSteps = () => {
    // Filtrer les étapes de type photo
    const photoSteps = ENHANCED_EDL_STEPS.filter(step => step.type === 'photo');
    // Regrouper par lignes de 3
    const rows = [];
    for (let i = 0; i < photoSteps.length; i += 3) {
      rows.push(photoSteps.slice(i, i + 3));
    }
    return (
      <View style={{ padding: 10 }}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={{ flexDirection: 'row', marginBottom: 12 }}>
            {row.map((step, colIndex) => (
              <PhotoCard
                key={step.key}
                label={step.title}
                image={edlData.photos[step.key]}
                completed={!!edlData.photos[step.key]}
                onPress={() => openCamera(step.key)}
              />
            ))}
            {/* Pour compléter la ligne si moins de 3 éléments */}
            {row.length < 3 && Array.from({ length: 3 - row.length }).map((_, i) => (
              <View key={i} style={{ flex: 1, margin: 6 }} />
            ))}
          </View>
        ))}
      </View>
    );
  };

  const renderVideoStep = () => (
    <View style={{ padding: 10 }}>
      <View style={{ flexDirection: 'row', marginBottom: 12 }}>
        {/* Case photo compteur */}
        <PhotoCard
          label="Compteur"
          image={edlData.photos.compteur}
          completed={!!edlData.photos.compteur}
          onPress={() => openCamera('compteur')}
        />
        {/* Case vidéo */}
        <TouchableOpacity onPress={() => {
          setCurrentCaptureTarget('video');
          setCameraMode('video');
          setShowCamera(true);
        }} activeOpacity={0.8} style={{ flex: 1, margin: 6 }}>
          <View style={{
            backgroundColor: '#F6F7FB',
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            aspectRatio: 1,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 1,
            borderWidth: edlData.video ? 2 : 1,
            borderColor: edlData.video ? '#4CD964' : '#E0E3ED',
            position: 'relative',
          }}>
            {edlData.video ? (
              <CheckCircle size={36} color="#4CD964" />
            ) : (
              <Video size={36} color="#B0B3C6" />
            )}
          </View>
          <Text style={{ textAlign: 'center', marginTop: 8, fontSize: 13, color: '#222', fontWeight: '500' }}>Vidéo</Text>
        </TouchableOpacity>
        {/* Case vide pour compléter la ligne */}
        <View style={{ flex: 1, margin: 6 }} />
      </View>
    </View>
  );

  const renderAdditionalPhotos = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Photos additionnelles (optionnelles)</Text>
      <Text style={styles.additionalDescription}>
        Ajoutez des photos supplémentaires pour documenter des détails spécifiques
      </Text>
      
      <TouchableOpacity
        style={styles.additionalButton}
        onPress={() => {
          // Logique pour ajouter des photos additionnelles
        }}
      >
        <Camera size={20} color={colors.primary} />
        <Text style={styles.additionalButtonText}>Ajouter des photos</Text>
      </TouchableOpacity>
    </View>
  );

  const now = new Date();
  const date = now.toLocaleDateString('fr-FR');
  const heure = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {renderHeader()}
      {renderProgressSection()}

      <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        {/* Date et heure de départ */}
        <GlassCard>
          <Text style={styles.sectionTitle}>Date et heure de départ</Text>
          <DateCard
            date={date}
            heure={heure}
            subtitle="Date et heure automatiquement renseignées (modifiables)"
            modifiable={false}
            iconType="clock"
          />
        </GlassCard>

        {/* Informations de base */}
        <GlassCard>
          <Text style={styles.sectionTitle}>Informations de base</Text>
          <Text style={styles.inputLabel}>Kilométrage actuel *</Text>
          <View style={styles.inputFieldContainer}>
            <View style={styles.inputFieldGlass}>
              <TextInput
                style={styles.inputFieldText}
                value={kilometrage}
                onChangeText={handleKilometrageChange}
                placeholder="Ex: 45 230 km"
                keyboardType="numeric"
                placeholderTextColor="#B0B3C6"
              />
            </View>
          </View>
          <Text style={styles.inputLabel}>Niveau de carburant</Text>
          <View style={styles.sliderRow}>
            <Fuel size={20} color="#B0B3C6" style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <FuelLevelSlider
                value={carburant}
                onValueChange={handleCarburantChange}
                style={styles.inlineFuelSlider}
              />
              <Text style={styles.sliderValue}>Niveau : {carburant}/4</Text>
            </View>
            <Fuel size={20} color="#B0B3C6" style={{ marginLeft: 8, transform: [{ scaleX: -1 }] }} />
          </View>
          <Text style={styles.inputLabel}>Accessoires fournis</Text>
          <View style={styles.inputFieldContainer}>
            <View style={styles.inputFieldGlass}>
              <TextInput
                style={[styles.inputFieldText, { minHeight: 40 }]}
                value={accessoires}
                onChangeText={setAccessoires}
                placeholder="Triangle, gilet, câble, chargeur, etc."
                placeholderTextColor="#B0B3C6"
                multiline
              />
            </View>
          </View>
        </GlassCard>

        {/* Type d'état des lieux */}
        <GlassCard>
          <Text style={styles.sectionTitle}>Type d'état des lieux *</Text>
          {/* Ici, boutons ou sélecteur pour le type (photo/vidéo) stylé glassy */}
          {renderModeSelection()}
        </GlassCard>

        {/* Étapes photos/vidéo */}
        <GlassCard style={{ padding: 0 }}>
          {edlData.mode === 'photo' ? (
            <>
              {renderPhotoSteps()}
              {renderAdditionalPhotos()}
            </>
          ) : (
            renderVideoStep()
          )}
        </GlassCard>
      </ScrollView>

      {/* Modal caméra */}
      <Modal
        visible={showCamera}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <CameraView
          visible={showCamera}
          mode={cameraMode}
          onCapture={handleCapture}
          onClose={() => setShowCamera(false)}
        />
      </Modal>
    </SafeAreaView>
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
  backButton: {
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
  completeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  completeButtonDisabled: {
    backgroundColor: colors.border,
  },
  progressSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: colors.surface,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginLeft: 10,
  },
  progressStats: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressStatsText: {
    fontSize: 12,
    color: colors.background,
    fontWeight: '600',
  },
  progressBarContainer: {
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  remainingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  remainingText: {
    fontSize: 12,
    color: colors.warning,
    marginLeft: 5,
    fontWeight: '500',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  helpButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpButtonText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  modeContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  modeButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
  },
  modeButtonTextActive: {
    color: colors.background,
  },
  modeDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  stepItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepItemCompleted: {
    borderColor: colors.success,
    backgroundColor: colors.success + '10',
  },
  stepItemMissing: {
    borderColor: colors.warning,
    backgroundColor: colors.warning + '10',
  },
  stepItemCurrent: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  stepTouchable: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  stepEmoji: {
    fontSize: 20,
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  stepTitleCompleted: {
    color: colors.success,
  },
  stepCategory: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  stepCategoryText: {
    fontSize: 10,
    color: colors.background,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  stepDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  stepValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 5,
  },
  stepMissing: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  stepMissingText: {
    fontSize: 12,
    color: colors.warning,
    marginLeft: 5,
  },
  tipButton: {
    marginTop: 8,
  },
  tipButtonText: {
    fontSize: 12,
    color: colors.primary,
    fontStyle: 'italic',
  },
  tipContainer: {
    backgroundColor: colors.primary + '10',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  tipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  stepAction: {
    marginLeft: 10,
  },
  stepThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  videoStep: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  videoIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  videoDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  videoButtonCompleted: {
    backgroundColor: colors.success,
  },
  videoButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  additionalDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 15,
  },
  additionalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  additionalButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
  inputFieldContainer: {
    marginTop: 10,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inputFieldText: {
    flex: 1,
    fontSize: 18,
    color: colors.text,
    paddingVertical: 4,
  },
  inputFieldUnit: {
    fontSize: 18,
    color: colors.textSecondary,
    marginLeft: 8,
    fontWeight: '500',
  },
  sliderContainer: {
    marginTop: 10,
    paddingHorizontal: 4,
  },
  inlineFuelSlider: {
    width: '100%',
  },
  cameraButton: {
    padding: 8,
    backgroundColor: colors.primary + '20',
    borderRadius: 8,
  },
  inputFieldGlass: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inputLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 15,
    marginBottom: 5,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  sliderValue: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 5,
    textAlign: 'center',
  },
}); 