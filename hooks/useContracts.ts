import { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { ContractService } from '@/services/contractService';
import { Contract, ContractService as ContractFirebaseService } from '@/services/firebaseService';
import { Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export function useContracts() {
  const { reservations, vehicles, clients, updateReservation } = useData();
  const { companyInfo, getExtraFees } = useCompanySettings();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);

  // Listen for contracts
  useEffect(() => {
    const unsubscribe = ContractFirebaseService.onSnapshot(
      (contractsData) => {
        setContracts(contractsData);
      },
      (error) => {
        console.error('Error loading contracts:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  /**
   * Generate a contract for a reservation
   */
  const generateContract = async (reservationId: string): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const reservation = reservations.find(r => r.id === reservationId);
      if (!reservation) {
        setError('Réservation introuvable');
        throw new Error('Réservation introuvable');
      }
      const vehicle = vehicles.find(v => v.id === reservation.vehiculeId);
      if (!vehicle) {
        setError('Véhicule introuvable');
        throw new Error('Véhicule introuvable');
      }
      const client = clients.find(c => c.id === reservation.clientId);
      if (!client) {
        setError('Client introuvable');
        throw new Error('Client introuvable');
      }
      if (!client.email) {
        setError('Le client n\'a pas d\'adresse email.');
        throw new Error('Le client n\'a pas d\'adresse email.');
      }
      if (!companyInfo || !companyInfo.nom) {
        setError('Informations entreprise manquantes');
        throw new Error('Informations entreprise manquantes');
      }
      // Get extra fees
      const extraFees = getExtraFees();
      // Log données envoyées
      console.log('Génération contrat: données envoyées', {reservation, client, vehicle, companyInfo, extraFees});
      let contractUrl;
      try {
        contractUrl = await ContractService.generateContract(
          reservation,
          client,
          vehicle,
          companyInfo,
          extraFees
        );
      } catch (error) {
        console.error('Erreur lors de la génération du contrat PDF:', error);
        setError(error instanceof Error ? error.message : String(error));
        throw error;
      }
      if (!contractUrl) {
        setError('Impossible de générer l\'URL du contrat');
        throw new Error('Impossible de générer l\'URL du contrat');
      }
      // Save contract to Firestore
      const contractData = {
        reservationId: reservation.id,
        clientId: client.id,
        vehicleId: vehicle.id,
        contractUrl,
        sentToEmail: false,
        createdAt: new Date().toISOString(),
      };
      try {
        await ContractFirebaseService.create(contractData);
      } catch (error) {
        console.error('Erreur Firestore contrat:', error);
      }
      try {
        await updateReservation(reservation.id, {
          contratGenere: contractUrl
        });
      } catch (error) {
        console.error('Erreur updateReservation contrat:', error);
      }
      return contractUrl;
    } catch (error) {
      console.error('Erreur globale génération contrat:', error);
      setError(error instanceof Error ? error.message : String(error));
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Send contract by email
   */
  const sendContractByEmail = async (contractUrl: string, reservationId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const reservation = reservations.find(r => r.id === reservationId);
      if (!reservation) {
        throw new Error('Réservation introuvable');
      }

      const vehicle = vehicles.find(v => v.id === reservation.vehiculeId);
      if (!vehicle || vehicle.userId !== user?.uid) {
        throw new Error('Véhicule introuvable');
      }

      const client = clients.find(c => c.id === reservation.clientId);
      if (!client || client.userId !== user?.uid) {
        throw new Error('Client introuvable');
      }

      if (!client.email) {
        throw new Error('Le client n\'a pas d\'adresse email');
      }
      
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      // Send email (corrigé à 4 arguments)
      await ContractService.sendContractByEmail(
        contractUrl,
        client.email,
        user.uid,
        `${vehicle.marque} ${vehicle.modele}`,
        contractData // ou l'objet approprié selon le contexte
      );

      // Find contract in Firestore
      const existingContract = contracts.find(c => c.reservationId === reservationId);
      if (existingContract) {
        // Update contract with email sent status
        await ContractFirebaseService.update(existingContract.id, {
          sentToEmail: true,
          emailSentAt: new Date().toISOString()
        });
      }

      return true;
    } catch (error) {
      console.error('Error sending contract by email:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de l\'envoi du contrat par email');
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate and send contract
   */
  const generateAndSendContract = async (reservationId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const contractUrl = await generateContract(reservationId);
      if (!contractUrl) {
        setLoading(false);
        return false;
      }

      try {
        const emailSent = await sendContractByEmail(contractUrl, reservationId);
        return emailSent;
      } catch (error) {
        console.error('Error sending contract email:', error);
        // Contract was generated but email failed
        return true;
      }
    } catch (error) {
      console.error('Error generating and sending contract:', error);
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Erreur lors de la génération et de l\'envoi du contrat');
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get contract for a reservation
   */
  const getContractByReservationId = async (reservationId: string): Promise<Contract | null> => {
    try {
      return await ContractFirebaseService.getByReservationId(reservationId);
    } catch (error) {
      console.error('Error getting contract:', error);
      return null;
    }
  };

  /**
   * Auto-generate contract when EDL is completed
   */
  const autoGenerateContractOnEDL = async (reservationId: string): Promise<void> => {
    try {
      const reservation = reservations.find(r => r.id === reservationId);
      if (!reservation || reservation.userId !== user?.uid) return;
      
      // Check if EDL is completed and contract not yet generated
      if (!reservation.edlDepart || reservation.contratGenere) return;
      
      const client = clients.find(c => c.id === reservation.clientId);
      if (!client || !client.email || client.userId !== user?.uid) {
        console.log(`Impossible de générer automatiquement le contrat pour ${reservationId}: client sans email`);
        return;
      }

      console.log('Auto-generating contract for reservation:', reservationId);
      
      const success = await generateAndSendContract(reservationId);
      if (success) {
        console.log('Contract auto-generated and sent successfully');
      } else {
        console.warn('Failed to auto-generate contract');
      }
    } catch (error) {
      console.error('Error in auto-generate contract:', error);
    }
  };

  return {
    contracts,
    loading,
    error,
    generateContract,
    sendContractByEmail,
    generateAndSendContract,
    getContractByReservationId,
    autoGenerateContractOnEDL
  };
}