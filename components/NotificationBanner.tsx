import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Dimensions,
  StatusBar,
  Platform
} from 'react-native';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

export type BannerType = 'success' | 'error' | 'warning' | 'info';

export interface BannerProps {
  visible: boolean;
  type: BannerType;
  title: string;
  message?: string;
  duration?: number;
  onClose?: () => void;
  onPress?: () => void;
  showCloseButton?: boolean;
  autoHide?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export default function NotificationBanner({
  visible,
  type,
  title,
  message,
  duration = 5000,
  onClose,
  onPress,
  showCloseButton = true,
  autoHide = true
}: BannerProps) {
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const getBannerConfig = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: colors.success,
          icon: CheckCircle,
          iconColor: 'white'
        };
      case 'error':
        return {
          backgroundColor: colors.error,
          icon: AlertCircle,
          iconColor: 'white'
        };
      case 'warning':
        return {
          backgroundColor: colors.warning,
          icon: AlertTriangle,
          iconColor: 'white'
        };
      case 'info':
        return {
          backgroundColor: colors.info,
          icon: Info,
          iconColor: 'white'
        };
      default:
        return {
          backgroundColor: colors.primary,
          icon: Info,
          iconColor: 'white'
        };
    }
  };

  const config = getBannerConfig();
  const IconComponent = config.icon;

  useEffect(() => {
    if (visible) {
      // Animer l'entrée
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide après la durée spécifiée
      if (autoHide && duration > 0) {
        const timer = setTimeout(() => {
          hideBanner();
        }, duration);

        return () => clearTimeout(timer);
      }
    } else {
      hideBanner();
    }
  }, [visible, duration, autoHide]);

  const hideBanner = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose?.();
    });
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      hideBanner();
    }
  };

  const handleClose = () => {
    hideBanner();
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={config.backgroundColor}
        translucent={Platform.OS === 'android'}
      />
      
      <TouchableOpacity
        style={styles.content}
        onPress={handlePress}
        activeOpacity={onPress ? 0.8 : 1}
      >
        <View style={styles.iconContainer}>
          <IconComponent size={24} color={config.iconColor} />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {message && <Text style={styles.message}>{message}</Text>}
        </View>
        
        {showCloseButton && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={20} color="white" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    minHeight: 60,
  },
  iconContainer: {
    marginRight: 12,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
}); 