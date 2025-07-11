import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, Dimensions } from 'react-native';
import { X, FileText, Download } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface DocumentViewerProps {
  visible: boolean;
  documentUrl: string | null;
  documentTitle: string;
  onClose: () => void;
}

export default function DocumentViewer({ visible, documentUrl, documentTitle, onClose }: DocumentViewerProps) {
  const { colors } = useTheme();
  const { width, height } = Dimensions.get('window');

  if (!documentUrl) return null;

  const styles = createStyles(colors);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{documentTitle}</Text>
          <TouchableOpacity style={styles.downloadButton}>
            <Download size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {documentUrl.toLowerCase().includes('.pdf') ? (
            <View style={styles.pdfContainer}>
              <FileText size={64} color={colors.textSecondary} />
              <Text style={styles.pdfText}>Document PDF</Text>
              <Text style={styles.pdfSubtext}>
                L'aperçu PDF n'est pas disponible dans cette version
              </Text>
            </View>
          ) : (
            <Image 
              source={{ uri: documentUrl }} 
              style={[styles.image, { width: width - 40, height: height - 120 }]}
              resizeMode="contain"
            />
          )}
        </View>
      </View>
    </Modal>
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
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    color: colors.text,
  },
  downloadButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  image: {
    borderRadius: 28,
  },
  pdfContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  pdfSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});