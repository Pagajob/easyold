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
    
    const { to, subject, html, attachments = [] } = body;
    const userId = body.userId;

    // Validate required fields
    if (!to || !subject || !html || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html, userId' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // In a production implementation, you would integrate with an email service like:
    // - SendGrid
    // - Mailgun
    // - AWS SES
    // - Resend

    // Example with SendGrid:
    /*
    // Import the SendGrid package
    import sgMail from '@sendgrid/mail';
    
    // Set API key
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error('SendGrid API key not found');
    }
    sgMail.setApiKey(apiKey);

    const msg = {
      to,
      from: process.env.FROM_EMAIL,
      subject,
      html,
      attachments: attachments?.map(att => ({
        filename: att.filename,
        content: att.content,
        type: att.type || 'application/pdf',
        disposition: 'attachment'
      }))
    };

    await sgMail.send(msg);
    */

    // For development, log the email details
    console.log('Email would be sent:', {
      to,
      subject,
      userId,
      html: html.substring(0, 100) + '...',
      attachments: attachments?.length || 0
    });

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email envoyé avec succès',
        messageId: `sim_${Date.now()}`
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error sending email:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}