import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Modal, Platform } from 'react-native';
import { ArrowLeft, Save, Camera, Video, CheckCircle, Circle, ChevronRight, AlertCircle } from 'lucide-react-native';
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

export default function DepartureEDLWizard({ 
  reservationId, 
  onComplete, 
  onCancel 
}: DepartureEDLWizardProps) {
  const { colors } = useTheme();
  const [edlData, setEdlData] = useState<EDLData>({
    mode: 'photo',
    photos: {},
    video: undefined
  });

  // États pour la caméra
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<'photo' | 'video'>('photo');
  const [currentCaptureTarget, setCurrentCaptureTarget] = useState<string>('');
  
  // Permissions
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaLibraryPermission, requestMediaLibraryPermission] = MediaLibrary.usePermissions();

  const styles = createStyles(colors);

  // Calculer la progression
  const progress = calculateProgress(edlData);
  const remainingSteps = getRemainingSteps(edlData);
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
    if (!validation.isValid) {
      Alert.alert('Étapes manquantes', validation.errors.join('\n'));
      return;
    }

    onComplete(edlData);
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
    </View>
  );

  const renderProgressBar = () => (
    <View style={styles.progressSection}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressTitle}>Progression</Text>
        <Text style={styles.progressText}>{progress}%</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      {remainingSteps.length > 0 && (
        <Text style={styles.remainingText}>
          {remainingSteps.length} étape{remainingSteps.length > 1 ? 's' : ''} restante{remainingSteps.length > 1 ? 's' : ''}
        </Text>
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

  const renderAdditionalPhotos = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Photos additionnelles (optionnelles)</Text>
      <TouchableOpacity
        style={styles.additionalButton}
        onPress={() => openCamera('additionnelles')}
      >
        <Camera size={20} color={colors.primary} />
        <Text style={styles.additionalButtonText}>
          Ajouter des photos supplémentaires
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={styles.title}>État des lieux de départ</Text>
        
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderModeSelection()}
        {renderProgressBar()}
        
        {edlData.mode === 'photo' ? (
          <>
            {renderPhotoSteps()}
            {renderAdditionalPhotos()}
          </>
        ) : (
          renderVideoStep()
        )}
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
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
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