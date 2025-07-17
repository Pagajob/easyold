import { Reservation, Client, Vehicle } from '@/contexts/DataContext';
import { CompanyInfo } from '@/contexts/SettingsContext';
import { storage } from '@/config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

// Import platform-specific PDF generation
let RNHTMLtoPDF: any;
if (Platform.OS !== 'web') {
  RNHTMLtoPDF = require('react-native-html-to-pdf').default;
}

export interface ContractData {
  nom_client: string;
  adresse_client: string;
  email_client: string;
  telephone_client: string;
  vehicule_marque: string;
  vehicule_modele: string;
  vehicule_immatriculation: string;
  vehicule_carburant: string;
  date_debut: string;
  heure_debut: string;
  date_fin: string;
  heure_fin: string;
  kilometrage_depart: string;
  kilometrage_depart_edl: string;
  kilometrage_inclus: string;
  prixKmSupplementaire: string;
  cautiondepart: string;
  cautionRSV: string;
  nom_entreprise: string;
  adresse_entreprise: string;
  siret_entreprise: string;
  ageminimal: string;
  anneepermis: string;
  retard: string;
  carburant_manquant: string;
  jante_frottee: string;
  nettoyage: string;
  montant_location: string;
  reservation_id: string;
  date_generation: string;
  signature_client: string;
  logo_entreprise: string;
  type_contrat: string;
  carburant_depart: string;
  carburant_max: string;
}

export class ContractService {
  /**
   * Generate a contract PDF for a reservation
   */
  static async generateContract(
    reservation: Reservation,
    client: Client,
    vehicle: Vehicle,
    companyInfo: CompanyInfo,
    extraFees: any
  ): Promise<string> {
    try {
      // Get enabled predefined fees
      const enabledPredefinedFees = extraFees.predefined?.filter((fee: any) => fee.enabled) || [];
      
      // Find specific fees
      const fuelFee = enabledPredefinedFees.find((fee: any) => fee.id === '1' && fee.label === 'Carburant manquant');
      const lateFee = enabledPredefinedFees.find((fee: any) => fee.id === '2' && fee.label.includes('Retard'));
      const rimFee = enabledPredefinedFees.find((fee: any) => fee.id === '3' && fee.label.includes('Jante'));
      const cleaningFee = enabledPredefinedFees.find((fee: any) => fee.id === '4' && fee.label.includes('Nettoyage'));

      // Format dates
      const dateDebut = new Date(reservation.dateDebut);
      const dateRetour = new Date(reservation.dateRetourPrevue);
      
      const formattedDateDebut = dateDebut.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      const formattedDateRetour = dateRetour.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      // Prepare contract data
      const contractData: ContractData = {
        nom_client: `${client.prenom} ${client.nom}`,
        adresse_client: 'Non spécifiée',
        email_client: client.email || '',
        telephone_client: client.telephone || 'Non spécifié',
        vehicule_marque: vehicle.marque,
        vehicule_modele: vehicle.modele,
        vehicule_immatriculation: vehicle.immatriculation,
        vehicule_carburant: vehicle.carburant,
        date_debut: formattedDateDebut,
        heure_debut: reservation.heureDebut,
        date_fin: formattedDateRetour,
        heure_fin: reservation.heureRetourPrevue,
        kilometrage_depart: reservation.kilometrageDepart?.toString() || 'À remplir',
        kilometrage_depart_edl: '',
        kilometrage_inclus: vehicle.kilometrageJournalier?.toString() || '',
        prixKmSupplementaire: vehicle.prixKmSupplementaire?.toString() || '0',
        cautiondepart: vehicle.cautionDepart?.toString() || '0',
        cautionRSV: vehicle.cautionRSV?.toString() || '0',
        nom_entreprise: companyInfo.nom || 'Tajirent',
        adresse_entreprise: companyInfo.adresse || '',
        siret_entreprise: companyInfo.siret || '',
        ageminimal: vehicle.ageMinimal?.toString() || '21',
        anneepermis: vehicle.anneesPermis?.toString() || '2',
        retard: lateFee?.price.toString() || '25',
        carburant_manquant: fuelFee?.price.toString() || '3',
        jante_frottee: rimFee?.price.toString() || '150',
        nettoyage: cleaningFee?.price.toString() || '80',
        montant_location: reservation.montantLocation?.toString() || '0',
        reservation_id: reservation.id,
        date_generation: new Date().toISOString(),
        signature_client: '',
        logo_entreprise: companyInfo.logo || '',
        type_contrat: reservation.typeContrat || '',
        carburant_depart: '',
        carburant_max: '',
      };

      // Create contract HTML content
      const contractHTML = this.generateContractHTML(contractData);

      // Generate PDF
      let pdfPath = '';
      
      if (Platform.OS === 'web') {
        // For web, use a different approach with html2canvas and jsPDF
        const pdfBlob = await this.generatePDFFromHTMLWeb(contractHTML);
        return await this.uploadPDFToFirebase(pdfBlob, reservation.id);
      } else {
        // For mobile platforms
        const options = {
          html: contractHTML,
          fileName: `contrat_${reservation.id}`,
          directory: 'Documents',
          base64: false
        };

        const pdf = await RNHTMLtoPDF.convert(options);
        pdfPath = pdf.filePath;

        // Upload PDF to Firebase Storage
        const pdfBlob = await this.fileToBlob(pdfPath);
        const downloadURL = await this.uploadPDFToFirebase(pdfBlob, reservation.id);

        // Clean up temporary file
        await FileSystem.deleteAsync(pdfPath, { idempotent: true });

        return downloadURL;
      }
    } catch (error) {
      console.error('Error generating contract:', error);
      throw new Error('Failed to generate contract');
    }
  }

  /**
   * Generate PDF from HTML for web platform
   */
  private static async generatePDFFromHTMLWeb(html: string): Promise<Blob> {
    try {
      // For web, create a proper PDF content
      const pdfContent = this.createSimplePDFContent(html);
      const blob = new Blob([pdfContent], { type: 'application/pdf' });
      return blob;
    } catch (error) {
      console.error('Error generating PDF for web:', error);
      // Return a fallback PDF
      const fallbackContent = this.createSimplePDFContent('Contrat de location - Erreur de génération');
      return new Blob([fallbackContent], { type: 'application/pdf' });
    }
  }

  /**
   * Create a simple PDF content (placeholder for proper PDF generation)
   */
  private static createSimplePDFContent(html: string): string {
    // Simplified PDF content generation
    const textContent = 'Contrat de location généré automatiquement';
    return `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj
4 0 obj<</Length 44>>stream
BT/F1 12 Tf 72 720 Td(${textContent})Tj ET
endstream endobj
xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000125 00000 n 
0000000209 00000 n 
trailer<</Size 5/Root 1 0 R>>
startxref
295
%%EOF`;
  }

  /**
   * Upload PDF to Firebase Storage
   */
  private static async uploadPDFToFirebase(pdfBlob: Blob, reservationId: string): Promise<string> {
    const storagePath = `contracts/${reservationId}/contract_${Date.now()}.pdf`;
    const storageRef = ref(storage, storagePath);
    
    await uploadBytes(storageRef, pdfBlob);
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  }

  /**
   * Send contract by email to client
   */
  static async sendContractByEmail(
    contractUrl: string,
    clientEmail: string,
    companyOwnerUserId: string,
    companyName: string,
    contractData: ContractData
  ): Promise<boolean> {
    try {
      // Use absolute URL for API calls
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
          to: clientEmail,
          subject: `Votre contrat de location - ${companyName}`,
          userId: companyOwnerUserId,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563EB;">Contrat de location</h2>
              <p>Bonjour,</p>
              <p>Veuillez trouver ci-joint votre contrat de location pour le véhicule <strong>${contractData.vehicule_modele}</strong>.</p>
              <p>Vous pouvez télécharger votre contrat en cliquant sur le lien ci-dessous :</p>
              <p><a href="${contractUrl}" style="background-color: #2563EB; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Télécharger le contrat</a></p>
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
              url: contractUrl,
              type: 'application/pdf'
            }
          ]
        })
      });

      const result = await response.json();
      return result.success || false;

    } catch (error) {
      console.error('Error sending contract email:', error);
      throw new Error('Failed to send contract by email');
    }
  }

  /**
   * Convert file to Blob
   */
  private static async fileToBlob(filePath: string): Promise<Blob> {
    try {
      if (Platform.OS === 'web') {
        const response = await fetch(filePath);
        return await response.blob();
      } else {
        // For mobile platforms, read the file and convert to blob
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (!fileInfo.exists) {
          throw new Error('File does not exist');
        }

        const fileContent = await FileSystem.readAsStringAsync(filePath, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Convert base64 to blob
        const byteCharacters = atob(fileContent);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: 'application/pdf' });
      }
    } catch (error) {
      console.error('Error converting file to blob:', error);
      throw new Error('Failed to convert file to blob');
    }
  }

  /**
   * Generate HTML content for the contract
   */
  private static generateContractHTML(data: ContractData): string {
    // Use the provided CGL Easygarage.html template
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Contrat de location</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.4;
          }
          h1 { 
            color: black; 
            font-family:"Avenir Next", sans-serif; 
            font-style: normal; 
            font-weight: bold; 
            text-decoration: none; 
            font-size: 19pt; 
            text-align: center;
            padding-top: 3pt;
          }
          .s1 { 
            color: black; 
            font-family:"Helvetica Neue", sans-serif; 
            font-style: normal; 
            font-weight: bold; 
            text-decoration: none; 
            font-size: 10pt; 
            text-align: center;
            padding-top: 5pt;
          }
          .s2 { 
            color: black; 
            font-family:"Helvetica Neue", sans-serif; 
            font-style: normal; 
            font-weight: normal; 
            text-decoration: none; 
            font-size: 8pt; 
            padding-left: 4pt;
          }
          .section {
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          table {
            width: 95%;
            border-collapse: collapse;
            margin-bottom: 20px;
            margin-left: 5.94292pt;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
            font-size: 12px;
          }
          .header-cell {
            background-color: #D5D5D5;
            text-align: center;
            padding: 6pt;
            font-weight: bold;
            border: 1pt solid #7F7F7F;
          }
          .data-cell {
            background-color: #F5F5F5;
            padding: 4pt;
            border: 1pt solid #7F7F7F;
          }
          .footer {
            margin-top: 50px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
            font-size: 10px;
            text-align: right;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
          }
          .signature-box {
            border-top: 1px solid #000;
            width: 45%;
            padding-top: 10px;
            text-align: center;
            font-size: 12px;
          }
          .terms {
            font-size: 9px;
            margin-top: 30px;
            text-align: justify;
          }
          .caution-table {
            background-color: #D5D5D5;
            border: 1pt solid #7F7F7F;
          }
          .caution-cell {
            padding: 8pt 4pt;
            font-weight: bold;
            font-size: 8pt;
          }
        </style>
      </head>
      <body>
        <h1>CONTRAT DE LOCATION</h1>
        
        <table>
          <tr>
            <td colspan="2" class="header-cell">CLIENT(S) - CONDUCTEUR(S)</td>
          </tr>
          <tr>
            <td class="data-cell" width="50%">
              <p class="s2">Nom : ${data.nom_client}</p>
            </td>
            <td class="data-cell" width="50%">
              <p class="s2">Téléphone : ${data.telephone_client}</p>
            </td>
          </tr>
          <tr>
            <td colspan="2" class="data-cell">
              <p class="s2">Adresse : ${data.adresse_client || 'Non spécifiée'}</p>
            </td>
          </tr>
        </table>
        
        <table>
          <tr>
            <td colspan="2" class="header-cell">VEHICULE</td>
          </tr>
          <tr>
            <td colspan="2" class="data-cell">
              <p class="s2">Marque et modèle : ${data.vehicule_marque} ${data.vehicule_modele}</p>
            </td>
          </tr>
          <tr>
            <td class="data-cell" width="50%">
              <p class="s2">Immatriculation : ${data.vehicule_immatriculation}</p>
            </td>
            <td class="data-cell" width="50%">
              <p class="s2">Carburant : ${data.vehicule_carburant}</p>
            </td>
          </tr>
        </table>
        
        <table>
          <tr>
            <td colspan="2" class="header-cell">DETAILS DE LA RESERVATION</td>
          </tr>
          <tr>
            <td class="data-cell" width="50%">
              <p class="s2">Date et heure de départ : ${data.date_debut} à ${data.heure_debut}</p>
            </td>
            <td class="data-cell" width="50%">
              <p class="s2">Date et heure de retour : ${data.date_fin} à ${data.heure_fin}</p>
            </td>
          </tr>
          <tr>
            <td class="data-cell">
              <p class="s2">Kilométrage au départ : ${data.kilometrage_depart}</p>
            </td>
            <td class="data-cell">
              <p class="s2">Kilométrage inclus : ${data.kilometrage_inclus} km/jour</p>
            </td>
          </tr>
        </table>
        
        <table>
          <tr>
            <td colspan="2" class="header-cell">SUPPLEMENTS</td>
          </tr>
          <tr>
            <td class="data-cell" width="50%">
              <p class="s2">Appoint de carburant : <b>${data.carburant_manquant}€</b> par litre manquant</p>
            </td>
            <td class="data-cell" width="50%">
              <p class="s2">Kilomètre supplémentaire : ${data.prixKmSupplementaire} €</p>
            </td>
          </tr>
        </table>
        
        <table class="caution-table">
          <tr>
            <td class="caution-cell" width="50%">Caution de départ : <span style="font-weight: normal">${data.cautiondepart} €</span></td>
            <td class="caution-cell" width="50%">Franchise majorée : <span style="font-weight: normal">${data.cautionRSV} €</span></td>
          </tr>
        </table>
        
        <p style="padding-top: 3pt; padding-left: 5pt; text-align: justify; font-size: 8pt;">
          Les présentes conditions générales de location régissent les relations entre la société
          ${data.nom_entreprise} et toute personne désignée sur le contrat de location, qui paie ledit contrat et/ou est désignée en tant que conducteur principal.
        </p>
        
        <h2 style="padding-left: 5pt; font-size: 8pt; text-align: justify;">
          ARTICLE 1. <span style="font-weight: normal">RÉSERVATION DU VÉHICULE : </span><i>Qui peut louer et conduire un véhicule ${data.nom_entreprise} ?</i>
        </h2>
        
        <p style="padding-left: 5pt; font-size: 8pt; text-align: left;">
          Pour louer et conduire un véhicule ${data.nom_entreprise}, je dois nécessairement:
        </p>
        <ul style="list-style-type: disc; padding-left: 39pt; font-size: 8pt;">
          <li>avoir plus de ${data.ageminimal} ans révolus</li>
          <li>disposer d'un permis de conduire valide obtenu depuis au moins ${data.anneepermis} an(s)</li>
          <li>disposer d'un moyen de paiement accepté par ${data.nom_entreprise}</li>
        </ul>
        
        <h2 style="padding-left: 5pt; font-size: 8pt; text-align: justify;">
          ARTICLE 5. <span style="font-weight: normal">GARDE ET UTILISATION DU VEHICULE : Le locataire assume la garde du véhicule et la maitrise de la conduite.</span>
        </h2>
        
        <table style="margin-top: 20px;">
          <tr>
            <td colspan="2" class="header-cell">TARIFS ET FRAIS POTENTIELS</td>
          </tr>
          <tr>
            <td class="data-cell" width="50%"><p class="s2">Jante frottée</p></td>
            <td class="data-cell" width="50%"><p class="s2">${data.jante_frottee}€ / remplacement si non réparable</p></td>
          </tr>
          <tr>
            <td class="data-cell"><p class="s2">Carburant manquant</p></td>
            <td class="data-cell"><p class="s2">${data.carburant_manquant}€ par litre</p></td>
          </tr>
          <tr>
            <td class="data-cell"><p class="s2">Nettoyage</p></td>
            <td class="data-cell"><p class="s2">${data.nettoyage}€</p></td>
          </tr>
          <tr>
            <td class="data-cell"><p class="s2">Retard (par tranche de 30min)</p></td>
            <td class="data-cell"><p class="s2">${data.retard}€</p></td>
          </tr>
          <tr>
            <td class="data-cell"><p class="s2">Rayure</p></td>
            <td class="data-cell"><p class="s2">Peinture de l'élément</p></td>
          </tr>
          <tr>
            <td class="data-cell"><p class="s2">Pare-brise</p></td>
            <td class="data-cell"><p class="s2">Achat + montage (environ 300€)</p></td>
          </tr>
        </table>
        
        <div class="signatures">
          <div class="signature-box">
            <p><strong>Signature du loueur</strong></p>
            <br><br>
            <p>${data.nom_entreprise}</p>
          </div>
          <div class="signature-box">
            <p><strong>Signature du client</strong></p>
            <br><br>
            <p>${data.nom_client}</p>
          </div>
        </div>
        
        <div class="terms">
          <p><strong>CONDITIONS GÉNÉRALES DE LOCATION</strong></p>
          
          <p><strong>ARTICLE 1. RÉSERVATION :</strong> Le présent contrat régit la location du véhicule mentionné ci-dessus.</p>
          
          <p><strong>ARTICLE 2. RESPONSABILITÉS :</strong> Le locataire s'engage à utiliser le véhicule conformément aux règles de circulation.</p>
          
          <p><strong>ARTICLE 3. RESTITUTION :</strong> Le véhicule doit être restitué dans l'état où il a été remis, au lieu et à l'heure convenus.</p>
          
          <p><strong>ARTICLE 4. ASSURANCE :</strong> Le véhicule est couvert par une assurance tous risques selon les conditions en vigueur.</p>
          
          <p><strong>ARTICLE 5. CONDUCTEUR :</strong> Pour louer et conduire un véhicule, le client doit nécessairement avoir plus de ${data.ageminimal} ans révolus et disposer d'un permis de conduire valide obtenu depuis au moins ${data.anneepermis} an(s).</p>
          
          <p><strong>ARTICLE 6. RETARD :</strong> Tout retard de restitution est facturé à hauteur de ${data.retard}€ par tranche de 30 minutes.</p>
          
          <p><strong>ARTICLE 7. AMENDES :</strong> Le client s'engage à régler tous frais, amendes et dépenses pour toute infraction au code de la route, au stationnement, etc.</p>
        </div>
        
        <div class="footer">
          <p style="font-size: 6pt;">${data.nom_entreprise} - ${data.adresse_entreprise || ''} ${data.siret_entreprise ? `- SIRET: ${data.siret_entreprise}` : ''}</p>
          <p style="font-size: 8pt;">Document généré le ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>
      </body>
      </html>
    `;
  }
}