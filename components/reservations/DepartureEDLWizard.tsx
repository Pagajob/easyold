import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Modal, Platform, TextInput, Switch } from 'react-native';
import { ArrowLeft, Save, Camera, Video, CheckCircle, Circle, ChevronRight, AlertCircle, FileText, Fuel, Car, CheckSquare, Square } from 'lucide-react-native';
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

// Checklist items for vehicle inspection
const CHECKLIST_ITEMS = [
  { id: 'carrosserie', label: 'Carrosserie en bon état', required: true },
  { id: 'pneus', label: 'Pneus en bon état', required: true },
  { id: 'phares', label: 'Phares fonctionnels', required: true },
  { id: 'interieur', label: 'Intérieur propre', required: true },
  { id: 'accessoires', label: 'Accessoires présents', required: false },
  { id: 'documents', label: 'Documents du véhicule présents', required: true },
];

// Étapes de l'EDL avec leurs descriptions
export const EDL_STEPS = [
  {
    key: 'compteur',
    title: 'Compteur kilométrique',
    description: 'Photo du compteur kilométrique',
    icon: '📊',
    obligatory: true
  },
  {
    key: 'face_avant',
    title: 'Face avant',
    description: 'Photo de la face avant du véhicule',
    icon: '🚗',
    obligatory: true
  },
  {
    key: 'avg',
    title: 'Côté avant gauche (AVG)',
    description: 'Photo du côté avant gauche',
    icon: '↖️',
    obligatory: true
  },
  {
    key: 'arg',
    title: 'Côté arrière gauche (ARG)',
    description: 'Photo du côté arrière gauche',
    icon: '↙️',
    obligatory: true
  },
  {
    key: 'face_arriere',
    title: 'Face arrière',
    description: 'Photo de la face arrière du véhicule',
    icon: '🚗',
    obligatory: true
  },
  {
    key: 'ard',
    title: 'Côté arrière droit (ARD)',
    description: 'Photo du côté arrière droit',
    icon: '↘️',
    obligatory: true
  },
  {
    key: 'avd',
    title: 'Côté avant droit (AVD)',
    description: 'Photo du côté avant droit',
    icon: '↗️',
    obligatory: true
  },
  {
    key: 'sieges',
    title: 'Sièges (habitacle)',
    description: 'Photo de l\'habitacle et des sièges',
    icon: '💺',
    obligatory: true
  }
];

interface DepartureEDLWizardProps {
  reservationId: string;
  onComplete: (edlData: EDLData) => void;
  onCancel: () => void;
}

// Interface for checklist data
interface ChecklistData {
  [key: string]: boolean;
}

export default function DepartureEDLWizard({ 
  reservationId, 
  onComplete, 
  onCancel 
}: DepartureEDLWizardProps) {
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [edlData, setEdlData] = useState<EDLData>({
    mode: 'photo',
    photos: {},
    video: undefined
  });
  const [skipMedia, setSkipMedia] = useState(false);
  const [skipReason, setSkipReason] = useState('');
  const [checklist, setChecklist] = useState<ChecklistData>({});
  const [comments, setComments] = useState('');
  const [fuelLevel, setFuelLevel] = useState(4); // Default to 4/8

  // États pour la caméra
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<'photo' | 'video'>('photo');
  const [currentCaptureTarget, setCurrentCaptureTarget] = useState<string>('');
  
  // Permissions
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaLibraryPermission, requestMediaLibraryPermission] = MediaLibrary.usePermissions();

  const styles = createStyles(colors);

  // Calculer la progression
  const calculateStepProgress = () => {
    switch (currentStep) {
      case 1: // Mode selection
        return 20;
      case 2: // Media capture
        if (skipMedia) return 40;
        return edlData.mode === 'photo' 
          ? 20 + (Object.keys(edlData.photos).length / (PHOTO_MODE_OBLIGATORY_KEYS.length + 1)) * 20
          : edlData.video ? 40 : 20;
      case 3: // Odometer
        return edlData.photos.compteur ? 60 : 40;
      case 4: // Checklist
        const checkedItems = Object.values(checklist).filter(Boolean).length;
        const totalItems = CHECKLIST_ITEMS.length;
        return 60 + (checkedItems / totalItems) * 20;
      case 5: // Summary
        return 100;
      default:
        return 0;
    }
  };
  
  const progress = calculateStepProgress();
  const remainingSteps = skipMedia ? ['compteur'] : getRemainingSteps(edlData);
  const validation = validateEDL(edlData);

  const openCamera = async (target: string) => {
    // Vérifier les permissions
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

  const recordVideo = async () => {
    // Vérifier les permissions
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

    setCurrentCaptureTarget('video');
    setCameraMode('video');
    setShowCamera(true);
  };

  const handleCapture = (uri: string, type: 'photo' | 'video') => {
    if (type === 'photo') {
      setEdlData(prev => ({
        ...prev,
        photos: {
          ...prev.photos,
          [currentCaptureTarget]: uri
        }
      }));
    } else {
      setEdlData(prev => ({
        ...prev,
        video: uri
      }));
    }

    setShowCamera(false);
    saveToGallery(uri);
  };

  const handleNextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1: // Mode selection
        return true;
      case 2: // Media capture
        if (skipMedia) return true;
        if (edlData.mode === 'photo') {
          // Check if all required photos are taken except compteur (which is in step 3)
          const photoKeys = Object.keys(edlData.photos);
          return PHOTO_MODE_OBLIGATORY_KEYS
            .filter(key => key !== 'compteur')
            .every(key => photoKeys.includes(key));
        }
        return !!edlData.video;
      case 3: // Odometer
        return !!edlData.photos.compteur;
      case 4: // Checklist
        return isChecklistComplete();
      default:
        return true;
    }
  };

  const saveToGallery = async (uri: string) => {
    if (!mediaLibraryPermission?.granted) {
      const permission = await requestMediaLibraryPermission();
      if (!permission.granted) {
        Alert.alert(
          'Enregistrer dans la galerie',
          'Voulez-vous enregistrer cette photo dans votre galerie ?',
          [
            { text: 'Non', style: 'cancel' },
            { 
              text: 'Oui', 
              onPress: async () => {
                const permission = await requestMediaLibraryPermission();
                if (permission.granted) {
                  saveImageToGallery(uri);
                }
              }
            }
          ]
        );
        return;
      }
    }

    Alert.alert(
      'Enregistrer dans la galerie',
      'Voulez-vous enregistrer cette photo dans votre galerie ?',
      [
        { text: 'Non', style: 'cancel' },
        { text: 'Oui', onPress: () => saveImageToGallery(uri) }
      ]
    );
  };

  const saveImageToGallery = async (uri: string) => {
    try {
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Succès', 'Photo enregistrée dans votre galerie');
    } catch (error) {
      console.error('Error saving to gallery:', error);
      Alert.alert('Erreur', 'Impossible d\'enregistrer la photo dans votre galerie');
    }
  };

  const toggleChecklistItem = (itemId: string) => {
    setChecklist(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const isChecklistComplete = () => {
    return CHECKLIST_ITEMS
      .filter(item => item.required)
      .every(item => checklist[item.id]);
  };

  const handleModeChange = (mode: 'photo' | 'video') => {
    setEdlData(prev => ({
      ...prev,
      mode,
      // Réinitialiser les photos si on passe en mode vidéo
      photos: mode === 'video' ? { compteur: prev.photos.compteur } : prev.photos,
      video: mode === 'photo' ? undefined : prev.video
    }));
  };

  const handleComplete = () => {
    // Prepare final data
    const finalData: EDLData & { 
      checklist?: ChecklistData; 
      comments?: string; 
      fuelLevel?: number;
      skipMedia?: boolean;
      skipReason?: string;
    } = {
      ...edlData,
      checklist,
      comments,
      fuelLevel,
      skipMedia,
      skipReason: skipMedia ? skipReason : undefined
    };
    
    // Validate mandatory fields
    if (!edlData.photos.compteur) {
      Alert.alert('Étape manquante', 'La photo du compteur kilométrique est obligatoire.');
      return;
    }
    
    if (!isChecklistComplete()) {
      Alert.alert('Checklist incomplète', 'Veuillez compléter tous les éléments obligatoires de la checklist.');
      return;
    }
    
    if (skipMedia && !skipReason.trim()) {
      Alert.alert('Justification requise', 'Veuillez indiquer la raison pour laquelle vous ne prenez pas de photos/vidéo.');
      return;
    }
    
    onComplete(finalData);
  };

  const renderModeSelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Mode d'état des lieux</Text>
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
        </TouchableOpacity>
      </View>
      
      <View style={styles.skipMediaContainer}>
        <View style={styles.switchRow}>
          <Text style={styles.skipMediaLabel}>Ne pas prendre de photo/vidéo</Text>
          <Switch
            value={skipMedia}
            onValueChange={setSkipMedia}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.background}
          />
        </View>
        
        {skipMedia && (
          <View style={styles.skipReasonContainer}>
            <Text style={styles.skipReasonLabel}>Veuillez justifier cette décision *</Text>
            <TextInput
              style={styles.skipReasonInput}
              value={skipReason}
              onChangeText={setSkipReason}
              placeholder="Raison obligatoire..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
            <View style={styles.warningBox}>
              <AlertCircle size={16} color={colors.warning} />
              <Text style={styles.warningText}>
                Attention : L'absence de photos/vidéo peut compliquer la gestion des litiges éventuels.
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  const renderOdometerStep = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Photo du compteur kilométrique</Text>
      <Text style={styles.stepDescription}>
        Prenez une photo claire du compteur kilométrique du véhicule.
        Cette étape est obligatoire même si vous avez choisi de ne pas prendre d'autres photos.
      </Text>
      
      <TouchableOpacity
        style={[
          styles.odometerButton,
          edlData.photos.compteur && styles.odometerButtonCompleted
        ]}
        onPress={() => openCamera('compteur')}
      >
        {edlData.photos.compteur ? (
          <Image 
            source={{ uri: edlData.photos.compteur }} 
            style={styles.odometerPreview} 
          />
        ) : (
          <>
            <Camera size={32} color={colors.primary} />
            <Text style={styles.odometerButtonText}>
              Prendre une photo du compteur
            </Text>
          </>
        )}
      </TouchableOpacity>
      
      {edlData.photos.compteur && (
        <TouchableOpacity
          style={styles.retakeButton}
          onPress={() => openCamera('compteur')}
        >
          <Camera size={16} color={colors.primary} />
          <Text style={styles.retakeButtonText}>
            Reprendre la photo
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderPhotoSteps = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Photos obligatoires</Text>
      {EDL_STEPS.map((step) => {
        const isCompleted = isStepCompleted(edlData, step.key);
        const isMissing = remainingSteps.includes(step.key);
        
        return (
          <TouchableOpacity
            key={step.key}
            style={[
              styles.stepItem,
              isCompleted && styles.stepItemCompleted,
              isMissing && styles.stepItemMissing
            ]}
            onPress={() => openCamera(step.key)}
          >
            <View style={styles.stepIcon}>
              {isCompleted ? (
                <CheckCircle size={24} color={colors.success} />
              ) : (
                <Text style={styles.stepEmoji}>{step.icon}</Text>
              )}
            </View>
            
            <View style={styles.stepContent}>
              <Text style={[
                styles.stepTitle,
                isCompleted && styles.stepTitleCompleted
              ]}>
                {step.title}
              </Text>
              <Text style={styles.stepDescription}>
                {step.description}
              </Text>
              {isMissing && (
                <Text style={styles.stepMissing}>
                  {ERROR_MESSAGES[step.key as keyof typeof ERROR_MESSAGES]}
                </Text>
              )}
            </View>

            <View style={styles.stepAction}>
              {edlData.photos[step.key as keyof typeof edlData.photos] ? (
                <Image 
                  source={{ uri: edlData.photos[step.key as keyof typeof edlData.photos] as string }}
                  style={styles.stepThumbnail}
                />
              ) : (
                <Camera size={20} color={colors.primary} />
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderVideoStep = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Vidéo obligatoire</Text>
      <TouchableOpacity
        style={[
          styles.videoStep,
          edlData.video && styles.videoStepCompleted
        ]}
        onPress={recordVideo}
      >
        <View style={styles.videoIcon}>
          {edlData.video ? (
            <CheckCircle size={24} color={colors.success} />
          ) : (
            <Video size={24} color={colors.primary} />
          )}
        </View>
        
        <View style={styles.videoContent}>
          <Text style={styles.videoTitle}>Vidéo de l'état des lieux</Text>
          <Text style={styles.videoDescription}>
            Enregistrez une vidéo complète du véhicule
          </Text>
          {!edlData.video && (
            <Text style={styles.videoMissing}>
              {ERROR_MESSAGES.video}
            </Text>
          )}
        </View>

        <ChevronRight size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  const renderChecklistStep = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Vérification du véhicule</Text>
      <Text style={styles.stepDescription}>
        Vérifiez l'état du véhicule et cochez les éléments ci-dessous.
        Les éléments marqués d'un astérisque (*) sont obligatoires.
      </Text>
      
      <View style={styles.checklistContainer}>
        {CHECKLIST_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.checklistItem}
            onPress={() => toggleChecklistItem(item.id)}
          >
            <View style={styles.checkboxContainer}>
              {checklist[item.id] ? (
                <CheckSquare size={24} color={colors.primary} />
              ) : (
                <Square size={24} color={colors.textSecondary} />
              )}
            </View>
            <Text style={styles.checklistItemText}>
              {item.label} {item.required && <Text style={styles.requiredMark}>*</Text>}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.commentsContainer}>
        <Text style={styles.commentsLabel}>Commentaires additionnels</Text>
        <TextInput
          style={styles.commentsInput}
          value={comments}
          onChangeText={setComments}
          placeholder="Notez ici toute observation sur l'état du véhicule..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={4}
        />
      </View>
      
      <View style={styles.fuelLevelContainer}>
        <Text style={styles.fuelLevelLabel}>Niveau de carburant</Text>
        <View style={styles.fuelLevelSlider}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.fuelLevelOption,
                fuelLevel === level && styles.fuelLevelOptionSelected
              ]}
              onPress={() => setFuelLevel(level)}
            >
              <Text style={[
                styles.fuelLevelText,
                fuelLevel === level && styles.fuelLevelTextSelected
              ]}>
                {level}/8
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.fuelLevelIndicator}>
          <Text style={styles.fuelLevelIndicatorText}>Vide</Text>
          <Fuel size={16} color={colors.primary} />
          <Text style={styles.fuelLevelIndicatorText}>Plein</Text>
        </View>
      </View>
    </View>
  );

  const renderSummaryStep = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Récapitulatif de l'état des lieux</Text>
      
      <View style={styles.summaryCard}>
        <Text style={styles.summaryCardTitle}>Mode d'inspection</Text>
        <Text style={styles.summaryCardValue}>
          {skipMedia ? 'Sans média (justifié)' : edlData.mode === 'photo' ? 'Photos' : 'Vidéo'}
        </Text>
        
        {skipMedia && (
          <View style={styles.summaryItem}>
            <Text style={styles.summaryItemLabel}>Justification :</Text>
            <Text style={styles.summaryItemValue}>{skipReason}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.summaryCard}>
        <Text style={styles.summaryCardTitle}>Compteur kilométrique</Text>
        {edlData.photos.compteur ? (
          <Image 
            source={{ uri: edlData.photos.compteur }} 
            style={styles.summaryImage} 
          />
        ) : (
          <Text style={styles.summaryCardValue}>Non photographié</Text>
        )}
      </View>
      
      <View style={styles.summaryCard}>
        <Text style={styles.summaryCardTitle}>Niveau de carburant</Text>
        <Text style={styles.summaryCardValue}>{fuelLevel}/8</Text>
      </View>
      
      <View style={styles.summaryCard}>
        <Text style={styles.summaryCardTitle}>Éléments vérifiés</Text>
        {CHECKLIST_ITEMS.map((item) => (
          <View key={item.id} style={styles.summaryCheckItem}>
            {checklist[item.id] ? (
              <CheckCircle size={16} color={colors.success} />
            ) : (
              <Circle size={16} color={colors.error} />
            )}
            <Text style={styles.summaryCheckText}>{item.label}</Text>
          </View>
        ))}
      </View>
      
      {comments && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardTitle}>Commentaires</Text>
          <Text style={styles.summaryCardValue}>{comments}</Text>
        </View>
      )}
      
      <TouchableOpacity
        style={styles.finalizeButton}
        onPress={handleComplete}
      >
        <FileText size={20} color={colors.background} />
        <Text style={styles.finalizeButtonText}>
          Finaliser l'état des lieux
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderProgressBar = () => (
    <View style={styles.progressSection}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressTitle}>Progression</Text>
        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      <View style={styles.stepsIndicator}>
        {[1, 2, 3, 4, 5].map((step) => (
          <View 
            key={step}
            style={[
              styles.stepIndicator,
              currentStep >= step && styles.stepIndicatorActive,
              currentStep === step && styles.stepIndicatorCurrent
            ]}
          >
            <Text style={[
              styles.stepIndicatorText,
              currentStep >= step && styles.stepIndicatorTextActive
            ]}>
              {step}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderAdditionalPhotos = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Photos additionnelles (optionnelles)</Text>
      <TouchableOpacity
        style={styles.additionalButton}
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={styles.title}>État des lieux de départ</Text>
        
        <TouchableOpacity
          onPress={currentStep === 5 ? handleComplete : handleNextStep}
          disabled={!canProceedToNextStep()}
          style={[
            styles.completeButton,
            !validation.isValid && styles.completeButtonDisabled
          ]}
          disabled={!validation.isValid}
        >
          <Save size={24} color={colors.background} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderProgressBar()}
        
        {currentStep === 1 && renderModeSelection()}
        {currentStep === 2 && !skipMedia && (edlData.mode === 'photo' ? renderPhotoSteps() : renderVideoStep())}
        {currentStep === 3 && renderOdometerStep()}
        {currentStep === 4 && renderChecklistStep()}
        {currentStep === 5 && renderSummaryStep()}
          mode={cameraMode}
          onCapture={handleCapture}
          onClose={() => setShowCamera(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}

      <View style={styles.footer}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={styles.prevButton}
            onPress={handlePrevStep}
          >
            <Text style={styles.prevButtonText}>Précédent</Text>
          </TouchableOpacity>
        )}
        
        {currentStep < 5 && (
          <TouchableOpacity
            style={[
              styles.nextButton,
              !canProceedToNextStep() && styles.nextButtonDisabled
            ]}
            onPress={handleNextStep}
            disabled={!canProceedToNextStep()}
          >
            <Text style={styles.nextButtonText}>Suivant</Text>
          </TouchableOpacity>
        )}
      </View>

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
    zIndex: 10,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  completeButton: {
    backgroundColor: colors.primary,
    padding: 8,
    borderRadius: 8,
    opacity: 0.9,
  },
  completeButtonDisabled: {
    backgroundColor: colors.border,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 15,
  },
  modeContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  modeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  modeButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  modeButtonTextActive: {
    color: colors.background,
  },
  progressSection: {
    marginBottom: 30,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  progressBar: {
  skipMediaContainer: {
    marginTop: 24,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipMediaLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  skipReasonContainer: {
    marginTop: 16,
  },
  skipReasonLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  skipReasonInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: colors.warning + '15',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    alignItems: 'flex-start',
  },
  warningText: {
    fontSize: 12,
    color: colors.warning,
    marginLeft: 8,
    flex: 1,
  },
  odometerButton: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary + '50',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    height: 200,
  },
  odometerButtonCompleted: {
    borderStyle: 'solid',
    borderColor: colors.success,
  },
  odometerPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  odometerButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    padding: 8,
  },
  retakeButtonText: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: 8,
  },
  checklistContainer: {
    marginTop: 16,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '30',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checklistItemText: {
    fontSize: 16,
    color: colors.text,
  },
  requiredMark: {
    color: colors.error,
  },
  commentsContainer: {
    marginTop: 24,
  },
  commentsLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  commentsInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  fuelLevelContainer: {
    marginTop: 24,
  },
  fuelLevelLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 12,
  },
  fuelLevelSlider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fuelLevelOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  fuelLevelOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  fuelLevelText: {
    fontSize: 12,
    color: colors.text,
  },
  fuelLevelTextSelected: {
    color: colors.background,
    fontWeight: '600',
  },
  fuelLevelIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  fuelLevelIndicatorText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  summaryCardValue: {
    fontSize: 14,
    color: colors.text,
  },
  summaryItem: {
    marginTop: 8,
  },
  summaryItemLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  summaryItemValue: {
    fontSize: 14,
    color: colors.text,
  },
  summaryImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 8,
  },
  summaryCheckItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryCheckText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
  },
  finalizeButton: {
    backgroundColor: colors.success,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  finalizeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  prevButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  prevButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  nextButton: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: colors.border,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  stepsIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 10,
  },
  stepIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndicatorActive: {
    backgroundColor: colors.primary + '50',
  },
  stepIndicatorCurrent: {
    backgroundColor: colors.primary,
  },
  stepIndicatorText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  stepIndicatorTextActive: {
    color: colors.text,
  },
  remainingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
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
    borderColor: colors.error,
    backgroundColor: colors.error + '10',
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
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  stepTitleCompleted: {
    color: colors.success,
  },
  stepDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  stepMissing: {
    fontSize: 12,
    color: colors.error,
  },
  stepAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '10',
    alignItems: 'center', 
    justifyContent: 'center', 
  },
  stepThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  videoStep: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  videoStepCompleted: {
    borderColor: colors.success,
    backgroundColor: colors.success + '10',
  },
  videoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  videoContent: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  videoDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  videoMissing: {
    fontSize: 12,
    color: colors.error,
  },
  additionalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  additionalButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: colors.text,
  },
}); 