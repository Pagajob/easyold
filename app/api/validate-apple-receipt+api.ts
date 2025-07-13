import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

// Remplace par le chemin de ta clé de service Firebase
const serviceAccount = require('../../../config/serviceAccountKey.json');

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

const APPLE_PROD_URL = 'https://buy.itunes.apple.com/verifyReceipt';
const APPLE_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  const { receiptData, userId } = req.body;
  if (!receiptData || !userId) return res.status(400).json({ error: 'Reçu ou utilisateur manquant' });

  // Envoie le reçu à Apple (prod puis sandbox si test)
  async function validateWithApple(url: string) {
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        'receipt-data': receiptData,
        'password': process.env.APPLE_SHARED_SECRET, // à définir dans .env
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  }

  let result = await validateWithApple(APPLE_PROD_URL);
  if (result.status === 21007) {
    // Reçu de sandbox, réessayer sur sandbox
    result = await validateWithApple(APPLE_SANDBOX_URL);
  }

  if (result.status !== 0) {
    return res.status(400).json({ error: 'Reçu invalide', details: result });
  }

  // Extraire les infos d'abonnement
  const latestReceiptInfo = result.latest_receipt_info?.[0];
  if (!latestReceiptInfo) {
    return res.status(400).json({ error: 'Aucun abonnement trouvé dans le reçu' });
  }

  // Exemple : extraire le product_id, date de début/fin
  const abonnement = latestReceiptInfo.product_id;
  const dateDebut = new Date(parseInt(latestReceiptInfo.purchase_date_ms));
  const dateFin = new Date(parseInt(latestReceiptInfo.expires_date_ms));
  const statut = Date.now() < dateFin.getTime() ? 'actif' : 'expiré';

  // Mettre à jour Firestore
  await db.collection('AbonnementUtilisateur').add({
    user: userId,
    abonnement,
    dateDebut,
    dateFin,
    statut,
  });

  return res.status(200).json({ statut, abonnement, dateDebut, dateFin });
} 