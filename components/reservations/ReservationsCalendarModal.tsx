import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Dimensions, Alert } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useReservations } from '@/hooks/useReservations';
import { useVehicles } from '@/hooks/useVehicles';
import { useClients } from '@/hooks/useClients';
import { X, ChevronLeft, ChevronRight, Car, Clock, User } from 'lucide-react-native';
import { router } from 'expo-router';

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];
  
  // Ajouter les jours vides du début
  const startingDayOfWeek = firstDay.getDay();
  const adjustedStartingDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
  for (let i = 0; i < adjustedStartingDay; i++) {
    days.push(null);
  }
  
  // Ajouter tous les jours du mois
  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day));
  }
  
  // Compléter avec des jours vides à la fin
  const totalCells = Math.ceil(days.length / 7) * 7;
  while (days.length < totalCells) {
    days.push(null);
  }
  
  return days;
}

function getReservationColor(status: string, colors: any) {
  switch (status) {
    case 'Confirmé': return colors.success;
    case 'En cours': return colors.warning;
    case 'Planifiée': return colors.info;
    case 'Terminé': return colors.textSecondary;
    case 'Annulé': return colors.error;
    default: return colors.primary;
  }
}

function getShortClientName(name: string) {
  return name.split(' ')[0];
}

function getShortVehicleName(vehicleName: string) {
  const parts = vehicleName.split(' ');
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[1]}`;
  }
  return vehicleName;
}

export default function ReservationsCalendarModal({ visible, onClose }: { visible: boolean, onClose: () => void }) {
  const { colors } = useTheme();
  const { reservations } = useReservations();
  const { getVehicleName } = useVehicles();
  const { getClientName } = useClients();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedReservation, setSelectedReservation] = useState<any>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = getMonthDays(year, month);

  // Filtrer les réservations pour le mois actuel
  const monthReservations = reservations.filter(res => {
    const start = new Date(res.dateDebut);
    const end = new Date(res.dateRetourPrevue);
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    
    return (
      (start <= monthEnd && end >= monthStart) &&
      res.statut !== 'Annulé'
    );
  });

  // Obtenir les réservations pour une date spécifique
  const getReservationsForDate = (date: Date) => {
    if (!date) return [];
    
    const dateString = date.toISOString().split('T')[0];
    return monthReservations.filter(res => {
      const start = new Date(res.dateDebut);
      const end = new Date(res.dateRetourPrevue);
      const checkDate = new Date(dateString);
      
      return checkDate >= start && checkDate <= end;
    });
  };

  const handleReservationPress = (reservation: any) => {
    setSelectedReservation(reservation);
  };

  const handleViewReservationDetails = () => {
    if (selectedReservation) {
      onClose();
      setTimeout(() => {
        router.push(`/reservations/details/${selectedReservation.id}`);
      }, 300);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const isToday = (date: Date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const styles = createStyles(colors);
  const screenHeight = Dimensions.get('window').height;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity activeOpacity={1} style={styles.backdrop} onPress={onClose}>
        <View style={[styles.modal, { maxHeight: screenHeight * 0.92 }]} pointerEvents="box-none">
          <View style={styles.header}>
            <View style={styles.headerCenter}>
              <TouchableOpacity onPress={() => navigateMonth('prev')}>
                <ChevronLeft size={26} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{MONTHS[month]} {year}</Text>
              <TouchableOpacity onPress={() => navigateMonth('next')}>
                <ChevronRight size={26} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.daysRow}>
            {DAYS.map((day, i) => (
              <Text key={i} style={styles.dayLabel}>{day}</Text>
            ))}
          </View>

          <ScrollView contentContainerStyle={styles.calendarContent} showsVerticalScrollIndicator={false}>
            <View style={styles.calendarGrid}>
              {days.map((date, index) => {
                const dateReservations = getReservationsForDate(date);
                const isTodayDate = isToday(date);
                
                return (
                  <View key={index} style={[styles.cell, isTodayDate && styles.todayCell]}>
                    {date && (
                      <>
                        <Text style={[styles.cellDate, isTodayDate && styles.todayDate]}>
                          {date.getDate()}
                        </Text>
                        
                        <View style={styles.reservationsContainer}>
                          {dateReservations.map((reservation, resIndex) => {
                            const vehicleName = getVehicleName(reservation.vehiculeId);
                            const clientName = getClientName(reservation.clientId);
                            const isStartDate = new Date(reservation.dateDebut).toDateString() === date.toDateString();
                            
                            return (
                              <TouchableOpacity
                                key={resIndex}
                                style={[
                                  styles.reservationTag,
                                  { backgroundColor: getReservationColor(reservation.statut, colors) + '20' }
                                ]}
                                onPress={() => handleReservationPress(reservation)}
                                activeOpacity={0.7}
                              >
                                {isStartDate && (
                                  <View style={styles.timeContainer}>
                                    <Clock size={10} color={getReservationColor(reservation.statut, colors)} />
                                    <Text style={[styles.timeText, { color: getReservationColor(reservation.statut, colors) }]}>
                                      {reservation.heureDebut}
                                    </Text>
                                  </View>
                                )}
                                
                                <View style={styles.vehicleContainer}>
                                  <Car size={10} color={getReservationColor(reservation.statut, colors)} />
                                  <Text style={[styles.vehicleText, { color: getReservationColor(reservation.statut, colors) }]} numberOfLines={1}>
                                    {getShortVehicleName(vehicleName)}
                                  </Text>
                                </View>
                                

                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </>
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              onClose();
              setTimeout(() => router.push('/reservations/add'), 250);
            }}
          >
            <Text style={styles.addButtonText}>+ Ajouter une réservation</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Modal de détails de réservation */}
      {selectedReservation && (
        <Modal
          visible={!!selectedReservation}
          animationType="slide"
          transparent
          onRequestClose={() => setSelectedReservation(null)}
        >
          <View style={styles.detailBackdrop}>
            <View style={styles.detailModal}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailTitle}>Détails de la réservation</Text>
                <TouchableOpacity onPress={() => setSelectedReservation(null)}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.detailContent}>
                <View style={styles.detailRow}>
                  <Car size={20} color={colors.primary} />
                  <Text style={styles.detailLabel}>Véhicule:</Text>
                  <Text style={styles.detailValue}>
                    {getVehicleName(selectedReservation.vehiculeId)}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <User size={20} color={colors.accent} />
                  <Text style={styles.detailLabel}>Client:</Text>
                  <Text style={styles.detailValue}>
                    {getClientName(selectedReservation.clientId)}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Clock size={20} color={colors.warning} />
                  <Text style={styles.detailLabel}>Départ:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedReservation.dateDebut).toLocaleDateString('fr-FR')} à {selectedReservation.heureDebut}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Clock size={20} color={colors.success} />
                  <Text style={styles.detailLabel}>Retour:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedReservation.dateRetourPrevue).toLocaleDateString('fr-FR')} à {selectedReservation.heureRetourPrevue}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Statut:</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getReservationColor(selectedReservation.statut, colors) + '20' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: getReservationColor(selectedReservation.statut, colors) }
                    ]}>
                      {selectedReservation.statut}
                    </Text>
                  </View>
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.viewDetailsButton}
                onPress={handleViewReservationDetails}
              >
                <Text style={styles.viewDetailsText}>Voir les détails complets</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(30,30,40,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  modal: {
    width: '95%',
    maxWidth: 500,
    maxHeight: '65%',
    backgroundColor: colors.surface,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
    paddingBottom: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    position: 'relative',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  closeBtn: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
    zIndex: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.surface,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  calendarContent: {
    padding: 4,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100/7}%`,
    minHeight: 80,
    borderWidth: 0.5,
    borderColor: colors.border,
    padding: 4,
    borderRadius: 8,
    marginBottom: 2,
    backgroundColor: colors.background,
  },
  todayCell: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
    borderWidth: 2,
  },
  cellDate: {
    fontSize: 13,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'right',
  },
  todayDate: {
    color: colors.primary,
    fontWeight: '800',
  },
  reservationsContainer: {
    gap: 2,
  },
  reservationTag: {
    borderRadius: 6,
    padding: 4,
    marginBottom: 2,
    minHeight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 1,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  vehicleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 1,
  },
  vehicleText: {
    fontSize: 10,
    fontWeight: '500',
    flex: 1,
  },
  clientContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  clientText: {
    fontSize: 10,
    fontWeight: '500',
    flex: 1,
  },
  addButton: {
    margin: 16,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 2,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  detailBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(30,30,40,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  detailModal: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  detailContent: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    minWidth: 80,
  },
  detailValue: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  viewDetailsButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  viewDetailsText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 