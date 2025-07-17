import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAuth, connectAuthEmulator, setPersistence, indexedDBLocalPersistence } from 'firebase/auth';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyA5DwMpXgH_wydbIP5BTs0JF58lY5u_p8s",
  authDomain: "tajirent-39852.firebaseapp.com",
  projectId: "tajirent-39852",
  storageBucket: "tajirent-39852.appspot.com",
  messagingSenderId: "587793687612",
  appId: "1:587793687612:ios:49f58e043fc566c0678f39"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Configure la persistance pour le web
if (Platform.OS === 'web') {
  // Activer la persistance IndexedDB pour le web
  setPersistence(auth, indexedDBLocalPersistence)
    .then(() => {
      console.log('Persistance Firebase Auth configurée avec succès');
    })
    .catch((error) => {
      console.error('Erreur lors de la configuration de la persistance Firebase Auth:', error);
    });
}

// Enable offline persistence for Firestore
import { enableNetwork, disableNetwork } from 'firebase/firestore';

// Export network control functions
export { enableNetwork, disableNetwork };

export default app;