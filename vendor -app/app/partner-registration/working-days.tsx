import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

const TOTAL_STEPS = 7;
const CURRENT_STEP = 3;
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Step3WorkingDays() {
  const router = useRouter();
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const allSelected = selectedDays.length === DAYS.length;

  const [sameTime, setSameTime] = useState<boolean>(true);
  const [commonOpenTime, setCommonOpenTime] = useState<Date>(new Date(0, 0, 0, 9, 0));
  const [commonCloseTime, setCommonCloseTime] = useState<Date>(new Date(0, 0, 0, 18, 0));
  const [dayTimes, setDayTimes] = useState<Record<string, { open: Date; close: Date }>>(
    () => {
      const initial: Record<string, { open: Date; close: Date }> = {};
      DAYS.forEach(day => {
        initial[day] = { open: new Date(0, 0, 0, 9, 0), close: new Date(0, 0, 0, 18, 0) };
      });
      return initial;
    }
  );

  const [showPicker, setShowPicker] = useState<{ day?: string; type?: 'open' | 'close' }>({});

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const selectAllDays = () => setSelectedDays(DAYS);
  const deselectAllDays = () => setSelectedDays([]);

  const onChangeTime = (event: any, selectedDate?: Date) => {
    if (!selectedDate) {
      setShowPicker({});
      return;
    }
    if (showPicker.day && showPicker.type) {
      if (showPicker.day === 'common') {
        if (showPicker.type === 'open') setCommonOpenTime(selectedDate);
        else setCommonCloseTime(selectedDate);
      } else {
        setDayTimes(prev => ({
          ...prev,
          [showPicker.day!]: { ...prev[showPicker.day!], [showPicker.type!]: selectedDate },
        }));
      }
    }
    setShowPicker({});
  };

  const formatTime = (date: Date): string => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const mStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${mStr} ${ampm}`;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.headerSpacer} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.stepLabel}>
          {'STEP ' + CURRENT_STEP + ' / ' + TOTAL_STEPS + ': WORKING DAYS'}
        </Text>

        {/* Step bar */}
        <View style={styles.stepContainer}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => {
            const isCompleted = i < CURRENT_STEP - 1;
            const isCurrent = i === CURRENT_STEP - 1;
            const isUpcoming = i > CURRENT_STEP - 1;
            
            return (
              <React.Fragment key={i}>
                <View
                  style={[
                    styles.stepBox,
                    isCompleted && styles.completedStep,
                    isCurrent && styles.activeStep,
                    isUpcoming && styles.inactiveStep,
                  ]}
                >
                  <Text
                    style={
                      isCompleted || isCurrent
                        ? styles.stepTextActive
                        : styles.stepTextInactive
                    }
                  >
                    {i + 1}
                  </Text>
                </View>
                {i < TOTAL_STEPS - 1 && (
                  <View
                    style={[
                      styles.stepLine,
                      isCompleted && styles.stepLineCompleted,
                    ]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>

        <Text style={styles.sectionHeader}>Select Shop Working Days</Text>
        <View style={styles.optionsRow}>
          <TouchableOpacity
            style={[styles.selectAllBtn, allSelected && styles.selectAllActive]}
            onPress={allSelected ? deselectAllDays : selectAllDays}
          >
            <Text style={allSelected ? styles.selectAllTextActive : styles.selectAllText}>
              {allSelected ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.daysList}>
          {DAYS.map(day => {
            const isSelected = selectedDays.includes(day);
            return (
              <TouchableOpacity key={day} onPress={() => toggleDay(day)} activeOpacity={0.7}>
                <View style={[styles.dayItem, isSelected && styles.dayItemSelected]}>
                  <Text style={isSelected ? styles.dayTextSelected : styles.dayText}>
                    {isSelected ? '✓ ' + day : day}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionHeader}>Shop Opening & Closing Time</Text>

        <View style={styles.optionsRow}>
          <TouchableOpacity
            style={[styles.toggleButton, sameTime && styles.toggleButtonActive]}
            onPress={() => setSameTime(true)}
          >
            <Text style={sameTime ? styles.toggleTextActive : styles.toggleText}>
              I open and close my shop at the same time on all working days
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.optionsRow}>
          <TouchableOpacity
            style={[styles.toggleButton, !sameTime && styles.toggleButtonActive]}
            onPress={() => setSameTime(false)}
          >
            <Text style={!sameTime ? styles.toggleTextActive : styles.toggleText}>
              I have separate day-wise timings for my shop
            </Text>
          </TouchableOpacity>
        </View>

        {sameTime ? (
          <View style={styles.commonTimeRow}>
            <TouchableOpacity
              style={styles.timePickerBtn}
              onPress={() => setShowPicker({ day: 'common', type: 'open' })}
            >
              <Text style={styles.timePickerLabel}>
                {'Open Time: ' + formatTime(commonOpenTime)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.timePickerBtn}
              onPress={() => setShowPicker({ day: 'common', type: 'close' })}
            >
              <Text style={styles.timePickerLabel}>
                {'Close Time: ' + formatTime(commonCloseTime)}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          selectedDays.length > 0 ? (
            selectedDays
              .filter(day => dayTimes[day] !== undefined)
              .map(day => {
                const dayTime = dayTimes[day];
                return (
                  <View key={day} style={styles.commonTimeRow}>
                    <Text style={styles.dayLabel}>{day}</Text>
                    <TouchableOpacity
                      style={styles.timePickerBtnSmall}
                      onPress={() => setShowPicker({ day, type: 'open' })}
                    >
                      <Text style={styles.timePickerLabel}>{formatTime(dayTime.open)}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.timePickerBtnSmall}
                      onPress={() => setShowPicker({ day, type: 'close' })}
                    >
                      <Text style={styles.timePickerLabel}>{formatTime(dayTime.close)}</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
          ) : (
            <View style={styles.commonTimeRow}>
              <Text style={styles.dayLabel}>Please select working days first</Text>
            </View>
          )
        )}

        {showPicker.day && showPicker.type && (
          <DateTimePicker
            value={
              showPicker.day === 'common'
                ? (showPicker.type === 'open' ? commonOpenTime : commonCloseTime)
                : (dayTimes[showPicker.day]?.[showPicker.type] || new Date(0, 0, 0, 9, 0))
            }
            mode="time"
            is24Hour={false}
            display="spinner"
            onChange={onChangeTime}
          />
        )}

      </ScrollView>
      
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextButton, selectedDays.length === 0 && styles.nextButtonDisabled]}
          onPress={() => {
            if (selectedDays.length === 0) {
              alert('Please select at least one working day.');
              return;
            }
            router.push('/partner-registration/documents');
          }}
          disabled={selectedDays.length === 0}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerSpacer: {
    height: 40, // spacer for notification bar + extra space
    backgroundColor: '#F9FAFB',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },
  stepContainer: {
    marginTop: 12,
    marginBottom: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  stepBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  completedStep: {
    backgroundColor: '#1F2937',
    shadowColor: '#1F2937',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  activeStep: {
    backgroundColor: '#1F2937',
    shadowColor: '#1F2937',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  inactiveStep: {
    backgroundColor: '#E5E7EB',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 6,
    borderRadius: 1,
  },
  stepLineCompleted: {
    backgroundColor: '#1F2937',
  },
  stepTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  stepTextInactive: {
    color: '#9CA3AF',
    fontWeight: '700',
    fontSize: 14,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 16,
    color: '#111827',
    textAlign: 'left',
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  selectAllBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectAllActive: {
    backgroundColor: '#1F2937',
    borderColor: '#1F2937',
    shadowColor: '#1F2937',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  selectAllText: {
    color: '#6B7280',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  selectAllTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  daysList: {
    flexDirection: 'column',
    marginBottom: 28,
  },
  dayItem: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dayItemSelected: {
    backgroundColor: '#1F2937',
    borderColor: '#1F2937',
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  dayText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  toggleButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginVertical: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleButtonActive: {
    backgroundColor: '#1F2937',
    borderColor: '#1F2937',
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  toggleText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 15,
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  commonTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  timePickerBtn: {
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: '#F9FAFB',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timePickerBtnSmall: {
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timePickerLabel: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 15,
  },
  dayLabel: {
    flex: 1,
    fontWeight: '700',
    fontSize: 15,
    color: '#374151',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    marginBottom: 20,
    backgroundColor: '#F5F7FA',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  backButton: {
    backgroundColor: '#9CA3AF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nextButton: {
    backgroundColor: '#1F2937',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  nextButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
