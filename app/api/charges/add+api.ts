import { db } from '@/config/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

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