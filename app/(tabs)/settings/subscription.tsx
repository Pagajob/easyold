import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Image, Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getSubscriptions, buySubscription, restorePurchases } from '@/services/iapService';
import { Check, Star, Shield, Users, FileText, Settings, ArrowRight, Calendar, Clock, CheckCircle, AlertTriangle } from 'lucide-react-native';
import { AbonnementUtilisateur } from '@/types/abonnement';

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

interface PlanCardProps {
  title: string;
  price: number;
  features: string[];
  isCurrentPlan: boolean;
  onSelect: () => void;
  isLoading: boolean;
  icon: any;
}

export default function SubscriptionScreen() {
  const { abonnementUtilisateur, acheterAbonnement, refreshAbonnement } = useAuth();
  const { colors } = useTheme();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState('');
  const [restoring, setRestoring] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const subs = await getSubscriptions();
      setPlans(subs);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    // Show success message for 5 seconds after subscription change
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  const handleUpgrade = async (productId: string) => {
    try {
      setProcessing(productId);
      await acheterAbonnement(productId);
      await refreshAbonnement();
      setShowSuccessMessage(true);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de finaliser l’abonnement.');
    } finally {
      setProcessing('');
    }
      <Text style={styles.title}>Gérer mon abonnement</Text>
      
      {/* Success message */}
      {showSuccessMessage && (
        <View style={styles.successMessage}>
          <CheckCircle size={20} color={colors.success} />
          <Text style={styles.successMessageText}>Votre abonnement a été mis à jour avec succès !</Text>
        </View>
      )}
      
      {/* Current subscription details */}
      {renderCurrentSubscription()}
      
      <Text style={styles.subtitle}>Choisissez votre formule</Text>
      
      {/* Subscription plans */}
      {loading ? <ActivityIndicator color={colors.primary} /> : (
        <View style={styles.plansGrid}>
          {plans.map(plan => {
            const Icon = PLAN_ICONS[plan.title] || Star;
            const isCurrentPlan = abonnementUtilisateur?.abonnement === plan.title;
            
            return (
              <PlanCard
                key={plan.productId}
                title={plan.title}
                price={parseFloat(plan.price) || 0}
                features={PLAN_FEATURES[plan.title] || []}
                isCurrentPlan={isCurrentPlan}
                onSelect={() => handleUpgrade(plan.productId)}
                isLoading={processing === plan.productId}
                icon={Icon}
              />
            );
          })}
        </View>
      )}
      
      {/* Restore purchases button */}
      <TouchableOpacity 
        style={styles.restoreButton} 
        onPress={handleRestorePurchases}
        disabled={restoring}
      > 
        <Text style={styles.restoreText}>
          {restoring ? 'Restauration en cours...' : 'Restaurer mes achats'}
        </Text>
        <ArrowRight size={18} color={colors.primary} />
      </TouchableOpacity>
      
      {/* Legal information */}
      <View style={styles.legalInfo}>
        <Text style={styles.legalText}>
          Les abonnements sont facturés via votre compte App Store et se renouvellent automatiquement 
          sauf si vous les annulez au moins 24h avant la fin de la période en cours.
        </Text>
        <Text style={styles.legalText}>
          Vous pouvez gérer vos abonnements dans les paramètres de votre compte App Store.
        </Text>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    alignItems: 'stretch',
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 18,
    textAlign: 'center',
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  successMessageText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
    flex: 1,
  },
  currentSubscriptionContainer: {
    marginBottom: 30,
  },
  currentSubscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentSubscriptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  planInfoCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  planInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  planInfoName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  planInfoDetails: {
    marginBottom: 20,
  },
  planInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  planInfoLabel: {
    fontSize: 14,
    color: colors.text,
    width: 120,
  },
  planInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  changePlanButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  changePlanButtonText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 16,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  plansGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  planCard: {
    width: '48%',
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  currentPlanCard: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primary + '05',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    flex: 1,
  },
  currentPlanBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentPlanBadgeText: {
    color: colors.background,
    fontSize: 10,
    fontWeight: '700',
  },
  planPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 4,
  },
  featuresList: {
    marginBottom: 16,
    flex: 1,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  featureText: {
    fontSize: 12,
    color: colors.text,
    flex: 1,
  },
  planButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentPlanButton: {
    backgroundColor: colors.success,
  },
  disabledButton: {
    opacity: 0.6,
  },
  planButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 24,
    padding: 8,
  },
  restoreText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 15,
    marginRight: 6,
  },
  legalInfo: {
    marginTop: 30,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  legalText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
}); 