import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Constants from 'expo-constants';
import { getServices, saveServices, Service } from '../../services/api';

// Default product list
const DEFAULT_PRODUCTS = {
  '🍗 Whole': true,
  '🍖 Legs': true,
  '🍗 Breast': true,
  '🍖 Wings': true,
  '🍗 Thighs': true,
  '🍖 Mutton': false,
  '🍗 Goat Meat': false,
  '🍖 Fish': false,
};

const DEFAULT_RATES = {
  '🍗 Whole': '180',
  '🍖 Legs': '220',
  '🍗 Breast': '250',
  '🍖 Wings': '200',
  '🍗 Thighs': '210',
  '🍖 Mutton': '600',
  '🍗 Goat Meat': '550',
  '🍖 Fish': '300',
};

export default function StoreScreen() {
  const [services, setServices] = useState(DEFAULT_PRODUCTS);
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load rates from backend on mount
  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    try {
      setLoading(true);
      const backendServices = await getServices();
      
      if (backendServices && backendServices.length > 0) {
        // Map backend services to our local state
        const newRates: Record<string, string> = { ...DEFAULT_RATES };
        const newServices: Record<string, boolean> = { ...DEFAULT_PRODUCTS };
        
        backendServices.forEach((service: Service) => {
          if (service.name in DEFAULT_RATES) {
            newRates[service.name] = service.price.toString();
            newServices[service.name] = service.is_active !== false;
          }
        });
        
        setRates(newRates);
        setServices(newServices);
      }
    } catch (error) {
      console.error('Error loading rates:', error);
      // Keep default rates if loading fails
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (serviceName: string) => {
    setServices((prev) => ({
      ...prev,
      [serviceName]: !prev[serviceName],
    }));
  };

  const updateRate = (serviceName: string, value: string) => {
    // Allow empty string or numeric only
    if (/^\d*$/.test(value)) {
      setRates((prev) => ({
        ...prev,
        [serviceName]: value,
      }));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Prepare services data for backend
      const servicesToSave: Service[] = Object.entries(services)
        .filter(([_, enabled]) => enabled) // Only include enabled services
        .map(([name, enabled]) => ({
          name,
          description: `Price per kg for ${name}`,
          price: parseFloat(rates[name] || '0'),
          duration_hours: 24,
        }));

      const result = await saveServices(servicesToSave);
      
      if (result.success) {
        Alert.alert('Success', result.message);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error: any) {
      console.error('Error saving rates:', error);
      Alert.alert('Error', 'Failed to save rates. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Manage Products & Prices</Text>
          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
            onPress={handleSave} 
            activeOpacity={0.8}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#111111" />
            <Text style={styles.loadingText}>Loading rates...</Text>
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Meat Products You Sell</Text>
            {Object.entries(services).map(([service, enabled]) => (
              <View key={service} style={styles.serviceRow}>
                <Text style={styles.serviceText}>{service}</Text>
                <Switch
                  value={enabled}
                  onValueChange={() => toggleService(service)}
                  thumbColor={enabled ? '#111111' : '#f4f3f4'}
                  trackColor={{ false: '#767577', true: '#a3a3a3' }}
                />
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product Rates (₹ per kg)</Text>

            {Object.entries(rates).map(([service, rate]) => {
              const isFocused = focusedInput === service;
              return (
                <View key={`${service}-rate`} style={styles.rateRow}>
                  <Text style={styles.serviceText}>{service}</Text>
                  <View style={[styles.rateInputContainer, isFocused && styles.rateInputFocused]}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <TextInput
                      style={styles.rateInput}
                      keyboardType="numeric"
                      value={rate}
                      onChangeText={(text) => updateRate(service, text)}
                      placeholder="0"
                      maxLength={5}
                      onFocus={() => setFocusedInput(service)}
                      onBlur={() => setFocusedInput(null)}
                      selectionColor="#111"
                      returnKeyType="done"
                      blurOnSubmit={true}
                      importantForAutofill="no"
                    />
                  </View>
                </View>
              );
            })}

            <Text style={styles.infoText}>
              Update the rates for each meat product per kilogram. Only numeric values are accepted.
            </Text>
          </View>
        </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: Constants.statusBarHeight + 16,
    paddingBottom: 14,
    paddingHorizontal: 20,
    backgroundColor: '#F9FAFB',
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
    fontSize: 22,
    fontWeight: '700',
    color: '#111111',
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#111111',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginLeft: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 20,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  serviceText: {
    fontSize: 16,
    color: '#111111',
    fontWeight: '500',
    flex: 1,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  rateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 10,
    height: 40,
    width: 90,
  },
  rateInputFocused: {
    borderColor: '#111111',
    shadowColor: '#111',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  currencySymbol: {
    fontSize: 18,
    color: '#111111',
    marginRight: 6,
  },
  rateInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#111111',
    padding: 0,
    margin: 0,
  },
  infoText: {
    marginTop: 10,
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
});
