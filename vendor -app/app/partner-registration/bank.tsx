import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useRegistration } from '@/contexts/RegistrationContext';

const TOTAL_STEPS = 7;
const CURRENT_STEP = 5;

export default function Step5BankDetails() {
  const router = useRouter();
  const { registrationData, updateRegistrationData } = useRegistration();
  const [ifsc, setIfsc] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');

  // Load existing bank details from registration data
  useEffect(() => {
    if (registrationData.bankDetails) {
      setIfsc(registrationData.bankDetails.ifsc || '');
      setAccountNumber(registrationData.bankDetails.accountNumber || '');
      setAccountHolderName(registrationData.bankDetails.accountHolderName || '');
      setBankName(registrationData.bankDetails.bankName || '');
    }
  }, []);

  // Save bank details to registration context when fields change
  useEffect(() => {
    const saveBankDetails = async () => {
      await updateRegistrationData({
        bankDetails: {
          ifsc: ifsc.trim(),
          accountNumber: accountNumber.trim(),
          accountHolderName: accountHolderName.trim(),
          bankName: bankName.trim(),
        },
      });
    };

    // Debounce: only save if there's actual data
    if (ifsc || accountNumber || accountHolderName || bankName) {
      const timeoutId = setTimeout(() => {
        saveBankDetails();
      }, 500); // Save after 500ms of no changes

      return () => clearTimeout(timeoutId);
    }
  }, [ifsc, accountNumber, accountHolderName, bankName, updateRegistrationData]);

  const goBack = () => router.back();

  const nextStep = async () => {
    // Validate account number match
    if (accountNumber && confirmAccountNumber && accountNumber !== confirmAccountNumber) {
      Alert.alert('Validation Error', 'Account numbers do not match. Please check and try again.');
      return;
    }

    // Save final bank details before proceeding
    await updateRegistrationData({
      bankDetails: {
        ifsc: ifsc.trim(),
        accountNumber: accountNumber.trim(),
        accountHolderName: accountHolderName.trim(),
        bankName: bankName.trim(),
      },
    });

    router.push('/partner-registration/contract');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          style={styles.scrollView}
        >
          {/* Step Label */}
          <Text style={styles.stepLabel}>
            {'STEP ' + CURRENT_STEP + ' / ' + TOTAL_STEPS + ': SHOP BANK DETAILS'}
          </Text>

        {/* Step Bar */}
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

        {/* Informational Text */}
        <Text style={styles.infoText}>Shop sales payments from Taaza Platform will be credited to this account 💰</Text>

        {/* IFSC Code */}
        <Text style={styles.label}>1️⃣ Bank IFSC Code</Text>
        <TextInput
          style={styles.input}
          value={ifsc}
          onChangeText={setIfsc}
          placeholder="Enter IFSC Code"
          autoCapitalize="characters"
          autoCorrect={false}
        />

        {/* Account Number */}
        <Text style={styles.label}>2️⃣ Bank Account Number</Text>
        <TextInput
          style={styles.input}
          value={accountNumber}
          onChangeText={setAccountNumber}
          keyboardType="numeric"
          placeholder="Enter Account Number"
        />

        {/* Confirm Account Number */}
        <Text style={styles.label}>3️⃣ Confirm Account Number</Text>
        <TextInput
          style={styles.input}
          value={confirmAccountNumber}
          onChangeText={setConfirmAccountNumber}
          keyboardType="numeric"
          placeholder="Confirm Account Number"
        />

        {/* Account Holder Name */}
        <Text style={styles.label}>4️⃣ Account Holder Name (Shop Owner)</Text>
        <TextInput
          style={styles.input}
          value={accountHolderName}
          onChangeText={setAccountHolderName}
          placeholder="Enter Account Holder Name"
        />

        {/* Bank Name */}
        <Text style={styles.label}>5️⃣ Bank Name</Text>
        <TextInput
          style={styles.input}
          value={bankName}
          onChangeText={setBankName}
          placeholder="Enter Bank Name"
        />

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Buttons - Fixed at bottom with padding */}
      <View style={styles.buttonContainer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Text style={styles.buttonText}>⬅️ Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={nextStep}
          >
            <Text style={styles.buttonText}>Next ➡️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
    backgroundColor: '#F5F7FA',
    flexGrow: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    backgroundColor: '#F5F7FA',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  stepContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 12,
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
  infoText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#374151',
    marginBottom: 28,
    fontWeight: '600',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  label: {
    fontWeight: '700',
    fontSize: 17,
    color: '#111827',
    marginTop: 8,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 16,
    marginBottom: 20,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    fontWeight: '500',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#9CA3AF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
