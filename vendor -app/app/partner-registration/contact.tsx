import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useRegistration } from '@/contexts/RegistrationContext';

const TOTAL_STEPS = 7;
const CURRENT_STEP = 2;

interface FormState {
  email: string;
  mobileNumber: string;
  isWhatsAppSame: boolean;
  whatsappNumber: string;
}

export default function Step2ContactDetails() {
  const router = useRouter();
  const { updateRegistrationData } = useRegistration();

  const [form, setForm] = useState<FormState>({
    email: '',
    mobileNumber: '',
    isWhatsAppSame: true,
    whatsappNumber: '',
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">

        {/* Step Label and Step Indicator */}
        <Text style={styles.stepLabel}>
          {'STEP ' + CURRENT_STEP + ' / ' + TOTAL_STEPS + ': OWNER CONTACT DETAILS'}
        </Text>
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

        <Text style={styles.sectionHeader}>Shop Contact Details</Text>

        {/* Email */}
        <View style={styles.inputWithIcon}>
          <MaterialIcons name="email" size={24} color="#555" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(text) => setForm((f) => ({ ...f, email: text }))}
          />
        </View>

        {/* Mobile Number */}
        <View style={styles.inputWithIcon}>
          <MaterialIcons name="phone" size={24} color="#555" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Mobile Number"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            value={form.mobileNumber}
            onChangeText={(text) => setForm((f) => ({ ...f, mobileNumber: text }))}
          />
        </View>

        {/* WhatsApp Information */}
        <View style={styles.whatsAppContainer}>
          <Text style={styles.infoLabel}>
            Please provide your shop contact number. If this number has a WhatsApp account, please enter the same number below for WhatsApp communication.
          </Text>
        </View>

        <View style={styles.inputWithIcon}>
          <FontAwesome name="whatsapp" size={24} color="#25D366" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="WhatsApp Number (if available)"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            value={form.whatsappNumber}
            onChangeText={(text) => setForm((f) => ({ ...f, whatsappNumber: text }))}
          />
        </View>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={async () => {
              // Validate required fields
              if (!form.email || !form.mobileNumber) {
                Alert.alert('Incomplete Form', 'Please fill in email and mobile number before proceeding.');
                return;
              }
              
              // Validate mobile number length
              if (form.mobileNumber.length < 10) {
                Alert.alert('Invalid Mobile Number', 'Please enter a valid mobile number (at least 10 digits).');
                return;
              }
              
              // Save all Step 2 data to registration context before navigating
              await updateRegistrationData({
                email: form.email,
                mobileNumber: form.mobileNumber,
                whatsappNumber: form.whatsappNumber || form.mobileNumber,
                isWhatsAppSame: form.isWhatsAppSame,
              });
              
              // Navigate to working-days route on next step
              router.push('/partner-registration/working-days');
            }}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#F5F7FA',
    paddingTop: 16,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 12,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  stepBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
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
  stepLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
    marginTop: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 20,
    color: '#111827',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  whatsAppContainer: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 12,
    color: '#111827',
  },
  infoLabel: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'left',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  toggleButtonActive: {
    backgroundColor: '#1F2937',
    borderColor: '#1F2937',
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
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
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: 30,
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
