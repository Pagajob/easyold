import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  Platform, 
  Dimensions,
  Animated,
  Pressable,
  BlurView
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Download, X, Check, FileText } from 'lucide-react-native';

interface ExportSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  onDownload: () => void;
  fileName: string;
  period: string;
}

const ExportSuccessModal = ({ 
  visible, 
  onClose, 
  onDownload, 
  fileName, 
  period 
}: ExportSuccessModalProps) => {
  const { colors } = useTheme();
  const [animation] = React.useState(new Animated.Value(0));
  
  React.useEffect(() => {
    if (visible) {
      Animated.spring(animation, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 40
      }).start();
    } else {
      Animated.timing(animation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }).start();
    }
  }, [visible]);
  
  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0]
  });
  
  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });
  
  const scale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1]
  });
  
  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(10px)',
    },
    modalContainer: {
      width: '85%',
      maxWidth: 400,
      backgroundColor: Platform.OS === 'ios' 
        ? 'rgba(255, 255, 255, 0.85)' 
        : colors.background,
      borderRadius: 28,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 10,
    },
    blurView: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    contentContainer: {
      padding: 24,
      alignItems: 'center',
    },
    successIcon: {
      width: 60,
      height: 60,
      borderRadius: 28,
      backgroundColor: colors.success + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    message: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: 22,
    },
    fileInfo: {
      backgroundColor: colors.primary + '10',
      borderRadius: 28,
      padding: 16,
      width: '100%',
      marginBottom: 24,
      flexDirection: 'row',
      alignItems: 'center',
    },
    fileIcon: {
      width: 40,
      height: 40,
      borderRadius: 28,
      backgroundColor: colors.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    fileDetails: {
      flex: 1,
    },
    fileName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    filePeriod: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    buttonsContainer: {
      flexDirection: 'row',
      width: '100%',
      gap: 12,
    },
    downloadButton: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: 28,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    downloadButtonText: {
      color: colors.background,
      fontSize: 16,
      fontWeight: '600',
    },
    closeButton: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 28,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    infoText: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 16,
      fontStyle: 'italic',
    },
    closeIconButton: {
      position: 'absolute',
      top: 16,
      right: 16,
      width: 30,
      height: 30,
      borderRadius: 28,
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    }
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Animated.View 
          style={[
            styles.modalContainer, 
            { 
              opacity, 
              transform: [{ translateY }, { scale }] 
            }
          ]}
        >
          <Pressable onPress={e => e.stopPropagation()}>
            {Platform.OS === 'ios' && (
              <BlurView
                style={styles.blurView}
                blurType="light"
                blurAmount={20}
              />
            )}
            
            <TouchableOpacity style={styles.closeIconButton} onPress={onClose}>
              <X size={16} color={colors.text} />
            </TouchableOpacity>
            
            <View style={styles.contentContainer}>
              <View style={styles.successIcon}>
                <Check size={30} color={colors.success} />
              </View>
              
              <Text style={styles.title}>Rapport exporté avec succès</Text>
              <Text style={styles.message}>
                Votre rapport financier pour {period} a été généré et est prêt à être téléchargé.
              </Text>
              
              <View style={styles.fileInfo}>
                <View style={styles.fileIcon}>
                  <FileText size={20} color={colors.primary} />
                </View>
                <View style={styles.fileDetails}>
                  <Text style={styles.fileName}>{fileName}</Text>
                  <Text style={styles.filePeriod}>Période: {period}</Text>
                </View>
              </View>
              
              <View style={styles.buttonsContainer}>
                <TouchableOpacity style={styles.downloadButton} onPress={onDownload}>
                  <Download size={18} color={colors.background} />
                  <Text style={styles.downloadButtonText}>Télécharger</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Text style={styles.closeButtonText}>Fermer</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.infoText}>
                Le fichier sera enregistré dans votre dossier Téléchargements
              </Text>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

export default ExportSuccessModal;