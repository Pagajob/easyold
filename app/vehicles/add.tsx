@@ .. @@
   container: {
     flex: 1,
     backgroundColor: colors.background,
-    paddingTop: Platform.OS === 'ios' ? 0 : 0,
   },
   header: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
     padding: 16,
-    paddingTop: Platform.OS === 'ios' ? 60 : 16,
+    paddingTop: 16,
     paddingBottom: 16,
   },