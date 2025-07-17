// scripts/seedAbonnements.node.js
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialisation Firebase Admin via variable d'environnement base64
if (!getApps().length) {
  const base64 = process.env.FIREBASE_KEY_BASE64;
  if (!base64) {
    throw new Error('FIREBASE_KEY_BASE64 manquant dans les variables d\'environnement');
  }
  const jsonStr = Buffer.from(base64, 'base64').toString('utf-8');
  const parsedKey = JSON.parse(jsonStr);
  initializeApp({
    credential: cert(parsedKey),
  });
}
const db = getFirestore();

const plans = [
  {
    nom: 'Gratuit',
    prixMensuel: 0,
    description: 'Découverte EasyGarage',
    vehiculesMax: 1,
    reservationsMax: 5,
    utilisateursMax: 1,
    dureeStockageEDL: '24h',
    exportAutorisé: false,
    personnalisationVisuelle: false,
    multiSociete: false,
    support: 'email',
  },
  {
    nom: 'Essentiel',
    prixMensuel: 9.99,
    description: 'Pour les petits loueurs',
    vehiculesMax: 5,
    reservationsMax: 50,
    utilisateursMax: 1,
    dureeStockageEDL: '7 jours',
    exportAutorisé: true,
    personnalisationVisuelle: true,
    multiSociete: false,
    support: 'email',
  },
  {
    nom: 'Pro',
    prixMensuel: 19.99,
    description: 'Pour les pros exigeants',
    vehiculesMax: 30,
    reservationsMax: 'illimité',
    utilisateursMax: 5,
    dureeStockageEDL: '1 mois',
    exportAutorisé: true,
    personnalisationVisuelle: true,
    multiSociete: false,
    support: 'prioritaire',
  },
  {
    nom: 'Premium',
    prixMensuel: 39.99,
    description: 'Pour les groupes et franchises',
    vehiculesMax: 'illimité',
    reservationsMax: 'illimité',
    utilisateursMax: 'illimité',
    dureeStockageEDL: '1 an',
    exportAutorisé: true,
    personnalisationVisuelle: true,
    multiSociete: true,
    support: 'téléphone',
  },
];

(async () => {
  try {
    const existing = await db.collection('Abonnements').get();
    const existingNames = existing.docs.map(doc => doc.data().nom);
    for (const plan of plans) {
      if (existingNames.includes(plan.nom)) continue;
      await db.collection('Abonnements').add(plan);
    }
    console.log('✅ Plans d\'abonnement Firestore créés avec succès.');
    process.exit(0);
  } catch (err) {
    console.error('Erreur lors du seed des plans :', err);
    process.exit(1);
  }
})(); 