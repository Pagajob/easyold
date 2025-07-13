import * as RNIap from 'react-native-iap';

// IDs des produits d'abonnement créés sur App Store Connect
export const productIds = [
  'easygarage_essentiel',
  'easygarage_pro',
  'easygarage_premium',
];

export async function initIAP() {
  try {
    await RNIap.initConnection();
    await RNIap.flushFailedPurchasesCachedAsPendingAndroid?.();
  } catch (e) {
    console.warn('Erreur IAP init:', e);
  }
}

export async function getSubscriptions() {
  try {
    const subs = await RNIap.getSubscriptions(productIds);
    return subs;
  } catch (e) {
    console.warn('Erreur getSubscriptions:', e);
    return [];
  }
}

export async function buySubscription(productId: string) {
  try {
    await RNIap.requestSubscription(productId);
  } catch (e) {
    console.warn('Erreur achat abonnement:', e);
    throw e;
  }
}

export async function restorePurchases() {
  try {
    const purchases = await RNIap.getAvailablePurchases();
    return purchases;
  } catch (e) {
    console.warn('Erreur restauration achats:', e);
    return [];
  }
}

export async function validateAppleReceipt(receipt: string, userId: string) {
  try {
    const response = await fetch('/api/validate-apple-receipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiptData: receipt, userId }),
    });
    if (!response.ok) throw new Error('Erreur de validation du reçu');
    return await response.json();
  } catch (e) {
    console.warn('Erreur validation reçu Apple:', e);
    throw e;
  }
}

export function endIAP() {
  RNIap.endConnection();
}

// À compléter : validation du reçu côté serveur pour sécuriser l'accès premium 