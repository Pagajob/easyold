import { InvitationService } from '@/services/invitationService';

export async function POST(request: Request) {
  try {
    // Parse request body
    let body: any;
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
    
    const { email, token, companyName, inviterId, companyId } = body;

    // Validate required fields
    if (!email || !token || !companyName || !inviterId || !companyId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, token, companyName, inviterId, companyId' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the base URL for the app
    const baseUrl = request.headers.get('origin') || 'https://easygarage-app.vercel.app';
    const inviteUrl = `${baseUrl}/register?token=${token}`;

    // In a production implementation, you would integrate with an email service
    // For now, we'll simulate sending an email
    console.log('Invitation email would be sent:', {
      to: email,
      subject: `Invitation à rejoindre ${companyName} sur EasyGarage`,
      inviteUrl,
      companyName
    });

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation sent successfully'
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error sending invitation:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send invitation',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}