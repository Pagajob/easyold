import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotificationContext } from '@/contexts/NotificationContext';

export default function NotificationDemo() {
  const { colors } = useTheme();
  const { showSuccess, showError, showWarning, showInfo } = useNotificationContext();

  const styles = createStyles(colors);

  const handleTestSuccess = () => {
    showSuccess(
      'Opération réussie !',
      'La tâche a été complétée avec succès.',
      { duration: 3000 }
    );
  };

  const handleTestError = () => {
    showError(
      'Erreur détectée',
      'Une erreur est survenue lors du traitement.',
      { duration: 4000 }
    );
  };

  const handleTestWarning = () => {
    showWarning(
      'Attention requise',
      'Veuillez vérifier les informations avant de continuer.',
      { duration: 5000 }
    );
  };

  const handleTestInfo = () => {
    showInfo(
      'Information',
      'Voici une information importante pour vous.',
      { duration: 3000 }
    );
  };

  const handleTestPersistent = () => {
    showInfo(
      'Notification persistante',
      'Cette notification ne se fermera pas automatiquement.',
      { 
        autoHide: false,
        showCloseButton: true,
        onPress: () => {
          showSuccess('Notification fermée !', 'Vous avez cliqué sur la notification.');
        }
      }
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test des notifications</Text>
      <Text style={styles.subtitle}>
        Appuyez sur les boutons ci-dessous pour tester les différents types de notifications
      </Text>

      <View style={styles.buttonGrid}>
        <TouchableOpacity style={[styles.button, styles.successButton]} onPress={handleTestSuccess}>
          <CheckCircle size={20} color="white" />
          <Text style={styles.buttonText}>Succès</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.errorButton]} onPress={handleTestError}>
          <AlertCircle size={20} color="white" />
          <Text style={styles.buttonText}>Erreur</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.warningButton]} onPress={handleTestWarning}>
          <AlertTriangle size={20} color="white" />
          <Text style={styles.buttonText}>Avertissement</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.infoButton]} onPress={handleTestInfo}>
          <Info size={20} color="white" />
          <Text style={styles.buttonText}>Information</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.persistentButton]} onPress={handleTestPersistent}>
          <Info size={20} color="white" />
          <Text style={styles.buttonText}>Persistante</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: colors.surface,
    borderRadius: 12,
    margin: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  buttonGrid: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  successButton: {
    backgroundColor: colors.success,
  },
  errorButton: {
    backgroundColor: colors.error,
  },
  warningButton: {
    backgroundColor: colors.warning,
  },
  infoButton: {
    backgroundColor: colors.info,
  },
  persistentButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 