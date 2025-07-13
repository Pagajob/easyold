// Types Firestore pour la gestion des abonnements EasyGarage

export type SupportType = 'email' | 'prioritaire' | 'téléphone';
export type DureeStockageEDL = '24h' | '7 jours' | '1 mois' | '1 an';
export type StatutAbonnement = 'actif' | 'expiré';

export interface Abonnement {
  id?: string; // Firestore doc id
  nom: string;
  prixMensuel: number;
  description: string;
  vehiculesMax: number;
  reservationsMax: number | 'illimité';
  utilisateursMax: number | 'illimité';
  dureeStockageEDL: DureeStockageEDL;
  exportAutorisé: boolean;
  personnalisationVisuelle: boolean;
  multiSociete: boolean;
  support: SupportType;
}

export interface AbonnementUtilisateur {
  id?: string; // Firestore doc id
  user: string; // UID Firebase Auth
  abonnement: string; // id de l'abonnement
  dateDebut: Date;
  dateFin: Date;
  statut: StatutAbonnement;
} 