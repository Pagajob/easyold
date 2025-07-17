import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  limit as firestoreLimit,
  Timestamp,
  initializeFirestore,
  persistentLocalCache,
  persistentMemoryLocalCache
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, app } from '../config/firebase';
import { Vehicle, Client, Charge, Reservation } from '../contexts/DataContext';

// Collections
const COLLECTIONS = {
  VEHICLES: 'vehicles',
  CLIENTS: 'clients',
  CHARGES: 'charges',
  RESERVATIONS: 'reservations',
  CONTRACTS: 'contracts',
  ENTREPRISES: 'entreprises',
};

// Nouvelle méthode de persistance Firestore (web uniquement)
if (typeof window !== 'undefined') {
  try {
    initializeFirestore(app, {
      localCache: persistentLocalCache()
    });
    console.log('Firestore persistentLocalCache (IndexedDB) activé');
  } catch (err) {
    console.warn('Firestore IndexedDB persistence failed, fallback to memory cache:', err);
    try {
      initializeFirestore(app, {
        localCache: persistentMemoryLocalCache()
      });
      console.log('Firestore persistentMemoryLocalCache (RAM) activé');
    } catch (err2) {
      console.error('Firestore memory cache fallback failed:', err2);
    }
  }
}

// Generic CRUD operations
export class FirebaseService {
  // Create
  static async create<T>(collectionName: string, data: Omit<T, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error(`Error creating document in ${collectionName}:`, error);
      throw new Error(`Erreur lors de la création: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // Read all
  static async getAll<T>(collectionName: string): Promise<T[]> {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, collectionName), orderBy('createdAt', 'desc'))
      );
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];
    } catch (error) {
      console.error(`Error getting documents from ${collectionName}:`, error);
      throw new Error(`Erreur lors de la récupération: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // Read one
  static async getById<T>(collectionName: string, id: string): Promise<T | null> {
    try {
      const docSnap = await getDoc(doc(db, collectionName, id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      }
      return null;
    } catch (error) {
      console.error(`Error getting document ${id} from ${collectionName}:`, error);
      throw new Error(`Erreur lors de la récupération: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // Update
  static async update<T>(collectionName: string, id: string, data: Partial<T>): Promise<void> {
    try {
      // Convert nested objects to plain objects for Firestore
      const sanitizedData = this.sanitizeDataForFirestore(data);
      
      await updateDoc(doc(db, collectionName, id), {
        ...sanitizedData,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error(`Error updating document ${id} in ${collectionName}:`, error);
      throw new Error(`Erreur lors de la mise à jour: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // Sanitize data for Firestore (convert nested objects to plain objects)
  private static sanitizeDataForFirestore(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeDataForFirestore(item));
    }

    if (typeof data === 'object' && data.constructor === Object) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeDataForFirestore(value);
      }
      return sanitized;
    }

    return data;
  }

  // Delete
  static async delete(collectionName: string, id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
      console.error(`Error deleting document ${id} from ${collectionName}:`, error);
      throw new Error(`Erreur lors de la suppression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // Real-time listener
  static onSnapshot<T>(
    collectionName: string, 
    callback: (data: T[]) => void,
    errorCallback?: (error: Error) => void
  ) {
    const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, 
      (querySnapshot) => {
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        callback(data);
      },
      (error) => {
        console.error(`Error in snapshot listener for ${collectionName}:`, error);
        if (errorCallback) {
          errorCallback(new Error(`Erreur de synchronisation: ${error.message}`));
        }
      }
    );
  }
  
  // Real-time listener filtered by userId
  static onSnapshotByUser<T>(
    collectionName: string,
    userId: string,
    callback: (data: T[]) => void,
    errorCallback?: (error: Error) => void
  ) {
    // If no userId, return empty array
    if (!userId) {
      callback([] as T[]);
      return () => {}; // Return empty unsubscribe function
    }
    
    // Create query filtered by userId
    const q = query(
      collection(db, collectionName),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, 
      (querySnapshot) => {
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        callback(data);
      },
      (error) => {
        console.error(`Error in snapshot listener for ${collectionName}:`, error);
        if (errorCallback) {
          errorCallback(new Error(`Erreur de synchronisation: ${error.message}`));
        }
      }
    );
  }

  // Upload file to Firebase Storage
  static async uploadFile(file: Blob | File, path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error(`Erreur lors de l'upload: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // Delete file from Firebase Storage
  static async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error(`Erreur lors de la suppression du fichier: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }
}

// Specific service methods for each collection
export class VehicleService {
  static async create(vehicle: Omit<Vehicle, 'id'>): Promise<string> {
    return FirebaseService.create<Vehicle>(COLLECTIONS.VEHICLES, vehicle);
  }

  static async getAll(): Promise<Vehicle[]> {
    return FirebaseService.getAll<Vehicle>(COLLECTIONS.VEHICLES);
  }

  static async getById(id: string): Promise<Vehicle | null> {
    return FirebaseService.getById<Vehicle>(COLLECTIONS.VEHICLES, id);
  }

  static async update(id: string, vehicle: Partial<Vehicle>): Promise<void> {
    return FirebaseService.update<Vehicle>(COLLECTIONS.VEHICLES, id, vehicle);
  }

  static async delete(id: string): Promise<void> {
    return FirebaseService.delete(COLLECTIONS.VEHICLES, id);
  }

  static onSnapshot(callback: (vehicles: Vehicle[]) => void, errorCallback?: (error: Error) => void) {
    return FirebaseService.onSnapshot<Vehicle>(COLLECTIONS.VEHICLES, callback, errorCallback);
  }

  static onSnapshotByUser(userId: string, callback: (vehicles: Vehicle[]) => void, errorCallback?: (error: Error) => void) {
    return FirebaseService.onSnapshotByUser<Vehicle>(COLLECTIONS.VEHICLES, userId, callback, errorCallback);
  }

  // Upload vehicle photo
  static async uploadPhoto(vehicleId: string, file: Blob | File): Promise<string> {
    const path = `vehicles/${vehicleId}/photo_${Date.now()}`;
    return FirebaseService.uploadFile(file, path);
  }
}

export class ClientService {
  static async create(client: Omit<Client, 'id'>): Promise<string> {
    return FirebaseService.create<Client>(COLLECTIONS.CLIENTS, client);
  }

  static async getAll(): Promise<Client[]> {
    return FirebaseService.getAll<Client>(COLLECTIONS.CLIENTS);
  }

  static async getById(id: string): Promise<Client | null> {
    return FirebaseService.getById<Client>(COLLECTIONS.CLIENTS, id);
  }

  static async update(id: string, client: Partial<Client>): Promise<void> {
    return FirebaseService.update<Client>(COLLECTIONS.CLIENTS, id, client);
  }

  static async delete(id: string): Promise<void> {
    return FirebaseService.delete(COLLECTIONS.CLIENTS, id);
  }

  static onSnapshot(callback: (clients: Client[]) => void, errorCallback?: (error: Error) => void) {
    return FirebaseService.onSnapshot<Client>(COLLECTIONS.CLIENTS, callback, errorCallback);
  }

  static onSnapshotByUser(userId: string, callback: (clients: Client[]) => void, errorCallback?: (error: Error) => void) {
    return FirebaseService.onSnapshotByUser<Client>(COLLECTIONS.CLIENTS, userId, callback, errorCallback);
  }

  // Upload client documents
  static async uploadDocument(clientId: string, file: Blob | File, type: 'permis' | 'carte'): Promise<string> {
    const path = `clients/${clientId}/${type}_${Date.now()}`;
    return FirebaseService.uploadFile(file, path);
  }
}

export class ChargeService {
  static async create(charge: Omit<Charge, 'id'>): Promise<string> {
    return FirebaseService.create<Charge>(COLLECTIONS.CHARGES, charge);
  }

  static async getAll(): Promise<Charge[]> {
    return FirebaseService.getAll<Charge>(COLLECTIONS.CHARGES);
  }

  static async getById(id: string): Promise<Charge | null> {
    return FirebaseService.getById<Charge>(COLLECTIONS.CHARGES, id);
  }

  static async update(id: string, charge: Partial<Charge>): Promise<void> {
    return FirebaseService.update<Charge>(COLLECTIONS.CHARGES, id, charge);
  }

  static async delete(id: string): Promise<void> {
    return FirebaseService.delete(COLLECTIONS.CHARGES, id);
  }

  static onSnapshot(callback: (charges: Charge[]) => void, errorCallback?: (error: Error) => void) {
    return FirebaseService.onSnapshot<Charge>(COLLECTIONS.CHARGES, callback, errorCallback);
  }

  static onSnapshotByUser(userId: string, callback: (charges: Charge[]) => void, errorCallback?: (error: Error) => void) {
    return FirebaseService.onSnapshotByUser<Charge>(COLLECTIONS.CHARGES, userId, callback, errorCallback);
  }
}


export interface Contract {
  id: string;
  reservationId: string;
  clientId: string;
  vehicleId: string;
  contractUrl: string;
  sentToEmail: boolean;
  emailSentAt?: string;
  createdAt: string;
}

export class ContractService {
  static async create(contract: Omit<Contract, 'id'>): Promise<string> {
    return FirebaseService.create<Contract>(COLLECTIONS.CONTRACTS, contract);
  }

  static async getByReservationId(reservationId: string): Promise<Contract | null> {
    try {
      const q = query(
        collection(db, COLLECTIONS.CONTRACTS),
        where('reservationId', '==', reservationId),
        orderBy('createdAt', 'desc'),
        firestoreLimit(1)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Contract;
    } catch (error) {
      console.error('Error getting contract by reservation ID:', error);
      throw new Error(`Erreur lors de la récupération du contrat: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  static async update(id: string, contract: Partial<Contract>): Promise<void> {
    return FirebaseService.update<Contract>(COLLECTIONS.CONTRACTS, id, contract);
  }

  static async delete(id: string): Promise<void> {
    return FirebaseService.delete(COLLECTIONS.CONTRACTS, id);
  }

  static onSnapshot(callback: (contracts: Contract[]) => void, errorCallback?: (error: Error) => void) {
    return FirebaseService.onSnapshot<Contract>(COLLECTIONS.CONTRACTS, callback, errorCallback);
  }

  // Upload contract PDF
  static async uploadContract(reservationId: string, file: Blob | File): Promise<string> {
    const path = `contracts/${reservationId}/contract_${Date.now()}.pdf`;
    return FirebaseService.uploadFile(file, path);
  }
}

export class ReservationService {
  static async create(reservation: Omit<Reservation, 'id'>): Promise<string> {
    return FirebaseService.create<Reservation>(COLLECTIONS.RESERVATIONS, reservation);
  }

  static async getAll(): Promise<Reservation[]> {
    return FirebaseService.getAll<Reservation>(COLLECTIONS.RESERVATIONS);
  }

  static async getById(id: string): Promise<Reservation | null> {
    return FirebaseService.getById<Reservation>(COLLECTIONS.RESERVATIONS, id);
  }

  static async update(id: string, reservation: Partial<Reservation>): Promise<void> {
    return FirebaseService.update<Reservation>(COLLECTIONS.RESERVATIONS, id, reservation);
  }

  static async delete(id: string): Promise<void> {
    return FirebaseService.delete(COLLECTIONS.RESERVATIONS, id);
  }

  static onSnapshot(callback: (reservations: Reservation[]) => void, errorCallback?: (error: Error) => void) {
    return FirebaseService.onSnapshot<Reservation>(COLLECTIONS.RESERVATIONS, callback, errorCallback);
  }

  static onSnapshotByUser(userId: string, callback: (reservations: Reservation[]) => void, errorCallback?: (error: Error) => void) {
    return FirebaseService.onSnapshotByUser<Reservation>(COLLECTIONS.RESERVATIONS, userId, callback, errorCallback);
  }

  // Get reservations by status
  static async getByStatus(status: string): Promise<Reservation[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.RESERVATIONS),
        where('statut', '==', status),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Reservation[];
    } catch (error) {
      console.error('Error getting reservations by status:', error);
      throw new Error(`Erreur lors de la récupération des réservations: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // Get reservations by status and userId
  static async getByStatusAndUser(status: string, userId: string): Promise<Reservation[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.RESERVATIONS),
        where('statut', '==', status),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Reservation[];
    } catch (error) {
      console.error('Error getting reservations by status and user:', error);
      throw new Error(`Erreur lors de la récupération des réservations: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // Upload EDL files
  static async uploadEDLFile(reservationId: string, file: Blob | File, type: 'photo' | 'video', name: string): Promise<string> {
    const path = `reservations/${reservationId}/edl/${type}_${name}_${Date.now()}`;
    return FirebaseService.uploadFile(file, path);
  }
  
  // Planifier la suppression de fichiers
  static async scheduleFileDeletion(reservationId: string, filePaths: string[], deleteAfter: Date): Promise<void> {
    try {
      // Créer un document dans la collection 'fileDeletions'
      await addDoc(collection(db, 'fileDeletions'), {
        reservationId,
        filePaths,
        deleteAfter: Timestamp.fromDate(deleteAfter),
        createdAt: Timestamp.now(),
        processed: false
      });
    } catch (error) {
      console.error('Error scheduling file deletion:', error);
      throw new Error(`Failed to schedule file deletion: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export interface Entreprise {
  id: string;
  userId: string;
  nom: string;
  logo?: string;
  siret?: string;
  adresse: string;
  pays: string;
  paysCode: string;
  createdAt: string;
  updatedAt: string;
}

export class EntrepriseService {
  static async create(entreprise: Omit<Entreprise, 'id'>): Promise<string> {
    return FirebaseService.create<Entreprise>(COLLECTIONS.ENTREPRISES, entreprise);
  }

  static async getByUserId(userId: string): Promise<Entreprise | null> {
    try {
      const docRef = doc(db, COLLECTIONS.ENTREPRISES, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Entreprise;
      }
      return null;
    } catch (error) {
      console.error('Error getting entreprise by userId:', error);
      throw new Error(`Erreur lors de la récupération: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  static async update(id: string, entreprise: Partial<Entreprise>): Promise<void> {
    return FirebaseService.update<Entreprise>(COLLECTIONS.ENTREPRISES, id, entreprise);
  }

  static onSnapshot(callback: (entreprises: Entreprise[]) => void, errorCallback?: (error: Error) => void) {
    return FirebaseService.onSnapshot<Entreprise>(COLLECTIONS.ENTREPRISES, callback, errorCallback);
  }

  static onSnapshotByUser(userId: string, callback: (entreprises: Entreprise[]) => void, errorCallback?: (error: Error) => void) {
    return FirebaseService.onSnapshotByUser<Entreprise>(COLLECTIONS.ENTREPRISES, userId, callback, errorCallback);
  }

  // Upload logo
  static async uploadLogo(userId: string, file: Blob | File): Promise<string> {
    const path = `entreprises/${userId}/logo`;
    return FirebaseService.uploadFile(file, path);
  }
}

// --- Script d'initialisation automatique des plans d'abonnement Firestore ---
import { Abonnement } from '../types/abonnement';

export async function seedAbonnementsPlans() {
  const plans: Omit<Abonnement, 'id'>[] = [
    {
      nom: 'Gratuit',
      prixMensuel: 0,
      description: 'Découverte EasyGarage',
      vehiculesMax: 1,
      reservationsMax: 5,
      utilisateursMax: 1,
      dureeStockageEDL: '24h',
      exportAutorisé: false,
      personnalisationVisuelle: false,
      multiSociete: false,
      support: 'email',
    },
    {
      nom: 'Essentiel',
      prixMensuel: 9.99,
      description: 'Pour les petits loueurs',
      vehiculesMax: 5,
      reservationsMax: 50,
      utilisateursMax: 1,
      dureeStockageEDL: '7 jours',
      exportAutorisé: true,
      personnalisationVisuelle: true,
      multiSociete: false,
      support: 'email',
    },
    {
      nom: 'Pro',
      prixMensuel: 19.99,
      description: 'Pour les pros exigeants',
      vehiculesMax: 30,
      reservationsMax: 'illimité',
      utilisateursMax: 5,
      dureeStockageEDL: '1 mois',
      exportAutorisé: true,
      personnalisationVisuelle: true,
      multiSociete: false,
      support: 'prioritaire',
    },
    {
      nom: 'Premium',
      prixMensuel: 39.99,
      description: 'Pour les groupes et franchises',
      vehiculesMax: 'illimité',
      reservationsMax: 'illimité',
      utilisateursMax: 'illimité',
      dureeStockageEDL: '1 an',
      exportAutorisé: true,
      personnalisationVisuelle: true,
      multiSociete: true,
      support: 'téléphone',
    },
  ];

  for (const plan of plans) {
    // Vérifie si le plan existe déjà (par nom)
    const existing = await FirebaseService.getAll<Abonnement>('Abonnements');
    if (existing.some(p => p.nom === plan.nom)) continue;
    await FirebaseService.create<Abonnement>('Abonnements', plan);
  }
  console.log('Plans d\'abonnement Firestore initialisés.');
}