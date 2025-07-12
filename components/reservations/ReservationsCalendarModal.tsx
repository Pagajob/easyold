import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useReservations } from '@/hooks/useReservations';
import { useVehicles } from '@/hooks/useVehicles';
import { useClients } from '@/hooks/useClients';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';

const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  return days;
}

function getWeeks(year: number, month: number) {
  // Retourne un tableau de semaines, chaque semaine est un tableau de 7 dates (ou null)
  const days = getMonthDays(year, month);
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const calendarCells = Array(offset).fill(null).concat(days);
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);
  const weeks = [];
  for (let i = 0; i < calendarCells.length; i += 7) {
    weeks.push(calendarCells.slice(i, i + 7));
  }
  return weeks;
}

function getReservationColor(res, colors) {
  if (res.statut === 'Confirmé') return colors.success + 'E0';
  if (res.statut === 'Annulé') return colors.error + 'B0';
  if (res.statut === 'En cours') return colors.info + 'E0';
  if (res.statut === 'Terminé') return colors.textSecondary + '80';
  return colors.primary + 'E0';
}

function getShortClientName(name) {
  return name.split(' ')[0];
}

export default function ReservationsCalendarModal({ visible, onClose }: { visible: boolean, onClose: () => void }) {
  const { colors } = useTheme();
  const { reservations } = useReservations();
  const { getVehicleName } = useVehicles();
  const { getClientName } = useClients();
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const weeks = getWeeks(year, month);

  // Préparer les réservations à afficher (celles qui touchent ce mois)
  const reservationsToShow = reservations.filter(res => {
    const start = new Date(res.dateDebut);
    const end = new Date(res.dateFin);
    return (
      (start.getFullYear() === year && start.getMonth() === month) ||
      (end.getFullYear() === year && end.getMonth() === month) ||
      (start < new Date(year, month + 1, 1) && end >= new Date(year, month, 1))
    );
  });

  // Pour chaque semaine, placer les réservations sur des lignes (éviter le chevauchement)
  function getWeekReservations(week) {
    // Pour chaque réservation, déterminer si elle occupe cette semaine
    const weekStart = week[0] ? new Date(week[0]) : null;
    const weekEnd = week[6] ? new Date(week[6]) : null;
    if (!weekStart || !weekEnd) return [];
    // Sélectionner les réservations qui touchent cette semaine
    const weekResas = reservationsToShow.filter(res => {
      const start = new Date(res.dateDebut);
      const end = new Date(res.dateFin);
      return end >= weekStart && start <= weekEnd;
    });
    // Placement sur lignes (greedy)
    const lines = [];
    weekResas.forEach(res => {
      const start = new Date(res.dateDebut);
      const end = new Date(res.dateFin);
      // Calculer la colonne de début et de fin dans la semaine
      const startCol = Math.max(0, Math.floor((start - weekStart) / (1000*60*60*24)));
      const endCol = Math.min(6, Math.floor((end - weekStart) / (1000*60*60*24)));
      // Chercher une ligne libre
      let placed = false;
      for (let l = 0; l < lines.length; l++) {
        let conflict = false;
        for (let c = startCol; c <= endCol; c++) {
          if (lines[l][c]) { conflict = true; break; }
        }
        if (!conflict) {
          for (let c = startCol; c <= endCol; c++) lines[l][c] = res;
          placed = true;
          break;
        }
      }
      if (!placed) {
        const newLine = Array(7).fill(null);
        for (let c = startCol; c <= endCol; c++) newLine[c] = res;
        lines.push(newLine);
      }
    });
    return lines;
  }

  const styles = createStyles(colors);
  const screenHeight = Dimensions.get('window').height;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.modal, { maxHeight: screenHeight * 0.92 }]}> 
          <View style={styles.header}>
            <View style={styles.headerCenter}>
              <TouchableOpacity onPress={() => setCurrentDate(new Date(year, month - 1, 1))}>
                <ChevronLeft size={26} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{MONTHS[month]} {year}</Text>
              <TouchableOpacity onPress={() => setCurrentDate(new Date(year, month + 1, 1))}>
                <ChevronRight size={26} color={colors.text} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={26} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.daysRow}>
            {DAYS.map((d, i) => (
              <Text key={i} style={styles.dayLabel}>{d}</Text>
            ))}
          </View>
          <ScrollView contentContainerStyle={styles.calendarContent} showsVerticalScrollIndicator={false}>
            <View>
              {weeks.map((week, wIdx) => {
                const weekLines = getWeekReservations(week);
                return (
                  <View key={wIdx} style={styles.weekRow}>
                    {/* Jours de la semaine (cases vides) */}
                    <View style={styles.weekDaysRow}>
                      {week.map((date, dIdx) => (
                        <View key={dIdx} style={styles.cell}>
                          {date && <Text style={styles.cellDate}>{date.getDate()}</Text>}
                        </View>
                      ))}
                    </View>
                    {/* Lignes de réservations */}
                    {weekLines.map((line, lIdx) => (
                      <View key={lIdx} style={styles.resaLineRow}>
                        {line.map((res, dIdx) => {
                          if (!res) return <View key={dIdx} style={styles.resaCell} />;
                          // Afficher la barre seulement au début
                          if (dIdx > 0 && res === line[dIdx-1]) return null;
                          // Largeur en colonnes
                          let width = 1;
                          for (let k = dIdx+1; k < 7 && line[k] === res; k++) width++;
                          const veh = getVehicleName(res.vehiculeId);
                          const client = getShortClientName(getClientName(res.clientId));
                          return (
                            <View
                              key={dIdx}
                              style={[styles.resaBar, {
                                backgroundColor: getReservationColor(res, colors),
                                flex: width,
                              }]}
                            >
                              <Text style={styles.resaBarText} numberOfLines={1}>{veh} {client}</Text>
                            </View>
                          );
                        })}
                      </View>
                    ))}
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
      </View>
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
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 24,
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
    minHeight: 64,
    borderWidth: 0.5,
    borderColor: colors.border,
    padding: 2,
    borderRadius: 8,
    marginBottom: 2,
    backgroundColor: colors.background,
  },
  cellDate: {
    fontSize: 13,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'right',
  },
  resaTag: {
    borderRadius: 8,
    paddingHorizontal: 4,
    marginVertical: 2,
    minHeight: 20,
    justifyContent: 'center',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  resaText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  resaLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
    marginBottom: 1,
  },
  resaCell: {
    width: `${100/7}%`,
    minHeight: 20,
    borderWidth: 0.5,
    borderColor: colors.border,
    padding: 2,
    borderRadius: 8,
    marginBottom: 2,
    backgroundColor: colors.background,
  },
  resaBar: {
    height: '100%',
    borderRadius: 8,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  resaBarText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
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
}); 