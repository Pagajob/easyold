import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { 
  Camera, 
  Video, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  TrendingUp,
  FileText
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface EDLStatsCardProps {
  totalReservations: number;
  completedEDLs: number;
  pendingEDLs: number;
  averageCompletionTime?: number; // en minutes
  successRate?: number; // pourcentage
}

export default function EDLStatsCard({
  totalReservations,
  completedEDLs,
  pendingEDLs,
  averageCompletionTime = 0,
  successRate = 0
}: EDLStatsCardProps) {
  const { colors } = useTheme();
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const countAnimation = useRef(new Animated.Value(0)).current;
  const rateAnimation = useRef(new Animated.Value(0)).current;

  const styles = createStyles(colors);

  useEffect(() => {
    // Animer les compteurs
    Animated.parallel([
      Animated.timing(countAnimation, {
        toValue: completedEDLs,
        duration: 1000,
        useNativeDriver: false,
      }),
      Animated.timing(progressAnimation, {
        toValue: successRate,
        duration: 1000,
        useNativeDriver: false,
      }),
      Animated.timing(rateAnimation, {
        toValue: successRate,
        duration: 1000,
        useNativeDriver: false,
      }),
    ]).start();
  }, [completedEDLs, successRate]);

  const getCompletionRate = () => {
    if (totalReservations === 0) return 0;
    return Math.round((completedEDLs / totalReservations) * 100);
  };

  const getStatusColor = (type: 'success' | 'warning' | 'info') => {
    switch (type) {
      case 'success': return colors.success;
      case 'warning': return colors.warning;
      case 'info': return colors.info;
      default: return colors.textSecondary;
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <FileText size={20} color={colors.primary} />
        <Text style={styles.title}>Statistiques EDL</Text>
      </View>

      <View style={styles.statsGrid}>
        {/* Taux de réussite */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <CheckCircle size={16} color={colors.success} />
            <Text style={styles.statLabel}>Taux de réussite</Text>
          </View>
          
          <Animated.Text style={[
            styles.statValue,
            { color: colors.success }
          ]}>
            {rateAnimation.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%']
            })}
          </Animated.Text>
          
          <View style={styles.progressBar}>
            <Animated.View 
              style={[
                styles.progressFill,
                { 
                  width: progressAnimation.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%']
                  }),
                  backgroundColor: colors.success
                }
              ]} 
            />
          </View>
        </View>

        {/* EDLs complétés */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Camera size={16} color={colors.primary} />
            <Text style={styles.statLabel}>EDLs complétés</Text>
          </View>
          
          <Animated.Text style={[
            styles.statValue,
            { color: colors.primary }
          ]}>
            {countAnimation.interpolate({
              inputRange: [0, completedEDLs],
              outputRange: ['0', completedEDLs.toString()]
            })}
          </Animated.Text>
          
          <Text style={styles.statSubtext}>
            sur {totalReservations} réservations
          </Text>
        </View>

        {/* EDLs en attente */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <AlertCircle size={16} color={colors.warning} />
            <Text style={styles.statLabel}>En attente</Text>
          </View>
          
          <Text style={[
            styles.statValue,
            { color: colors.warning }
          ]}>
            {pendingEDLs}
          </Text>
          
          <Text style={styles.statSubtext}>
            à effectuer
          </Text>
        </View>

        {/* Temps moyen */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Clock size={16} color={colors.accent} />
            <Text style={styles.statLabel}>Temps moyen</Text>
          </View>
          
          <Text style={[
            styles.statValue,
            { color: colors.accent }
          ]}>
            {formatTime(averageCompletionTime)}
          </Text>
          
          <Text style={styles.statSubtext}>
            par EDL
          </Text>
        </View>
      </View>

      {/* Indicateurs visuels */}
      <View style={styles.indicators}>
        <View style={styles.indicator}>
          <View style={[styles.indicatorDot, { backgroundColor: colors.success }]} />
          <Text style={styles.indicatorText}>Complétés</Text>
        </View>
        
        <View style={styles.indicator}>
          <View style={[styles.indicatorDot, { backgroundColor: colors.warning }]} />
          <Text style={styles.indicatorText}>En attente</Text>
        </View>
        
        <View style={styles.indicator}>
          <View style={[styles.indicatorDot, { backgroundColor: colors.info }]} />
          <Text style={styles.indicatorText}>En cours</Text>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 6,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  indicatorText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
}); 