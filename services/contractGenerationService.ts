import { Reservation, Client, Vehicle } from '@/contexts/DataContext';
import { CompanyInfo } from '@/contexts/SettingsContext';
import { storage } from '@/config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Platform } from 'react-native';

export interface ContractData {
  reservation: Reservation;
  client: Client;
  vehicle: Vehicle;
  companyInfo: CompanyInfo;
}

export class ContractGenerationService {
  /**
   * Generate a rental contract PDF
   */
  static async generateContractPDF(contractData: ContractData): Promise<string> {
    try {
      const { reservation, client, vehicle, companyInfo } = contractData;

      // Call the API route to generate the contract
      const response = await fetch('/api/contracts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationId: reservation.id,
          clientData: client,
          vehicleData: vehicle,
          companyData: companyInfo
        })
      });

      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate contract');
        } else {
          const errorText = await response.text();
          throw new Error('Réponse inattendue du serveur: ' + errorText);
        }
      }

      if (contentType && contentType.includes('application/json')) {
        const result = await response.json();
        return result.contractUrl;
      } else {
        const errorText = await response.text();
        throw new Error('Réponse inattendue du serveur: ' + errorText);
      }
    } catch (error) {
      console.error('Error generating contract PDF:', error);
      throw new Error(`Failed to generate contract: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send contract email to client
   */
  static async sendContractEmail(
    contractURL: string,
    clientEmail: string,
    clientName: string,
    vehicleInfo: string,
    companyName: string
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: clientEmail,
          subject: `Votre contrat de location - ${companyName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563EB;">Contrat de location</h2>
              <p>Bonjour ${clientName},</p>
              <p>Veuillez trouver ci-joint votre contrat de location pour le véhicule <strong>${vehicleInfo}</strong>.</p>
              <p>Vous pouvez télécharger votre contrat en cliquant sur le lien ci-dessous :</p>
              <p><a href="${contractURL}" style="background-color: #2563EB; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Télécharger le contrat</a></p>
              <p>Merci de votre confiance.</p>
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 12px;">
                ${companyName}<br>
                Cet email a été généré automatiquement, merci de ne pas y répondre.
              </p>
            </div>
          `,
          attachments: [
            {
              filename: 'contrat_location.pdf',
              url: contractURL,
              type: 'application/pdf'
            }
          ]
        })
      });

      const contentTypeEmail = response.headers.get('content-type');
      if (contentTypeEmail && contentTypeEmail.includes('application/json')) {
        const result = await response.json();
        return result.success || false;
      } else {
        const errorText = await response.text();
        console.error('Réponse inattendue (non-JSON) du serveur email:', errorText);
        return false;
      }
    } catch (error) {
      console.error('Error sending contract email:', error);
      return false;
    }
  }

  /**
   * Generate a simple PDF from HTML content (client-side fallback)
   */
  static async generateSimplePDF(htmlContent: string): Promise<Blob> {
    // Create a simple PDF structure
    const textContent = htmlContent
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();

    const pdfContent = this.createBasicPDF(textContent);
    return new Blob([pdfContent], { type: 'application/pdf' });
  }

  /**
   * Create a basic PDF structure
   */
  private static createBasicPDF(content: string): string {
    const lines = content.split('\n').slice(0, 40); // Limit content
    const pdfLines = lines.map(line => `(${line.substring(0, 70)}) Tj 0 -15 Td`).join('\n');

    return `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
>>
endobj

4 0 obj
<<
/Length ${content.length + 300}
>>
stream
BT
/F1 12 Tf
50 750 Td
(CONTRAT DE LOCATION) Tj
0 -30 Td
${pdfLines}
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000173 00000 n 
0000000301 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
${1200 + content.length}
%%EOF`;
  }
}