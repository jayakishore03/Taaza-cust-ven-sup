import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Package, MapPin, Clock, Phone, User, CreditCard } from 'lucide-react-native';
import { getVendorOrderById, updateOrderStatus, Order } from '../services/api';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { Platform, StatusBar as RNStatusBar } from 'react-native';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight || 24 : 44;

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadOrderDetails();
  }, [id]);

  const loadOrderDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const orderData = await getVendorOrderById(id);
      setOrder(orderData);
    } catch (error: any) {
      console.error('[OrderDetailsScreen] Error loading order:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;

    Alert.alert(
      'Update Status',
      `Change order status to "${newStatus}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            try {
              setUpdating(true);
              const updatedOrder = await updateOrderStatus(order.id, newStatus);
              setOrder(updatedOrder);
              Alert.alert('Success', 'Order status updated');
            } catch (error: any) {
              console.error('[OrderDetailsScreen] Error updating status:', error);
              Alert.alert('Error', error.message || 'Failed to update order status');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (amount?: number) => {
    if (!amount) return '₹0.00';
    return `₹${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ExpoStatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <ExpoStatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Order not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'preparing':
        return '#FFA500';
      case 'ready':
        return '#4CAF50';
      case 'out for delivery':
        return '#2196F3';
      case 'delivered':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      default:
        return '#666';
    }
  };

  return (
    <View style={styles.container}>
      <ExpoStatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Header */}
        <View style={styles.orderHeader}>
          <View style={styles.orderNumberContainer}>
            <Package size={20} color="#000" />
            <Text style={styles.orderNumber}>
              {order.orderNumber || `Order #${order.id.slice(0, 8)}`}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusText}>{order.status || 'Preparing'}</Text>
          </View>
        </View>

        {/* Order Info */}
        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Clock size={16} color="#666" />
            <Text style={styles.infoText}>Placed on: {formatDate(order.created_at || order.placedOn)}</Text>
          </View>
          <View style={styles.infoRow}>
            <CreditCard size={16} color="#666" />
            <Text style={styles.infoText}>
              Payment: {order.paymentMethod || 'Cash on Delivery'}
            </Text>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {order.items && order.items.length > 0 ? (
            order.items.map((item: any, index) => (
              <View key={item.id || index} style={styles.itemCard}>
                {item.image && (
                  <Image source={{ uri: item.image }} style={styles.itemImage} />
                )}
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.name || 'Product'}</Text>
                  <Text style={styles.itemQuantity}>
                    Quantity: {item.quantity || 1}
                    {item.weight && ` • ${item.weight}`}
                    {item.weightInKg && ` (${item.weightInKg} kg)`}
                  </Text>
                  <Text style={styles.itemPrice}>
                    {item.price || item.pricePerKg || '₹0.00'}
                    {item.pricePerKg && ` per kg`}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No items found</Text>
          )}
        </View>

        {/* Delivery Address */}
        {order.address && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <View style={styles.addressCard}>
              <MapPin size={20} color="#000" />
              <View style={styles.addressDetails}>
                <Text style={styles.addressName}>{order.address.contactName || 'Customer'}</Text>
                {order.address.phone && (
                  <View style={styles.infoRow}>
                    <Phone size={14} color="#666" />
                    <Text style={styles.addressText}>{order.address.phone}</Text>
                  </View>
                )}
                <Text style={styles.addressText}>
                  {order.address.street}
                  {order.address.landmark && `, ${order.address.landmark}`}
                </Text>
                <Text style={styles.addressText}>
                  {order.address.city}, {order.address.state} {order.address.postalCode}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              {formatPrice(order.subtotal || order.total_amount || 0)}
            </Text>
          </View>
          {order.deliveryCharge && order.deliveryCharge > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Charge</Text>
              <Text style={styles.summaryValue}>{formatPrice(order.deliveryCharge)}</Text>
            </View>
          )}
          {order.discount && order.discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={styles.summaryValue}>-{formatPrice(order.discount)}</Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {order.total || formatPrice(order.total_amount || 0)}
            </Text>
          </View>
        </View>

        {/* Status Update Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Update Status</Text>
          <View style={styles.statusButtons}>
            {order.status?.toLowerCase() !== 'preparing' && (
              <TouchableOpacity
                style={[styles.statusButton, styles.statusButtonSecondary]}
                onPress={() => handleStatusUpdate('Preparing')}
                disabled={updating}
              >
                <Text style={styles.statusButtonText}>Mark as Preparing</Text>
              </TouchableOpacity>
            )}
            {order.status?.toLowerCase() !== 'ready' && (
              <TouchableOpacity
                style={[styles.statusButton, styles.statusButtonPrimary]}
                onPress={() => handleStatusUpdate('Ready')}
                disabled={updating}
              >
                <Text style={[styles.statusButtonText, styles.statusButtonTextPrimary]}>
                  Mark as Ready
                </Text>
              </TouchableOpacity>
            )}
            {order.status?.toLowerCase() !== 'out for delivery' && (
              <TouchableOpacity
                style={[styles.statusButton, styles.statusButtonSecondary]}
                onPress={() => handleStatusUpdate('Out for Delivery')}
                disabled={updating}
              >
                <Text style={styles.statusButtonText}>Out for Delivery</Text>
              </TouchableOpacity>
            )}
            {order.status?.toLowerCase() !== 'delivered' && (
              <TouchableOpacity
                style={[styles.statusButton, styles.statusButtonSuccess]}
                onPress={() => handleStatusUpdate('Delivered')}
                disabled={updating}
              >
                <Text style={[styles.statusButtonText, styles.statusButtonTextWhite]}>
                  Mark as Delivered
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  backButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  itemCard: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginBottom: 10,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 15,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 5,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  addressCard: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
  },
  addressDetails: {
    flex: 1,
    marginLeft: 15,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  totalRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  statusButtons: {
    gap: 10,
  },
  statusButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  statusButtonPrimary: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  statusButtonSecondary: {
    backgroundColor: '#fff',
    borderColor: '#000',
  },
  statusButtonSuccess: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  statusButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  statusButtonTextPrimary: {
    color: '#fff',
  },
  statusButtonTextWhite: {
    color: '#fff',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});

