import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, SafeAreaView } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getSubscriptions } from '@/services/iapService';
import { Check, Star, Shield, Users, FileText, ArrowRight } from 'lucide-react-native';

const PLAN_FEATURES: Record<string, string[]> = {
  'Gratuit': [
    '1 véhicule',
    '5 réservations',
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
  const { abonnementUtilisateur, acheterAbonnement, refreshAbonnement } = useAuth();
  const { colors } = useTheme();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const subs = await getSubscriptions();
      setPlans(subs);
      setLoading(false);
    })();
  }, []);

  const handleUpgrade = async (productId: string) => {
    try {
      setProcessing(productId);
      await acheterAbonnement(productId);
      await refreshAbonnement();
      Alert.alert('Abonnement mis à jour', 'Votre abonnement a bien été activé.');
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de finaliser l’abonnement.');
    } finally {
      setProcessing('');
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
          <Text style={styles.sectionTitle}>Changer de formule</Text>
          {loading ? <ActivityIndicator color={colors.primary} /> : (
            plans.map(plan => {
              const Icon = PLAN_ICONS[plan.title] || Star;
              const isCurrent = abonnementUtilisateur?.abonnement === plan.title;
              return (
                <View key={plan.productId} style={[styles.planCard, isCurrent && styles.planCardCurrent]}>
                  <View style={styles.planHeader}>
                    <Icon size={28} color={colors.primary} style={{ marginRight: 10 }} />
                    <Text style={styles.planTitle}>{plan.title}</Text>
                    {isCurrent && (
                      <View style={[styles.badge, { backgroundColor: colors.primary }]}> 
                        <Text style={styles.badgeText}>Plan actuel</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.planPrice}>{plan.localizedPrice}</Text>
                  <View style={styles.featuresList}>
                    {PLAN_FEATURES[plan.title]?.map((f, i) => (
                      <View key={i} style={styles.featureRow}>
                        <Check size={16} color={colors.success} style={{ marginRight: 6 }} />
                        <Text style={styles.featureText}>{f}</Text>
                      </View>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={[styles.chooseButton, isCurrent && styles.chooseButtonSelected]}
                    onPress={() => handleUpgrade(plan.productId)}
                    disabled={processing === plan.productId || isCurrent}
                    activeOpacity={0.8}
                  >
                    {processing === plan.productId ? (
                      <ActivityIndicator color={colors.background} />
                    ) : (
                      <Text style={styles.chooseButtonText}>
                        {isCurrent ? 'Plan actuel' : 'Choisir ce plan'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <TouchableOpacity style={styles.restoreButton} onPress={() => Alert.alert('Restaurer', 'Fonctionnalité à venir')}> 
            <Text style={styles.restoreText}>Restaurer un achat</Text>
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
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 20,
    marginBottom: 18,
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
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginRight: 8,
  },
  featuresList: {
    marginVertical: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
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
  chooseButtonSelected: {
    backgroundColor: colors.disabled,
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
    backgroundColor: colors.primary,
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
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginRight: 8,
  },
}); 