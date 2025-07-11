import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  VehicleService, 
  ClientService, 
  ChargeService, 
  ReservationService 
} from '@/services/firebaseService';
import { useAuth } from '@/contexts/AuthContext';
import { useContracts } from '@/hooks/useContracts';

export interface Vehicle {
  id: string;
  userId: string;
  marque: string;
  modele: string;
  immatriculation: string;
  photo?: string;
  carburant: 'Essence' | 'Diesel' | 'Électrique' | 'Hybride';
  financement: 'Achat comptant' | 'Leasing' | 'LLD' | 'Mise à disposition';
  assuranceMensuelle: number;
  statut: 'Disponible' | 'Loué' | 'Maintenance' | 'Indisponible';
  notes: string;
  kilometrageJournalier: number;
  
  // Nouveaux champs de prix
  prix_base_24h: number;
  prix_base_weekend?: number;
  prixKmSupplementaire?: number;
  cautionDepart?: number;
  cautionRSV?: number;
  
  // Exigences conducteur
  ageMinimal?: number;
  anneesPermis?: number;
  
  // Champs conditionnels selon financement
  prixAchat?: number;
  dateAchat?: string;
  apportInitial?: number;
  mensualites?: number;
  loyerMensuel?: number;
  dureeContrat?: number;
  dateDebut?: string;
  valeurResiduelle?: number;
  kilometrageAutorise?: number;
  cautionDeposee?: number;
  nomProprietaire?: string;
  montantMensuel?: number;
  duree?: number;
  conditionsParticulieres?: string;
  prixReverse24h?: number;
  prixReverseWeekend?: number;
}

export interface Client {
  id: string;
  userId: string;
  prenom: string;
  nom: string;
  telephone: string;
  email: string;
  adresse: string; // Champ adresse ajouté
  permisConduire?: string;
  carteIdentite?: string;
  notes: string;
}

export interface Charge {
  id: string;
  userId: string;
  nom: string;
  montantMensuel: number;
  type: 'Fixe' | 'Variable';
  dateDebut: string;
  frequence: 'Mensuelle' | 'Trimestrielle' | 'Annuelle';
  vehiculeId?: string | null;
  // Nouveau champ pour les paiements au propriétaire
  estPaiementProprietaire?: boolean;
}

export interface Reservation {
  id: string;
  userId: string;
  vehiculeId: string;
  clientId: string;
  typeContrat: 'Location' | 'Prêt';
  dateDebut: string;
  heureDebut: string;
  dateRetourPrevue: string;
  heureRetourPrevue: string;
  kilometrageDepart?: number;
  kilometrageRetour?: number;
  statut: 'Planifiée' | 'Confirmé' | 'En cours' | 'Terminé' | 'Annulé';
  
  // État des lieux
  edlDepart?: {
    type: 'Photo' | 'Vidéo';
    compteur?: string;
    kmDepart?: number; // Added field to store departure km as a number
    jantes?: string;
    interieur?: string;
    carrosserie?: string;
    video?: string;
    carburant: number;
    accessoires: string;
    degats: string;
    dateHeure: string;
    coordonnees?: string;
  };
  
  edlRetour?: {
    type: 'Retour';
    kmDepart?: number; // Added field to store departure km for reference
    kmRetour?: number;
    carburantRetour?: number;
    dateHeure: string;
  };
  
  montantLocation?: number;
  signature?: string;
  contratGenere?: string;
  
  // Nouveaux champs pour les frais supplémentaires
  fraisKmSupp?: number;
  totalFraisRetour?: number;
  
  // Nouveau champ pour le montant reversé au propriétaire
  montantReverseProprietaire?: number;
}

interface DataContextType {
  vehicles: Vehicle[];
  clients: Client[];
  charges: Charge[];
  reservations: Reservation[];
  loading: boolean;
  error: string | null;
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => Promise<void>;
  updateVehicle: (id: string, vehicle: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  addClient: (client: Omit<Client, 'id'>) => Promise<void>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addCharge: (charge: Omit<Charge, 'id'>) => Promise<void>;
  updateCharge: (id: string, charge: Partial<Charge>) => Promise<void>;
  deleteCharge: (id: string) => Promise<void>;
  addReservation: (reservation: Omit<Reservation, 'id'>) => Promise<void>;
  updateReservation: (id: string, reservation: Partial<Reservation>) => Promise<void>;
  deleteReservation: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, userProfile } = useAuth();

  useEffect(() => {
    let unsubscribeVehicles: (() => void) | undefined;
    let unsubscribeClients: (() => void) | undefined;
    let unsubscribeCharges: (() => void) | undefined;
    let unsubscribeReservations: (() => void) | undefined;

    const setupRealtimeListeners = () => {
      try {
        // Setup real-time listeners for all collections
        if (user?.uid) {
          // Filter data by current user ID
          unsubscribeVehicles = VehicleService.onSnapshotByUser(
            user.uid,
            (vehiclesData) => {
              setVehicles(vehiclesData);
              setLoading(false);
            },
            (error) => setError(error.message)
          );

          unsubscribeClients = ClientService.onSnapshotByUser(
            user.uid,
            (clientsData) => {
              setClients(clientsData);
            },
            (error) => setError(error.message)
          );

          unsubscribeCharges = ChargeService.onSnapshotByUser(
            user.uid,
            (chargesData) => {
              setCharges(chargesData);
            },
            (error) => setError(error.message)
          );

          unsubscribeReservations = ReservationService.onSnapshotByUser(
            user.uid,
            (reservationsData) => {
              setReservations(reservationsData);
            },
            (error) => setError(error.message)
          );
        } else {
          // No user, set empty data
          setVehicles([]);
          setClients([]);
          setCharges([]);
          setReservations([]);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error setting up real-time listeners:', error);
        setError('Erreur de connexion à la base de données');
        setLoading(false);
      }
    };

    setupRealtimeListeners();

    // Cleanup function
    return () => {
      unsubscribeVehicles?.();
      unsubscribeClients?.();
      unsubscribeCharges?.();
      unsubscribeReservations?.();
    };
  }, [user?.uid]); // Re-run when user changes

  // Vehicle operations
  const addVehicle = async (vehicle: Omit<Vehicle, 'id'>) => {
    try {
      setError(null);
      // Add userId to the vehicle data
      await VehicleService.create({
        ...vehicle,
        userId: user?.uid || ''
      });
    } catch (error) {
      console.error('Error adding vehicle:', error);
      setError('Erreur lors de l\'ajout du véhicule');
      throw error;
    }
  };

  const updateVehicle = async (id: string, vehicle: Partial<Vehicle>) => {
    try {
      setError(null);
      await VehicleService.update(id, vehicle);
    } catch (error) {
      console.error('Error updating vehicle:', error);
      setError('Erreur lors de la mise à jour du véhicule');
      throw error;
    }
  };

  const deleteVehicle = async (id: string) => {
    try {
      setError(null);
      await VehicleService.delete(id);
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      setError('Erreur lors de la suppression du véhicule');
      throw error;
    }
  };

  // Client operations
  const addClient = async (client: Omit<Client, 'id'>) => {
    try {
      setError(null);
      // Add userId to the client data
      await ClientService.create({
        ...client,
        userId: user?.uid || ''
      });
    } catch (error) {
      console.error('Error adding client:', error);
      setError('Erreur lors de l\'ajout du client');
      throw error;
    }
  };

  const updateClient = async (id: string, client: Partial<Client>) => {
    try {
      setError(null);
      await ClientService.update(id, client);
    } catch (error) {
      console.error('Error updating client:', error);
      setError('Erreur lors de la mise à jour du client');
      throw error;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      setError(null);
      await ClientService.delete(id);
    } catch (error) {
      console.error('Error deleting client:', error);
      setError('Erreur lors de la suppression du client');
      throw error;
    }
  };

  // Charge operations
  const addCharge = async (charge: Omit<Charge, 'id'>) => {
    try {
      setError(null);
      // Add userId to the charge data
      await ChargeService.create({
        ...charge,
        userId: user?.uid || ''
      });
    } catch (error) {
      console.error('Error adding charge:', error);
      setError('Erreur lors de l\'ajout de la charge');
      throw error;
    }
  };

  const updateCharge = async (id: string, charge: Partial<Charge>) => {
    try {
      setError(null);
      await ChargeService.update(id, charge);
    } catch (error) {
      console.error('Error updating charge:', error);
      setError('Erreur lors de la mise à jour de la charge');
      throw error;
    }
  };

  const deleteCharge = async (id: string) => {
    try {
      setError(null);
      await ChargeService.delete(id);
    } catch (error) {
      console.error('Error deleting charge:', error);
      setError('Erreur lors de la suppression de la charge');
      throw error;
    }
  };

  // Reservation operations
  const addReservation = async (reservation: Omit<Reservation, 'id'>) => {
    try {
      setError(null);
      // Add userId to the reservation data
      await ReservationService.create({
        ...reservation,
        userId: user?.uid || ''
      });
    } catch (error) {
      console.error('Error adding reservation:', error);
      setError('Erreur lors de l\'ajout de la réservation');
      throw error;
    }
  };

  const updateReservation = async (id: string, reservation: Partial<Reservation>) => {
    try {
      setError(null);
      await ReservationService.update(id, reservation);
    } catch (error) {
      console.error('Error updating reservation:', error);
      setError('Erreur lors de la mise à jour de la réservation');
      throw error;
    }
  };

  const deleteReservation = async (id: string) => {
    try {
      setError(null);
      await ReservationService.delete(id);
    } catch (error) {
      console.error('Error deleting reservation:', error);
      setError('Erreur lors de la suppression de la réservation');
      throw error;
    }
  };

  return (
    <DataContext.Provider value={{
      vehicles,
      clients,
      charges,
      reservations,
      loading,
      error,
      addVehicle,
      updateVehicle,
      deleteVehicle,
      addClient,
      updateClient,
      deleteClient,
      addCharge,
      updateCharge,
      deleteCharge,
      addReservation,
      updateReservation,
      deleteReservation,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};