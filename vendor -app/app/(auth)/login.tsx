import React, { useEffect, useState } from 'react';
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
  Image,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { User, Lock, Eye, EyeOff, Phone } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shopName, setShopName] = useState('Vendor');

  // Load cached vendor info to personalize the welcome message
  useEffect(() => {
    const loadVendorName = async () => {
      try {
        const vendorDataStr = await AsyncStorage.getItem('vendor_data');
        if (vendorDataStr) {
          const vendorData = JSON.parse(vendorDataStr);
          const nameFromData =
            vendorData?.shop?.storeName ||
            vendorData?.shop?.name ||
            vendorData?.user?.name ||
            vendorData?.user?.email;
          if (nameFromData) {
            setShopName(nameFromData);
          }
        }
      } catch (error) {
        // Non-blocking: keep default name
      }
    };

    loadVendorName();
  }, []);

  const handleLogin = async () => {
    if (!mobileNumber || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    // Validate mobile number format (10 digits)
    const cleanMobile = mobileNumber.trim().replace(/[^\d]/g, '');
    if (cleanMobile.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }
    
    setLoading(true);
    let loginSuccess = false;
    
    try {
      const result = await signIn(cleanMobile, password);
      
      if (result.success) {
        loginSuccess = true;
        // Navigate immediately for fast user experience
        router.replace('/(tabs)');
        
        // Load vendor profile data in the background (non-blocking)
        // This happens after navigation so it doesn't delay the user
        (async () => {
          try {
            const { getVendorProfile } = await import('@/services/api');
            const vendorResult = await getVendorProfile();
            if (vendorResult.success && vendorResult.data) {
              // Vendor data is now stored in session storage
              console.log('Vendor profile loaded:', vendorResult.data);
              const nameFromData =
                vendorResult.data?.shop?.storeName ||
                vendorResult.data?.shop?.name ||
                vendorResult.data?.user?.name ||
                vendorResult.data?.user?.email;
              if (nameFromData) {
                setShopName(nameFromData);
              }
            }
          } catch (vendorError) {
            console.error('Error loading vendor profile:', vendorError);
            // Continue even if vendor profile fails to load
          }
        })();
      } else {
        // Show error message with better formatting
        const errorMsg = result.error || 'Invalid mobile number or password';
        Alert.alert('Login Failed', errorMsg);
        setLoading(false);
      }
    } catch (error: any) {
      // Show network error to user
      const errorMessage = error?.message || 'Network request failed';
      Alert.alert(
        'Connection Error',
        errorMessage + '\n\nPlease ensure:\n• Backend server is running\n• Correct IP address in config/api.ts\n• Device and computer are on same network'
      );
      setLoading(false);
    } finally {
      // Don't set loading to false if we're navigating (let the new screen handle it)
      if (!loginSuccess) {
        setLoading(false);
      }
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
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <View style={styles.logoTextContainer}>
                  <Text style={styles.logoTextLeft}></Text>
                  <Image
                    source={require('../../assets/images/taaza.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.logoTextRight}></Text>
                </View>
                <Text style={styles.vendorText}>Vendor Portal</Text>
              </View>
            </View>

            <View style={styles.form}>
              <Text style={styles.welcomeText}>Welcome Back{shopName ? `, ${shopName}` : ''}!</Text>
              <Text style={styles.subtitleText}>Sign in to manage your Taaza Shop</Text>

              <View style={styles.inputContainer}>
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

                <View style={styles.inputWrapper}>
                  <Lock size={20} color="#000000" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    placeholderTextColor="#6B7280"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#6B7280" />
                    ) : (
                      <Eye size={20} color="#6B7280" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>New vendor? </Text>
                <TouchableOpacity onPress={() => router.push('/partner-registration')}>
                  {/* <- Added onPress for Register navigation */}
                  <Text style={styles.signupText}>Register here</Text>
                </TouchableOpacity>
              </View>
            </View>
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
  },
  header: {
    flex: 0.3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logoTextLeft: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000000',
  },
  logoTextRight: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000000',
  },
  logoImage: {
    width: 120,
    height: 120,
    marginHorizontal: 8,
  },
  vendorText: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '500',
  },
  form: {
    flex: 0.6,
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 32,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111111',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 32,
  },
  forgotPasswordText: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#111111',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  loginButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#4B5563',
    fontSize: 14,
  },
  signupText: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '600',
  },
});
