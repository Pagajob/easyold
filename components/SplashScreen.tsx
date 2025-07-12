import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Image } from 'react-native';
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

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const { colors } = useTheme();
  
  // Shared values for animations
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const logoRotation = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const backgroundOpacity = useSharedValue(0);
  const skipButtonOpacity = useSharedValue(0);
  
  const canSkip = useRef(false);
  const animationFinished = useRef(false);

  const slogan = "Votre gestion de flotte simplifiée";
  const sloganWords = slogan.split(' ');
  // Un tableau de sharedValues pour chaque mot
  const wordOpacities = sloganWords.map(() => useSharedValue(0));
  const wordScales = sloganWords.map(() => useSharedValue(0.7));
  const wordTranslates = sloganWords.map(() => useSharedValue(30)); // 30px en dessous

  // Background animation
  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  // Logo animation
  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotation.value}deg` },
    ],
    opacity: logoOpacity.value,
  }));

  // Glow animation
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [
      { scale: interpolate(glowOpacity.value, [0, 1], [0.8, 1.2], Extrapolate.CLAMP) },
    ],
  }));

  // Text animation
  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  // Skip button animation
  const skipButtonStyle = useAnimatedStyle(() => ({
    opacity: skipButtonOpacity.value,
  }));

  // Slogan animation (mot par mot, slide up)
  const animatedSlogan = sloganWords.map((word, i) => {
    const style = useAnimatedStyle(() => ({
      opacity: wordOpacities[i].value,
      transform: [
        { scale: wordScales[i].value },
        { translateY: wordTranslates[i].value },
      ],
    }));
    return (
      <Animated.Text key={i} style={[styles.sloganWord, style]}>
        {word + (i < sloganWords.length - 1 ? ' ' : '')}
      </Animated.Text>
    );
  });

  const startAnimation = () => {
    // 1. Background fade in (0-800ms)
    backgroundOpacity.value = withTiming(1, { duration: 800 });

    // 2. Logo animation (400-1200ms)
    setTimeout(() => {
      logoOpacity.value = withTiming(1, { duration: 400 });
      logoScale.value = withSpring(1, {
        damping: 8,
        stiffness: 100,
        mass: 0.8,
        restDisplacementThreshold: 0.01,
      });
    }, 400);

    // 3. Glow animation (800-2000ms)
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

    // 4. App name fade in (1400-1800ms)
    setTimeout(() => {
      textOpacity.value = withTiming(1, { duration: 400 });
    }, 1400);

    // 5. Slogan mot par mot (1600ms+)
    sloganWords.forEach((_, i) => {
      setTimeout(() => {
        wordOpacities[i].value = withTiming(1, { duration: 350 });
        wordTranslates[i].value = withSpring(0, { damping: 7, stiffness: 120 });
        wordScales[i].value = withSpring(1, { damping: 7, stiffness: 120 });
      }, 1600 + i * 180);
    });

    // 6.5. Rotation du logo (3000ms)
    setTimeout(() => {
      logoRotation.value = withTiming(360, {
        duration: 800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }, 3000);

    // 6. Skip button available (1500ms+)
    setTimeout(() => {
      canSkip.current = true;
      skipButtonOpacity.value = withTiming(1, { duration: 300 });
    }, 1500);

    // 7. Auto finish (3800ms)
    setTimeout(() => {
      if (!animationFinished.current) {
        setTimeout(() => {
          finishAnimation();
        }, 500);
      }
    }, 3800);
  };

  const finishAnimation = () => {
    animationFinished.current = true;
    
    // Fade out all elements
    backgroundOpacity.value = withTiming(0, { duration: 500 });
    logoOpacity.value = withTiming(0, { duration: 300 });
    textOpacity.value = withTiming(0, { duration: 300 });
    glowOpacity.value = withTiming(0, { duration: 200 });
    logoRotation.value = withTiming(720, { duration: 500 });
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
      <Animated.View style={[styles.background, backgroundOpacity.value ? { opacity: backgroundOpacity.value } : {}]}>
        <LinearGradient
          colors={['#8B5CF6', '#EC4899']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

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

      {/* Slogan mot par mot */}
      <View style={styles.sloganContainer}>
        {animatedSlogan}
      </View>

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
    backgroundColor: 'transparent', // S'assurer qu'il n'y a pas de fond blanc
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1, // Toujours en arrière-plan
  },
  gradient: {
    flex: 1,
    width: '100%',
    height: '100%',
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
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 30,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  sloganWord: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginRight: 4,
    fontWeight: '600',
  },
  cursor: {
    fontWeight: 'bold',
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