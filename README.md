# Tajirent - Application de Gestion de Location de Voitures

Une application mobile moderne développée avec Expo et React Native pour la gestion de location de voitures destinée aux loueurs indépendants et garages automobiles.

## 🚀 Fonctionnalités

### 📊 Tableau de bord
- Vue d'ensemble des statistiques en temps réel
- Graphiques de revenus et répartition des véhicules
- Indicateurs financiers (revenus, charges, bénéfices)

### 🚗 Gestion des véhicules
- Ajout/modification/suppression de véhicules
- Support de différents types de financement (achat, leasing, LLD, mise à disposition)
- Gestion des statuts (disponible, loué, maintenance)
- Upload de photos des véhicules

### 👥 Gestion des clients
- Base de données clients complète
- Upload de documents (permis de conduire, carte d'identité)
- Historique des locations par client

### 📅 Réservations
- Création de réservations avec sélection de véhicule et client
- Gestion des dates et heures de location
- Calcul automatique des prix et kilométrages inclus
- États des lieux de départ et retour avec photos/vidéos
- Signature électronique des clients

### ⚙️ Paramètres
- Thème sombre/clair
- Personnalisation des couleurs
- Export des données

## 🛠️ Technologies utilisées

- **Framework**: Expo SDK 52.0.30
- **Navigation**: Expo Router 4.0.17
- **Base de données**: Firebase Firestore
- **Stockage**: Firebase Storage
- **État global**: React Context API
- **UI**: React Native avec StyleSheet
- **Icônes**: Lucide React Native
- **Graphiques**: React Native Chart Kit

## 🔧 Configuration Firebase

### 1. Créer un projet Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Créez un nouveau projet
3. Activez Firestore Database
4. Activez Firebase Storage
5. Configurez les règles de sécurité

### 2. Configuration des variables d'environnement

Créez un fichier `.env` à la racine du projet et ajoutez vos clés Firebase :

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Règles de sécurité Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permettre la lecture et l'écriture pour tous les documents
    // À adapter selon vos besoins de sécurité
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 4. Règles de sécurité Storage

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

## 📱 Installation et démarrage

### Prérequis
- Node.js (version 18 ou supérieure)
- npm ou yarn
- Expo CLI

### Installation

```bash
# Cloner le projet
git clone [url-du-repo]
cd tajirent-app

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

### Démarrage

```bash
# Démarrer l'application
npm run dev
```

L'application sera accessible sur :
- Web : http://localhost:8081
- Mobile : Scanner le QR code avec l'app Expo Go

## 📁 Structure du projet

```
tajirent-app/
├── app/                    # Routes de l'application
│   ├── (tabs)/            # Navigation par onglets
│   │   ├── index.tsx      # Tableau de bord
│   │   ├── vehicles/      # Gestion véhicules
│   │   ├── clients/       # Gestion clients
│   │   ├── reservations/  # Gestion réservations
│   │   └── settings/      # Paramètres
│   └── _layout.tsx        # Layout principal
├── components/            # Composants réutilisables
├── contexts/             # Contextes React (état global)
├── services/             # Services Firebase
├── config/               # Configuration Firebase
└── hooks/                # Hooks personnalisés
```

## 🔄 Synchronisation en temps réel

L'application utilise les listeners en temps réel de Firestore pour synchroniser automatiquement les données entre tous les appareils connectés. Toute modification (ajout, suppression, mise à jour) est immédiatement reflétée sur tous les clients.

## 📊 Collections Firestore

### Vehicles
- Informations complètes des véhicules
- Types de financement
- Statuts et disponibilité

### Clients
- Données personnelles
- Documents (permis, carte d'identité)
- Historique

### Reservations
- Détails de location
- États des lieux (départ/retour)
- Signatures électroniques

### Charges
- Charges fixes et variables
- Fréquences de paiement

## 🎨 Thèmes et personnalisation

L'application supporte :
- Mode sombre/clair
- Personnalisation de la couleur principale
- Thèmes adaptatifs selon les préférences système

## 📱 Compatibilité

- ✅ Web (navigateur)
- ✅ iOS (via Expo Go ou build natif)
- ✅ Android (via Expo Go ou build natif)

## 🚀 Déploiement

### Web
```bash
npm run build:web
```

### Mobile
Utilisez EAS Build pour créer des builds natifs :
```bash
npx eas build --platform all
```

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou soumettre une pull request.

## 📞 Support

Pour toute question ou support, contactez l'équipe de développement.# easygaragerepaired
# easyold
