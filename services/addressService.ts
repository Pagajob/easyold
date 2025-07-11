export interface AddressSuggestion {
  label: string;
  context: string;
  type: string;
  x: number;
  y: number;
  importance: number;
  id: string;
  name: string;
  postcode: string;
  citycode: string;
  city: string;
  district?: string;
  street?: string;
  housenumber?: string;
}

export interface AddressApiResponse {
  type: string;
  version: string;
  features: {
    type: string;
    geometry: {
      type: string;
      coordinates: [number, number];
    };
    properties: AddressSuggestion;
  }[];
  attribution: string;
  licence: string;
  query: string;
  limit: number;
}

export class AddressService {
  private static readonly BASE_URL = 'https://api-adresse.data.gouv.fr';
  
  /**
   * Recherche d'adresses avec autocomplétion
   * @param query - Texte de recherche
   * @param limit - Nombre maximum de résultats (défaut: 5)
   * @returns Promise<AddressSuggestion[]>
   */
  static async searchAddresses(query: string, limit: number = 5): Promise<AddressSuggestion[]> {
    if (!query || query.trim().length < 3) {
      return [];
    }

    try {
      const encodedQuery = encodeURIComponent(query.trim());
      const url = `${this.BASE_URL}/search/?q=${encodedQuery}&limit=${limit}&type=housenumber`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
      }

      const data: AddressApiResponse = await response.json();
      
      return data.features.map(feature => feature.properties);
    } catch (error) {
      console.error('Erreur lors de la recherche d\'adresses:', error);
      throw new Error('Impossible de rechercher les adresses. Vérifiez votre connexion internet.');
    }
  }

  /**
   * Formate une adresse pour l'affichage
   * @param address - Suggestion d'adresse
   * @returns string - Adresse formatée
   */
  static formatAddress(address: AddressSuggestion): string {
    const parts = [];
    
    if (address.housenumber) {
      parts.push(address.housenumber);
    }
    
    if (address.street || address.name) {
      parts.push(address.street || address.name);
    }
    
    if (address.postcode && address.city) {
      parts.push(`${address.postcode} ${address.city}`);
    }
    
    return parts.join(', ');
  }

  /**
   * Formate une adresse pour le stockage (format complet)
   * @param address - Suggestion d'adresse
   * @returns string - Adresse complète formatée
   */
  static formatFullAddress(address: AddressSuggestion): string {
    const parts = [];
    
    if (address.housenumber) {
      parts.push(address.housenumber);
    }
    
    if (address.street || address.name) {
      parts.push(address.street || address.name);
    }
    
    if (address.district) {
      parts.push(address.district);
    }
    
    if (address.postcode && address.city) {
      parts.push(`${address.postcode} ${address.city}`);
    }
    
    return parts.join(', ');
  }

  /**
   * Valide si une chaîne ressemble à une adresse française
   * @param address - Adresse à valider
   * @returns boolean
   */
  static isValidFrenchAddress(address: string): boolean {
    if (!address || address.trim().length < 10) {
      return false;
    }

    // Regex simple pour détecter un code postal français (5 chiffres)
    const postalCodeRegex = /\b\d{5}\b/;
    return postalCodeRegex.test(address);
  }

  /**
   * Extrait le code postal d'une adresse
   * @param address - Adresse complète
   * @returns string | null - Code postal ou null si non trouvé
   */
  static extractPostalCode(address: string): string | null {
    const match = address.match(/\b(\d{5})\b/);
    return match ? match[1] : null;
  }

  /**
   * Extrait la ville d'une adresse
   * @param address - Adresse complète
   * @returns string | null - Ville ou null si non trouvée
   */
  static extractCity(address: string): string | null {
    // Cherche le pattern "code postal + ville"
    const match = address.match(/\b\d{5}\s+([^,]+)/);
    return match ? match[1].trim() : null;
  }
}