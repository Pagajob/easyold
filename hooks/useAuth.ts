@@ .. @@
   updateUserEmail: (currentPassword: string, newEmail: string) => Promise<void>;
   updateUserProfile?: (data: Partial<UserProfile>) => Promise<void>;
   enableBiometricAuth: () => Promise<boolean>;
   disableBiometricAuth: () => Promise<boolean>;
   canUseBiometric: boolean;
   biometricTypeName: string;
   abonnementUtilisateur: AbonnementUtilisateur | null;
   refreshAbonnement: () => Promise<void>;
   acheterAbonnement: (productId: string) => Promise<void>;
-  restaurerAbonnement: () => Promise<void>;
+  restaurerAbonnement: () => Promise<boolean>;
 }
 
 const AuthContext = createContext<AuthContextType | undefined>(undefined);
@@ .. @@
   // Acheter un abonnement via l'App Store
   const acheterAbonnement = async (productId: string) => {
     const purchase = await IAP.buySubscription(productId);
-    // Récupérer le reçu de la transaction
-    const receipt = purchase?.transactionReceipt;
-    if (receipt && user) {
-      await IAP.validateAppleReceipt(receipt, user.uid);
+    
+    if (purchase && user) {
+      // Récupérer le reçu de la transaction
+      const receipt = purchase.transactionReceipt;
+      if (receipt) {
+        await IAP.validateAppleReceipt(receipt, user.uid);
+      }
     }
     await refreshAbonnement();
   };
 
   // Restaurer les achats
-  const restaurerAbonnement = async () => {
+  const restaurerAbonnement = async (): Promise<boolean> => {
     const purchases = await IAP.restorePurchases();
-    // Prendre le reçu du dernier achat restauré
-    const receipt = purchases?.[0]?.transactionReceipt;
-    if (receipt && user) {
-      await IAP.validateAppleReceipt(receipt, user.uid);
+    
+    if (purchases && purchases.length > 0 && user) {
+      // Prendre le reçu du dernier achat restauré
+      const receipt = purchases[0].transactionReceipt;
+      if (receipt) {
+        await IAP.validateAppleReceipt(receipt, user.uid);
+        await refreshAbonnement();
+        return true;
+      }
     }
-    await refreshAbonnement();
+    return false;
   };