import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getVendorOrders, Order } from '@/services/api';


export default function BankingScreen() {
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [bankingData, setBankingData] = useState({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    accountType: '',
    branchName: '',
    upiId: '',
    minimumBalance: '0',
  });

  const [currentBalance, setCurrentBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(true);
  

  // Load banking details and calculate real income from orders
  useEffect(() => {
    const loadBankingDetails = async () => {
      try {
        const vendorDataStr = await AsyncStorage.getItem('vendor_data');
        if (!vendorDataStr) {
          return;
        }

        const vendorData = JSON.parse(vendorDataStr);
        const shop = vendorData.shop || {};

        setBankingData(prev => ({
          ...prev,
          accountHolderName: shop.account_holder_name || prev.accountHolderName,
          bankName: shop.bank_name || prev.bankName,
          accountNumber: shop.account_number || prev.accountNumber,
          confirmAccountNumber: shop.account_number || prev.confirmAccountNumber,
          ifscCode: shop.ifsc_code || prev.ifscCode,
          accountType: shop.account_type || prev.accountType,
          branchName: shop.bank_branch || prev.branchName,
          // UPI ID and minimum balance are not stored in shop; keep any existing or leave blank/default
        }));
      } catch (error) {
        console.error('[BankingScreen] Error loading banking details:', error);
      }
    };

    const loadBalance = async () => {
      try {
        setBalanceLoading(true);
        // Fetch all orders to calculate total income
        const orders = await getVendorOrders();
        
        if (!orders || orders.length === 0) {
          setCurrentBalance(0);
          setBalanceLoading(false);
          return;
        }

        // Calculate total income from all orders (after 20% commission deduction)
        const totalIncome = orders.reduce((sum, order) => {
          let orderAmount = 0;
          
          // Try to get total_amount (number) first, then parse total (string) if needed
          if (order.total_amount) {
            orderAmount = order.total_amount;
          } else if (order.total) {
            // Parse formatted string like "₹1,234.56" or "₹1234.56"
            const numericValue = parseFloat(order.total.replace(/[₹,\s]/g, ''));
            orderAmount = isNaN(numericValue) ? 0 : numericValue;
          }
          
          // Skip if order amount is 0 or invalid
          if (orderAmount <= 0) {
            return sum;
          }
          
          // Deduct 20% commission from each order
          // Commission = 20% of order amount
          const commission = orderAmount * 0.20;
          // Net amount = Order amount - Commission (vendor receives 80% of order value)
          const netAmount = orderAmount - commission;
          
          console.log(`[loadBalance] Order ${order.id || 'N/A'}: Original Amount=₹${orderAmount}, Commission (20%)=₹${commission.toFixed(2)}, Net Amount=₹${netAmount.toFixed(2)}`);
          
          return sum + netAmount;
        }, 0);
        
        console.log(`[loadBalance] Total Balance (after 20% commission): ₹${totalIncome.toLocaleString('en-IN')}`);

        setCurrentBalance(totalIncome);
      } catch (error) {
        console.error('[BankingScreen] Error loading balance:', error);
        setCurrentBalance(0);
      } finally {
        setBalanceLoading(false);
      }
    };

    loadBankingDetails();
    loadBalance();
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
            <View style={styles.balanceContent}>
              <View style={styles.balanceHeader}>
                <Text style={styles.balanceLabel}>Current Balance</Text>
                <Building size={24} color="#111111" />
              </View>
              {balanceLoading ? (
                <View style={styles.balanceLoadingContainer}>
                  <ActivityIndicator size="small" color="#111111" />
                  <Text style={[styles.balanceAmount, { marginLeft: 8 }]}>Loading...</Text>
                </View>
              ) : (
                <Text style={styles.balanceAmount}>
                  ₹{currentBalance.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                </Text>
              )}
              <View style={styles.balanceNote}>
                <Text style={styles.balanceNoteText}>
                  Your earnings will be automatically credited to your registered bank account every Monday.
                </Text>
                <Text style={[styles.balanceNoteText, { marginTop: 6, fontWeight: '500' }]}>
                  This amount is after platform fee (20%) deduction. Your net income is displayed here.
                </Text>
              </View>
            </View>
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
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  balanceContent: {
    width: '100%',
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  balanceLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  balanceNote: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  balanceNoteText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
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
