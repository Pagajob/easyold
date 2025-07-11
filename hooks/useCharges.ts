import { useData } from '@/contexts/DataContext';
import { Charge } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';

export function useCharges() {
  const { charges, addCharge, updateCharge, deleteCharge, loading, error } = useData();
  const { user } = useAuth();

  // Only find charges belonging to the current user
  const getChargeById = (id: string) => charges.find(c => c.id === id && c.userId === user?.uid);

  const getChargesByType = (type: Charge['type'], userId = user?.uid) => {
    return charges.filter(c => 
      c.type === type && 
      !c.estPaiementProprietaire && 
      c.userId === userId
    );
  };

  const getChargesByVehicle = (vehicleId: string, userId = user?.uid) => {
    return charges.filter(c => 
      c.vehiculeId === vehicleId && 
      !c.estPaiementProprietaire && 
      c.userId === userId
    );
  };

  const getGeneralCharges = (userId = user?.uid) => {
    return charges.filter(c => 
      c.vehiculeId === null && 
      !c.estPaiementProprietaire && 
      c.userId === userId
    );
  };

  const calculateMonthlyCharges = (userId = user?.uid) => {
    // Filter out owner payments and calculate total monthly charges
    return charges.filter(c => 
      !c.estPaiementProprietaire && 
      c.vehiculeId !== undefined && 
      c.userId === userId
    ).reduce((sum, c) => {
      const multiplier = c.frequence === 'Trimestrielle' ? 1/3 : c.frequence === 'Annuelle' ? 1/12 : 1;
      return sum + (c.montantMensuel * multiplier);
    }, 0);
  };

  const getVehicleMonthlyCharge = (vehicleId: string, userId = user?.uid) => {
    // Get all charges for this specific vehicle that are not owner payments
    const vehicleCharges = getChargesByVehicle(vehicleId, userId);

    // Calculate total monthly cost from these charges
    const totalCharge = vehicleCharges.reduce((sum, c) => {
      const multiplier = c.frequence === 'Trimestrielle' ? 1/3 : c.frequence === 'Annuelle' ? 1/12 : 1;
      return sum + (c.montantMensuel * multiplier);
    }, 0);
    
    return totalCharge;
  };

  const calculateYearlyCharges = (userId = user?.uid) => {
    return charges.filter(c => 
      !c.estPaiementProprietaire && 
      c.vehiculeId !== undefined && 
      c.userId === userId
    ).reduce((sum, c) => {
      const multiplier = c.frequence === 'Mensuelle' ? 12 : c.frequence === 'Trimestrielle' ? 4 : 1;
      return sum + (c.montantMensuel * multiplier);
    }, 0);
  };

  return {
    charges,
    addCharge,
    updateCharge,
    deleteCharge,
    getChargeById,
    getChargesByType,
    getChargesByVehicle,
    getVehicleMonthlyCharge,
    getGeneralCharges,
    calculateMonthlyCharges,
    calculateYearlyCharges,
    loading,
    error,
  };
}