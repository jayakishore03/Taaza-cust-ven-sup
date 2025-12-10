import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Bell,
  Shield,
  LogOut,
  CreditCard as Edit,
  Save,
  Lock,
  HelpCircle,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const [editing, setEditing] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [profileData, setProfileData] = useState({
    name: 'Saikiran Konapala',
    email: 'saikirankonapala26@gmail.com',
    phone: '+91 94926 64870',
    dateOfBirth: '2002-11-29',
    address: 'Currency Nagar, Vijayawada, India',
    businessName: 'Taaza Shop',
    experience: '8 years',
    specialization: 'Fresh meat products',
  });

  const handleSave = () => {
    setEditing(false);
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => router.replace('/(auth)/login'),
        },
      ]
    );
  };

  const updateField = (field: keyof typeof profileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const profilePictureUrl = 'https://cdn.123telugu.com/content/wp-content/uploads/2025/09/OG-2-1.webp'; // Placeholder URL

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity
          style={editing ? styles.saveButton : styles.editButton}
          onPress={editing ? handleSave : () => setEditing(true)}
        >
          {editing ? (
            <>
              <Save size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save</Text>
            </>
          ) : (
            <>
              <Edit size={20} color="#111111" />
              <Text style={styles.editButtonText}>Edit</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: profilePictureUrl }}
              style={styles.profileImage}
            />
          </View>
          <Text style={styles.profileName}>{profileData.name}</Text>
          <Text style={styles.businessName}>{profileData.businessName}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <User size={18} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={profileData.name}
                onChangeText={text => updateField('name', text)}
                placeholder="Full name"
                placeholderTextColor="#6B7280"
                editable={editing}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Mail size={18} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={profileData.email}
                onChangeText={text => updateField('email', text)}
                placeholder="Email address"
                placeholderTextColor="#6B7280"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={editing}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <Phone size={18} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={profileData.phone}
                onChangeText={text => updateField('phone', text)}
                placeholder="Phone number"
                placeholderTextColor="#6B7280"
                keyboardType="phone-pad"
                editable={editing}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date of Birth</Text>
            <View style={styles.inputWrapper}>
              <Calendar size={18} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={profileData.dateOfBirth}
                onChangeText={text => updateField('dateOfBirth', text)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#6B7280"
                editable={editing}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Address</Text>
            <View style={styles.inputWrapper}>
              <MapPin size={18} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.textArea]}
                value={profileData.address}
                onChangeText={text => updateField('address', text)}
                placeholder="Full address"
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={2}
                editable={editing}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Business Name</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={profileData.businessName}
                onChangeText={text => updateField('businessName', text)}
                placeholder="Business name"
                placeholderTextColor="#6B7280"
                editable={editing}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Experience</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={profileData.experience}
                onChangeText={text => updateField('experience', text)}
                placeholder="Years of experience"
                placeholderTextColor="#6B7280"
                editable={editing}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Specialization</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={profileData.specialization}
                onChangeText={text => updateField('specialization', text)}
                placeholder="Your specialization"
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={2}
                editable={editing}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Bell size={20} color="#111111" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingSubtitle}>
                  Get notified about new orders and updates
                </Text>
              </View>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#E5E7EB', true: '#111111' }}
              thumbColor={notifications ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          <TouchableOpacity style={styles.settingButton}>
            <Lock size={20} color="#111111" />
            <Text style={styles.settingButtonText}>Change Password</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingButton}>
            <HelpCircle size={20} color="#111111" />
            <Text style={styles.settingButtonText}>Help & Support</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingButton}>
            <Shield size={20} color="#111111" />
            <Text style={styles.settingButtonText}>Privacy & Security</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111111',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#111111',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#111111',
    fontWeight: '600',
    marginLeft: 8,
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
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileImageContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111111',
    marginBottom: 4,
  },
  businessName: {
    fontSize: 16,
    color: '#6B7280',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111111',
    marginBottom: 16,
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
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111111',
    paddingVertical: 12,
  },
  textArea: {
    textAlignVertical: 'top',
    height: 60,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 16,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
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
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  settingButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111111',
    marginLeft: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 20,
    marginBottom: 32,
    borderWidth: 2,
    borderColor: '#FEE2E2',
  },
  logoutButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});