import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { ChevronLeft, ChevronRight, Calendar, Clock, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface CalendarPickerProps {
  visible: boolean;
  selectedDate: string;
  selectedTime: string;
  onDateTimeSelect: (date: string, time: string) => void;
  onClose: () => void;
  title: string;
  minDate?: Date | null;
}

const HOURS = [
  '08:00', '09:00', '10:00',
  '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00',
  '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00'
];

// European format (Monday to Sunday)
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']; 
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function CalendarPicker({
  visible,
  selectedDate,
  selectedTime,
  onDateTimeSelect,
  onClose,
  title,
  minDate = new Date()
}: CalendarPickerProps) {
  const { colors } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tempSelectedDate, setTempSelectedDate] = useState(selectedDate);
  const [tempSelectedTime, setTempSelectedTime] = useState(selectedTime);

  // Initialiser avec la date sélectionnée ou aujourd'hui
  useEffect(() => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      if (!isNaN(date.getTime())) {
        setCurrentDate(date);
        setTempSelectedDate(selectedDate);
      }
    }
    if (selectedTime) {
      setTempSelectedTime(selectedTime);
    }
  }, [selectedDate, selectedTime, visible]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const startingDayOfWeek = firstDay.getDay();
    
    const adjustedStartingDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

    const days = [];
    
    for (let i = 0; i < adjustedStartingDay; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    const totalCells = Math.ceil(days.length / 7) * 7;
    while (days.length < totalCells) {
      days.push(null);
    }
    
    return days;
  };

  const formatDateForComparison = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const compareDate = new Date(date.getTime()); 
    compareDate.setHours(0, 0, 0, 0);
    
    if (minDate !== null && minDate !== undefined) {
      const minDateCopy = new Date(minDate.getTime()); 
      minDateCopy.setHours(0, 0, 0, 0);
      return compareDate < minDateCopy;
    }
    return false;
  };

  const isDateSelected = (date: Date) => {
    const formattedDate = formatDateForComparison(date);
    return formattedDate === tempSelectedDate;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    const formattedDate = formatDateForComparison(date);
    const formattedToday = formatDateForComparison(today);
    return formattedDate === formattedToday;
  };

  const handleDateSelect = (date: Date) => {
    if (isDateDisabled(date)) return;
    setTempSelectedDate(formatDateForComparison(date));
  };

  const handleTimeSelect = (time: string) => {
    setTempSelectedTime(time);
  };

  const handleConfirm = () => {
    if (tempSelectedDate && tempSelectedTime) {
      onDateTimeSelect(tempSelectedDate, tempSelectedTime);
    }
  };

  const handleCancel = () => {
    setTempSelectedDate(selectedDate);
    setTempSelectedTime(selectedTime);
    onClose();
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

  const canNavigatePrev = () => {
    const prevMonth = new Date(currentDate);
    prevMonth.setMonth(currentDate.getMonth() - 1);
    if (minDate === null) {
      return true;
    }
    
    if (minDate) {
      return prevMonth.getFullYear() > minDate.getFullYear() || 
             (prevMonth.getFullYear() === minDate.getFullYear() && prevMonth.getMonth() >= minDate.getMonth());
    }
    if (minDate === null) {
      return true;
    }
    
    if (minDate !== null && minDate !== undefined) {
    }
    
    return false;
    
    const today = new Date();
    return prevMonth.getFullYear() > today.getFullYear() || 
           (prevMonth.getFullYear() === today.getFullYear() && prevMonth.getMonth() >= today.getMonth());
  };

  const days = getDaysInMonth(currentDate);
  const styles = createStyles(colors);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleCancel}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity 
            onPress={handleConfirm} 
            style={[
              styles.confirmButton,
              (!tempSelectedDate || !tempSelectedTime) && styles.confirmButtonDisabled
            ]}
            disabled={!tempSelectedDate || !tempSelectedTime}
          >
            <Text style={[
              styles.confirmText,
              (!tempSelectedDate || !tempSelectedTime) && styles.confirmTextDisabled
            ]}>
              Confirmer
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Calendar Section */}
          <View style={styles.calendarSection}>
            <View style={styles.sectionHeader}>
              <Calendar size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Sélectionner une date</Text>
            </View>

            <View style={styles.calendarContainer}>
              <View style={styles.calendarHeader}>
                <TouchableOpacity 
                  onPress={() => navigateMonth('prev')} 
                  style={[styles.navButton, !canNavigatePrev() && styles.navButtonDisabled]}
                  disabled={!canNavigatePrev()}
                >
                  <ChevronLeft size={24} color={canNavigatePrev() ? colors.primary : colors.textSecondary} />
                </TouchableOpacity>
                <Text style={styles.monthYear}>
                  {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                </Text>
                <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
                  <ChevronRight size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.daysHeader}>
                {DAYS.map((day) => (
                  <View key={day} style={styles.dayHeader}>
                    <Text style={styles.dayHeaderText}>{day}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.daysGrid}>
                {days.map((date, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayCell,
                      date && isDateSelected(date) && styles.dayCellSelected,
                      date && isDateDisabled(date) && styles.dayCellDisabled,
                      date && isToday(date) && !isDateSelected(date) && styles.dayCellToday,
                    ]}
                    onPress={() => date && handleDateSelect(date)}
                    disabled={!date || isDateDisabled(date)}
                    activeOpacity={0.7}
                  >
                    {date && (
                      <Text style={[
                        styles.dayText,
                        isDateSelected(date) && styles.dayTextSelected,
                        isDateDisabled(date) && styles.dayTextDisabled,
                        isToday(date) && !isDateSelected(date) && styles.dayTextToday,
                      ]}>
                        {date.getDate()}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Time Section */}
          <View style={styles.timeSection}>
            <View style={styles.sectionHeader}>
              <Clock size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Sélectionner une heure</Text>
            </View>
            
            <View style={styles.timeContainer}>
              <View style={styles.timeGrid}>
                {HOURS.map((hour) => (
                  <TouchableOpacity
                    key={hour}
                    style={[
                      styles.timeCell,
                      tempSelectedTime === hour && styles.timeCellSelected
                    ]}
                    onPress={() => handleTimeSelect(hour)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.timeText,
                      tempSelectedTime === hour && styles.timeTextSelected
                    ]}>
                      {hour}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Summary Section */}
          {tempSelectedDate && tempSelectedTime && (
            <View style={styles.summarySection}>
              <Text style={styles.summaryTitle}>Résumé de la sélection</Text>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryText}>
                  {new Date(tempSelectedDate).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })} à {tempSelectedTime}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleConfirm} 
            style={[
              styles.confirmButtonLarge,
              (!tempSelectedDate || !tempSelectedTime) && styles.confirmButtonDisabled
            ]}
            disabled={!tempSelectedDate || !tempSelectedTime}
          >
            <Text style={[
              styles.confirmButtonText,
              (!tempSelectedDate || !tempSelectedTime) && styles.confirmTextDisabled
            ]}>
              Confirmer la sélection
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  confirmButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  confirmTextDisabled: {
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  calendarSection: {
    padding: 20,
    paddingBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  calendarContainer: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  navButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    backgroundColor: colors.background,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  monthYear: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  daysHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  dayCell: {
    width: '14.285714%', // Exactly 100% / 7
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginVertical: 1,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayCellToday: {
    backgroundColor: colors.accent + '20',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  dayTextSelected: {
    color: colors.background,
    fontWeight: '700',
  },
  dayTextDisabled: {
    color: colors.textSecondary,
  },
  dayTextToday: {
    color: colors.accent,
    fontWeight: '700',
  },
  timeSection: {
    padding: 20,
  },
  timeContainer: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeCell: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  timeCellSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  timeTextSelected: {
    color: colors.background,
    fontWeight: '700',
  },
  summarySection: {
    padding: 20,
    paddingTop: 0,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: colors.primary + '10',
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  confirmButtonLarge: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },
});