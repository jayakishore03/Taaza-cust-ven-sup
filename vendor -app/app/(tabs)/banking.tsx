import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import {
  Building,
  Smartphone,
  Save,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const initialBalance = Math.floor(Math.random() * 50000) + 10000;

export default function BankingScreen() {
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [autoWithdrawal, setAutoWithdrawal] = useState(true);
  const [bankingData, setBankingData] = useState({
    accountHolderName: 'Saikiran Konapala',
    bankName: 'State Bank of India',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: 'SBIN0001234',
    accountType: 'Savings',
    branchName: 'Currency Nagar,Vijayawada',
    upiId: '9492664870@paytm',
    minimumBalance: '1000',
  });

  const animatedBalance = useRef(new Animated.Value(initialBalance)).current;

  const [displayBalance, setDisplayBalance] = useState(initialBalance);

  useEffect(() => {
    animatedBalance.addListener(({ value }) => {
      setDisplayBalance(Math.floor(value));
    });

    return () => {
      animatedBalance.removeAllListeners();
    };
  }, []);

  const updateField = (field: keyof typeof bankingData, value: string) => {
    setBankingData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!bankingData.accountNumber || !bankingData.confirmAccountNumber) {
      Alert.alert('Error', 'Please enter account number twice.');
      return;
    }
    if (bankingData.accountNumber !== bankingData.confirmAccountNumber) {
      Alert.alert('Error', 'Account numbers do not match.');
      return;
    }
    Alert.alert('Success', 'Banking details updated successfully!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Banking Details</Text>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Save size={20} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          <View style={styles.balanceCard}>
            <View>
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <Animated.Text style={styles.balanceAmount}>
                ₹{displayBalance.toLocaleString('en-IN')}
              </Animated.Text>
            </View>
            <Building size={60} color="#111111" />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Building size={24} color="#000000" />
              <Text style={styles.sectionTitle}>Bank Account Details</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Holder Name</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={bankingData.accountHolderName}
                  onChangeText={text => updateField('accountHolderName', text)}
                  placeholder="Account holder name"
                  placeholderTextColor="#6B7280"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bank Name</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={bankingData.bankName}
                  onChangeText={text => updateField('bankName', text)}
                  placeholder="Bank name"
                  placeholderTextColor="#6B7280"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Number</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={bankingData.accountNumber}
                  onChangeText={text => updateField('accountNumber', text)}
                  placeholder="Account number"
                  secureTextEntry={!showAccountNumber}
                  keyboardType="number-pad"
                  placeholderTextColor="#6B7280"
                />
                <TouchableOpacity
                  onPress={() => setShowAccountNumber(!showAccountNumber)}
                  style={styles.eyeIcon}
                >
                  {showAccountNumber ? (
                    <EyeOff size={20} color="#9CA3AF" />
                  ) : (
                    <Eye size={20} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Account Number</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={bankingData.confirmAccountNumber}
                  onChangeText={text => updateField('confirmAccountNumber', text)}
                  placeholder="Confirm account number"
                  secureTextEntry={!showAccountNumber}
                  keyboardType="number-pad"
                  placeholderTextColor="#6B7280"
                />
                <TouchableOpacity
                  onPress={() => setShowAccountNumber(!showAccountNumber)}
                  style={styles.eyeIcon}
                >
                  {showAccountNumber ? (
                    <EyeOff size={20} color="#9CA3AF" />
                  ) : (
                    <Eye size={20} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>IFSC Code</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={bankingData.ifscCode}
                    onChangeText={text => updateField('ifscCode', text)}
                    placeholder="IFSC Code"
                    autoCapitalize="characters"
                    placeholderTextColor="#6B7280"
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Account Type</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={bankingData.accountType}
                    onChangeText={text => updateField('accountType', text)}
                    placeholder="Account type"
                    placeholderTextColor="#6B7280"
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Branch Name</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={bankingData.branchName}
                  onChangeText={text => updateField('branchName', text)}
                  placeholder="Branch name"
                  placeholderTextColor="#6B7280"
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Smartphone size={24} color="#000000" />
              <Text style={styles.sectionTitle}>UPI Details</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>UPI ID</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={bankingData.upiId}
                  onChangeText={text => updateField('upiId', text)}
                  placeholder="your-upi@bank"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#6B7280"
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Shield size={24} color="#000000" />
              <Text style={styles.sectionTitle}>Withdrawal Settings</Text>
            </View>

            {/* INFO TEXT INSTEAD OF WITHDRAWAL AMOUNT */}
            <Text style={{ marginBottom: 12, fontSize: 14, color: '#374151' }}>
              Earnings will be automatically credited to your bank account every Monday.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Minimum Balance (₹)</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={bankingData.minimumBalance}
                  onChangeText={text => updateField('minimumBalance', text)}
                  placeholder="Minimum balance to maintain"
                  keyboardType="numeric"
                  placeholderTextColor="#6B7280"
                />
              </View>
            </View>
          </View>

          <View style={styles.securityNotice}>
            <Shield size={20} color="#059669" />
            <View style={styles.securityText}>
              <Text style={styles.securityTitle}>Your data is secure</Text>
              <Text style={styles.securitySubtitle}>
                All banking information is encrypted and securely stored
              </Text>
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
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111111',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111111',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    marginLeft: 12,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 16,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111111',
    paddingVertical: 12,
  },
  eyeIcon: {
    padding: 4,
  },
  row: {
    flexDirection: 'row',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111111',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  securityText: {
    marginLeft: 12,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 2,
  },
  securitySubtitle: {
    fontSize: 12,
    color: '#059669',
  },
});
