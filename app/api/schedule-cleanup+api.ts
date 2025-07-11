export async function POST(request: Request) {
  try {
    // Appeler l'API de nettoyage des fichiers
    const cleanupUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/api/clean-files`
      : process.env.EXPO_PUBLIC_API_URL
        ? `${process.env.EXPO_PUBLIC_API_URL}/api/clean-files`
        : 'https://easygarage-app.vercel.app/api/clean-files';
    
    const response = await fetch(cleanupUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const result = await response.json();
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Cleanup scheduled',
        result
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error scheduling cleanup:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to schedule cleanup',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}