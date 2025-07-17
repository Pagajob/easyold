"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disableNetwork = exports.enableNetwork = exports.auth = exports.storage = exports.db = void 0;
var app_1 = require("firebase/app");
var firestore_1 = require("firebase/firestore");
var storage_1 = require("firebase/storage");
var auth_1 = require("firebase/auth");
var react_native_1 = require("react-native");
var firebaseConfig = {
    apiKey: "AIzaSyAJiD77M7pha3HCrs-xf8vEpnNUaN2_w2c",
    authDomain: "tajirent-39852.firebaseapp.com",
    projectId: "tajirent-39852",
    storageBucket: "tajirent-39852.firebasestorage.app",
    messagingSenderId: "587793687612",
    appId: "1:587793687612:web:a9989cd5c11c2b27678f39",
    measurementId: "G-SWX4CL3DGG"
};
// Initialize Firebase
var app = (0, app_1.initializeApp)(firebaseConfig);
// Initialize Firebase services
exports.db = (0, firestore_1.getFirestore)(app);
exports.storage = (0, storage_1.getStorage)(app);
exports.auth = (0, auth_1.getAuth)(app);
// Configure la persistance pour le web
if (react_native_1.Platform.OS === 'web') {
    // Activer la persistance IndexedDB pour le web
    (0, auth_1.setPersistence)(exports.auth, auth_1.indexedDBLocalPersistence)
        .then(function () {
        console.log('Persistance Firebase Auth configurée avec succès');
    })
        .catch(function (error) {
        console.error('Erreur lors de la configuration de la persistance Firebase Auth:', error);
    });
}
// Enable offline persistence for Firestore
var firestore_2 = require("firebase/firestore");
Object.defineProperty(exports, "enableNetwork", { enumerable: true, get: function () { return firestore_2.enableNetwork; } });
Object.defineProperty(exports, "disableNetwork", { enumerable: true, get: function () { return firestore_2.disableNetwork; } });
exports.default = app;
