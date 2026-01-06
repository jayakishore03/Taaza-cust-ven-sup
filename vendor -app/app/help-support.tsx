import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  HelpCircle,
  Mail,
  Phone,
  Clock,
  CheckCircle,
} from 'lucide-react-native';

export default function HelpSupportScreen() {

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}?subject=Vendor Support Request`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#111111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.iconContainer}>
              <HelpCircle size={48} color="#111111" />
            </View>
            <Text style={styles.heroTitle}>We're Here to Help</Text>
            <Text style={styles.heroSubtitle}>
              Our dedicated management team is available to assist you with any questions or concerns.
            </Text>
          </View>

          {/* Contact Methods */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Management Team</Text>
            <Text style={styles.sectionSubtitle}>
              Choose your preferred method to reach out to us
            </Text>

            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => handleEmail('support@taaza.com')}
            >
              <View style={styles.contactIconContainer}>
                <Mail size={24} color="#111111" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Email Support</Text>
                <Text style={styles.contactSubtitle}>support@taaza.com</Text>
                <Text style={styles.contactDescription}>
                  Get help via email. We typically respond within 24 hours.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => handleCall('8919079058')}
            >
              <View style={styles.contactIconContainer}>
                <Phone size={24} color="#111111" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Phone Support</Text>
                <Text style={styles.contactSubtitle}>+91-8919079058</Text>
                <Text style={styles.contactDescription}>
                  Call us Monday - Friday, 9:00 AM - 6:00 PM IST
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.contactCard}>
              <View style={styles.contactIconContainer}>
                <Clock size={24} color="#111111" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Business Hours</Text>
                <Text style={styles.contactSubtitle}>Monday - Friday</Text>
                <Text style={styles.contactDescription}>
                  9:00 AM - 6:00 PM IST
                </Text>
              </View>
            </View>
          </View>

          {/* Additional Support */}
          <View style={styles.section}>
            <View style={styles.supportCard}>
              <HelpCircle size={32} color="#111111" />
              <Text style={styles.supportCardTitle}>
                Need Immediate Assistance?
              </Text>
              <Text style={styles.supportCardDescription}>
                For urgent matters, please call our support line directly. Our team is ready to assist you during business hours.
              </Text>
              <TouchableOpacity
                style={styles.supportButton}
                onPress={() => handleCall('8919079058')}
              >
                <Phone size={18} color="#111111" />
                <Text style={styles.supportButtonText}>Call Now</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer Note */}
          <View style={styles.footerNote}>
            <CheckCircle size={20} color="#10B981" />
            <Text style={styles.footerText}>
              Your satisfaction is our priority. We're committed to providing you with the best support experience.
            </Text>
          </View>
        </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111111',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    marginBottom: 2,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111111',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111111',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  contactCard: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#111111',
    fontWeight: '500',
    marginBottom: 4,
  },
  contactDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  supportCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  supportCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111111',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  supportCardDescription: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#111111',
  },
  supportButtonText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginTop: 2,
    paddingHorizontal: 24,
  },
  footerText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 12,
    lineHeight: 20,
  },
});

