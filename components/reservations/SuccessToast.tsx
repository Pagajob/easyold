import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface SuccessToastProps {
  visible: boolean;
  message: string;
  onClose: () => void;
  duration?: number;
}

export default function SuccessToast({ 
  visible, 
  message, 
  onClose, 
  duration = 3000 
}: SuccessToastProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  
  useEffect(() => {
    let hideTimeout: NodeJS.Timeout;
    
    if (visible) {
      // Animation d'entrée
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        })
      ]).start();
      
      // Masquer automatiquement après la durée spécifiée
      hideTimeout = setTimeout(() => {
        hideToast();
      }, duration);
    }
    
    return () => {
      if (hideTimeout) clearTimeout(hideTimeout);
    };
  }, [visible]);
  
  const hideToast = () => {
    // Animation de sortie
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      onClose();
    });
  };
  
  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 50 : 20,
      left: 20,
      right: 20,
      alignItems: 'center',
      zIndex: 1000,
    },
    toast: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Platform.OS === 'ios' 
        ? 'rgba(255, 255, 255, 0.8)' 
        : colors.background,
      borderRadius: 28,
      paddingHorizontal: 16,
      paddingVertical: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
      maxWidth: 500,
      width: '100%',
    },
    iconContainer: {
      width: 32,
      height: 32,
      borderRadius: 28,
      backgroundColor: colors.success + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    message: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      width: 24,
      height: 24,
      borderRadius: 28,
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    }
  });
  
  if (!visible) return null;
  
  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View 
        style={[
          styles.toast, 
          { 
            opacity, 
            transform: [{ translateY }] 
          }
        ]}
      >
        <View style={styles.iconContainer}>
          <Check size={18} color={colors.success} />
        </View>
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity style={styles.closeButton} onPress={hideToast}>
          <X size={14} color={colors.text} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}