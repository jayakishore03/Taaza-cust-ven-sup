import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Phone, ArrowLeft, Mail } from 'lucide-react-native';
import { getVendorEmailByMobile, sendEmailOTP } from '@/services/api';

export default function ForgotPasswordScreen() {
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'mobile' | 'otp' | 'reset'>('mobile');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleGetEmail = async () => {
    if (!mobileNumber.trim()) {
      Alert.alert('Error', 'Please enter your mobile number');
      return;
    }

    const cleanMobile = mobileNumber.trim().replace(/[^\d]/g, '');
    if (cleanMobile.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const result = await getVendorEmailByMobile(cleanMobile);
      
      if (result.success && result.data?.email) {
        setEmail(result.data.email);
        // Automatically send OTP to email
        await handleSendOTP(result.data.email);
      } else {
        // For security, don't reveal if email exists or not
        Alert.alert(
          'OTP Sent',
          'If this mobile number is registered, an OTP has been sent to the registered email address. Please check your email.',
          [{ text: 'OK' }]
        );
        // Still proceed to OTP screen (user can enter email manually if needed)
        setStep('otp');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to retrieve email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (emailToUse?: string) => {
    const emailToSend = emailToUse || email;
    
    if (!emailToSend) {
      Alert.alert('Error', 'Email address is required');
      return;
    }

    setLoading(true);
    try {
      const result = await sendEmailOTP(emailToSend, 'password-reset');
      
      if (result.success) {
        setOtpSent(true);
        setStep('otp');
        Alert.alert(
          'OTP Sent',
          `OTP has been sent to ${emailToSend}. Please check your email.`,
          [{ text: 'OK' }]
        );
        // In development, show OTP in alert
        if (result.data?.otp) {
          console.log('OTP (dev only):', result.data.otp);
        }
      } else {
        Alert.alert('Error', result.error?.message || 'Failed to send OTP. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.trim().length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    if (!email) {
      Alert.alert('Error', 'Email address is required');
      return;
    }

    setLoading(true);
    try {
      const { verifyEmailOTP } = await import('@/services/api');
      const result = await verifyEmailOTP(email, otp.trim());
      
      if (result.success) {
        setOtpVerified(true);
        setStep('reset');
        Alert.alert('Success', 'OTP verified successfully. You can now reset your password.');
      } else {
        Alert.alert('Error', result.error?.message || 'Invalid OTP. Please try again.');
        setOtp('');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to verify OTP. Please try again.');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim() || newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!otpVerified) {
      Alert.alert('Error', 'Please verify OTP first');
      return;
    }

    setLoading(true);
    try {
      const { resetPasswordByEmail } = await import('@/services/api');
      const result = await resetPasswordByEmail(email, newPassword);
      
      if (result.success) {
        Alert.alert(
          'Success',
          'Your password has been reset successfully. You can now sign in with your new password.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)/login'),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error?.message || 'Failed to reset password. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color="#111111" />
            </TouchableOpacity>

            <View style={styles.header}>
              <Text style={styles.title}>Forgot Password?</Text>
              <Text style={styles.subtitle}>
                {step === 'mobile' && 'Enter your registered mobile number to receive OTP via email'}
                {step === 'otp' && `Enter the OTP sent to ${email || 'your email'}`}
                {step === 'reset' && 'Enter your new password'}
              </Text>
            </View>

            {step === 'mobile' && (
              <View style={styles.form}>
                <View style={styles.inputWrapper}>
                  <Phone size={20} color="#000000" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Mobile Number"
                    value={mobileNumber}
                    onChangeText={setMobileNumber}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    maxLength={10}
                    placeholderTextColor="#6B7280"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleGetEmail}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>Send OTP to Email</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {step === 'otp' && (
              <View style={styles.form}>
                {email && (
                  <View style={styles.emailDisplay}>
                    <Mail size={16} color="#6B7280" />
                    <Text style={styles.emailText}>{email}</Text>
                  </View>
                )}

                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChangeText={(text) => setOtp(text.replace(/[^\d]/g, '').slice(0, 6))}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholderTextColor="#6B7280"
                  />
                </View>

                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={() => handleSendOTP()}
                  disabled={loading}
                >
                  <Text style={styles.resendText}>Resend OTP</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleVerifyOTP}
                  disabled={loading || !otp || otp.length !== 6}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>Verify OTP</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {step === 'reset' && (
              <View style={styles.form}>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="New Password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showPassword}
                    placeholderTextColor="#6B7280"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    placeholderTextColor="#6B7280"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    <Text style={styles.eyeText}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>Reset Password</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  backButton: {
    marginBottom: 20,
    padding: 8,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111111',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  form: {
    flex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111111',
  },
  eyeIcon: {
    padding: 4,
  },
  eyeText: {
    fontSize: 20,
  },
  emailDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  emailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  button: {
    backgroundColor: '#111111',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#6B7280',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resendButton: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    padding: 8,
  },
  resendText: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '500',
  },
});

