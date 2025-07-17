import * as RNIap from 'react-native-iap';
import { Platform } from 'react-native';

// IDs des produits d'abonnement créés sur App Store Connect
export const productIds = [
  'easygarage.essentiel',
  'easygarage.pro',
  'easygarage.premium',
];

export async function initIAP() {
  try {
    if (Platform.OS !== 'web') {
      await RNIap.initConnection();
      if (Platform.OS === 'android') {
        await RNIap.flushFailedPurchasesCachedAsPendingAndroid();
      }
    }
  } catch (e) {
    console.warn('Erreur IAP init:', e);
  }
}

export async function getSubscriptions() {
  try {
    if (Platform.OS === 'web') {
      // Mock data for web platform
      return [
        {
          productId: 'easygarage.essentiel',
          title: 'Essentiel',
          description: '5 véhicules, 50 réservations/mois, 1 utilisateur, EDL 7 jours, export CSV/PDF, logo perso',
          price: '6.99',
          currency: 'EUR',
          localizedPrice: '6,99 €/semaine',
        },
        {
          productId: 'easygarage.pro',
          title: 'Pro',
          description: '30 véhicules, réservations illimitées, 5 utilisateurs, EDL 1 mois, stats avancées, support prioritaire',
          price: '12.99',
          currency: 'EUR',
          localizedPrice: '12,99 €/semaine',
        },
        {
          productId: 'easygarage.premium',
          title: 'Premium',
          description: 'Véhicules et utilisateurs illimités, EDL 1 an, multi-sociétés, automatisations, API adresse, support téléphonique',
          price: '24.99',
          currency: 'EUR',
          localizedPrice: '24,99 €/semaine',
        }
      ];
    } else {
      const subs = await RNIap.getSubscriptions({ skus: productIds });
      return subs;
    }
  } catch (e) {
    console.warn('Erreur getSubscriptions:', e);
    return [];
  }
}

export async function buySubscription(productId: string) {
  try {
    if (Platform.OS === 'web') {
      // Simulate purchase for web
      console.log('Simulating purchase on web for:', productId);
      return {
        productId,
        transactionId: 'web-transaction-' + Date.now(),
        transactionReceipt: 'web-receipt-' + Date.now(),
      };
    } else {
      return await RNIap.requestSubscription({ sku: productId });
    }
  } catch (e) {
    console.warn('Erreur achat abonnement:', e);
    throw e;
  }
}

export async function restorePurchases() {
  try {
    if (Platform.OS === 'web') {
      // Simulate restore for web
      console.log('Simulating restore purchases on web');
      return [];
    } else {
      const purchases = await RNIap.getAvailablePurchases();
      return purchases;
    }
  } catch (e) {
    console.warn('Erreur restauration achats:', e);
    return [];
  }
}

export async function validateAppleReceipt(receipt: string, userId: string) {
  try {
    if (Platform.OS === 'web') {
      // Simulate validation for web
      console.log('Simulating receipt validation on web for user:', userId);
      return { success: true };
    } else {
      // Use absolute URL for API calls
      const apiUrl =
        (typeof window !== 'undefined' && window.location && window.location.origin)
          ? `${window.location.origin}/api/validate-apple-receipt`
          : process.env.EXPO_PUBLIC_API_URL
            ? `${process.env.EXPO_PUBLIC_API_URL}/api/validate-apple-receipt`
            : 'https://easygarage-app.vercel.app/api/validate-apple-receipt';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptData: receipt, userId }),
      });
      
      if (!response.ok) throw new Error('Erreur de validation du reçu');
      return await response.json();
    }
  } catch (e) {
    console.warn('Erreur validation reçu Apple:', e);
    throw e;
  }
}

export function endIAP() {
  if (Platform.OS !== 'web') {
    RNIap.endConnection();
  }
}

// À compléter : validation du reçu côté serveur pour sécuriser l'accès premium 