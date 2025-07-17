import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useReservations } from '@/hooks/useReservations';
import { useVehicles } from '@/hooks/useVehicles';
import { useClients } from '@/hooks/useClients';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  return days;
}

const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function ReservationsCalendarScreen() {
  const { colors } = useTheme();
  const { reservations } = useReservations();
  const { getVehicleName } = useVehicles();
  const { getClientName } = useClients();
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = getMonthDays(year, month);

  // Pour aligner le 1er jour du mois sur le bon jour de la semaine
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const calendarCells = Array(offset).fill(null).concat(days);
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  // Regrouper les réservations par jour
  const reservationsByDay: { [key: string]: any[] } = {};
  reservations.forEach(res => {
    const start = new Date(res.dateDebut);
    const end = new Date(res.dateRetourPrevue);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      if (!reservationsByDay[key]) reservationsByDay[key] = [];
      reservationsByDay[key].push(res);
    }
  });

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentDate(new Date(year, month - 1, 1))}>
          <ChevronLeft size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{MONTHS[month]} {year}</Text>
        <TouchableOpacity onPress={() => setCurrentDate(new Date(year, month + 1, 1))}>
          <ChevronRight size={28} color={colors.text} />
        </TouchableOpacity>
      </View>
      <View style={styles.daysRow}>
        {DAYS.map((d, i) => (
          <Text key={i} style={styles.dayLabel}>{d}</Text>
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.calendarContent}>
        <View style={styles.calendarGrid}>
          {calendarCells.map((date, idx) => {
            const key = date ? date.toISOString().slice(0, 10) : `empty-${idx}`;
            const dayReservations = date ? reservationsByDay[key] || [] : [];
            return (
              <View key={key} style={styles.cell}>
                {date && <Text style={styles.cellDate}>{date.getDate()}</Text>}
                {dayReservations.map((res, i) => {
                  const veh = getVehicleName(res.vehiculeId);
                  const client = getClientName(res.clientId).split(' ')[0];
                  return (
                    <View key={i} style={[styles.resaTag, {backgroundColor: colors.primary + '20'}]}>
                      <Text style={styles.resaText} numberOfLines={1}>{veh} {client}</Text>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
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
    minHeight: 60,
    borderWidth: 0.5,
    borderColor: colors.border,
    padding: 2,
  },
  cellDate: {
    fontSize: 13,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'right',
  },
  resaTag: {
    borderRadius: 4,
    paddingHorizontal: 2,
    marginVertical: 1,
    minHeight: 18,
    justifyContent: 'center',
  },
  resaText: {
    fontSize: 11,
    color: colors.text,
  },
}); 