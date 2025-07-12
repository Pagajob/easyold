export async function POST(request: Request) {
  try {
    // Parse request body
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
    
    const { reservationId } = body;
    const { clientData, vehicleData, companyData } = body;

    if (!reservationId) {
      return new Response(
        JSON.stringify({ error: 'Missing reservationId' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 1. Fetch reservation data
    let reservationData;
    
    if (clientData && vehicleData && companyData) {
      // Use provided data if available
      reservationData = {
        reservation: { id: reservationId, ...body.reservation },
        client: clientData,
        vehicle: vehicleData,
        company: companyData
      };
    } else {
      // Otherwise use mock data for testing
      reservationData = getMockReservationData(reservationId);
    }
    
    if (!reservationData) {
      return new Response(
        JSON.stringify({ error: 'Reservation not found' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 2. Generate contract URL
    // In a real implementation, this would generate a PDF using a library like PDFKit
    // For now, we'll use a mock URL
    const timestamp = Date.now();
    const contractUrl = `https://easygarage-app.vercel.app/contracts/${reservationId}_${timestamp}.pdf`;
    
    // 3. Send email with contract
    const emailSent = await sendContractEmail(reservationData, contractUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        contractUrl: contractUrl,
        emailSent 
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error generating contract:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate contract',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

function getMockReservationData(reservationId: string) {
  return {
    reservation: { 
      id: reservationId,
      userId: 'mock_user_id',
      statut: 'Confirmé',
      dateDebut: '2024-01-15',
      heureDebut: '10:00',
      dateRetourPrevue: '2024-01-17',
      heureRetourPrevue: '18:00',
      montantLocation: 150,
      typeContrat: 'Location'
    },
    client: {
      id: 'client123',
      userId: 'mock_user_id',
      prenom: 'Jean-Pierre',
      nom: 'Dupont',
      email: 'client@example.com',
      telephone: '06 12 34 56 78'
    },
    vehicle: {
      id: 'vehicle123',
      userId: 'mock_user_id',
      marque: 'Audi',
      modele: 'A3',
      immatriculation: 'AB-123-CD',
      carburant: 'Diesel',
      kilometrageJournalier: 200,
      cautionDepart: 500,
      cautionRSV: 1000
    },
    company: {
      nom: 'EasyGarage',
      siret: '12345678901234',
      adresse: '123 Avenue des Champs-Élysées, 75008 Paris'
    }
  };
}

async function sendContractEmail(data: any, contractUrl: string): Promise<boolean> {
  const { client, vehicle, company } = data;

  try {
    const apiUrl =
      (typeof window !== 'undefined' && window.location && window.location.origin)
        ? `${window.location.origin}/api/send-email`
        : process.env.EXPO_PUBLIC_API_URL
          ? `${process.env.EXPO_PUBLIC_API_URL}/api/send-email`
          : 'https://easygarage-app.vercel.app/api/send-email';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: client.email,
        subject: 'Votre contrat de location - Tajirent',
        userId: client.userId || 'mock_user_id',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563EB;">Contrat de location</h2>
            <p>Bonjour ${client.prenom},</p>
            <p>Veuillez trouver ci-joint votre contrat de location pour le véhicule <strong>${vehicle.marque} ${vehicle.modele}</strong>.</p>
            <p>Vous pouvez télécharger votre contrat en cliquant sur le lien ci-dessous :</p>
            <p><a href="${contractUrl}" style="background-color: #2563EB; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Télécharger le contrat</a></p>
            <p>Merci de votre confiance et à bientôt chez ${company?.nom || 'EasyGarage'}.</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              ${company?.nom || 'EasyGarage'}<br>
              Cet email a été généré automatiquement, merci de ne pas y répondre.
            </p>
          </div>
        `,
        attachments: [
          {
            filename: 'contrat_location.pdf',
            url: contractUrl,
            type: 'application/pdf'
          }
        ]
      })
    });

    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      const result = await response.json();
      return result.success || false;
    } else {
      const errorText = await response.text();
      console.error('Réponse inattendue (non-JSON) du serveur email:', errorText);
      return false;
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}