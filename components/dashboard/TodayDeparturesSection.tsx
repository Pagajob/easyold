import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Calendar, Clock, User, Car, FileText } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useReservations } from '@/hooks/useReservations';
import { useVehicles } from '@/hooks/useVehicles';
import { useClients } from '@/hooks/useClients';
import { router } from 'expo-router';

export default function TodayDeparturesSection() {
  const { colors } = useTheme();
  const { reservations, canStartEDL } = useReservations();
  const { getVehicleName } = useVehicles();
  const { getClientName } = useClients();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, []);
  
  // Get today's date at midnight for comparison
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);
  
  // Get tomorrow's date at midnight for comparison
  const tomorrow = useMemo(() => {
    const date = new Date(today);
    date.setDate(date.getDate() + 1);
    return date;
  }, [today]);
  
  // Filter reservations for today's departures
  const todayDepartures = useMemo(() => {
    return reservations
      .filter(reservation => {
        try {
          const departureDate = new Date(reservation.dateDebut);
          departureDate.setHours(0, 0, 0, 0);
          return (
            departureDate.getTime() === today.getTime() && 
            (reservation.statut === 'Planifiée' || reservation.statut === 'Confirmé')
          );
        } catch (e) {
          return false;
        }
      })
      .sort((a, b) => {
        // Sort by departure time
        const timeA = a.heureDebut || '00:00';
        const timeB = b.heureDebut || '00:00';
        return timeA.localeCompare(timeB);
      });
  }, [reservations, today]);

  const formatTime = (timeString: string) => {
    // Ensure time is in HH:MM format
    if (!timeString) return '--:--';
    return timeString;
  };

  // Calculate time remaining until departure
  const getTimeRemaining = (departureDate: string, departureTime: string) => {
    try {
      // Create a Date object for the departure time
      const [hours, minutes] = departureTime.split(':').map(Number);
      const departure = new Date(departureDate);
      departure.setHours(hours, minutes, 0, 0);
      
      // Calculate difference in milliseconds
      const diffMs = departure.getTime() - currentTime.getTime();
      
      // If departure time has passed
      if (diffMs <= 0) {
        return { text: "Départ imminent", isUrgent: true };
      }
      
      // Calculate hours and minutes
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      // Format the time remaining
      let timeText = '';
      if (diffHours > 0) {
        timeText += `${diffHours}h `;
      }
      timeText += `${diffMinutes}min`;
      
      // Determine if it's urgent (less than 1 hour)
      const isUrgent = diffHours === 0 && diffMinutes <= 60;
      
      return { text: timeText, isUrgent };
    } catch (e) {
      return { text: "Heure inconnue", isUrgent: false };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Planifiée': return colors.info;
      case 'Confirmé': return colors.success;
      case 'En cours': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  const handleEDLPress = (reservationId: string) => {
    router.push(`/reservations/edl/${reservationId}`);
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={{ fontSize: 24, marginBottom: 4 }}>🚀</Text>
        <Text style={styles.title}>Départs du jour</Text>
      </View>

      {todayDepartures.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Aucun départ prévu aujourd'hui</Text>
        </View>
      ) : (
        <FlatList
          data={todayDepartures}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.departureCard}>
              <View style={styles.departureHeader}>
                <View style={styles.timeContainer}>
                  <Clock size={16} color={colors.primary} />
                  <Text style={styles.timeText}>{formatTime(item.heureDebut)}</Text>
                </View>
                <View style={[
                  styles.statusBadge, 
                  { backgroundColor: getStatusColor(item.statut) + '20' }
                ]}>
                  <Text style={[
                    styles.statusText, 
                    { color: getStatusColor(item.statut) }
                  ]}>
                    {item.statut}
                  </Text>
                </View>
              </View>
              
              <View style={styles.departureDetails}>
                <View style={styles.detailRow}>
                  <User size={16} color={colors.accent} />
                  <Text style={styles.detailText}>
                    {getClientName(item.clientId)}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Car size={16} color={colors.primary} />
                  <Text style={styles.detailText}>
                    {getVehicleName(item.vehiculeId)}
                  </Text>
                </View>
                
                {/* Countdown timer */}
                {(() => {
                  const { text, isUrgent } = getTimeRemaining(item.dateDebut, item.heureDebut);
                  return (
                    <View style={styles.countdownContainer}>
                      <Text style={[
                        styles.countdownText,
                        isUrgent && styles.countdownUrgent
                      ]}>
                        {isUrgent ? '🔥 ' : '⏱️ '}Départ dans: {text}
                      </Text>
                    </View>
                  );
                })()}
                
                {/* EDL Button */}
                {canStartEDL(item) && !item.edlDepart && (
                  <TouchableOpacity
                    style={styles.edlButton}
                    onPress={() => handleEDLPress(item.id)}
                  >
                    <FileText size={16} color={colors.background} />
                    <Text style={styles.edlButtonText}>EDL de départ</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  departureCard: {
    backgroundColor: colors.background,
    borderRadius: 28,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  departureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  departureDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.text,
  },
  countdownContainer: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  countdownText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  countdownUrgent: {
    color: colors.error,
    fontWeight: '700',
  },
  edlButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  edlButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background,
  }
});