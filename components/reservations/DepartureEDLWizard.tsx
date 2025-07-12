import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Image,
  TextInput,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, Check, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { CameraView } from '../CameraView';
import { useTheme } from '../../contexts/ThemeContext';

interface DepartureEDLWizardProps {
  reservation: any;
  onComplete: (edlData: any) => void;
  onCancel: () => void;
}

interface EDLData {
  mode: 'photo' | 'video' | 'none';
  skipMedia: boolean;
  skipMediaReason: string;
  photos: string[];
  video: string | null;
  odometerPhoto: string | null;
  checklist: {
    bodywork: boolean;
    tires: boolean;
    lights: boolean;
    interior: boolean;
    documents: boolean;
  };
  fuelLevel: number;
  comments: string;
}

const CHECKLIST_ITEMS = [
  { key: 'bodywork', label: 'Carrosserie', required: true },
  { key: 'tires', label: 'Pneus', required: true },
  { key: 'lights', label: 'Éclairage', required: true },
  { key: 'interior', label: 'Intérieur', required: false },
  { key: 'documents', label: 'Documents', required: true },
];

export default function DepartureEDLWizard({ reservation, onComplete, onCancel }: DepartureEDLWizardProps) {
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<'photo' | 'video'>('photo');
  const [captureType, setCaptureType] = useState<'media' | 'odometer'>('media');
  
  const [edlData, setEdlData] = useState<EDLData>({
    mode: 'photo',
    skipMedia: false,
    skipMediaReason: '',
    photos: [],
    video: null,
    odometerPhoto: null,
    checklist: {
      bodywork: false,
      tires: false,
      lights: false,
      interior: false,
      documents: false,
    },
    fuelLevel: 8,
    comments: '',
  });

  const styles = createStyles(colors);

  const handleModeSelection = (mode: 'photo' | 'video' | 'none') => {
    setEdlData(prev => ({ ...prev, mode, skipMedia: mode === 'none' }));
  };

  const handleSkipMediaToggle = (skip: boolean) => {
    setEdlData(prev => ({ 
      ...prev, 
      skipMedia: skip,
      mode: skip ? 'none' : 'photo',
      skipMediaReason: skip ? prev.skipMediaReason : ''
    }));
  };

  const handleCapture = (uri: string) => {
    if (captureType === 'odometer') {
      setEdlData(prev => ({ ...prev, odometerPhoto: uri }));
    } else {
      if (edlData.mode === 'photo') {
        setEdlData(prev => ({ ...prev, photos: [...prev.photos, uri] }));
      } else if (edlData.mode === 'video') {
        setEdlData(prev => ({ ...prev, video: uri }));
      }
    }
    setShowCamera(false);
  };

  const handleChecklistChange = (key: string, value: boolean) => {
    setEdlData(prev => ({
      ...prev,
      checklist: { ...prev.checklist, [key]: value }
    }));
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return edlData.skipMedia ? edlData.skipMediaReason.trim().length > 0 : true;
      case 2:
        if (edlData.skipMedia) return true;
        return edlData.mode === 'photo' ? edlData.photos.length > 0 : edlData.video !== null;
      case 3:
        return edlData.odometerPhoto !== null;
      case 4:
        const requiredItems = CHECKLIST_ITEMS.filter(item => item.required);
        return requiredItems.every(item => edlData.checklist[item.key as keyof typeof edlData.checklist]);
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1 && edlData.skipMedia) {
      setCurrentStep(3); // Skip media step
    } else if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 3 && edlData.skipMedia) {
      setCurrentStep(1); // Skip back to mode selection
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete(edlData);
  };

  const openCamera = (type: 'media' | 'odometer') => {
    setCaptureType(type);
    setCameraMode(type === 'odometer' ? 'photo' : edlData.mode as 'photo' | 'video');
    setShowCamera(true);
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(currentStep / 5) * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>Étape {currentStep} sur 5</Text>
    </View>
  );

  const renderModeSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Choix du mode de capture</Text>
      
      <View style={styles.modeContainer}>
        <TouchableOpacity
          style={[styles.modeButton, edlData.mode === 'photo' && !edlData.skipMedia && styles.modeButtonActive]}
          onPress={() => handleModeSelection('photo')}
        >
          <Camera size={24} color={edlData.mode === 'photo' && !edlData.skipMedia ? colors.primary : colors.text} />
          <Text style={[styles.modeButtonText, edlData.mode === 'photo' && !edlData.skipMedia && styles.modeButtonTextActive]}>
            Photos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeButton, edlData.mode === 'video' && !edlData.skipMedia && styles.modeButtonActive]}
          onPress={() => handleModeSelection('video')}
        >
          <Camera size={24} color={edlData.mode === 'video' && !edlData.skipMedia ? colors.primary : colors.text} />
          <Text style={[styles.modeButtonText, edlData.mode === 'video' && !edlData.skipMedia && styles.modeButtonTextActive]}>
            Vidéo
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.skipMediaContainer}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => handleSkipMediaToggle(!edlData.skipMedia)}
        >
          <View style={[styles.checkbox, edlData.skipMedia && styles.checkboxChecked]}>
            {edlData.skipMedia && <Check size={16} color={colors.background} />}
          </View>
          <Text style={styles.checkboxLabel}>Ne pas prendre de photo/vidéo</Text>
        </TouchableOpacity>

        {edlData.skipMedia && (
          <View style={styles.warningContainer}>
            <AlertTriangle size={20} color={colors.warning} />
            <Text style={styles.warningText}>
              Cette option doit être justifiée
            </Text>
          </View>
        )}

        {edlData.skipMedia && (
          <TextInput
            style={styles.reasonInput}
            placeholder="Raison de ne pas prendre de média..."
            value={edlData.skipMediaReason}
            onChangeText={(text) => setEdlData(prev => ({ ...prev, skipMediaReason: text }))}
            multiline
            numberOfLines={3}
            placeholderTextColor={colors.textSecondary}
          />
        )}
      </View>
    </View>
  );

  const renderMediaStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>
        {edlData.mode === 'photo' ? 'Prendre des photos' : 'Enregistrer une vidéo'}
      </Text>

      <TouchableOpacity
        style={styles.captureButton}
        onPress={() => openCamera('media')}
      >
        <Camera size={32} color={colors.background} />
        <Text style={styles.captureButtonText}>
          {edlData.mode === 'photo' ? 'Prendre une photo' : 'Enregistrer une vidéo'}
        </Text>
      </TouchableOpacity>

      {edlData.photos.length > 0 && (
        <View style={styles.mediaPreview}>
          <Text style={styles.mediaPreviewTitle}>Photos prises ({edlData.photos.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {edlData.photos.map((photo, index) => (
              <Image key={index} source={{ uri: photo }} style={styles.photoThumbnail} />
            ))}
          </ScrollView>
        </View>
      )}

      {edlData.video && (
        <View style={styles.mediaPreview}>
          <Text style={styles.mediaPreviewTitle}>Vidéo enregistrée</Text>
          <View style={styles.videoThumbnail}>
            <Camera size={24} color={colors.textSecondary} />
            <Text style={styles.videoText}>Vidéo prête</Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderOdometerStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Photo du compteur kilométrique</Text>
      <Text style={styles.stepSubtitle}>Cette photo est obligatoire</Text>

      <TouchableOpacity
        style={styles.captureButton}
        onPress={() => openCamera('odometer')}
      >
        <Camera size={32} color={colors.background} />
        <Text style={styles.captureButtonText}>Photographier le compteur</Text>
      </TouchableOpacity>

      {edlData.odometerPhoto && (
        <View style={styles.mediaPreview}>
          <Text style={styles.mediaPreviewTitle}>Photo du compteur</Text>
          <Image source={{ uri: edlData.odometerPhoto }} style={styles.odometerPhoto} />
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={() => openCamera('odometer')}
          >
            <Text style={styles.retakeButtonText}>Reprendre la photo</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderChecklistStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Vérifications</Text>

      <View style={styles.checklistContainer}>
        {CHECKLIST_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.checklistItem}
            onPress={() => handleChecklistChange(item.key, !edlData.checklist[item.key as keyof typeof edlData.checklist])}
          >
            <View style={[styles.checkbox, edlData.checklist[item.key as keyof typeof edlData.checklist] && styles.checkboxChecked]}>
              {edlData.checklist[item.key as keyof typeof edlData.checklist] && <Check size={16} color={colors.background} />}
            </View>
            <Text style={styles.checklistLabel}>
              {item.label}
              {item.required && <Text style={styles.requiredMark}> *</Text>}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.fuelContainer}>
        <Text style={styles.fuelLabel}>Niveau de carburant</Text>
        <View style={styles.fuelSelector}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.fuelLevel,
                edlData.fuelLevel >= level && styles.fuelLevelActive
              ]}
              onPress={() => setEdlData(prev => ({ ...prev, fuelLevel: level }))}
            >
              <Text style={[
                styles.fuelLevelText,
                edlData.fuelLevel >= level && styles.fuelLevelTextActive
              ]}>
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TextInput
        style={styles.commentsInput}
        placeholder="Commentaires additionnels..."
        value={edlData.comments}
        onChangeText={(text) => setEdlData(prev => ({ ...prev, comments: text }))}
        multiline
        numberOfLines={4}
        placeholderTextColor={colors.textSecondary}
      />
    </View>
  );

  const renderSummaryStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Récapitulatif</Text>

      <View style={styles.summarySection}>
        <Text style={styles.summaryLabel}>Mode de capture:</Text>
        <Text style={styles.summaryValue}>
          {edlData.skipMedia ? 'Aucun média' : edlData.mode === 'photo' ? 'Photos' : 'Vidéo'}
        </Text>
      </View>

      {edlData.skipMedia && (
        <View style={styles.summarySection}>
          <Text style={styles.summaryLabel}>Raison:</Text>
          <Text style={styles.summaryValue}>{edlData.skipMediaReason}</Text>
        </View>
      )}

      <View style={styles.summarySection}>
        <Text style={styles.summaryLabel}>Médias capturés:</Text>
        <Text style={styles.summaryValue}>
          {edlData.skipMedia ? 'Aucun' : 
           edlData.mode === 'photo' ? `${edlData.photos.length} photo(s)` : 
           edlData.video ? '1 vidéo' : 'Aucun'}
        </Text>
      </View>

      <View style={styles.summarySection}>
        <Text style={styles.summaryLabel}>Photo compteur:</Text>
        <Text style={styles.summaryValue}>
          {edlData.odometerPhoto ? 'Prise' : 'Manquante'}
        </Text>
      </View>

      <View style={styles.summarySection}>
        <Text style={styles.summaryLabel}>Vérifications:</Text>
        <Text style={styles.summaryValue}>
          {Object.values(edlData.checklist).filter(Boolean).length} / {CHECKLIST_ITEMS.length} éléments vérifiés
        </Text>
      </View>

      <View style={styles.summarySection}>
        <Text style={styles.summaryLabel}>Niveau carburant:</Text>
        <Text style={styles.summaryValue}>{edlData.fuelLevel}/8</Text>
      </View>

      {edlData.comments && (
        <View style={styles.summarySection}>
          <Text style={styles.summaryLabel}>Commentaires:</Text>
          <Text style={styles.summaryValue}>{edlData.comments}</Text>
        </View>
      )}
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
          onPress={currentStep === 5 ? handleComplete : handleNextStep}
          disabled={!canProceedToNextStep()}
          style={[
            styles.completeButton,
            !canProceedToNextStep() && styles.completeButtonDisabled
          ]}
        >
          <Text style={[
            styles.completeButtonText,
            !canProceedToNextStep() && styles.completeButtonTextDisabled
          ]}>
            {currentStep === 5 ? 'Terminer' : 'Suivant'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderProgressBar()}
        
        {currentStep === 1 && renderModeSelection()}
        {currentStep === 2 && !edlData.skipMedia && renderMediaStep()}
        {currentStep === 3 && renderOdometerStep()}
        {currentStep === 4 && renderChecklistStep()}
        {currentStep === 5 && renderSummaryStep()}
      </ScrollView>

      <View style={styles.navigationButtons}>
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

      <Modal visible={showCamera} animationType="slide">
        <CameraView
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
    padding: 16,
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
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  completeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  completeButtonDisabled: {
    backgroundColor: colors.border,
  },
  completeButtonText: {
    color: colors.background,
    fontWeight: '600',
  },
  completeButtonTextDisabled: {
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  modeContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  modeButton: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  modeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  modeButtonText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  modeButtonTextActive: {
    color: colors.primary,
  },
  skipMediaContainer: {
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    fontSize: 16,
    color: colors.text,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    backgroundColor: colors.warningLight,
    borderRadius: 8,
  },
  warningText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.warning,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
    textAlignVertical: 'top',
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  captureButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  mediaPreview: {
    marginTop: 16,
  },
  mediaPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  videoThumbnail: {
    width: 120,
    height: 80,
    backgroundColor: colors.surface,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoText: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textSecondary,
  },
  odometerPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  retakeButton: {
    alignSelf: 'center',
    padding: 8,
  },
  retakeButtonText: {
    fontSize: 14,
    color: colors.primary,
  },
  checklistContainer: {
    marginBottom: 24,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checklistLabel: {
    fontSize: 16,
    color: colors.text,
  },
  requiredMark: {
    color: colors.error,
  },
  fuelContainer: {
    marginBottom: 24,
  },
  fuelLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  fuelSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fuelLevel: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fuelLevelActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  fuelLevelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  fuelLevelTextActive: {
    color: colors.background,
  },
  commentsInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    textAlignVertical: 'top',
  },
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    flex: 1,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  prevButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  prevButtonText: {
    fontSize: 16,
    color: colors.text,
  },
  nextButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  nextButtonDisabled: {
    backgroundColor: colors.border,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
});