import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { ChevronLeft, ChevronRight, Calendar, Clock, X, Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface DualDatePickerProps {
  visible: boolean;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  onDatesSelect: (startDate: string, startTime: string, endDate: string, endTime: string) => void;
  onClose: () => void;
  title?: string;
  minDate?: Date;
  reservedDates?: string[];
}

const HOURS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00'
];

// European format (Monday to Sunday)
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']; 
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function DualDatePicker({
  visible,
  startDate,
  endDate,
  startTime,
  endTime,
  onDatesSelect,
  onClose,
  title = "Sélectionner les dates",
  minDate = new Date(),
  reservedDates = []
}: DualDatePickerProps) {
  const { colors } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);
  const [tempStartTime, setTempStartTime] = useState(startTime);
  const [tempEndTime, setTempEndTime] = useState(endTime);
  const [selectionMode, setSelectionMode] = useState<'start' | 'end'>('start');
  const [showTimeSelector, setShowTimeSelector] = useState(false);
  const [timeForDate, setTimeForDate] = useState<'start' | 'end'>('start');

  // Initialize with the selected dates or today
  useEffect(() => {
    if (visible) {
      if (startDate) {
        const date = new Date(startDate);
        if (!isNaN(date.getTime())) {
          setCurrentDate(date);
        }
      }
      setTempStartDate(startDate);
      setTempEndDate(endDate);
      setTempStartTime(startTime);
      setTempEndTime(endTime);
      setSelectionMode('start');
    }
  }, [startDate, endDate, startTime, endTime, visible]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get day of week (0-6, where 0 is Sunday)
    const startingDayOfWeek = firstDay.getDay();
    
    // Convert to European format (1-7, where 1 is Monday and 7 is Sunday)
    const adjustedStartingDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < adjustedStartingDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
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
    if (!date) return true;
    
    const compareDate = new Date(date.getTime());
    compareDate.setHours(0, 0, 0, 0);
    
    // If selecting end date, disable dates before start date
    if (selectionMode === 'end' && tempStartDate) {
      const startDateObj = new Date(tempStartDate);
      startDateObj.setHours(0, 0, 0, 0);
      return compareDate < startDateObj;
    }
    
    // For start date or if no start date is selected yet, disable dates before minDate
    const minDateCopy = new Date(minDate.getTime());
    minDateCopy.setHours(0, 0, 0, 0);
    return compareDate < minDateCopy;
  };

  const isDateSelected = (date: Date) => {
    if (!date) return false;
    const formattedDate = formatDateForComparison(date);
    
    if (selectionMode === 'start') {
      return formattedDate === tempStartDate;
    } else {
      return formattedDate === tempEndDate;
    }
  };

  const isDateInRange = (date: Date) => {
    if (!date || !tempStartDate || !tempEndDate) return false;
    
    const formattedDate = formatDateForComparison(date);
    const start = new Date(tempStartDate);
    const end = new Date(tempEndDate);
    
    // Convert to timestamp for comparison
    const dateTime = new Date(formattedDate).getTime();
    return dateTime > start.getTime() && dateTime < end.getTime();
  };

  const isToday = (date: Date) => {
    if (!date) return false;
    const today = new Date();
    return formatDateForComparison(date) === formatDateForComparison(today);
  };

  const handleDateSelect = (date: Date) => {
    if (isDateDisabled(date)) return;
    
    const formattedDate = formatDateForComparison(date);
    
    if (selectionMode === 'start') {
      setTempStartDate(formattedDate);
      // If end date is before new start date, clear it
      if (tempEndDate && new Date(tempEndDate) < date) {
        setTempEndDate('');
      }
      // Automatically switch to end date selection
      setSelectionMode('end');
    } else {
      setTempEndDate(formattedDate);
      // Show time selector for the selected end date
      setTimeForDate('end');
      setShowTimeSelector(true);
    }
  };

  const handleTimeSelect = (time: string) => {
    if (timeForDate === 'start') {
      setTempStartTime(time);
    } else {
      setTempEndTime(time);
    }
    setShowTimeSelector(false);
    
    // If we just selected start time, move to end date selection
    if (timeForDate === 'start') {
      setSelectionMode('end');
    }
  };

  const handleConfirm = () => {
    if (tempStartDate && tempEndDate && tempStartTime && tempEndTime) {
      onDatesSelect(tempStartDate, tempStartTime, tempEndDate, tempEndTime);
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

  const canNavigatePrev = () => {
    const prevMonth = new Date(currentDate);
    prevMonth.setMonth(currentDate.getMonth() - 1);
    return prevMonth.getFullYear() >= minDate.getFullYear() && 
           (prevMonth.getFullYear() > minDate.getFullYear() || 
            prevMonth.getMonth() >= minDate.getMonth());
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return 'Non sélectionnée';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const days = getDaysInMonth(currentDate);
  const styles = createStyles(colors);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity 
            onPress={handleConfirm} 
            style={[
              styles.confirmButton,
              (!tempStartDate || !tempEndDate || !tempStartTime || !tempEndTime) && styles.confirmButtonDisabled
            ]}
            disabled={!tempStartDate || !tempEndDate || !tempStartTime || !tempEndTime}
          >
            <Check size={20} color={colors.background} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Date Selection Mode Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, selectionMode === 'start' && styles.activeTab]}
              onPress={() => setSelectionMode('start')}
            >
              <Text style={[styles.tabText, selectionMode === 'start' && styles.activeTabText]}>
                🚀 Date de départ
              </Text>
              {tempStartDate && (
                <Text style={styles.selectedDateText}>
                  {formatDisplayDate(tempStartDate)}
                </Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tab, selectionMode === 'end' && styles.activeTab]}
              onPress={() => setSelectionMode('end')}
            >
              <Text style={[styles.tabText, selectionMode === 'end' && styles.activeTabText]}>
                🔙 Date de retour
              </Text>
              {tempEndDate && (
                <Text style={styles.selectedDateText}>
                  {formatDisplayDate(tempEndDate)}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Calendar */}
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
                    date && isDateInRange(date) && styles.dayCellInRange,
                    date && isDateDisabled(date) && styles.dayCellDisabled, 
                    date && reservedDates.includes(formatDateForComparison(date)) && styles.dayCellReserved,
                    date && isToday(date) && !isDateSelected(date) && !isDateInRange(date) && styles.dayCellToday,
                  ]}
                  onPress={() => date && handleDateSelect(date)}
                  disabled={!date || isDateDisabled(date)}
                  activeOpacity={0.7}
                >
                  {date && (
                    <Text style={[
                      styles.dayText,
                      isDateSelected(date) && styles.dayTextSelected,
                      isDateInRange(date) && styles.dayTextInRange,
                      isDateDisabled(date) && styles.dayTextDisabled, 
                      reservedDates.includes(formatDateForComparison(date)) && styles.dayTextReserved,
                      isToday(date) && !isDateSelected(date) && !isDateInRange(date) && styles.dayTextToday,
                    ]}>
                      {date.getDate()}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Time Selection */}
          <View style={styles.timeSection}>
            <View style={styles.timeSectionHeader}>
              <Clock size={20} color={colors.primary} />
              <Text style={styles.timeSectionTitle}>
                {selectionMode === 'start' ? 'Heure de départ' : 'Heure de retour'}
              </Text>
            </View>
            
            <View style={styles.timeButtonsContainer}>
              <TouchableOpacity 
                style={styles.timeButton}
                onPress={() => {
                  setTimeForDate(selectionMode);
                  setShowTimeSelector(true);
                }}
              >
                <Clock size={20} color={colors.primary} />
                <Text style={styles.timeButtonText}>
                  {selectionMode === 'start' 
                    ? tempStartTime || 'Sélectionner l\'heure de départ'
                    : tempEndTime || 'Sélectionner l\'heure de retour'
                  }
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Summary */}
          {tempStartDate && tempEndDate && tempStartTime && tempEndTime && (
            <View style={styles.summarySection}>
              <Text style={styles.summaryTitle}>📋 Résumé de la réservation</Text>
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Départ:</Text>
                  <Text style={styles.summaryValue}>
                    {formatDisplayDate(tempStartDate)} à {tempStartTime}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Retour:</Text>
                  <Text style={styles.summaryValue}>
                    {formatDisplayDate(tempEndDate)} à {tempEndTime}
                  </Text>
                </View>
                
                {/* Calculate duration */}
                {(() => {
                  const start = new Date(tempStartDate);
                  const end = new Date(tempEndDate);
                  const diffTime = Math.abs(end.getTime() - start.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  return (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Durée:</Text>
                      <Text style={[styles.summaryValue, { fontWeight: 'bold' }]}>
                        {diffDays} jour{diffDays > 1 ? 's' : ''}
                      </Text>
                    </View>
                  );
                })()}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Time Selector Modal */}
        <Modal
          visible={showTimeSelector}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowTimeSelector(false)}
        >
          <View style={styles.timeModalOverlay}>
            <View style={styles.timeModalContainer}>
              <View style={styles.timeModalHeader}>
                <Text style={styles.timeModalTitle}>
                  {timeForDate === 'start' ? 'Heure de départ' : 'Heure de retour'}
                </Text>
                <TouchableOpacity onPress={() => setShowTimeSelector(false)}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.timeGrid}>
                {HOURS.map((hour) => (
                  <TouchableOpacity
                    key={hour}
                    style={[
                      styles.timeCell,
                      (timeForDate === 'start' && tempStartTime === hour) || 
                      (timeForDate === 'end' && tempEndTime === hour) 
                        ? styles.timeCellSelected 
                        : {}
                    ]}
                    onPress={() => handleTimeSelect(hour)}
                  >
                    <Text style={[
                      styles.timeText,
                      (timeForDate === 'start' && tempStartTime === hour) || 
                      (timeForDate === 'end' && tempEndTime === hour) 
                        ? styles.timeTextSelected 
                        : {}
                    ]}>
                      {hour}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.confirmButtonLarge,
              (!tempStartDate || !tempEndDate || !tempStartTime || !tempEndTime) && styles.confirmButtonDisabled
            ]}
            onPress={handleConfirm}
            disabled={!tempStartDate || !tempEndDate || !tempStartTime || !tempEndTime}
          >
            <Text style={styles.confirmButtonText}>Confirmer</Text>
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
  },
  confirmButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: colors.border,
  },
  content: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeTab: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  activeTabText: {
    color: colors.primary,
  },
  selectedDateText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  calendarContainer: {
    backgroundColor: colors.surface,
    margin: 16,
    borderRadius: 28,
    padding: 16,
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
    marginBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 28,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  daysHeader: {
    flexDirection: 'row',
    marginBottom: 8,
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
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
  },
  dayCellInRange: {
    backgroundColor: colors.primary + '30',
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayCellReserved: {
    backgroundColor: 'transparent',
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  dayCellToday: {
    backgroundColor: colors.accent + '20',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  dayText: {
    fontSize: 16,
    color: colors.text,
  },
  dayTextSelected: {
    color: colors.background,
    fontWeight: '700',
  },
  dayTextInRange: {
    color: colors.primary,
    fontWeight: '500',
  },
  dayTextDisabled: {
    color: colors.textSecondary,
  },
  dayTextReserved: {
    color: colors.primary,
    fontWeight: '600',
  },
  dayTextToday: {
    color: colors.accent,
    fontWeight: '700',
  },
  timeSection: {
    backgroundColor: colors.surface,
    margin: 16,
    borderRadius: 28,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  timeSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  timeButtonsContainer: {
    gap: 12,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 28,
    padding: 16,
    gap: 12,
  },
  timeButtonText: {
    fontSize: 16,
    color: colors.text,
  },
  timeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  timeModalContainer: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  timeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  timeModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  timeCell: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  timeCellSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeText: {
    fontSize: 16,
    color: colors.text,
  },
  timeTextSelected: {
    color: colors.background,
    fontWeight: '700',
  },
  summarySection: {
    backgroundColor: colors.surface,
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: colors.primary + '10',
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: colors.text,
  },
  summaryValue: {
    fontSize: 16,
    color: colors.text,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  confirmButtonLarge: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: colors.border,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },
});