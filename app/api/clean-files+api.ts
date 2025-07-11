import { Timestamp } from 'firebase/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Initialiser Firebase Admin si ce n'est pas déjà fait
let app;
if (!getApps().length) {
  try {
    // Récupérer les variables d'environnement pour Firebase Admin
    const serviceAccount = {
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
    };
    
    // Si les variables d'environnement sont définies, initialiser avec le compte de service
    if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
      app = initializeApp({
        credential: cert(serviceAccount as any),
        storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
      });
    } else {
      // Sinon, initialiser avec la configuration par défaut
      app = initializeApp({
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
      });
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
  }
}

// Fonction pour nettoyer les fichiers expirés
export async function GET(request: Request) {
  try {
    // Vérifier si Firebase Admin est initialisé
    if (!app) {
      return new Response(
        JSON.stringify({ error: 'Firebase Admin not initialized' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Obtenir les instances Firestore et Storage
    const db = getFirestore();
    const storage = getStorage();
    const bucket = storage.bucket();
    
    // Obtenir la date actuelle
    const now = new Date();
    
    // Récupérer les fichiers à supprimer
    const fileDeletionsRef = db.collection('fileDeletions');
    const query = fileDeletionsRef
      .where('deleteAfter', '<=', Timestamp.fromDate(now))
      .where('processed', '==', false)
      .limit(100);
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      return new Response(
        JSON.stringify({ message: 'No files to delete' }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Supprimer les fichiers
    const results = [];
    const batch = db.batch();
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const { filePaths, reservationId } = data;
      
      // Supprimer chaque fichier
      for (const filePath of filePaths) {
        try {
          // Extraire le chemin du fichier à partir de l'URL
          const filePathInStorage = filePath.includes('firebase.googleapis.com')
            ? decodeURIComponent(filePath.split('/o/')[1].split('?')[0])
            : filePath;
          
          await bucket.file(filePathInStorage).delete();
          
          results.push({
            reservationId,
            filePath: filePathInStorage,
            status: 'deleted'
          });
        } catch (error) {
          console.error(`Error deleting file ${filePath}:`, error);
          
          results.push({
            reservationId,
            filePath,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      // Marquer le document comme traité
      batch.update(doc.ref, { processed: true, processedAt: Timestamp.now() });
    }
    
    // Exécuter le batch
    await batch.commit();
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${snapshot.size} deletion requests`,
        results
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error cleaning files:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to clean files',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}