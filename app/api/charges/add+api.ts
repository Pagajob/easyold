export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    const { nom, montantMensuel, type, dateDebut, frequence, vehiculeId, estPaiementProprietaire } = body;
    const userId = body.userId;

    // Validate required fields
    if (!nom || montantMensuel === undefined || !type || !frequence || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields (nom, montantMensuel, type, frequence, userId)' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Import Firestore functions using ESM syntax
    // Use ESM import syntax
    const firestoreModule = await import('firebase/firestore');
    const { getFirestore, collection, addDoc, Timestamp } = firestoreModule;
    
    const appModule = await import('firebase/app');
    const { initializeApp, getApps } = appModule;
    
    // Initialize Firebase if not already done
    let app;
    if (getApps().length === 0) {
      app = initializeApp({
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
      });
    } else {
      app = getApps()[0];
    }

    const db = getFirestore(app);
    
    // Create the charge
    const chargeData = {
      nom,
      userId,
      montantMensuel: Number(montantMensuel),
      type,
      dateDebut: dateDebut || new Date().toISOString().split('T')[0],
      frequence,
      vehiculeId: vehiculeId || null,
      estPaiementProprietaire: estPaiementProprietaire || false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    const docRef = await addDoc(collection(db, 'charges'), chargeData);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        id: docRef.id,
        message: 'Charge added successfully'
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error adding charge:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to add charge',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}