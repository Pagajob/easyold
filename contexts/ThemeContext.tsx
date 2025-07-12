import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

interface ThemeContextType {
  colors: ThemeColors;
  isDark: boolean;
  updatePrimaryColor: (color: string) => void;
  toggleTheme: () => void;
}

const lightColors: ThemeColors = {
  primary: '#007AFF',
  primaryDark: '#0062CC',
  secondary: '#8E8E93',
  accent: '#34C759',
  background: '#FFFFFF',
  surface: '#F2F2F7',
  text: '#000000',
  textSecondary: '#8E8E93',
  border: '#D1D1D6',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#5AC8FA',
};

const darkColors: ThemeColors = {
  primary: '#2563EB', // Bleu profond
  primaryDark: '#1A4CB8',
  secondary: '#A0A4B8',
  accent: '#30D158',
  background: '#181A20', // Fond général très sombre
  surface: '#23262F',   // Cartes, modals, inputs
  text: '#F5F6FA',      // Texte principal très clair
  textSecondary: '#A0A4B8', // Texte secondaire gris bleuté
  border: '#23262F',    // Bordures discrètes
  success: '#30D158',
  warning: '#FFD60A',
  error: '#FF453A',
  info: '#64D2FF',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('#2563EB');

  useEffect(() => {
    loadThemeSettings();
  }, []);

  const loadThemeSettings = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      const savedColor = await AsyncStorage.getItem('primaryColor');
      
      if (savedTheme) {
        setIsDark(savedTheme === 'dark');
      }
      if (savedColor) {
        setPrimaryColor(savedColor);
      }
    } catch (error) {
      console.error('Error loading theme settings:', error);
    }
  };

  const updatePrimaryColor = async (color: string) => {
    setPrimaryColor(color);
    await AsyncStorage.setItem('primaryColor', color);
  };

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const colors: ThemeColors = {
    ...(isDark ? darkColors : lightColors),
    primary: primaryColor,
    primaryDark: adjustColor(primaryColor, -20),
  };

  return (
    <ThemeContext.Provider value={{ colors, isDark, updatePrimaryColor, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

function adjustColor(color: string, amount: number): string {
  const usePound = color[0] === '#';
  const col = usePound ? color.slice(1) : color;
  const num = parseInt(col, 16);
  let r = (num >> 16) + amount;
  let g = (num >> 8 & 0x00FF) + amount;
  let b = (num & 0x0000FF) + amount;
  r = r > 255 ? 255 : r < 0 ? 0 : r;
  g = g > 255 ? 255 : g < 0 ? 0 : g;
  b = b > 255 ? 255 : b < 0 ? 0 : b;
  return (usePound ? '#' : '') + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
}