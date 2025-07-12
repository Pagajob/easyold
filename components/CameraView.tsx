import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  SafeAreaView, 
  Platform,
  ActivityIndicator,
  Animated,
  Alert
} from 'react-native';
import { ArrowLeft, RefreshCw, CircleStop as StopCircle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import * as MediaLibrary from 'expo-media-library';

// Platform-specific camera imports
let ExpoCameraView: any = null;
let CameraType: any = 'back';
let useCameraPermissions: any = () => [{ granted: false }, async () => {}];

// Only import camera on native platforms
if (Platform.OS !== 'web') {
  try {
    const ExpoCamera = require('expo-camera');
    ExpoCameraView = ExpoCamera.CameraView;
    CameraType = ExpoCamera.CameraType;
    useCameraPermissions = ExpoCamera.useCameraPermissions;
  } catch (error) {
    console.error('Failed to import expo-camera:', error);
  }
}

interface CameraViewProps {
  visible: boolean;
  mode: 'photo' | 'video';
  onCapture: (uri: string, type: 'photo' | 'video') => void;
  onClose: () => void;
}

export default function CameraViewComponent({ visible, mode, onCapture, onClose }: CameraViewProps) {
  const { colors } = useTheme();
  const [cameraType, setCameraType] = useState('back');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [hasError, setHasError] = useState(false);
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaLibraryPermission, requestMediaLibraryPermission] = MediaLibrary.usePermissions();
  
  // Animation pour le bouton d'enregistrement
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Timer pour l'enregistrement vidéo
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // Animation de pulsation pour le bouton d'enregistrement
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      setRecordingTime(0);
      pulseAnim.setValue(1);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);
  
  // Formater le temps d'enregistrement (mm:ss)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Basculer entre caméra avant et arrière
  const toggleCameraType = () => {
    setCameraType(current => (current === 'back' ? 'front' : 'back'));
  };
  
  // Prendre une photo
  const takePicture = async () => {
    if (Platform.OS === 'web') {
      console.log('Simulating photo capture on web');
      // Simulate a photo capture for web
      setTimeout(() => {
        // Use a placeholder image URL for web
        onCapture('https://via.placeholder.com/300x400?text=Photo+Simulée', 'photo');
      }, 500);
      return;
    }
    
    if (!cameraRef.current) {
      console.error('Camera reference is not available');
      setHasError(true);
      Alert.alert('Erreur', 'Caméra non disponible. Veuillez réessayer.');
      return;
    }
    
    try {
      setIsSaving(true);
      setHasError(false);
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: Platform.OS === 'android',
      });
      
      // Sauvegarder dans la galerie si l'utilisateur le souhaite
      if (mediaLibraryPermission?.granted) {
        try {
          await MediaLibrary.saveToLibraryAsync(photo.uri);
        } catch (error) {
          console.error('Error saving to media library:', error);
        }
      }
      
      onCapture(photo.uri, 'photo');
      setIsSaving(false);
    } catch (error) {
      console.error('Error taking picture:', error);
      setIsSaving(false);
      setHasError(true);
      
      // Gestion spécifique pour le simulateur iOS
      if (Platform.OS === 'ios') {
        Alert.alert(
          'Erreur de caméra',
          'La caméra ne fonctionne pas correctement sur le simulateur iOS. Veuillez tester sur un appareil réel.',
          [
            { text: 'Annuler', onPress: onClose },
            { 
              text: 'Simuler', 
              onPress: () => {
                // Simuler une photo pour le développement
                onCapture('https://via.placeholder.com/300x400?text=Photo+Simulée', 'photo');
              }
            }
          ]
        );
      } else {
        Alert.alert('Erreur', 'Impossible de prendre la photo. Veuillez réessayer.');
      }
    }
  };
  
  // Démarrer/arrêter l'enregistrement vidéo
  const toggleRecording = async () => {
    if (Platform.OS === 'web') {
      console.log('Video recording not supported on web');
      Alert.alert('Non supporté', 'L\'enregistrement vidéo n\'est pas supporté sur le web.');
      return;
    }
    
    if (!cameraRef.current) {
      console.error('Camera reference is not available');
      setHasError(true);
      Alert.alert('Erreur', 'Caméra non disponible. Veuillez réessayer.');
      return;
    }
    
    if (isRecording) {
      // Arrêter l'enregistrement
      try {
        cameraRef.current.stopRecording();
        setIsRecording(false);
      } catch (error) {
        console.error('Error stopping recording:', error);
        setIsRecording(false);
      }
    } else {
      // Démarrer l'enregistrement
      setIsRecording(true);
      setHasError(false);
      
      try {
        const videoPromise = cameraRef.current.recordAsync({
          maxDuration: 180, // 3 minutes max
          quality: '720p',
          mute: false,
        });
        
        videoPromise.then(async (video: any) => {
          setIsRecording(false);
          
          // Check if video object is valid before processing
          if (!video || !video.uri) {
            console.error('Video recording failed: Invalid video object');
            setIsSaving(false);
            setHasError(true);
            return;
          }
          
          setIsSaving(true);
          
          // Sauvegarder dans la galerie si l'utilisateur le souhaite
          if (mediaLibraryPermission?.granted) {
            try {
              await MediaLibrary.saveToLibraryAsync(video.uri);
            } catch (error) {
              console.error('Error saving video to media library:', error);
            }
          }
          
          onCapture(video.uri, 'video');
          setIsSaving(false);
        }).catch((error: any) => {
          console.error('Error recording video:', error);
          setIsRecording(false);
          setIsSaving(false);
          setHasError(true);
          
          // Gestion spécifique pour le simulateur iOS
          if (Platform.OS === 'ios') {
            Alert.alert(
              'Erreur d\'enregistrement',
              'L\'enregistrement vidéo ne fonctionne pas correctement sur le simulateur iOS. Veuillez tester sur un appareil réel.',
              [
                { text: 'Annuler', onPress: onClose },
                { 
                  text: 'Simuler', 
                  onPress: () => {
                    // Simuler une vidéo pour le développement
                    onCapture('https://via.placeholder.com/300x400?text=Vidéo+Simulée', 'video');
                  }
                }
              ]
            );
          } else {
            Alert.alert('Erreur', 'Impossible d\'enregistrer la vidéo. Veuillez réessayer.');
          }
        });
      } catch (error) {
        console.error('Error starting recording:', error);
        setIsRecording(false);
        setHasError(true);
        Alert.alert('Erreur', 'Impossible de démarrer l\'enregistrement.');
      }
    }
  };

  // Gestion des erreurs de permission
  useEffect(() => {
    if (visible && !permission?.granted) {
      Alert.alert(
        'Permission caméra requise',
        'Cette fonctionnalité nécessite l\'accès à votre caméra.',
        [
          { text: 'Annuler', onPress: onClose },
          { text: 'Autoriser', onPress: requestPermission }
        ]
      );
    }
  }, [visible, permission]);

  // Si pas de caméra disponible, afficher un message d'erreur
  if (!ExpoCameraView) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.title}>Caméra non disponible</Text>
            <View style={{ width: 40 }} />
          </View>
          
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              La caméra n'est pas disponible sur cette plateforme ou dans cet environnement.
            </Text>
            <TouchableOpacity 
              style={styles.simulateButton}
              onPress={() => {
                const simulatedUri = mode === 'photo' 
                  ? 'https://via.placeholder.com/300x400?text=Photo+Simulée'
                  : 'https://via.placeholder.com/300x400?text=Vidéo+Simulée';
                onCapture(simulatedUri, mode);
              }}
            >
              <Text style={styles.simulateButtonText}>
                Simuler une {mode === 'photo' ? 'photo' : 'vidéo'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.container}>
          <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.title}>
            {mode === 'photo' ? 'Appareil photo' : 'Caméra vidéo'}
            </Text>
          <TouchableOpacity onPress={toggleCameraType} style={styles.switchButton}>
              <RefreshCw size={24} color="white" />
            </TouchableOpacity>
          </View>
          
        <View style={styles.cameraContainer}>
          <ExpoCameraView
            ref={cameraRef}
            style={styles.camera}
            type={cameraType}
            onMountError={(error: any) => {
              console.error('Camera mount error:', error);
              setHasError(true);
              Alert.alert(
                'Erreur de caméra',
                'Impossible d\'initialiser la caméra. Veuillez réessayer.',
                [
                  { text: 'Annuler', onPress: onClose },
                  { 
                    text: 'Simuler', 
                    onPress: () => {
                      const simulatedUri = mode === 'photo' 
                        ? 'https://via.placeholder.com/300x400?text=Photo+Simulée'
                        : 'https://via.placeholder.com/300x400?text=Vidéo+Simulée';
                      onCapture(simulatedUri, mode);
                    }
                  }
                ]
              );
            }}
          />
          
          {hasError && (
            <View style={styles.errorOverlay}>
              <Text style={styles.errorOverlayText}>
                Erreur de caméra
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => setHasError(false)}
              >
                <Text style={styles.retryButtonText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.controls}>
          {mode === 'video' && isRecording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>{formatTime(recordingTime)}</Text>
            </View>
          )}
          
              <TouchableOpacity 
            style={[
              styles.captureButton,
              isRecording && styles.recordingButton,
              hasError && styles.captureButtonDisabled
            ]}
            onPress={mode === 'photo' ? takePicture : toggleRecording}
            disabled={isSaving || hasError}
              >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : isRecording ? (
              <StopCircle size={32} color="white" />
                ) : (
              <View style={styles.captureButtonInner} />
                )}
              </TouchableOpacity>
            </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  switchButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorOverlayText: {
    color: 'white',
    fontSize: 18,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  recordingButton: {
    backgroundColor: '#FF3B30',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    marginRight: 8,
  },
  recordingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  simulateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  simulateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});