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

export interface UserProfile {
  uid: string;
  email: string;
  name?: string;
  createdAt: string;
  isEmailVerified: boolean;
  role?: string;
  companyId?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  authInitialized: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithApple: () => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateUserEmail: (currentPassword: string, newEmail: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false); 
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from persistent storage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Vérifier si nous avons une session stockée
        const storedUser = await AsyncStorage.getItem('auth_user');
        
        if (storedUser) {
          // Si nous avons un utilisateur stocké, initialiser l'état d'authentification
          const parsedUser = JSON.parse(storedUser);
          
          // Nous ne définissons pas directement l'état de l'utilisateur à partir du stockage
          // Firebase Auth's onAuthStateChanged s'en chargera
          // Cela garantit que nous avons un token valide et non expiré
          
          console.log('Session d\'authentification trouvée, attente de l\'initialisation de Firebase Auth');
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'authentification depuis le stockage:', error);
      } finally {
        setAuthInitialized(true);
      }
    };
    
    initializeAuth();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? `User ${user.uid}` : 'No user');
      setUser(user);
      
      if (user) {
        // Stocker l'état d'authentification de l'utilisateur dans AsyncStorage pour la persistance
        try {
          // Nous ne stockons que les informations minimales nécessaires pour restaurer la session
          const userToStore = {
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified,
          };
          await AsyncStorage.setItem('auth_user', JSON.stringify(userToStore));
        } catch (error) {
          console.error('Erreur lors du stockage de l\'état d\'authentification:', error);
        }
        
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
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      } else {
        setUserProfile(null);
        // Effacer l'état d'authentification stocké lorsque l'utilisateur est null
        try {
          await AsyncStorage.removeItem('auth_user');
        } catch (error) {
          console.error('Error removing auth state:', error);
        }
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [authInitialized]);

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

  const signIn = async (email: string, password: string): Promise<UserCredential> => {
    try {
      // Configurer la persistance avant la connexion
      await configurePersistence();
      
      // Tenter de se connecter
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Stocker l'email pour la fonctionnalité "Se souvenir de moi"
      try {
        if (userCredential.user) {
          await AsyncStorage.setItem('auth_last_email', email);
        }
      } catch (error) {
        console.error('Erreur lors du stockage de l\'email:', error);
      }
      
      return userCredential;
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code));
    }
  };

  const signInWithApple = async () => {
    try {
      // Vérifier si l'authentification Apple est disponible sur cet appareil
      if (Platform.OS === 'web') {
        throw new Error('Sign in with Apple is not available on web');
      }

      // Request Apple authentication
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME, 
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // If we got a credential, sign in to Firebase with it
      if (credential) {
        // Create a Firebase credential from the Apple credential
        const { OAuthProvider } = await import('firebase/auth'); 
        const provider = new OAuthProvider('apple.com');
        
        // Create a credential for Firebase using the token from Apple
        const authCredential = provider.credential({
          idToken: credential.identityToken || '',
          rawNonce: credential.nonce,
        });
        
        // Sign in to Firebase with the credential
        const userCredential = await signInWithCredential(auth, authCredential);
        const firebaseUser = userCredential.user;

        // Check if this is a new user
        const isNewUser = userCredential.additionalUserInfo?.isNewUser;

        // Si c'est un nouvel utilisateur, créer un profil
        if (isNewUser) {
          // Create a user profile in Firestore
          const profile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: credential.fullName?.givenName || '',
            createdAt: new Date().toISOString(),
            isEmailVerified: true,
            role: 'user',
          };

          await setDoc(doc(db, 'users', firebaseUser.uid), profile);
        }

        // Configurer la persistance
        await configurePersistence();
        
        return userCredential;
      }
    } catch (error: any) {
      // Handle Apple authentication errors
      if (error.code === 'ERR_CANCELED' || error.code === 'ERR_REQUEST_CANCELED' || error.message === 'Sign in was canceled') {
        // User canceled the sign-in flow
        throw new Error('Sign in was canceled');
      }
      
      console.error('Apple authentication error:', error);
      throw new Error(error.message || 'Failed to authenticate with Apple');
    }
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
      await AsyncStorage.removeItem('auth_user');
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

  return (
    <AuthContext.Provider value={{
      authInitialized,
      user, 
      userProfile,
      loading,
      signIn,
      signInWithApple,
      signUp,
      logout,
      resetPassword,
      resendVerificationEmail, 
      refreshUser, 
      updateUserPassword,
      updateUserEmail,
      updateUserProfile
    }}>
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