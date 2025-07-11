import { useData } from '@/contexts/DataContext';
import { Vehicle } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';

export function useVehicles() {
  const { vehicles, addVehicle, updateVehicle, deleteVehicle, loading, error } = useData();
  const { user } = useAuth();

  // Filter vehicles by current user and status
  const availableVehicles = vehicles.filter(v => v.statut === 'Disponible' && v.userId === user?.uid);
  const rentedVehicles = vehicles.filter(v => v.statut === 'Loué' && v.userId === user?.uid);
  const maintenanceVehicles = vehicles.filter(v => v.statut === 'Maintenance' && v.userId === user?.uid);
  const unavailableVehicles = vehicles.filter(v => v.statut === 'Indisponible' && v.userId === user?.uid);

  const getVehicleById = (id: string) => vehicles.find(v => v.id === id);
  
  const getVehicleName = (id: string) => {
    const vehicle = getVehicleById(id);
    return vehicle ? `${vehicle.marque} ${vehicle.modele}` : 'Véhicule inconnu';
  };

  const getVehiclesByStatus = (status: Vehicle['statut'], userId = user?.uid) => {
    return vehicles.filter(v => v.statut === status && v.userId === userId);
  };

  return {
    vehicles,
    availableVehicles,
    rentedVehicles,
    maintenanceVehicles,
    unavailableVehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    getVehicleById,
    getVehicleName,
    getVehiclesByStatus,
    loading,
    error,
  };
}