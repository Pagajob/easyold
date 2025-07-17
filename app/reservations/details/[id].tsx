import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Linking, Modal, TextInput, Platform } from 'react-native';
import { ArrowLeft, Car, User, Calendar, Clock, FileText, Phone, Mail, DollarSign, CreditCard as Edit, Trash2, Download, Pencil } from 'lucide-react-native';
import { useData } from '@/contexts/DataContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useContracts } from '@/hooks/useContracts';
import { useVehicles } from '@/hooks/useVehicles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import EDLRetourModal from '@/components/reservations/EDLRetourModal';
import EnhancedEDLRetourModal from '@/components/reservations/EnhancedEDLRetourModal';
import EDLHistoryView from '@/components/reservations/EDLHistoryView';
import EditReservationModal from '@/components/reservations/EditReservationModal';

export default function ReservationDetailsScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  const { reservations, vehicles, clients, deleteReservation, updateReservation, loading, error } = useData();
  const { user } = useAuth();
  const { getVehicleById } = useVehicles();
  const { generateAndSendContract, getContractByReservationId, loading: contractLoading } = useContracts();

  const [isGeneratingContract, setIsGeneratingContract] = useState(false);
  const [contractUrl, setContractUrl] = useState<string | null>(null);
  const [edlRetourModalVisible, setEdlRetourModalVisible] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showOwnerPaymentModal, setShowOwnerPaymentModal] = useState(false);
  const [ownerPaymentAmount, setOwnerPaymentAmount] = useState('0');

  const reservation = reservations.find(r => r.id === id);
  const vehicle = reservation ? vehicles.find(v => v.id === reservation.vehiculeId) : null;
  const client = reservation ? clients.find(c => c.id === reservation.clientId) : null;

  useEffect(() => {
    if (reservation && vehicle && vehicle.financement === 'Mise à disposition') {
      if (reservation.montantReverseProprietaire === undefined) {
        const days = calculateDuration();
        const defaultAmount = (vehicle.prixReverse24h || 0) * days;
        setOwnerPaymentAmount(defaultAmount.toString());
      } else {
        setOwnerPaymentAmount(reservation.montantReverseProprietaire.toString());
      }
    }
  }, [reservation, vehicle]);

  useEffect(() => {
    const loadContract = async () => {
      if (reservation) {
        if (reservation.contratGenere) {
          setContractUrl(reservation.contratGenere);
        } else {
          const contract = await getContractByReservationId(reservation.id);
          if (contract) {
            setContractUrl(contract.contractUrl);
          }
        }
      }
    };
    loadContract();
  }, [reservation]);

  if (loading) {
    return <LoadingSpinner message="Chargement des détails..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  // Fonction utilitaire pour calculer la durée de la réservation en jours
  const calculateDuration = () => {
    if (!reservation) return 0;
    const start = new Date(reservation.dateDebut);
    const end = new Date(reservation.dateRetourPrevue);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Fonction utilitaire pour générer les styles dynamiquement
  const createStyles = (colors: any) => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    errorContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorText: {
      color: colors.error,
      fontSize: 18,
      fontWeight: 'bold',
    },
    // ... (ajouter ici les autres styles nécessaires du composant)
  });

  if (!reservation || !vehicle || !client) {
    return (
      <SafeAreaView style={createStyles(colors).container}>
        <View style={createStyles(colors).errorContainer}>
          <Text style={createStyles(colors).errorText}>Réservation introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ... (handlers et JSX comme dans la version corrigée du code, voir codebase_search)
}