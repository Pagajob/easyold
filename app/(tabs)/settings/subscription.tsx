import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, SafeAreaView, Image } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getSubscriptions } from '@/services/iapService';
import { Check, Star, Shield, Users, FileText, ArrowRight } from 'lucide-react-native';

const PLAN_FEATURES: Record<string, string[]> = {
  'Gratuit': [
    '1 véhicule',
    '3 réservations',
    '1 utilisateur',
    'EDL local 24h',
    'Aucune exportation',
    'Logo EasyGarage affiché',
  ],
  'Essentiel': [
    '5 véhicules',
    '50 réservations/mois',
    '1 utilisateur',
    'EDL stocké 7 jours',
    'Export CSV/PDF',
    'Personnalisation logo/couleurs',
  ],
  'Pro': [
    '30 véhicules',
    'Réservations illimitées',
    '5 utilisateurs',
    'EDL stocké 1 mois',
    'Statistiques avancées',
    'Support prioritaire',
  ],
  'Premium': [
    'Véhicules et utilisateurs illimités',
    'EDL 1 an',
    'Multi-sociétés',
    'Automatisations',
    'API adresse',
    'Support téléphonique',
  ],
};

const PLAN_ICONS: Record<string, any> = {
  'Gratuit': Star,
  'Essentiel': FileText,
  'Pro': Users,
  'Premium': Shield,
};

export default function SubscriptionScreen() {
  const { abonnementUtilisateur, acheterAbonnement, refreshAbonnement, user, updateUserProfile } = useAuth();
  const { colors } = useTheme();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const subs = await getSubscriptions();
      
      // Remplacer les prix par les prix hebdomadaires
      const updatedSubs = subs.map(sub => {
        if (sub.title === 'Essentiel') {
          return { ...sub, price: '6.99', localizedPrice: '6,99 €/semaine' };
        } else if (sub.title === 'Pro') {
          return { ...sub, price: '12.99', localizedPrice: '12,99 €/semaine' };
        } else if (sub.title === 'Premium') {
          return { ...sub, price: '24.99', localizedPrice: '24,99 €/semaine' };
        }
        return sub;
      });
      
      setPlans(updatedSubs);
      setLoading(false);
    })();
  }, []);

  const handleUpgrade = async (productId: string, planName: string) => {
    try {
      setProcessing(productId);
      
      // Initier l'achat via l'App Store
      await acheterAbonnement(productId);
      
      // Mettre à jour le profil utilisateur avec le plan choisi
      if (user) {
        await updateUserProfile({
          plan: planName.toLowerCase()
        });
      }
      
      // Rafraîchir les informations d'abonnement
      await refreshAbonnement();
      
      Alert.alert('Abonnement mis à jour', 'Votre abonnement a bien été activé.');
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de finaliser l'abonnement.');
    } finally {
      setProcessing('');
    }
  };

  const getProductId = (planName: string): string => {
    switch (planName) {
      case 'Essentiel': return 'easygarage.essentiel';
      case 'Pro': return 'easygarage.pro';
      case 'Premium': return 'easygarage.premium';
      default: return '';
    }
  };

  const styles = createStyles(colors);

  const renderCurrentPlan = () => {
    if (!abonnementUtilisateur) return null;
    const Icon = PLAN_ICONS[abonnementUtilisateur.abonnement] || Star;
    // Cherche le prix du plan actuel dans la liste des plans
    const currentPlan = plans.find(p => p.title === abonnementUtilisateur.abonnement);
    return (
      <View style={styles.currentCard}>
        <View style={styles.currentHeaderRow}>
          <Icon size={36} color={colors.primary} style={{ marginRight: 14 }} />
          <View style={{ flex: 1 }}>
            <View style={styles.currentPlanRow}>
              <Text style={styles.planName}>{abonnementUtilisateur.abonnement}</Text>
              <View style={[styles.badge, { backgroundColor: abonnementUtilisateur.statut === 'actif' ? colors.success : colors.error }]}> 
                <Text style={styles.badgeText}>{abonnementUtilisateur.statut === 'actif' ? 'Actif' : 'Expiré'}</Text>
              </View>
            </View>
            <Text style={styles.planPrice}>{currentPlan?.localizedPrice || ''}</Text>
          </View>
        </View>
        <Text style={styles.renewal}>Renouvellement : {new Date(abonnementUtilisateur.dateFin).toLocaleDateString('fr-FR')}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Gérer mon abonnement</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Abonnement en cours</Text>
          {renderCurrentPlan()}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choisir un forfait</Text>
          
          {loading ? (
            <ActivityIndicator color={colors.primary} size="large" style={{ marginVertical: 30 }} />
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.plansContainer}
            >
              {plans.map(plan => {
                const Icon = PLAN_ICONS[plan.title] || Star;
                const isCurrent = abonnementUtilisateur?.abonnement === plan.title;
                const productId = getProductId(plan.title);
                
                return (
                  <View key={plan.productId || productId} style={[
                    styles.planCard,
                    isCurrent && styles.planCardCurrent
                  ]}>
                    <View style={styles.planHeader}>
                      <Icon size={28} color={colors.primary} />
                      <Text style={styles.planTitle}>{plan.title}</Text>
                    </View>
                    
                    <Text style={styles.planPrice}>{plan.localizedPrice}</Text>
                    
                    <View style={styles.featuresList}>
                      {PLAN_FEATURES[plan.title]?.map((feature, i) => (
                        <View key={i} style={styles.featureRow}>
                          <Check size={16} color={colors.success} />
                          <Text style={styles.featureText}>{feature}</Text>
                        </View>
                      ))}
                    </View>
                    
                    <TouchableOpacity
                      style={[
                        styles.chooseButton,
                        (isCurrent || processing === (plan.productId || productId)) && styles.chooseButtonDisabled
                      ]}
                      onPress={() => handleUpgrade(plan.productId || productId, plan.title)}
                      disabled={isCurrent || processing === (plan.productId || productId)}
                    >
                      {processing === (plan.productId || productId) ? (
                        <ActivityIndicator color={colors.background} size="small" />
                      ) : (
                        <Text style={styles.chooseButtonText}>
                          {isCurrent ? 'Plan actuel' : 'Choisir ce plan'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
        
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <TouchableOpacity 
            style={styles.restoreButton} 
            onPress={async () => {
              try {
                setLoading(true);
                const restored = await refreshAbonnement();
                if (restored) {
                  Alert.alert('Succès', 'Vos achats ont été restaurés avec succès.');
                } else {
                  Alert.alert('Information', 'Aucun achat à restaurer n\'a été trouvé.');
                }
              } catch (error) {
                Alert.alert('Erreur', 'Impossible de restaurer vos achats.');
              } finally {
                setLoading(false);
              }
            }}
          > 
            <Text style={styles.restoreText}>Restaurer mes achats</Text>
            <ArrowRight size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: 20,
    alignItems: 'stretch',
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 22,
    marginTop: 32,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  section: {
    marginBottom: 36,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: 0.1,
  },
  currentCard: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 26,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 3,
  },
  currentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentPlanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  planName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 10,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  renewal: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 6,
    marginLeft: 2,
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginLeft: 6,
    alignSelf: 'center',
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  plansContainer: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 16,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 20,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  planCardCurrent: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 10,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  featuresList: {
    marginVertical: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  featureText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  chooseButton: {
    marginTop: 10,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  chooseButtonDisabled: {
    backgroundColor: colors.disabled || colors.border,
  },
  chooseButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 8,
    marginBottom: 8,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  restoreText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 16,
    marginRight: 8,
  },
});