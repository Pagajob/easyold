import { createContext } from 'react';
import { UserProfile } from '@/contexts/AuthContext';
import { AbonnementUtilisateur, Abonnement } from '@/types/abonnement';

export interface AuthContextType {
  updateUserEmail: (currentPassword: string, newEmail: string) => Promise<void>;
  updateUserProfile?: (data: Partial<UserProfile>) => Promise<void>;
  enableBiometricAuth: () => Promise<boolean>;
  disableBiometricAuth: () => Promise<boolean>;
  canUseBiometric: boolean;
  biometricTypeName: string;
  abonnementUtilisateur: AbonnementUtilisateur | null;
  abonnements: Abonnement[];
  getAbonnementCourant: () => Abonnement | undefined;
  refreshAbonnement: () => Promise<void>;
  acheterAbonnement: (productId: string) => Promise<void>;
  restaurerAbonnement: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);