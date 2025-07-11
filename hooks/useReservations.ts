import { useData } from '@/contexts/DataContext';
import { Reservation } from '@/contexts/DataContext';
import { useVehicles } from '@/hooks/useVehicles';
import { useAuth } from '@/contexts/AuthContext';

export function useReservations() {
  const { reservations, addReservation, updateReservation, deleteReservation, loading, error } = useData();
  const { vehicles } = useVehicles();
  const { user } = useAuth();

  // Only find reservations belonging to the current user
  const getReservationById = (id: string) => reservations.find(r => r.id === id && r.userId === user?.uid);

  const getReservationsByStatus = (status: Reservation['statut'], userId = user?.uid) => {
    return reservations.filter(r => r.statut === status && r.userId === userId);
  };

  const getReservationsByClient = (clientId: string, userId = user?.uid) => {
    return reservations.filter(r => r.clientId === clientId && r.userId === userId);
  };

  const getReservationsByVehicle = (vehicleId: string, userId = user?.uid) => {
    return reservations.filter(r => r.vehiculeId === vehicleId && r.userId === userId);
  };

  // Calculate payments made to vehicle owner for the current month
  const calculateVehicleOwnerPayments = (vehicleId: string, userId = user?.uid) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle || vehicle.financement !== 'Mise à disposition' || !vehicle.prixReverse24h) {
      return 0;
    }

    // Get current month's reservations for this vehicle
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const currentMonthReservations = reservations.filter(r => {
      try {
        const reservationDate = new Date(r.dateDebut);
        return r.vehiculeId === vehicleId && 
              reservationDate.getMonth() === currentMonth &&
              reservationDate.getFullYear() === currentYear &&
              r.statut !== 'Annulé' &&
              r.userId === userId;
      } catch (e) {
        return false;
      }
    });
    
    // Sum up all payments to owner that have been explicitly set
    const explicitPayments = currentMonthReservations
      .filter(r => r.montantReverseProprietaire !== undefined)
      .reduce((sum, r) => sum + (r.montantReverseProprietaire || 0), 0);
    
    // For reservations without explicit payment, calculate based on duration and daily rate
    const calculatedPayments = currentMonthReservations
      .filter(r => r.montantReverseProprietaire === undefined)
      .reduce((sum, r) => {
        // Calculate duration in days
        const startDate = new Date(r.dateDebut);
        const endDate = new Date(r.dateRetourPrevue);
        const durationMs = endDate.getTime() - startDate.getTime();
        const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24)) || 1;
        
        // Calculate payment based on daily rate
        return sum + (vehicle.prixReverse24h * durationDays);
      }, 0);
    
    return explicitPayments + calculatedPayments;
  };

  const getActiveReservations = (userId = user?.uid) => {
    return reservations.filter(r => r.statut === 'En cours' && r.userId === userId);
  };

  const getUpcomingReservations = (userId = user?.uid) => {
    const today = new Date();
    return reservations.filter(r => {
      try {
        const startDate = new Date(r.dateDebut);
        return r.statut === 'Confirmé' && startDate >= today && r.userId === userId;
      } catch (e) {
        return false;
      }
    });
  };

  const calculateTotalRevenue = (userId = user?.uid) => {
    return reservations.filter(r => 
        r.statut !== 'Annulé' && 
        r.montantLocation && 
        r.userId === userId
      )
      .reduce((sum, r) => sum + (r.montantLocation || 0), 0);
  };

  const canStartEDL = (reservation: Reservation, userId = user?.uid) => {
    if (reservation.userId !== userId) return false;
    
    const today = new Date();
    const startDate = new Date(reservation.dateDebut);
    return (reservation.statut === 'Confirmé' || reservation.statut === 'Planifiée') && startDate <= today;
  };

  return {
    reservations,
    addReservation,
    updateReservation,
    deleteReservation,
    getReservationById,
    getReservationsByStatus,
    getReservationsByClient,
    getReservationsByVehicle,
    calculateVehicleOwnerPayments,
    getActiveReservations,
    getUpcomingReservations,
    calculateTotalRevenue,
    canStartEDL,
    loading,
    error,
  };
}