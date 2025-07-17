// scripts/seedAbonnements.js
const { seedAbonnementsPlans } = require('../services/firebaseService');

(async () => {
  try {
    await seedAbonnementsPlans();
    console.log('✅ Plans d\'abonnement Firestore créés avec succès.');
    process.exit(0);
  } catch (err) {
    console.error('Erreur lors du seed des plans :', err);
    process.exit(1);
  }
})(); 