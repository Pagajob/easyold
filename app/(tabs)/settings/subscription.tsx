import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getSubscriptions } from '@/services/iapService';
import { Check, Star, Shield, Users, FileText, Settings, ArrowRight } from 'lucide-react-native';

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
    return (
      <View style={styles.currentCard}>
        <View style={styles.currentHeader}>
          <Icon size={32} color={colors.primary} style={{ marginRight: 12 }} />
          <View>
            <Text style={styles.currentTitle}>Votre abonnement actuel</Text>
            <View style={[styles.badge, { backgroundColor: abonnementUtilisateur.statut === 'actif' ? colors.success : colors.error }]}> 
              <Text style={styles.badgeText}>{abonnementUtilisateur.statut === 'actif' ? 'Actif' : 'Expiré'}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.planName}>{abonnementUtilisateur.abonnement}</Text>
        <Text style={styles.renewal}>Renouvellement : {new Date(abonnementUtilisateur.dateFin).toLocaleDateString('fr-FR')}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Gérer mon abonnement</Text>
      {renderCurrentPlan()}
      <Text style={styles.subtitle}>Choisissez votre formule</Text>
      {loading ? <ActivityIndicator color={colors.primary} /> : (
        plans.map(plan => {
          const Icon = PLAN_ICONS[plan.title] || Star;
          return (
            <View key={plan.productId} style={styles.planCard}>
              <View style={styles.planHeader}>
                <Icon size={28} color={colors.primary} style={{ marginRight: 10 }} />
                <Text style={styles.planTitle}>{plan.title}</Text>
                {abonnementUtilisateur?.abonnement === plan.title && (
                  <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.badgeText}>Sélectionné</Text>
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
                style={[styles.chooseButton, abonnementUtilisateur?.abonnement === plan.title && styles.chooseButtonSelected]}
                onPress={() => handleUpgrade(plan.productId)}
                disabled={processing === plan.productId || abonnementUtilisateur?.abonnement === plan.title}
                activeOpacity={0.8}
              >
                {processing === plan.productId ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text style={styles.chooseButtonText}>
                    {abonnementUtilisateur?.abonnement === plan.title ? 'Plan actuel' : 'Choisir ce plan'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          );
        })
      )}
      <TouchableOpacity style={styles.restoreButton} onPress={() => Alert.alert('Restaurer', 'Fonctionnalité à venir')}> 
        <Text style={styles.restoreText}>Restaurer un achat</Text>
        <ArrowRight size={18} color={colors.primary} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 24,
    alignItems: 'stretch',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 18,
    textAlign: 'center',
  },
  currentCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 22,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  currentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 4,
  },
  badgeText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 13,
  },
  planName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
    marginTop: 8,
    textAlign: 'center',
  },
  renewal: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 8,
  },
  planPrice: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  featuresList: {
    marginBottom: 14,
    marginTop: 2,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  featureText: {
    fontSize: 15,
    color: colors.text,
  },
  chooseButton: {
    backgroundColor: colors.primary,
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  chooseButtonSelected: {
    backgroundColor: colors.success,
  },
  chooseButtonText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 16,
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 18,
    padding: 8,
  },
  restoreText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 15,
    marginRight: 6,
  },
}); 