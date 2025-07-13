import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Image, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  runOnJS,
  interpolate,
  Extrapolate, 
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Car, Calendar, Users, Settings } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const { colors } = useTheme();
  
  // Valeurs partagées pour les animations
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const logoRotation = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textProgress = useSharedValue(0);
  const cursorOpacity = useSharedValue(0);
  const backgroundOpacity = useSharedValue(0);
  const skipButtonOpacity = useSharedValue(0);
  const iconsOpacity = useSharedValue(0);
  const iconsScale = useSharedValue(0);
  
  const canSkip = useRef(false);
  const animationFinished = useRef(false);

  const slogan = "Votre gestion de flotte simplifiée";
  const [displayedText, setDisplayedText] = React.useState('');
  const [showCursor, setShowCursor] = React.useState(false);
  const [showIcons, setShowIcons] = React.useState(false);

  // Animation du fond
  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  // Animation du logo
  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotation.value}deg` },
    ],
    opacity: logoOpacity.value,
  }));

  // Animation du halo
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [
      { scale: interpolate(glowOpacity.value, [0, 1], [0.8, 1.2], Extrapolate.CLAMP) },
    ],
  }));

  // Animation du texte
  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  // Animation du curseur
  const cursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  // Animation du bouton de saut
  const skipButtonStyle = useAnimatedStyle(() => ({
    opacity: skipButtonOpacity.value,
  }));

  // Animation des icônes
  const iconsStyle = useAnimatedStyle(() => ({
    opacity: iconsOpacity.value,
    transform: [
      { scale: iconsScale.value },
    ],
  }));

  const startAnimation = () => {
    // 1. Background fade in (0-800ms)
    backgroundOpacity.value = withTiming(1, { duration: 800 });

    // 2. Animation du logo (400-1200ms)
    setTimeout(() => {
      logoOpacity.value = withTiming(1, { duration: 400 });
      logoScale.value = withSpring(1, {
        damping: 8,
        stiffness: 100,
        mass: 0.8,
        restDisplacementThreshold: 0.01,
      });
    }, 400);

    // 3. Animation du halo (800-2000ms)
    setTimeout(() => {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(0.3, { duration: 600 })
        ),
        -1,
        true
      );
    }, 800);

    // 4. Animation du texte (1400-2400ms)
    setTimeout(() => {
      textOpacity.value = withTiming(1, { duration: 400 });
    }, 1400);

    // 5. Effet machine à écrire (1400-3500ms)
    setTimeout(() => {
      let currentIndex = 0;
      const typewriterInterval = setInterval(() => {
        if (currentIndex <= slogan.length) {
          setDisplayedText(slogan.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(typewriterInterval);
          // Start cursor blinking
          cursorOpacity.value = withRepeat(
            withSequence(
              withTiming(1, { duration: 500 }),
              withTiming(0, { duration: 500 })
            ),
            -1,
            true
          );
          setShowCursor(true);
        }
      }, 30); // vitesse accélérée
    }, 1400);

    // 6. Rotation du logo (3000ms)
    setTimeout(() => {
      logoRotation.value = withTiming(360, {
        duration: 800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }, 3000);

    // 7. Animation des icônes (2500ms)
    setTimeout(() => {
      setShowIcons(true);
      iconsOpacity.value = withTiming(1, { duration: 800 });
      iconsScale.value = withSpring(1, {
        damping: 8,
        stiffness: 100,
      });
    }, 2500);

    // 8. Bouton de saut disponible (1500ms+)
    setTimeout(() => {
      canSkip.current = true;
      skipButtonOpacity.value = withTiming(1, { duration: 300 });
    }, 1500);

    // 9. Fin automatique (4200ms)
    setTimeout(() => {
      if (!animationFinished.current) {
        // Délai supplémentaire pour permettre à la rotation de se terminer
        setTimeout(() => {
          finishAnimation();
        }, 500);
      }
    }, 4200);
  };

  const finishAnimation = () => {
    animationFinished.current = true;
    
    // Fade out all elements
    backgroundOpacity.value = withTiming(0, { duration: 500 });
    logoOpacity.value = withTiming(0, { duration: 300 });
    textOpacity.value = withTiming(0, { duration: 300 });
    glowOpacity.value = withTiming(0, { duration: 200 });
    iconsOpacity.value = withTiming(0, { duration: 200 });
    logoRotation.value = withTiming(720, { duration: 500 });
    cursorOpacity.value = withTiming(0, { duration: 200 });
    skipButtonOpacity.value = withTiming(0, { duration: 200 });
    
    // Call onFinish after fade out
    setTimeout(() => {
      onFinish();
    }, 500);
  };

  const handleSkip = () => {
    if (canSkip.current) {
      finishAnimation();
    }
  };

  useEffect(() => {
    startAnimation();
  }, []);

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      {Platform.OS === 'web' ? (
        <Animated.View style={[styles.background, backgroundStyle]}>
          <LinearGradient
            colors={[colors.primary, '#EC4899']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
      ) : (
        <Animated.View style={[styles.background, backgroundStyle, {backgroundColor: colors.primary}]} />
      )}

      {/* Logo with glow effect */}
      <View style={styles.logoContainer}>
        <Animated.View style={[styles.glow, glowStyle]} />
        <Animated.View style={[styles.logo, logoStyle]}>
          <Image 
            source={require('@/assets/images/lucid.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      {/* App name */}
      <Animated.Text style={[styles.appName, textStyle]}>
        EasyGarage
      </Animated.Text>

      {/* Slogan with typewriter effect */}
      <Animated.View style={[styles.sloganContainer, textStyle]}>
        <Text style={styles.sloganText}>
          {displayedText}
          <Animated.Text style={[styles.cursor, cursorStyle]}>
            {showCursor ? '|' : ''}
          </Animated.Text>
        </Text>
      </Animated.View>

      {/* Animated icons */}
      {showIcons && (
        <Animated.View style={[styles.iconsContainer, iconsStyle]}>
          <View style={styles.iconRow}>
            <View style={[styles.iconCircle, {backgroundColor: 'rgba(255, 255, 255, 0.2)'}]}>
              <Car size={24} color="white" />
            </View>
            <View style={[styles.iconCircle, {backgroundColor: 'rgba(255, 255, 255, 0.2)'}]}>
              <Users size={24} color="white" />
            </View>
          </View>
          <View style={styles.iconRow}>
            <View style={[styles.iconCircle, {backgroundColor: 'rgba(255, 255, 255, 0.2)'}]}>
              <Calendar size={24} color="white" />
            </View>
            <View style={[styles.iconCircle, {backgroundColor: 'rgba(255, 255, 255, 0.2)'}]}>
              <Settings size={24} color="white" />
            </View>
          </View>
        </Animated.View>
      )}

      {/* Skip button */}
      <Animated.View style={[styles.skipContainer, skipButtonStyle]}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradient: {
    flex: 1,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 40,
  },
  glow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    top: -10,
    left: -10,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  sloganContainer: {
    alignItems: 'center',
    minHeight: 30,
  },
  sloganText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cursor: {
    fontWeight: 'bold',
  },
  iconsContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 30,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  skipContainer: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
  },
  skipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  skipText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
}); 