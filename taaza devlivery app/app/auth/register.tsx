import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, FileText, Eye, EyeOff } from 'lucide-react-native';

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    alternatePhone: '',
    password: '',
    confirmPassword: '',
    vehicleType: '',
    vehicleNumber: '',
    vehicleName: '',
  });
  const [documents, setDocuments] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const paramsProcessedRef = useRef<string>('');

  useEffect(() => {
    // Create a unique key from params to track if we've processed them
    const paramsKey = JSON.stringify({
      fullName: params.fullName,
      email: params.email,
      documents: params.documents,
    });

    // Only process if params have actually changed
    if (paramsKey === paramsProcessedRef.current) {
      return;
    }

    paramsProcessedRef.current = paramsKey;

    // Restore form data from params if coming back from documents screen
    if (params.fullName) {
      setFormData({
        fullName: params.fullName as string,
        email: params.email as string,
        phoneNumber: params.phoneNumber as string,
        alternatePhone: params.alternatePhone as string,
        password: params.password as string,
        confirmPassword: params.password as string, // Auto-fill confirm password
        vehicleType: params.vehicleType as string,
        vehicleNumber: (params.vehicleNumber as string) || '',
        vehicleName: (params.vehicleName as string) || '',
      });
    }
    
    // Check if documents are passed from document upload screen
    if (params.documents) {
      try {
        const parsedDocs = JSON.parse(params.documents as string);
        setDocuments(parsedDocs);
      } catch (e) {
        console.error('Error parsing documents:', e);
      }
    }
  }, [params.fullName, params.email, params.phoneNumber, params.alternatePhone, params.password, params.vehicleType, params.vehicleNumber, params.vehicleName, params.documents]);

  const vehicleTypes = [
    { id: 'bike', label: 'Bike', icon: '🏍️' },
    { id: 'auto', label: 'Auto', icon: '🛺' },
    { id: 'van', label: 'Van', icon: '🚐' },
  ];

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate Indian mobile number format (10 digits, optionally with +91 or 0 prefix)
  const isValidMobileNumber = (phone: string): boolean => {
    // Remove spaces, dashes, and +91 prefix if present
    const cleaned = phone.replace(/[\s\-+]/g, '').replace(/^91|^0/, '');
    // Should be exactly 10 digits
    return /^\d{10}$/.test(cleaned);
  };

  // Format phone number for display/storage
  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    // Remove leading 91 or 0 if present
    const cleaned = digits.replace(/^91|^0/, '');
    // Return formatted as +91-XXXXXXXXXX if 10 digits
    if (cleaned.length === 10) {
      return `+91-${cleaned}`;
    }
    return phone;
  };

  const handleContinueToDocuments = () => {
    // Validate all fields are filled
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.phoneNumber ||
      !formData.alternatePhone ||
      !formData.password ||
      !formData.vehicleType ||
      !formData.vehicleNumber ||
      !formData.vehicleName
    ) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Validate full name (should be at least 2 words, no numbers)
    const nameParts = formData.fullName.trim().split(/\s+/);
    if (nameParts.length < 2) {
      Alert.alert('Invalid Name', 'Please enter your full name (first name and last name)');
      return;
    }
    if (/\d/.test(formData.fullName)) {
      Alert.alert('Invalid Name', 'Name should not contain numbers');
      return;
    }

    // Validate email format
    if (!isValidEmail(formData.email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address (e.g., yourname@example.com)');
      return;
    }

    // Validate phone numbers
    if (!isValidMobileNumber(formData.phoneNumber)) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit mobile number (e.g., 9876543210)');
      return;
    }

    if (!isValidMobileNumber(formData.alternatePhone)) {
      Alert.alert('Invalid Alternate Phone', 'Please enter a valid 10-digit alternate mobile number');
      return;
    }

    // Check if both phone numbers are the same
    const phone1 = formData.phoneNumber.replace(/\D/g, '').replace(/^91|^0/, '');
    const phone2 = formData.alternatePhone.replace(/\D/g, '').replace(/^91|^0/, '');
    if (phone1 === phone2) {
      Alert.alert('Invalid Phone Numbers', 'Primary and alternate phone numbers cannot be the same');
      return;
    }

    // Validate password (at least 6 characters)
    if (formData.password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match. Please check and try again.');
      return;
    }

    // Validate vehicle number (should be alphanumeric, at least 5 characters)
    if (formData.vehicleNumber.length < 5) {
      Alert.alert('Invalid Vehicle Number', 'Please enter a valid vehicle registration number');
      return;
    }

    // Validate vehicle name
    if (formData.vehicleName.length < 2) {
      Alert.alert('Invalid Vehicle Name', 'Please enter a valid vehicle name or model');
      return;
    }

    // Format phone numbers before passing
    const formattedPhone = formatPhoneNumber(formData.phoneNumber);
    const formattedAlternatePhone = formatPhoneNumber(formData.alternatePhone);

    // Navigate to document upload screen with form data
    router.push({
      pathname: '/auth/register-documents',
      params: {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phoneNumber: formattedPhone,
        alternatePhone: formattedAlternatePhone,
        password: formData.password,
        vehicleType: formData.vehicleType,
        vehicleNumber: formData.vehicleNumber.trim().toUpperCase(),
        vehicleName: formData.vehicleName.trim(),
      },
    });
  };

  const handleRegister = async () => {
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.phoneNumber ||
      !formData.alternatePhone ||
      !formData.password ||
      !formData.vehicleType ||
      !formData.vehicleNumber ||
      !formData.vehicleName
    ) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // Check if documents are uploaded
    const isBankDetailsComplete = documents?.bankDetails && 
      documents.bankDetails.accountNumber && 
      documents.bankDetails.ifscCode && 
      documents.bankDetails.bankName && 
      documents.bankDetails.accountHolderName && 
      documents.bankDetails.branchName;

    if (!documents || !documents.drivingLicense || !documents.aadhar || !documents.pan || !isBankDetailsComplete) {
      Alert.alert('Documents Required', 'Please upload all required documents and complete bank details');
      // Navigate to document upload screen
      router.push({
        pathname: '/auth/register-documents',
        params: {
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          alternatePhone: formData.alternatePhone,
          password: formData.password,
          vehicleType: formData.vehicleType,
          vehicleNumber: formData.vehicleNumber,
          vehicleName: formData.vehicleName,
        },
      });
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create auth user
      const { error: signUpError, user: authUser } = await signUp(formData.email, formData.password);

      if (signUpError || !authUser) {
        setLoading(false);
        Alert.alert('Registration Failed', signUpError?.message || 'Failed to create account');
        return;
      }

      // Step 2: Upload documents if they exist
      let drivingLicenseUrl = documents?.drivingLicense || null;
      let aadharUrl = documents?.aadhar || null;
      let panUrl = documents?.pan || null;

      // Step 3: Save delivery agent profile to database
      const { supabase } = await import('../../lib/supabase');
      const { error: profileError } = await supabase
        .from('delivery_agents')
        .insert({
          user_id: authUser.id,
          full_name: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone_number: formatPhoneNumber(formData.phoneNumber),
          alternate_phone: formatPhoneNumber(formData.alternatePhone),
          vehicle_type: formData.vehicleType,
          vehicle_number: formData.vehicleNumber.trim().toUpperCase(),
          vehicle_name: formData.vehicleName.trim(),
          driving_license_url: drivingLicenseUrl,
          aadhar_url: aadharUrl,
          pan_url: panUrl,
          bank_account_number: documents?.bankDetails?.accountNumber || null,
          bank_ifsc_code: documents?.bankDetails?.ifscCode || null,
          bank_name: documents?.bankDetails?.bankName || null,
          bank_account_holder_name: documents?.bankDetails?.accountHolderName || null,
          bank_branch_name: documents?.bankDetails?.branchName || null,
          verification_status: 'pending',
          is_active: false, // Inactive until verified by admin
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        setLoading(false);
        Alert.alert('Registration Error', 'Account created but profile setup failed. Please contact support.');
        return;
      }

      setLoading(false);
      
      // Navigate to tabs immediately
      router.replace('/(tabs)');
      
      // Show success message
      setTimeout(() => {
        Alert.alert(
          'Registration Complete!', 
          'Your account has been created and is pending verification. You will be notified once approved.',
          [{ text: 'OK' }]
        );
      }, 300);
    } catch (error: any) {
      setLoading(false);
      console.error('Registration error:', error);
      Alert.alert('Registration Failed', error.message || 'An unexpected error occurred');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ArrowLeft size={24} color="#000" />
      </TouchableOpacity>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start your delivery journey</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="First Name Last Name"
              placeholderTextColor="#888"
              value={formData.fullName}
              onChangeText={(text) => {
                // Only allow letters, spaces, and common name characters
                const cleaned = text.replace(/[^a-zA-Z\s\.\'\-]/g, '');
                setFormData({ ...formData, fullName: cleaned });
              }}
              autoCapitalize="words"
            />
            {formData.fullName && formData.fullName.trim().split(/\s+/).length < 2 && (
              <Text style={styles.errorText}>Please enter your full name (first and last name)</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="yourname@example.com"
              placeholderTextColor="#888"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text.trim().toLowerCase() })}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
            {formData.email && !isValidEmail(formData.email) && (
              <Text style={styles.errorText}>Please enter a valid email address</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="9876543210"
              placeholderTextColor="#888"
              value={formData.phoneNumber}
              onChangeText={(text) => {
                // Only allow digits, +, -, and spaces
                const cleaned = text.replace(/[^\d+\-\s]/g, '');
                setFormData({ ...formData, phoneNumber: cleaned });
              }}
              keyboardType="phone-pad"
              maxLength={15}
            />
            {formData.phoneNumber && !isValidMobileNumber(formData.phoneNumber) && (
              <Text style={styles.errorText}>Please enter a valid 10-digit mobile number</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Alternate Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="9876543210"
              placeholderTextColor="#888"
              value={formData.alternatePhone}
              onChangeText={(text) => {
                // Only allow digits, +, -, and spaces
                const cleaned = text.replace(/[^\d+\-\s]/g, '');
                setFormData({ ...formData, alternatePhone: cleaned });
              }}
              keyboardType="phone-pad"
              maxLength={15}
            />
            {formData.alternatePhone && !isValidMobileNumber(formData.alternatePhone) && (
              <Text style={styles.errorText}>Please enter a valid 10-digit mobile number</Text>
            )}
            {formData.alternatePhone && 
             formData.phoneNumber && 
             formData.phoneNumber.replace(/\D/g, '').replace(/^91|^0/, '') === 
             formData.alternatePhone.replace(/\D/g, '').replace(/^91|^0/, '') && (
              <Text style={styles.errorText}>Alternate phone must be different from primary phone</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Select Vehicle</Text>
            <View style={styles.vehicleContainer}>
              {vehicleTypes.map((vehicle) => (
                <TouchableOpacity
                  key={vehicle.id}
                  style={[
                    styles.vehicleButton,
                    formData.vehicleType === vehicle.id && styles.vehicleButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, vehicleType: vehicle.id })}
                >
                  <Text style={styles.vehicleIcon}>{vehicle.icon}</Text>
                  <Text
                    style={[
                      styles.vehicleLabel,
                      formData.vehicleType === vehicle.id && styles.vehicleLabelActive,
                    ]}
                  >
                    {vehicle.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Vehicle Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., AP31AB1234"
              placeholderTextColor="#888"
              value={formData.vehicleNumber}
              onChangeText={(text) => {
                // Only allow alphanumeric characters
                const cleaned = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                setFormData({ ...formData, vehicleNumber: cleaned });
              }}
              autoCapitalize="characters"
              maxLength={15}
            />
            {formData.vehicleNumber && formData.vehicleNumber.length < 5 && (
              <Text style={styles.errorText}>Please enter a valid vehicle registration number</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Vehicle Name / Model</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Honda Activa, Bajaj Auto"
              placeholderTextColor="#888"
              value={formData.vehicleName}
              onChangeText={(text) => setFormData({ ...formData, vehicleName: text })}
              autoCapitalize="words"
            />
            {formData.vehicleName && formData.vehicleName.trim().length < 2 && (
              <Text style={styles.errorText}>Please enter a valid vehicle name or model</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Minimum 6 characters"
                placeholderTextColor="#888"
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#666" />
                ) : (
                  <Eye size={20} color="#666" />
                )}
              </TouchableOpacity>
            </View>
            {formData.password && formData.password.length < 6 && (
              <Text style={styles.errorText}>Password must be at least 6 characters</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Re-enter your password"
                placeholderTextColor="#888"
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color="#666" />
                ) : (
                  <Eye size={20} color="#666" />
                )}
              </TouchableOpacity>
            </View>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <Text style={styles.errorText}>Passwords do not match</Text>
            )}
          </View>

          {/* Show "Next" button to proceed to documents */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleContinueToDocuments}
          >
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={styles.linkText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 20,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#444',
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  input: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
  },
  eyeButton: {
    paddingRight: 16,
    paddingLeft: 8,
  },
  vehicleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  vehicleButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#CCCCCC',
  },
  vehicleButtonActive: {
    borderColor: '#000',
    backgroundColor: '#E6E6E6',
  },
  vehicleIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  vehicleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },
  vehicleLabelActive: {
    color: '#000',
  },
  button: {
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 16,
    color: '#666',
  },
  linkText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '700',
  },
  documentsStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    marginTop: 10,
  },
  documentsStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  documentsStatusTextPending: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
    marginLeft: 4,
  },
});
