import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { DashboardStats, getVendorOrders, Order, getVendorProfile, updateShopStatus, getUnreadNotificationCount } from '@/services/api';

import {
  LogOut,
  Bell,
  TrendingUp,
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
    pendingOrders: 0,
    totalIncome: 0,
  });
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [newOrders, setNewOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allOrdersLoading, setAllOrdersLoading] = useState(false);
  const [shopName, setShopName] = useState<string | undefined>(undefined);
  const [isOpen, setIsOpen] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastOrderCheckRef = useRef<Date>(new Date());
  const [viewedOrderIds, setViewedOrderIds] = useState<Set<string>>(new Set());
  const viewedOrderIdsLoaded = useRef(false); // Track if viewed IDs have been loaded
  const viewedOrderIdsRef = useRef<Set<string>>(new Set()); // Ref to always have latest viewed IDs

  // Load viewed order IDs from storage on mount (MUST load before fetching orders)
  useEffect(() => {
    const loadViewedOrders = async () => {
      try {
        const viewedStr = await AsyncStorage.getItem('viewed_order_ids');
        if (viewedStr) {
          const viewedArray = JSON.parse(viewedStr);
          const viewedSet = new Set(viewedArray);
          setViewedOrderIds(viewedSet);
          viewedOrderIdsRef.current = viewedSet; // Update ref as well
          viewedOrderIdsLoaded.current = true;
          console.log(`[loadViewedOrders] Loaded ${viewedArray.length} viewed order IDs:`, Array.from(viewedSet));
        } else {
          viewedOrderIdsRef.current = new Set(); // Initialize empty set
          viewedOrderIdsLoaded.current = true; // Mark as loaded even if empty
          console.log(`[loadViewedOrders] No viewed orders found`);
        }
      } catch (error) {
        console.error('[loadViewedOrders] Error loading viewed orders:', error);
        viewedOrderIdsLoaded.current = true; // Mark as loaded even on error
      }
    };
    loadViewedOrders();
  }, []);

  useEffect(() => {
    // Wait for viewedOrderIds to load before fetching orders
    const initializeOrders = async () => {
      // Wait a bit to ensure viewedOrderIds are loaded
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (viewedOrderIdsLoaded.current) {
        console.log('[useEffect] Viewed order IDs loaded, fetching orders...');
        
        // First, load all orders to see what exists
        await loadAllOrders();
        
        // If no viewed orders exist in storage, mark all existing orders as viewed
        // This ensures all existing orders appear only in "All Orders", not "New Orders"
        if (viewedOrderIds.size === 0) {
          // Wait a bit for allOrders state to update
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Get current allOrders from state (we need to check it after loadAllOrders completes)
          // Since state updates are async, we'll fetch orders again to mark them
          const orders = await getVendorOrders();
          if (orders && orders.length > 0) {
            console.log(`[useEffect] No viewed orders in storage. Marking all ${orders.length} existing orders as viewed...`);
            const allOrderIds = orders.map(order => order.id);
            const newViewedSet = new Set(allOrderIds);
            setViewedOrderIds(newViewedSet);
            viewedOrderIdsRef.current = newViewedSet;
            
            // Save to AsyncStorage
            await AsyncStorage.setItem('viewed_order_ids', JSON.stringify(Array.from(newViewedSet)));
            console.log(`[useEffect] ✅ Marked ${allOrderIds.length} existing orders as viewed. They will only appear in "All Orders"`);
          }
        }
        
        // Now load new orders (will be filtered by viewedOrderIds - should be empty if all were marked as viewed)
        loadNewOrders();
        
        // Start polling for new orders every 2 seconds
        startPolling();
      } else {
        console.log('[useEffect] Waiting for viewed order IDs to load...');
        // Retry after a short delay
        setTimeout(async () => {
          if (viewedOrderIdsLoaded.current) {
            await loadAllOrders();
            
            // Mark all existing orders as viewed if none are marked
            if (viewedOrderIds.size === 0) {
              await new Promise(resolve => setTimeout(resolve, 200));
              const orders = await getVendorOrders();
              if (orders && orders.length > 0) {
                const allOrderIds = orders.map(order => order.id);
                const newViewedSet = new Set(allOrderIds);
                setViewedOrderIds(newViewedSet);
                viewedOrderIdsRef.current = newViewedSet;
                await AsyncStorage.setItem('viewed_order_ids', JSON.stringify(Array.from(newViewedSet)));
                console.log(`[useEffect] ✅ Marked ${allOrderIds.length} existing orders as viewed`);
              }
            }
            
            loadNewOrders();
            startPolling();
          }
        }, 500);
      }
    };
    
    initializeOrders();
    
    // Cleanup polling on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [viewedOrderIdsLoaded.current]);

  // Refresh orders when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('[DashboardScreen] Screen focused - immediately fetching orders...');
      // Only refresh if viewedOrderIds have been loaded
      if (viewedOrderIdsLoaded.current) {
        // Refresh immediately when screen comes into focus (no delay)
        // This ensures new orders appear instantly when vendor opens the app
        loadNewOrders();
        loadAllOrders();
        
        // Restart polling with faster interval
        startPolling();
      }
      
      return () => {
        // Cleanup polling when screen loses focus
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    }, [])
  );

  // Function to mark an order as viewed
  const markOrderAsViewed = async (orderId: string) => {
    try {
      console.log(`[markOrderAsViewed] Marking order ${orderId} as viewed...`);
      
      setViewedOrderIds(prev => {
        const newSet = new Set(prev);
        newSet.add(orderId);
        
        // Update ref immediately so loadNewOrders can use it
        viewedOrderIdsRef.current = newSet;
        
        // Save to AsyncStorage
        AsyncStorage.setItem('viewed_order_ids', JSON.stringify(Array.from(newSet))).catch(err => {
          console.error('[markOrderAsViewed] Error saving viewed orders:', err);
        });
        
        console.log(`[markOrderAsViewed] ✅ Marked order ${orderId} as viewed. Total viewed: ${newSet.size}`);
        return newSet;
      });
      
      // Remove from newOrders immediately (optimistic update)
      setNewOrders(prevOrders => {
        const filtered = prevOrders.filter(o => o.id !== orderId);
        console.log(`[markOrderAsViewed] Removed order ${orderId} from newOrders. Remaining: ${filtered.length}`);
        return filtered;
      });
      
      // Small delay to ensure state is updated, then reload
      setTimeout(() => {
        loadNewOrders(true); // Pass true for background poll
      }, 100);
    } catch (error) {
      console.error('[markOrderAsViewed] Error marking order as viewed:', error);
    }
  };

  // Function to update a specific order in the list
  const updateOrderInList = (updatedOrder: Order) => {
    // When order status is updated, mark it as viewed (moves to All Orders)
    markOrderAsViewed(updatedOrder.id);
    
    setNewOrders(prevOrders => {
      // Remove from new orders since it's been viewed/updated
      return prevOrders.filter(o => o.id !== updatedOrder.id);
    });
  };

  const startPolling = () => {
    // Clear existing interval if any
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    // Poll every 2 seconds for new orders (real-time updates)
    // This ensures vendors see new orders immediately when customers place them
    // Reduced from 5 seconds to 2 seconds for faster order detection
    pollingIntervalRef.current = setInterval(() => {
      console.log('[Polling] Fetching orders every 2 seconds...');
      loadNewOrders(true); // Pass true to indicate it's a background poll
    }, 2000); // 2 seconds - faster polling for immediate order detection
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadNewOrders(),
      loadAllOrders(),
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

  // Load notification count
  const loadNotificationCount = async () => {
    try {
      const count = await getUnreadNotificationCount();
      setUnreadNotificationCount(count);
    } catch (error) {
      console.error('[DashboardScreen] Error loading notification count:', error);
    }
  };

  useEffect(() => {
    loadNotificationCount();
  }, []);

  // Refresh notification count when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadNotificationCount();
    }, [])
  );

  // Calculate stats from allOrders state (ensures counts match displayed orders)
  const calculateStats = (orders: Order[]) => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => {
      const status = (o.status || '').toLowerCase();
      return status.includes('pending') || 
             status.includes('confirmed') || 
             status.includes('preparing') ||
             status.includes('order placed') ||
             status.includes('order ready') ||
             status.includes('out for delivery');
    }).length;
    
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
      
      console.log(`[calculateStats] Order ${order.id || 'N/A'}: Original Amount=₹${orderAmount}, Commission (20%)=₹${commission.toFixed(2)}, Net Amount=₹${netAmount.toFixed(2)}`);
      
      return sum + netAmount;
    }, 0);
    
    console.log(`[calculateStats] Total Income (after 20% commission): ₹${totalIncome.toLocaleString('en-IN')}`);
    
    return {
      totalOrders,
      pendingOrders,
      totalIncome,
    };
  };

  // Update stats whenever allOrders changes
  useEffect(() => {
    if (!allOrdersLoading) {
      const newStats = calculateStats(allOrders);
      setStats(newStats);
    }
  }, [allOrders, allOrdersLoading]);

  // Update ref whenever viewedOrderIds state changes
  useEffect(() => {
    viewedOrderIdsRef.current = viewedOrderIds;
    console.log(`[useEffect] Updated viewedOrderIdsRef. Count: ${viewedOrderIds.size}`);
  }, [viewedOrderIds]);

  // Reload new orders when viewedOrderIds changes (to filter out viewed orders)
  useEffect(() => {
    if (viewedOrderIdsLoaded.current && viewedOrderIds.size >= 0) {
      console.log(`[useEffect] Viewed order IDs changed, reloading new orders. Viewed count: ${viewedOrderIds.size}`);
      loadNewOrders(true); // Reload in background when viewed orders change
    }
  }, [viewedOrderIds.size]); // Trigger when size changes

  const loadNewOrders = async (isBackgroundPoll = false) => {
    try {
      // Only show loading indicator if it's a manual refresh, not background polling
      if (!isBackgroundPoll) {
        setOrdersLoading(true);
      }
      
      console.log(`[loadNewOrders] Fetching orders for shop (filtered by shop_id in backend)...`);
      const orders = await getVendorOrders();
      
      console.log(`[loadNewOrders] ✅ Fetched ${orders?.length || 0} orders from API (filtered by shop_id)`);
      
      // Log order details for debugging new shops
      if (orders && orders.length > 0) {
        console.log(`[loadNewOrders] Order details:`, orders.map(o => ({
          id: o.id,
          order_number: o.order_number,
          shop_id: o.shop_id,
          status: o.status,
          created_at: o.created_at || o.placedOn,
        })));
      } else {
        console.log(`[loadNewOrders] ⚠️ No orders returned - this might be a new shop or no orders yet`);
      }
      
      // If no orders returned, set empty array and return early
      if (!orders || orders.length === 0) {
        console.log('[loadNewOrders] No orders returned from API - waiting for new orders...');
        setNewOrders([]);
        if (!isBackgroundPoll) {
          setOrdersLoading(false);
        }
        return;
      }
      
      // Get only the latest unviewed orders (sorted by newest first)
      // Filter out orders that have been viewed/opened by the vendor
      // IMPORTANT: Use ref to get the latest viewed IDs (avoids closure issues)
      const currentViewedIds = viewedOrderIdsRef.current;
      console.log(`[loadNewOrders] Filtering orders. Total orders: ${orders.length}, Viewed IDs count: ${currentViewedIds.size}`);
      if (currentViewedIds.size > 0) {
        console.log(`[loadNewOrders] Viewed order IDs:`, Array.from(currentViewedIds));
      }
      
      const latestUnviewedOrders = orders
        .filter(order => {
          const isViewed = currentViewedIds.has(order.id);
          if (isViewed) {
            console.log(`[loadNewOrders] ❌ Filtering out viewed order: ${order.id} (${order.orderNumber || order.order_number || 'N/A'})`);
          } else {
            console.log(`[loadNewOrders] ✅ Including unviewed order: ${order.id} (${order.orderNumber || order.order_number || 'N/A'})`);
          }
          return !isViewed; // Only show unviewed orders
        })
        .sort((a, b) => {
          try {
            const dateA = new Date(a.created_at || a.placedOn || 0).getTime();
            const dateB = new Date(b.created_at || b.placedOn || 0).getTime();
            return dateB - dateA; // Newest first
          } catch {
            return 0; // If date parsing fails, maintain order
          }
        })
        .slice(0, 5); // Show max 5 most recent unviewed orders
      
      console.log(`[loadNewOrders] Filtered to ${latestUnviewedOrders.length} latest unviewed orders`);
      
      // Check if we have new orders (compare with previous state)
      const hasNewOrders = latestUnviewedOrders.length > 0 && 
        (newOrders.length === 0 || 
         latestUnviewedOrders[0]?.id !== newOrders[0]?.id ||
         latestUnviewedOrders.length !== newOrders.length);
      
      // Only update if orders actually changed to avoid unnecessary re-renders
      if (hasNewOrders || JSON.stringify(latestUnviewedOrders.map(o => o.id)) !== JSON.stringify(newOrders.map(o => o.id))) {
        console.log(`[loadNewOrders] ✅ Latest unviewed orders detected! Updating UI with ${latestUnviewedOrders.length} orders`);
        setNewOrders(latestUnviewedOrders);
      } else {
        console.log(`[loadNewOrders] No new unviewed orders since last check`);
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
          <TouchableOpacity 
            style={styles.bellButton}
            onPress={() => router.push('/notifications')}
          >
            <Bell size={24} color="#000" />
            {unreadNotificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>
                  {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                </Text>
              </View>
            )}
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

          {allOrdersLoading ? (
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
              <Text style={[styles.statCount, styles.primaryStatCount]}>
                {stats.totalOrders === 1 ? '1 order' : `${stats.totalOrders} orders`}
              </Text>
            </View>

            <View style={styles.statCard}>
              <Package size={24} color="#000" />
              <Text style={styles.statValue}>{stats.pendingOrders}</Text>
              <Text style={styles.statLabel}>Pending Orders</Text>
              <Text style={styles.statCount}>
                {stats.pendingOrders === 1 ? '1 pending' : `${stats.pendingOrders} pending`}
              </Text>
            </View>

            <View style={styles.statCard}>
              <CreditCard size={24} color="#000" />
              <Text style={styles.statValue}>
                ₹{stats.totalIncome.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
              </Text>
              <Text style={styles.statLabel}>Total Income</Text>
              <Text style={styles.statCount}>
                From all orders
              </Text>
              <View style={styles.incomeNote}>
                <Text style={styles.incomeNoteText}>
                  After platform fee (20%) deduction
                </Text>
              </View>
            </View>
          </View>
          )}
        </View>

        {/* New Order Received - Latest Orders Only */}
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
              <Text style={styles.emptyOrdersText}>No orders yet</Text>
              <Text style={styles.emptyOrdersSubtext}>
                Latest orders from customers will appear here
              </Text>
            </View>
          ) : (
            newOrders.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => {
                  // Mark order as viewed when vendor opens it
                  markOrderAsViewed(order.id);
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
  statCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  primaryStatCount: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  incomeNote: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    width: '100%',
  },
  incomeNoteText: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
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
