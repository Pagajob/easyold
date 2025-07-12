import { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { Reservation } from '@/contexts/DataContext';

export function useContractAutomation() {
  const { reservations, updateReservation } = useData();
  const { companyInfo } = useCompanySettings();
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Monitor reservations for contract generation triggers
  useEffect(() => {
    const processReservations = async () => {
      for (const reservation of reservations) {
        // Skip if already processing or already has contract
        if (processing.has(reservation.id) || reservation.contratGenere) {
          continue;
        }

        // Trigger contract generation for confirmed reservations
        if (reservation.statut === 'Confirmé' || reservation.statut === 'confirmée') {
          await generateContractForReservation(reservation.id);
        }
      }
    };

    // Debounce the processing to avoid excessive calls
    const timeoutId = setTimeout(processReservations, 1000);
    return () => clearTimeout(timeoutId);
  }, [reservations]);

  const generateContractForReservation = async (reservationId: string): Promise<boolean> => {
    if (processing.has(reservationId)) {
      return false;
    }

    setProcessing(prev => new Set(prev).add(reservationId));
    setErrors(prev => ({ ...prev, [reservationId]: '' }));

    try {
      console.log(`Generating contract for reservation ${reservationId}...`);
      
      // Use absolute URL for API calls
      const apiUrl =
        (typeof window !== 'undefined' && window.location && window.location.origin)
          ? `${window.location.origin}/api/contracts/generate`
          : process.env.EXPO_PUBLIC_API_URL
            ? `${process.env.EXPO_PUBLIC_API_URL}/api/contracts/generate`
            : 'https://easygarage-app.vercel.app/api/contracts/generate';
      
      // Call the API route to generate contract
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationId: reservationId
        })
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate contract');
        } else {
          const errorText = await response.text();
          throw new Error('Réponse inattendue du serveur: ' + errorText);
        }
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const result = await response.json();
        // Update reservation with contract URL
        await updateReservation(reservationId, {
          contratGenere: result.contractUrl
        });
        console.log(`Contract generated successfully for reservation ${reservationId}`);
        return true;
      } else {
        const errorText = await response.text();
        throw new Error('Réponse inattendue du serveur: ' + errorText);
      }
    } catch (error) {
      console.error(`Error generating contract for reservation ${reservationId}:`, error);
      setErrors(prev => ({
        ...prev,
        [reservationId]: error instanceof Error ? error.message : 'Erreur inconnue'
      }));
      return false;
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(reservationId);
        return newSet;
      });
    }
  };

  const manuallyGenerateContract = async (reservationId: string): Promise<boolean> => {
    return await generateContractForReservation(reservationId);
  };

  const isProcessing = (reservationId: string): boolean => {
    return processing.has(reservationId);
  };

  const getError = (reservationId: string): string | undefined => {
    return errors[reservationId];
  };

  return {
    manuallyGenerateContract,
    isProcessing,
    getError,
    processing: Array.from(processing),
    errors
  };
}