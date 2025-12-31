import React, { useState, useEffect, useRef } from 'react';
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
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardStats, DashboardStats, getVendorOrders, Order, getVendorProfile, updateShopStatus } from '@/services/api';

import {
  LogOut,
  Bell,
  TrendingUp,
  DollarSign,
  Package,
  MapPin,
  FileText,
  CreditCard,
  Clock,
  ArrowRight,
} from 'lucide-react-native';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

export default function DashboardScreen() {
  const { signOut, user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    monthlyRevenue: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [newOrders, setNewOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allOrdersLoading, setAllOrdersLoading] = useState(false);
  const [shopName, setShopName] = useState<string | undefined>(undefined);
  const [isOpen, setIsOpen] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastOrderCheckRef = useRef<Date>(new Date());

  useEffect(() => {
    loadDashboardData();
    loadNewOrders();
    loadAllOrders();
    
    // Start polling for new orders every 10 seconds
    startPolling();
    
    // Cleanup polling on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Refresh orders when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Refresh immediately when screen comes into focus
      loadNewOrders();
      loadAllOrders();
      loadDashboardData();
      
      // Restart polling
      startPolling();
      
      return () => {
        // Cleanup polling when screen loses focus
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    }, [])
  );

  // Function to update a specific order in the list
  const updateOrderInList = (updatedOrder: Order) => {
    setNewOrders(prevOrders => {
      const orderIndex = prevOrders.findIndex(o => o.id === updatedOrder.id);
      if (orderIndex !== -1) {
        // Update the specific order
        const updatedOrders = [...prevOrders];
        updatedOrders[orderIndex] = updatedOrder;
        console.log(`[updateOrderInList] Updated order ${updatedOrder.id} status to ${updatedOrder.status}`);
        return updatedOrders;
      }
      // If order not in list, check if it should be added (based on status)
      const status = updatedOrder.status?.toLowerCase() || '';
      const isActiveStatus = status.includes('preparing') || status.includes('ready') || status.includes('pending') || status.includes('confirmed');
      if (isActiveStatus) {
        // Add to list if it's an active status
        return [updatedOrder, ...prevOrders].slice(0, 5);
      }
      return prevOrders;
    });
  };

  const startPolling = () => {
    // Clear existing interval if any
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    // Poll every 5 seconds for new orders (real-time updates)
    // This ensures vendors see new orders immediately when customers place them
    pollingIntervalRef.current = setInterval(() => {
      console.log('[Polling] Fetching orders every 5 seconds...');
      loadNewOrders(true); // Pass true to indicate it's a background poll
    }, 5000); // 5 seconds - fetches orders based on shop_id from backend
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadDashboardData(),
      loadNewOrders(),
    ]);
    setRefreshing(false);
  };

  // Load cached vendor/shop name and shop status for header
  useEffect(() => {
    const loadVendorData = async () => {
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
          }
          // Load shop is_open status from cached data
          if (vendorData?.shop?.is_open !== undefined) {
            setIsOpen(vendorData.shop.is_open);
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
        const profile = await getVendorProfile();
        if (profile?.data) {
          const nameFromProfile = extractName(profile.data);
          if (nameFromProfile) {
            setShopName(nameFromProfile);
          }
          // Load shop is_open status from fresh profile
          if (profile.data?.shop?.is_open !== undefined) {
            setIsOpen(profile.data.shop.is_open);
          }
          // cache latest vendor data
          await AsyncStorage.setItem('vendor_data', JSON.stringify(profile.data));
        }
      } catch {
        // Silently ignore network/profile errors for header text
      }
    };

    loadVendorData();
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

  const loadNewOrders = async (isBackgroundPoll = false) => {
    try {
      // Only show loading indicator if it's a manual refresh, not background polling
      if (!isBackgroundPoll) {
        setOrdersLoading(true);
      }
      
      console.log(`[loadNewOrders] Fetching orders for shop (filtered by shop_id in backend)...`);
      const orders = await getVendorOrders();
      
      console.log(`[loadNewOrders] Fetched ${orders?.length || 0} orders from API (filtered by shop_id)`);
      
      // If no orders returned, set empty array and return early
      if (!orders || orders.length === 0) {
        console.log('[loadNewOrders] No orders returned from API - waiting for new orders...');
        setNewOrders([]);
        if (!isBackgroundPoll) {
          setOrdersLoading(false);
        }
        return;
      }
      
      // Filter new orders - orders with status "Preparing" or "Pending" or "Confirmed"
      // and created within last 24 hours, sorted by newest first
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const recentOrders = orders
        .filter(order => {
          // Use created_at if available, otherwise use placedOn (backend format)
          const orderDateStr = order.created_at || order.placedOn;
          if (!orderDateStr) {
            console.log(`[loadNewOrders] Order ${order.id || order.order_number} has no date`);
            return false;
          }
          
          // Handle formatted date strings from backend
          try {
            const orderDate = new Date(orderDateStr);
            if (isNaN(orderDate.getTime())) {
              console.log(`[loadNewOrders] Order ${order.id || order.order_number} has invalid date: ${orderDateStr}`);
              return false; // Invalid date
            }
            
            const status = order.status?.toLowerCase() || '';
            const isRecent = orderDate >= oneDayAgo;
            const isActiveStatus = status.includes('preparing') || status.includes('pending') || status.includes('confirmed');
            
            if (!isRecent) {
              console.log(`[loadNewOrders] Order ${order.id || order.order_number} is too old: ${orderDateStr}`);
            }
            if (!isActiveStatus) {
              console.log(`[loadNewOrders] Order ${order.id || order.order_number} has inactive status: ${status}`);
            }
            
            return isRecent && isActiveStatus;
          } catch (error) {
            console.log(`[loadNewOrders] Error parsing date for order ${order.id || order.order_number}:`, error);
            return false; // Invalid date format
          }
        })
        .sort((a, b) => {
          try {
            const dateA = new Date(a.created_at || a.placedOn || 0).getTime();
            const dateB = new Date(b.created_at || b.placedOn || 0).getTime();
            return dateB - dateA;
          } catch {
            return 0; // If date parsing fails, maintain order
          }
        })
        .slice(0, 5); // Show max 5 most recent orders
      
      console.log(`[loadNewOrders] Filtered to ${recentOrders.length} recent active orders`);
      
      // Check if we have new orders (compare with previous state)
      const hasNewOrders = recentOrders.length > 0 && 
        (newOrders.length === 0 || 
         recentOrders[0]?.id !== newOrders[0]?.id ||
         recentOrders.length !== newOrders.length);
      
      // Only update if orders actually changed to avoid unnecessary re-renders
      if (hasNewOrders || JSON.stringify(recentOrders.map(o => o.id)) !== JSON.stringify(newOrders.map(o => o.id))) {
        console.log(`[loadNewOrders] ✅ New orders detected! Updating UI with ${recentOrders.length} orders`);
        setNewOrders(recentOrders);
      } else {
        console.log(`[loadNewOrders] No new orders since last check`);
      }
      
      // Update last check time
      lastOrderCheckRef.current = new Date();
      
    } catch (error) {
      // Log error but don't stop polling - continue trying
      console.error('[loadNewOrders] Error fetching orders:', error);
      // Don't clear existing orders on error - keep showing what we have
      // setNewOrders([]); // Commented out to prevent clearing orders on temporary errors
    } finally {
      if (!isBackgroundPoll) {
        setOrdersLoading(false);
      }
    }
  };

  const loadAllOrders = async () => {
    try {
      setAllOrdersLoading(true);
      
      console.log('[loadAllOrders] Fetching all orders...');
      const orders = await getVendorOrders();
      
      console.log(`[loadAllOrders] Fetched ${orders?.length || 0} total orders`);
      
      if (!orders || orders.length === 0) {
        setAllOrders([]);
        return;
      }
      
      // Sort all orders by newest first
      const sortedOrders = orders
        .sort((a, b) => {
          try {
            const dateA = new Date(a.created_at || a.placedOn || 0).getTime();
            const dateB = new Date(b.created_at || b.placedOn || 0).getTime();
            return dateB - dateA;
          } catch {
            return 0;
          }
        });
      
      setAllOrders(sortedOrders);
    } catch (error) {
      console.error('[loadAllOrders] Error fetching all orders:', error);
      setAllOrders([]);
    } finally {
      setAllOrdersLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
  };

  const getStatusColor = (status: string | undefined): string => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower.includes('preparing') || statusLower.includes('pending')) {
      return '#FFF3CD';
    } else if (statusLower.includes('confirmed')) {
      return '#D1ECF1';
    } else if (statusLower.includes('completed') || statusLower.includes('delivered')) {
      return '#D4EDDA';
    } else {
      return '#E5E7EB';
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
            onValueChange={async (newValue) => {
              // Update local state immediately for responsive UI
              setIsOpen(newValue);
              
              // Save to backend
              try {
                const result = await updateShopStatus(newValue);
                if (result.success) {
                  console.log(`✅ Shop status updated to: ${newValue ? 'OPEN' : 'CLOSED'}`);
                  // Update cached vendor data
                  try {
                    const vendorDataStr = await AsyncStorage.getItem('vendor_data');
                    if (vendorDataStr) {
                      const vendorData = JSON.parse(vendorDataStr);
                      vendorData.shop = { ...vendorData.shop, is_open: newValue };
                      await AsyncStorage.setItem('vendor_data', JSON.stringify(vendorData));
                    }
                  } catch (error) {
                    // Non-blocking: ignore storage errors
                  }
                } else {
                  // Revert on error
                  setIsOpen(!newValue);
                  Alert.alert(
                    'Failed to Update Status',
                    result.error?.message || 'Could not update shop status. Please try again.',
                    [{ text: 'OK' }]
                  );
                }
              } catch (error: any) {
                // Revert on error
                setIsOpen(!newValue);
                console.error('Error updating shop status:', error);
                Alert.alert(
                  'Error',
                  error.message || 'Failed to update shop status. Please check your connection and try again.',
                  [{ text: 'OK' }]
                );
              }
            }}
            thumbColor={isOpen ? '#111111' : '#f4f3f4'}
            trackColor={{ true: '#c7ffd9', false: '#ffd6d6' }}
          />
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#000"
            colors={['#000']}
          />
        }
      >
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
              <Package size={24} color="#000" />
              <Text style={styles.statValue}>{stats.pendingOrders}</Text>
              <Text style={styles.statLabel}>Pending Orders</Text>
            </View>
          </View>
          )}
        </View>

        {/* New Order Received */}
        <View style={styles.newOrdersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>New Order Received</Text>
            {newOrders.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  router.push('/all-orders');
                }}
              >
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>

          {ordersLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#000" />
            </View>
          ) : newOrders.length === 0 ? (
            <View style={styles.emptyOrdersContainer}>
              <Package size={32} color="#999" />
              <Text style={styles.emptyOrdersText}>No new orders</Text>
              <Text style={styles.emptyOrdersSubtext}>
                New orders from customers will appear here
              </Text>
            </View>
          ) : (
            newOrders.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => {
                  router.push(`/order-details?id=${order.id}`);
                }}
              >
                <View style={styles.orderCardLeft}>
                  <View style={styles.orderIconContainer}>
                    <Package size={20} color="#000" />
                  </View>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderNumber}>
                      {order.orderNumber || `Order #${order.id.slice(0, 8)}`}
                    </Text>
                    <Text style={styles.orderTotal}>
                      {order.total || 
                        (order.total_amount 
                          ? `₹${order.total_amount.toFixed(2)}` 
                          : '₹0.00')}
                    </Text>
                    <View style={styles.orderMeta}>
                      <Clock size={12} color="#666" />
                    <Text style={styles.orderTime}>
                      {formatTimeAgo(order.created_at || order.placedOn || new Date().toISOString())}
                    </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.orderCardRight}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(order.status) }
                  ]}>
                    <Text style={styles.statusText}>
                      {order.status || 'Preparing'}
                    </Text>
                  </View>
                  <ArrowRight size={20} color="#999" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* All Orders */}
        <View style={styles.allOrdersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Orders</Text>
            {allOrders.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  router.push('/all-orders');
                }}
              >
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>

          {allOrdersLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#000" />
            </View>
          ) : allOrders.length === 0 ? (
            <View style={styles.emptyOrdersContainer}>
              <Package size={32} color="#999" />
              <Text style={styles.emptyOrdersText}>No orders found</Text>
              <Text style={styles.emptyOrdersSubtext}>
                Orders from customers will appear here
              </Text>
            </View>
          ) : (
            allOrders.slice(0, 10).map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => {
                  router.push(`/order-details?id=${order.id}`);
                }}
              >
                <View style={styles.orderCardLeft}>
                  <View style={styles.orderIconContainer}>
                    <Package size={20} color="#000" />
                  </View>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderNumber}>
                      {order.orderNumber || `Order #${order.id.slice(0, 8)}`}
                    </Text>
                    <Text style={styles.orderTotal}>
                      {order.total || 
                        (order.total_amount 
                          ? `₹${order.total_amount.toFixed(2)}` 
                          : '₹0.00')}
                    </Text>
                    <View style={styles.orderMeta}>
                      <Clock size={12} color="#666" />
                      <Text style={styles.orderTime}>
                        {formatTimeAgo(order.created_at || order.placedOn || new Date().toISOString())}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.orderCardRight}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(order.status) }
                  ]}>
                    <Text style={styles.statusText}>
                      {order.status || 'Preparing'}
                    </Text>
                  </View>
                  <ArrowRight size={20} color="#999" />
                </View>
              </TouchableOpacity>
            ))
          )}
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
    marginBottom: 32,
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
  newOrdersSection: {
    marginBottom: 8,
  },
  allOrdersSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  orderCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderTime: {
    fontSize: 12,
    color: '#666',
  },
  orderCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  emptyOrdersContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyOrdersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyOrdersSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
