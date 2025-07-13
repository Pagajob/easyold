// Script d'initialisation des plans d'abonnement EasyGarage dans Firestore
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Abonnement } from '../types/abonnement';

// Remplace par le chemin de ta clé de service Firebase
const serviceAccount = require('../config/serviceAccountKey.json');

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

const abonnements: Abonnement[] = [
  {
    nom: 'Gratuit',
    prixMensuel: 0,
    description: '1 véhicule, 5 réservations, 1 utilisateur, EDL non stocké (local 24h), pas d’export, pas de personnalisation, logo EasyGarage affiché',
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
    prixMensuel: 29,
    description: '5 véhicules, 50 réservations/mois, 1 utilisateur, EDL stocké 7 jours, export CSV/PDF, personnalisation logo et couleurs',
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
    prixMensuel: 49,
    description: '30 véhicules, réservations illimitées, 5 utilisateurs, EDL stocké 1 mois, statistiques avancées, support prioritaire',
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
    prixMensuel: 99,
    description: 'Véhicules et utilisateurs illimités, EDL 1 an, multi-sociétés, automatisations, API adresse, support téléphonique',
    vehiculesMax: 9999, // Utilisé comme "illimité"
    reservationsMax: 'illimité',
    utilisateursMax: 'illimité',
    dureeStockageEDL: '1 an',
    exportAutorisé: true,
    personnalisationVisuelle: true,
    multiSociete: true,
    support: 'téléphone',
  },
];

async function main() {
  for (const ab of abonnements) {
    const ref = db.collection('Abonnements').doc(ab.nom.toLowerCase());
    await ref.set(ab);
    console.log(`Abonnement ${ab.nom} ajouté.`);
  }
  console.log('Tous les plans ont été initialisés.');
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 