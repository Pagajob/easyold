import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { RotateCcw, Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

// Platform-specific imports
// Import directly for web platform
import SignatureCanvas from 'react-signature-canvas';

// For mobile platforms, use dynamic import
let SignatureScreen: any = null;
if (Platform.OS !== 'web') {
  // Mobile platforms - use react-native-signature-canvas
  try {
    SignatureScreen = require('react-native-signature-canvas').default;
  } catch (error) {
    console.error('Failed to import react-native-signature-canvas:', error);
  }
}

interface SignaturePadProps {
  onOK: (signature: string) => void;
  onEmpty?: () => void;
  onClear?: () => void;
  onBegin?: () => void;
  onEnd?: () => void;
  descriptionText?: string;
  clearText?: string;
  confirmText?: string;
  webStyle?: string;
  style?: any;
}

export default function SignaturePad({
  onOK,
  onEmpty,
  onClear,
  onBegin,
  onEnd,
  descriptionText = "Signez dans la zone ci-dessous",
  clearText = "Effacer",
  confirmText = "Valider",
  webStyle,
  style
}: SignaturePadProps) {
  const { colors } = useTheme();
  const signatureRef = useRef<any>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const { width } = Dimensions.get('window');

  const styles = createStyles(colors);

  const handleClear = () => {
    if (Platform.OS === 'web' && signatureRef.current) {
      signatureRef.current.clear();
    } else if (signatureRef.current) {
      signatureRef.current.clearSignature();
    }
    setIsEmpty(true);
    onClear?.();
  };

  const handleConfirm = () => {
    if (isEmpty) {
      onEmpty?.();
      return;
    }

    if (Platform.OS === 'web' && signatureRef.current) {
      const dataURL = signatureRef.current.toDataURL();
      onOK(dataURL);
    } else if (signatureRef.current) {
      signatureRef.current.readSignature();
    }
  };

  const handleBegin = () => {
    setIsEmpty(false);
    onBegin?.();
  };

  const handleEnd = () => {
    onEnd?.();
  };

  // Mobile signature handling
  const handleMobileOK = (signature: string) => {
    onOK(signature);
  };

  const handleMobileEmpty = () => {
    setIsEmpty(true);
    onEmpty?.();
  };

  // Web signature component
  const renderWebSignature = () => {    
    if (typeof SignatureCanvas !== 'function') {
      return (
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackText}>
            Signature non disponible sur cette plateforme
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.webContainer}>
        <Text style={styles.descriptionText}>{descriptionText}</Text>
        <View style={styles.canvasContainer}>
          <SignatureCanvas
            ref={signatureRef}
            canvasProps={{
              width: width - 40,
              height: 300,
              className: 'signature-canvas',
              style: {
                border: `2px dashed ${colors.border}`,
                borderRadius: '12px',
                backgroundColor: colors.background,
              }
            }}
            backgroundColor={colors.background}
            penColor={colors.text}
            onBegin={handleBegin}
            onEnd={handleEnd}
          />
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <RotateCcw size={20} color={colors.textSecondary} />
            <Text style={styles.clearButtonText}>{clearText}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.confirmButton, isEmpty && styles.confirmButtonDisabled]} 
            onPress={handleConfirm}
          >
            <Check size={20} color={colors.background} />
            <Text style={styles.confirmButtonText}>{confirmText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Mobile signature component
  const renderMobileSignature = () => {    
    if (typeof SignatureScreen !== 'function') {
      return (
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackText}>
            Signature non disponible sur cette plateforme
          </Text>
        </View>
      );
    }

    const webStyleString = webStyle || `
      .m-signature-pad {
        box-shadow: none;
        border: 2px dashed ${colors.border};
        border-radius: 12px;
        margin: 16px;
      }
      .m-signature-pad--body {
        border: none;
        background-color: ${colors.background};
      }
      .m-signature-pad--footer {
        display: none;
      }
      body {
        background-color: ${colors.background};
      }
    `;

    return (
      <View style={styles.mobileContainer}>
        <SignatureScreen
          ref={signatureRef}
          onOK={handleMobileOK}
          onEmpty={handleMobileEmpty}
          onClear={onClear}
          onBegin={handleBegin}
          onEnd={handleEnd}
          descriptionText={descriptionText}
          clearText={clearText}
          confirmText={confirmText}
          {...(Platform.OS !== 'web' ? { webStyle: webStyleString } : {})}
          style={style}
        />
        <View style={styles.mobileButtonsContainer}>
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <RotateCcw size={20} color={colors.textSecondary} />
            <Text style={styles.clearButtonText}>{clearText}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.confirmButton, isEmpty && styles.confirmButtonDisabled]} 
            onPress={handleConfirm}
          >
            <Check size={20} color={colors.background} />
            <Text style={styles.confirmButtonText}>{confirmText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? renderWebSignature() : renderMobileSignature()}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  webContainer: {
    flex: 1,
    padding: 20,
  },
  mobileContainer: {
    flex: 1,
    padding: 0,
  },
  descriptionText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  canvasContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 20,
  },
  mobileButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    padding: 20,
    marginTop: 20,
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.border,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  fallbackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  fallbackText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});