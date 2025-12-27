import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  ActivityIndicator,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Href } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardStats, DashboardStats } from '@/services/api';

import {
  LogOut,
  Bell,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  MapPin,
  FileText,
  CreditCard,
} from 'lucide-react-native';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

export default function DashboardScreen() {
  const { signOut, user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    monthlyRevenue: 0,
    activeCustomers: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [shopName, setShopName] = useState<string | undefined>(undefined);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Load cached vendor/shop name for header
  useEffect(() => {
    const loadVendorName = async () => {
      const extractName = (data: any) =>
        data?.shop?.storeName ||
        data?.shop?.name ||
        data?.shop?.store_name ||
        data?.shop?.shopName ||
        data?.user?.name ||
        data?.user?.email;

      try {
        const vendorDataStr = await AsyncStorage.getItem('vendor_data');
        if (vendorDataStr) {
          const vendorData = JSON.parse(vendorDataStr);
          const nameFromData = extractName(vendorData);
          if (nameFromData) {
            setShopName(nameFromData);
            return;
          }
        }
      } catch {
        // Non-blocking: ignore storage errors
      }

      // Try auth user
      if (user?.name) {
        setShopName(user.name);
      }

      // Fetch fresh profile and persist for future loads
      try {
        const { getVendorProfile } = await import('@/services/api');
        const profile = await getVendorProfile();
        if (profile?.data) {
          const nameFromProfile = extractName(profile.data);
          if (nameFromProfile) {
            setShopName(nameFromProfile);
          }
          // cache latest vendor data
          await AsyncStorage.setItem('vendor_data', JSON.stringify(profile.data));
        }
      } catch {
        // Silently ignore network/profile errors for header text
      }
    };

    loadVendorName();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const dashboardStats = await getDashboardStats();
      if (dashboardStats) {
        setStats(dashboardStats);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: STATUS_BAR_HEIGHT }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back!</Text>
          <Text style={styles.vendorName}>{shopName || user?.name || 'Taaza Shop'}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.bellButton}>
            <Bell size={24} color="#000" />
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Open/Close toggle */}
      <View style={styles.openCloseContainer}>
        <Text style={styles.openCloseLabel}>Store Status:</Text>
        <View style={styles.statusRow}>
          <Text style={[styles.statusText, isOpen ? styles.openText : styles.closeText]}>
            {isOpen ? 'Open' : 'Closed'}
          </Text>
          <Switch
            value={isOpen}
            onValueChange={setIsOpen}
            thumbColor={isOpen ? '#111111' : '#f4f3f4'}
            trackColor={{ true: '#c7ffd9', false: '#ffd6d6' }}
          />
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Business Overview */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Business Overview</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#000" />
            </View>
          ) : (
            <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.primaryCard]}>
              <TrendingUp size={24} color="#fff" />
              <Text style={[styles.statValue, styles.primaryStatValue]}>
                {stats.totalOrders}
              </Text>
              <Text style={[styles.statLabel, styles.primaryStatLabel]}>
                Total Orders
              </Text>
            </View>

            <View style={styles.statCard}>
              <DollarSign size={24} color="#000" />
              <Text style={styles.statValue}>
                ₹{stats.monthlyRevenue.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Monthly Revenue</Text>
            </View>

            <View style={styles.statCard}>
              <Users size={24} color="#000" />
              <Text style={styles.statValue}>{stats.activeCustomers}</Text>
              <Text style={styles.statLabel}>Active Customers</Text>
            </View>

            <View style={styles.statCard}>
              <Package size={24} color="#000" />
              <Text style={styles.statValue}>{stats.pendingOrders}</Text>
              <Text style={styles.statLabel}>Pending Orders</Text>
            </View>
          </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/store' as Href)}
          >
            <MapPin size={24} color="#000" />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Update Store Details</Text>
              <Text style={styles.actionSubtitle}>
                Manage your store information and location
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/documents' as Href)}
          >
            <FileText size={24} color="#000" />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Upload Documents</Text>
              <Text style={styles.actionSubtitle}>
                Keep your business documents up to date
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/banking' as Href)}
          >
            <CreditCard size={24} color="#000" />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Banking Information</Text>
              <Text style={styles.actionSubtitle}>
                Manage payment and banking details
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentActivity}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>

          <View style={styles.activityItem}>
            <View style={styles.activityDot} />
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>New order received</Text>
              <Text style={styles.activityTime}>2 hours ago</Text>
            </View>
          </View>

          <View style={styles.activityItem}>
            <View style={styles.activityDot} />
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Payment processed</Text>
              <Text style={styles.activityTime}>4 hours ago</Text>
            </View>
          </View>

          <View style={styles.activityItem}>
            <View style={styles.activityDot} />
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Document verified</Text>
              <Text style={styles.activityTime}>1 day ago</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  vendorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bellButton: {
    marginRight: 16,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#000',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 8,
  },
  openCloseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
    paddingTop: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  openCloseLabel: {
    fontSize: 16,
    color: '#444',
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '700',
  },
  openText: {
    color: '#1f7a3d',
  },
  closeText: {
    color: '#b02626',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
    marginTop: 24,
  },
  statsContainer: {
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '48%',
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  primaryCard: {
    backgroundColor: '#000',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 8,
    marginBottom: 4,
  },
  primaryStatValue: {
    color: '#fff',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  primaryStatLabel: {
    color: '#fff',
  },
  quickActions: {
    marginBottom: 8,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  actionContent: {
    marginLeft: 16,
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  recentActivity: {
    marginBottom: 32,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000',
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
