import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Package, Clock } from 'lucide-react-native';
import { getVendorOrders, Order } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { Platform, StatusBar as RNStatusBar } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight || 24 : 44;

export default function AllOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAllOrders = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const allOrders = await getVendorOrders();
      
      // Sort by created_at descending (newest first)
      const sortedOrders = (allOrders || []).sort((a, b) => {
        const dateA = new Date(a.created_at || a.placedOn || 0).getTime();
        const dateB = new Date(b.created_at || b.placedOn || 0).getTime();
        return dateB - dateA;
      });

      setOrders(sortedOrders);
    } catch (error) {
      console.error('[AllOrdersScreen] Error loading orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllOrders();
  }, []);

  // Refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadAllOrders();
    }, [])
  );

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Just now';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'Just now';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'preparing':
      case 'order placed':
        return '#FEF3C7';
      case 'ready':
      case 'order ready':
        return '#D1FAE5';
      case 'out for delivery':
      case 'picked up':
        return '#DBEAFE';
      case 'delivered':
        return '#D1FAE5';
      case 'cancelled':
        return '#FEE2E2';
      default:
        return '#F3F4F6';
    }
  };

  const getStatusTextColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'preparing':
      case 'order placed':
        return '#D97706';
      case 'ready':
      case 'order ready':
        return '#059669';
      case 'out for delivery':
      case 'picked up':
        return '#1D4ED8';
      case 'delivered':
        return '#059669';
      case 'cancelled':
        return '#DC2626';
      default:
        return '#6B7280';
    }
  };

  // Group orders by status
  const groupedOrders = {
    active: orders.filter(o => {
      const status = o.status?.toLowerCase() || '';
      return !status.includes('delivered') && !status.includes('cancelled');
    }),
    completed: orders.filter(o => {
      const status = o.status?.toLowerCase() || '';
      return status.includes('delivered');
    }),
    cancelled: orders.filter(o => {
      const status = o.status?.toLowerCase() || '';
      return status.includes('cancelled');
    }),
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ExpoStatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>All Orders</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ExpoStatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Orders</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadAllOrders(true)} />
        }
      >
        {/* Active Orders */}
        {groupedOrders.active.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Orders ({groupedOrders.active.length})</Text>
            {groupedOrders.active.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => router.push(`/order-details?id=${order.id}`)}
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
                        {formatTimeAgo(order.created_at || order.placedOn)}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.orderCardRight}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(order.status) }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: getStatusTextColor(order.status) }
                    ]}>
                      {order.status || 'Preparing'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Completed Orders */}
        {groupedOrders.completed.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completed Orders ({groupedOrders.completed.length})</Text>
            {groupedOrders.completed.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => router.push(`/order-details?id=${order.id}`)}
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
                        {formatDate(order.created_at || order.placedOn)}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.orderCardRight}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(order.status) }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: getStatusTextColor(order.status) }
                    ]}>
                      {order.status || 'Delivered'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Cancelled Orders */}
        {groupedOrders.cancelled.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cancelled Orders ({groupedOrders.cancelled.length})</Text>
            {groupedOrders.cancelled.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => router.push(`/order-details?id=${order.id}`)}
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
                        {formatDate(order.created_at || order.placedOn)}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.orderCardRight}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(order.status) }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: getStatusTextColor(order.status) }
                    ]}>
                      {order.status || 'Cancelled'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {orders.length === 0 && (
          <View style={styles.emptyContainer}>
            <Package size={48} color="#999" />
            <Text style={styles.emptyText}>No orders found</Text>
            <Text style={styles.emptySubtext}>
              Orders from customers will appear here
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: STATUS_BAR_HEIGHT + 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: '600',
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
    marginLeft: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 300,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});


