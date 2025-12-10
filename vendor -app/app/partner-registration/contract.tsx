import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useRegistration } from '@/contexts/RegistrationContext';
import * as ImagePicker from 'expo-image-picker';
import { Eye, EyeOff } from 'lucide-react-native';

const TOTAL_STEPS = 7;
const CURRENT_STEP = 7;

export default function Step7PartnerContract() {
  const router = useRouter();
  const { registrationData, updateRegistrationData, submitRegistration } = useRegistration();
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signatureUri, setSignatureUri] = useState<string | null>(
    registrationData.signature || null
  );
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);

  const goBack = () => router.back();

  const pickSignature = async () => {
    Alert.alert(
      'Select Signature',
      'Choose an option',
      [
        {
          text: 'Camera',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert(
                'Camera Permission Denied',
                'Please allow camera access to take a photo of your signature.',
                [{ text: 'OK' }]
              );
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 2],
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              const uri = result.assets[0].uri;
              setSignatureUri(uri);
              await updateRegistrationData({ signature: uri });
            }
          },
        },
        {
          text: 'Gallery',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert(
                'Photo Library Permission Denied',
                'Please allow photo library access to upload your signature.',
                [{ text: 'OK' }]
              );
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 2],
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              const uri = result.assets[0].uri;
              setSignatureUri(uri);
              await updateRegistrationData({ signature: uri });
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const nextStep = async () => {
    if (!accepted) {
      Alert.alert('Required', 'Please accept the terms and conditions to proceed.');
      return;
    }

    if (!password || password.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match. Please try again.');
      return;
    }

    setSubmitting(true);
    await updateRegistrationData({ contractAccepted: true, profitShare: 20 });
    
    const result = await submitRegistration(password);
    setSubmitting(false);

    if (result.success) {
      // Show success screen
      setShowSuccessScreen(true);
    } else {
      Alert.alert('Error', result.message || 'Failed to submit registration. Please try again.');
    }
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
          {'STEP ' + CURRENT_STEP + ' / ' + TOTAL_STEPS + ': SHOP PARTNER AGREEMENT'}
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

        {/* Contract Details */}
        <View style={styles.contractBox}>
          <Text style={styles.contractTitle}>Shop Profit Share Details 📊</Text>
          <Text style={styles.contractText}>
            The profit share for your shop according to the agreement is fixed at{' '}
            <Text style={styles.highlight}>20%</Text>.
          </Text>
          <Text style={styles.contractText}>
            This share is generated based on meat sales data from our Taaza platform.
          </Text>

          <Text style={[styles.contractTitle, { marginTop: 20 }]}>
            Sign Contract ✍️
          </Text>
          <TouchableOpacity 
            style={styles.signatureBox}
            onPress={pickSignature}
            activeOpacity={0.7}
          >
            {signatureUri ? (
              <Image 
                source={{ uri: signatureUri }} 
                style={styles.signatureImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.signaturePlaceholderContainer}>
                <Text style={styles.signaturePlaceholder}>
                  Tap to upload signature
                </Text>
                <Text style={styles.signaturePlaceholderSubtext}>
                  Camera or Gallery
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Password Setup */}
        <View style={styles.passwordContainer}>
          <Text style={styles.passwordTitle}>Create Account Password 🔐</Text>
          <Text style={styles.passwordSubtitle}>
            Create a password to secure your vendor account
          </Text>

          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password (min 6 characters)"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              {showPassword ? (
                <EyeOff size={20} color="#666" />
              ) : (
                <Eye size={20} color="#666" />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm Password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              {showConfirmPassword ? (
                <EyeOff size={20} color="#666" />
              ) : (
                <Eye size={20} color="#666" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Terms Acceptance */}
        <View style={styles.termsContainer}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setAccepted(!accepted)}
          >
            <View style={[styles.checkbox, accepted ? styles.checkboxChecked : null]} />
            <Text style={styles.termsText}>I accept the terms and conditions for shop partnership</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Buttons - Fixed at bottom with padding */}
      <View style={styles.buttonContainer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Text style={styles.buttonText}>⬅️ Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nextButton, (!accepted || submitting || !password || password !== confirmPassword) && styles.nextButtonDisabled]}
            onPress={nextStep}
            disabled={!accepted || submitting || !password || password !== confirmPassword}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Submit ✔️</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Success Screen Modal */}
      <Modal
        visible={showSuccessScreen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successContainer}>
            {/* Success Icon */}
            <View style={styles.successIconContainer}>
              <Text style={styles.successIcon}>✓</Text>
            </View>

            {/* Success Title */}
            <Text style={styles.successTitle}>Registration Completed!</Text>

            {/* Success Message */}
            <Text style={styles.successMessage}>
              Your registration has been successfully submitted. Our team will review your application and verify your details.
            </Text>

            {/* Verification Notice */}
            <View style={styles.verificationBox}>
              <Text style={styles.verificationTitle}>📧 Verification Email</Text>
              <Text style={styles.verificationText}>
                Please wait for the verification completion email. You will be notified once your account has been verified and activated.
              </Text>
            </View>

            {/* Next Steps */}
            <View style={styles.nextStepsBox}>
              <Text style={styles.nextStepsTitle}>What's Next?</Text>
              <Text style={styles.nextStepsText}>
                • Check your email for verification status{'\n'}
                • You'll receive login credentials after verification{'\n'}
                • Start managing your shop once approved
              </Text>
            </View>

            {/* Continue Button */}
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => {
                setShowSuccessScreen(false);
                router.replace('/(auth)/login');
              }}
            >
              <Text style={styles.continueButtonText}>Continue to Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  safeArea: { 
    flex: 1, 
    backgroundColor: '#F5F7FA' 
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: { 
    padding: 20, 
    paddingBottom: 100,
    flexGrow: 1,
    backgroundColor: '#F5F7FA',
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
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 8,
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
    backgroundColor: '#E5E7EB' 
  },
  stepTextActive: { 
    color: '#FFFFFF', 
    fontWeight: '700', 
    fontSize: 14 
  },
  stepTextInactive: { 
    color: '#9CA3AF', 
    fontWeight: '700', 
    fontSize: 14 
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
  contractBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  contractTitle: { 
    fontWeight: '700', 
    fontSize: 20, 
    marginBottom: 12,
    color: '#111827',
  },
  contractText: { 
    fontSize: 16, 
    marginBottom: 10,
    color: '#374151',
    lineHeight: 24,
  },
  highlight: { 
    fontWeight: '900', 
    color: '#1F2937',
    fontSize: 18,
  },
  signatureBox: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    height: 120,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    marginTop: 16,
    overflow: 'hidden',
  },
  signaturePlaceholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  signaturePlaceholder: { 
    fontStyle: 'italic', 
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  signaturePlaceholderSubtext: {
    fontStyle: 'italic',
    color: '#D1D5DB',
    fontSize: 12,
  },
  signatureImage: {
    width: '100%',
    height: '100%',
  },
  passwordContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  passwordTitle: {
    fontWeight: '700',
    fontSize: 20,
    marginBottom: 8,
    color: '#111827',
  },
  passwordSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    color: '#6B7280',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#111827',
  },
  eyeIcon: {
    padding: 16,
  },
  termsContainer: { 
    marginBottom: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  checkboxContainer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: { 
    backgroundColor: '#1F2937', 
    borderColor: '#1F2937' 
  },
  termsText: { 
    fontSize: 16, 
    color: '#374151',
    fontWeight: '600',
    flex: 1,
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
  nextButtonDisabled: { 
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0.1,
  },
  buttonText: { 
    color: '#FFFFFF', 
    fontWeight: '700', 
    fontSize: 16,
    letterSpacing: 0.5,
  },
  // Success Screen Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  successIcon: {
    fontSize: 48,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  successMessage: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    fontWeight: '500',
  },
  verificationBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  verificationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 12,
    textAlign: 'center',
  },
  verificationText: {
    fontSize: 14,
    color: '#047857',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  nextStepsBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  nextStepsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  nextStepsText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
