import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { 
  User,
  UserCredential,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  onAuthStateChanged,
  reload,
  EmailAuthProvider,
  reauthenticateWithCredential, 
  updatePassword,
  updateEmail, 
  signInWithCredential,
  setPersistence,
  browserLocalPersistence,
  inMemoryPersistence
} from 'firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { collection, query, where, getDocs, updateDoc, Timestamp, getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { AbonnementUtilisateur, Abonnement } from '@/types/abonnement';
import * as IAP from '@/services/iapService';

export interface UserProfile {
  uid: string;
  email: string;
  name?: string;
  prenom?: string;
  nom?: string;
  telephone?: string;
  profilePicture?: string;
  createdAt: string;
  isEmailVerified: boolean;
  role?: string;
  companyId?: string;
  plan?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  authInitialized: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithBiometric: () => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateUserEmail: (currentPassword: string, newEmail: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  enableBiometricAuth: () => Promise<boolean>;
  disableBiometricAuth: () => Promise<boolean>;
  canUseBiometric: boolean;
  biometricTypeName: string;
  abonnementUtilisateur: AbonnementUtilisateur | null;
  abonnements: Abonnement[];
  getAbonnementCourant: () => Abonnement | undefined;
  refreshAbonnement: () => Promise<void>;
  acheterAbonnement: (productId: string) => Promise<void>;
  restaurerAbonnement: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false); 
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [abonnementUtilisateur, setAbonnementUtilisateur] = useState<AbonnementUtilisateur | null>(null);
  const [abonnements, setAbonnements] = useState<Abonnement[]>([]);

  // Charger tous les abonnements Firestore au démarrage
  useEffect(() => {
    const fetchAbonnements = async () => {
      try {
        const abonnementsRef = collection(db, 'abonnements');
        const snapshot = await getDocs(abonnementsRef);
        const abonnementsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Abonnement[];
        setAbonnements(abonnementsList);
      } catch (error) {
        console.error('Erreur lors du chargement des abonnements:', error);
      }
    };
    fetchAbonnements();
  }, []);

  // Helper pour obtenir l’objet Abonnement courant
  const getAbonnementCourant = () => {
    if (!abonnementUtilisateur || !abonnements.length) return undefined;
    return abonnements.find(a => a.id === abonnementUtilisateur.abonnement);
  };

  // Hook pour l'authentification biométrique
  const biometricAuth = useBiometricAuth();

  // Initialize auth state from persistent storage
  useEffect(() => {
    setAuthInitialized(true);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? `User ${user.uid}` : 'No user');
      setUser(user);
      
      if (user) {
        // Charger le profil utilisateur depuis Firestore ou le créer s'il n'existe pas
        await refreshUser();
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
          } else {
            // Créer le profil s'il n'existe pas
            const profile: UserProfile = {
              uid: user.uid,
              email: user.email!,
              createdAt: new Date().toISOString(),
              isEmailVerified: user.emailVerified,
              role: 'user',
            };
            await setDoc(doc(db, 'users', user.uid), profile);
            setUserProfile(profile);
          }
        } catch (error: any) {
          if (error && error.message && error.message.includes('client is offline')) {
            // Mode hors-ligne : conserver le dernier profil connu
            console.warn('Firestore hors-ligne : données utilisateur non rafraîchies, utilisation du cache local.');
            // Optionnel : afficher une notification ou un toast ici
          } else {
            console.error('Error loading user profile:', error);
            setUserProfile(null);
          }
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [authInitialized]);

  // Après avoir chargé le userProfile dans AuthContext
  useEffect(() => {
    if (user && userProfile && (!userProfile.prenom || !userProfile.nom || !userProfile.telephone)) {
      // Rediriger vers l'onboarding profil utilisateur
      router.replace('/profile');
    }
  }, [user, userProfile]);

  // Configurer la persistance de l'authentification
  const configurePersistence = async () => {
    if (Platform.OS === 'web') {
      try {
        // Pour le web, nous utilisons la persistance locale
        await setPersistence(auth, browserLocalPersistence);
      } catch (error) {
        console.error('Erreur lors de la configuration de la persistance:', error);
      }
    }
    // Sur mobile, la persistance est activée par défaut
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      // Configurer la persistance avant la connexion
      await configurePersistence();
      
      // Tenter de se connecter
      await signInWithEmailAndPassword(auth, email, password);

      // Stocker l'email pour la fonctionnalité "Se souvenir de moi"
      try {
        if (user) {
          await AsyncStorage.setItem('auth_last_email', email);
        }
      } catch (error) {
        console.error('Erreur lors du stockage de l\'email:', error);
      }
      
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code));
    }
  };

  const signInWithApple = async (): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        throw new Error('Sign in with Apple is not available on web');
      }
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME, 
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (credential) {
        // const { OAuthProvider } = await import('firebase/auth'); // Import dynamique non supporté en mode strict
        // const provider = new OAuthProvider('apple.com');
        // const authCredential = provider.credential({
        //   idToken: credential.idToken,
        // });
        // await signInWithCredential(auth, authCredential);
        // Le profil utilisateur sera complété via l'onboarding
      }
      await configurePersistence();
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code));
    }
  };

  const signInWithBiometric = async (): Promise<void> => {
    try {
      if (!biometricAuth.canUseBiometric()) {
        throw new Error('Authentification biométrique non disponible');
      }

      const userId = await biometricAuth.authenticateWithBiometric();
      if (!userId) {
        throw new Error('Authentification biométrique échouée');
      }

      // Récupérer les informations utilisateur depuis Firestore
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('Utilisateur non trouvé');
      }

      // Créer un token d'authentification personnalisé pour Firebase
      // Note: Cette approche nécessite une configuration côté serveur
      // Pour l'instant, on redirige vers la connexion normale
      throw new Error('Authentification biométrique en cours de développement');
    } catch (error: any) {
      throw new Error(error.message || 'Erreur lors de l\'authentification biométrique');
    }
  };

  const enableBiometricAuth = async (): Promise<boolean> => {
    if (!user?.uid) {
      throw new Error('Utilisateur non connecté');
    }
    return await biometricAuth.enableBiometric(user.uid);
  };

  const disableBiometricAuth = async (): Promise<boolean> => {
    return await biometricAuth.disableBiometric();
  };

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Envoyer l'email de vérification
      await sendEmailVerification(user);

      // Check if this user was invited to a company
      let companyId = undefined;
      
      if (name) { 
        // This might be a company name from an invitation
        try {
          const invitationsRef = collection(db, 'invitations');
          const q = query(
            invitationsRef,
            where('email', '==', user.email),
            where('status', '==', 'pending')
          ); 
          
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const invitationDoc = querySnapshot.docs[0];
            const invitationData = invitationDoc.data();
            
            // Vérifier si l'invitation est toujours valide
            const expiresAt = invitationData.expiresAt?.toDate ? 
              invitationData.expiresAt.toDate() : 
              new Date(invitationData.expiresAt);
            
            if (expiresAt >= new Date()) {
              companyId = invitationData.companyId;
              
              // Mettre à jour le statut de l'invitation
              await updateDoc(doc(db, 'invitations', invitationDoc.id), {
                status: 'accepted',
                acceptedAt: Timestamp.now()
              });
            }
          }
        } catch (error) {
          console.error('Error checking invitations:', error);
        }
      }
      
      // Créer le profil utilisateur dans Firestore avec une image de profil par défaut
      const profile: UserProfile = {
        role: 'user',
        uid: user.uid,
        email: user.email!,
        name,
        createdAt: new Date().toISOString(),
        isEmailVerified: false,
        companyId,
        profilePicture: 'easygarage-icon.png'
      };
      
      await setDoc(doc(db, 'users', user.uid), profile);
      setUserProfile(profile);
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code));
    }
  };

  const logout = async () => {
    try {
      await signOut(auth); 
      // Clear stored auth state
      setUser(null);
      setUserProfile(null);
    } catch (error: any) {
      throw new Error('Erreur lors de la déconnexion');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code));
    }
  };

  const resendVerificationEmail = async () => {
    if (!user) throw new Error('Aucun utilisateur connecté'); 
    
    try {
      await sendEmailVerification(user);
    } catch (error: any) {
      throw new Error('Erreur lors de l\'envoi de l\'email de vérification');
    }
  };

  const refreshUser = async () => {
    if (!user) return;
     
    try {
      // Force token refresh if needed
      try {
        await user.getIdToken(true);
      } catch (error) {
        console.error('Error refreshing token:', error);
      }
       
      // Reload user data
      await reload(user);
      
      // Mettre à jour le profil utilisateur
      if (user.emailVerified && userProfile && !userProfile.isEmailVerified) {
        const updatedProfile = { ...userProfile, isEmailVerified: true };
        await setDoc(doc(db, 'users', user.uid), updatedProfile);
        setUserProfile(updatedProfile);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const updateUserPassword = async (currentPassword: string, newPassword: string) => {
    if (!user || !user.email) {
      throw new Error('Utilisateur non connecté');
    }
    
    try {
      // Réauthentifier l'utilisateur avant de changer le mot de passe
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Mettre à jour le mot de passe
      await updatePassword(user, newPassword);
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code));
    }
  };

  const updateUserEmail = async (currentPassword: string, newEmail: string) => {
    if (!user || !user.email) {
      throw new Error('Utilisateur non connecté');
    }
    
    try {
      // Réauthentifier l'utilisateur avant de changer l'email
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Mettre à jour l'email
      await updateEmail(user, newEmail);
      
      // Mettre à jour le profil utilisateur dans Firestore
      if (userProfile) {
        const updatedProfile = { ...userProfile, email: newEmail };
        await setDoc(doc(db, 'users', user.uid), updatedProfile);
        setUserProfile(updatedProfile);
      }
      
      // Envoyer un email de vérification pour le nouvel email
      await sendEmailVerification(user);
    } catch (error: any) { 
      throw new Error(getAuthErrorMessage(error.code));
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user || !userProfile) {
      throw new Error('Utilisateur non connecté');
    }
    
    try {
      const updatedProfile = { ...userProfile, ...data };
      await setDoc(doc(db, 'users', user.uid), updatedProfile);
      setUserProfile(updatedProfile);
    } catch (error: any) {
      throw new Error('Erreur lors de la mise à jour du profil');
    }
  };
  
  // Fonction utilitaire pour vérifier si l'email d'un utilisateur est vérifié
  const isEmailVerified = () => {
    return user?.emailVerified || false;
  };

  // Vérifier les restrictions d'abonnement
  const checkSubscriptionLimits = (vehicleCount: number, reservationCount: number) => {
    // Si l'utilisateur n'a pas de plan, limiter à 1 véhicule et 3 réservations
    if (!userProfile?.plan) {
      return {
        vehiclesAllowed: vehicleCount < 1,
        reservationsAllowed: reservationCount < 3
      };
    }
    
    // Vérifier les limites selon le plan
    switch(userProfile.plan) {
      case 'essentiel':
        return {
          vehiclesAllowed: vehicleCount < 5,
          reservationsAllowed: reservationCount < 50
        };
      case 'pro':
        return {
          vehiclesAllowed: vehicleCount < 30,
          reservationsAllowed: true // illimité
        };
      case 'premium':
        return {
          vehiclesAllowed: true, // illimité
          reservationsAllowed: true // illimité
        };
      default:
        return {
          vehiclesAllowed: vehicleCount < 1,
          reservationsAllowed: reservationCount < 3
        };
    }
  };

  // Récupérer l'abonnement utilisateur depuis Firestore
  const refreshAbonnement = async () => {
    if (!user) return;
    const q = query(collection(db, 'AbonnementUtilisateur'), where('user', '==', user.uid), where('statut', '==', 'actif'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      setAbonnementUtilisateur(snap.docs[0].data() as AbonnementUtilisateur);
    } else {
      setAbonnementUtilisateur(null);
    }
  };

  // Acheter un abonnement via l'App Store
  const acheterAbonnement = async (productId: string) => {
    const purchase = await IAP.buySubscription(productId);
    // Récupérer le reçu de la transaction
    const receipt = (purchase as any)?.transactionReceipt;
    if (receipt && user) {
      await IAP.validateAppleReceipt(receipt, user.uid);
    }
    await refreshAbonnement();
  };

  // Restaurer les achats
  const restaurerAbonnement = async () => {
    const purchases = await IAP.restorePurchases();
    // Prendre le reçu du dernier achat restauré
    const receipt = (purchases?.[0] as any)?.transactionReceipt;
    if (receipt && user) {
      await IAP.validateAppleReceipt(receipt, user.uid);
    }
    await refreshAbonnement();
  };

  // Rafraîchir l'abonnement à chaque connexion
  useEffect(() => {
    if (user) refreshAbonnement();
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        authInitialized,
        user, 
        userProfile,
        loading,
        signIn,
        signInWithApple,
        signInWithBiometric,
        signUp,
        logout,
        resetPassword,
        resendVerificationEmail, 
        refreshUser, 
        updateUserPassword,
        updateUserEmail,
        updateUserProfile,
        enableBiometricAuth,
        disableBiometricAuth,
        canUseBiometric: biometricAuth.canUseBiometric(),
        biometricTypeName: biometricAuth.getBiometricTypeName(),
        abonnementUtilisateur,
        abonnements,
        getAbonnementCourant,
        refreshAbonnement,
        acheterAbonnement,
        restaurerAbonnement,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

function getAuthErrorMessage(errorCode: string): string { 
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'Aucun compte n\'a été trouvé avec cette adresse email';
    case 'auth/wrong-password':
      return 'Mot de passe incorrect';
    case 'auth/email-already-in-use':
      return 'Cette adresse email est déjà utilisée';
    case 'auth/weak-password':
      return 'Le mot de passe doit contenir au moins 6 caractères';
    case 'auth/invalid-email':
      return 'Adresse email invalide';
    case 'auth/user-disabled':
      return 'Ce compte a été désactivé';
    case 'auth/too-many-requests':
      return 'Trop de tentatives. Veuillez réessayer plus tard';
    case 'auth/network-request-failed':
      return 'Erreur de connexion. Vérifiez votre connexion internet';
    case 'auth/requires-recent-login':
      return 'Cette opération est sensible et nécessite une authentification récente. Veuillez vous reconnecter';
    case 'auth/invalid-credential':
      return 'Identifiants invalides. Veuillez vérifier votre mot de passe';
    default:
      return 'Une erreur est survenue. Veuillez réessayer';
  }
}