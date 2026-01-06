import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import * as Haptics from "expo-haptics";
import {
  Package,
  MapPin,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  User,
} from "lucide-react-native";
import {
  getAvailableOrders,
  getMyOrders,
  acceptOrder,
  rejectOrder,
  markOrderDelivered,
  type Order,
} from "@/services/orders";
import { supabase } from "@/lib/supabase";

export default function OrdersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"available" | "my-orders">("available");
  const [deliveryAgentName, setDeliveryAgentName] = useState<string>("");
  const subscriptionRef = useRef<any>(null);
  const lastOrderCountRef = useRef<number>(0);

  // Fetch delivery agent name from database
  useEffect(() => {
    const fetchAgentName = async () => {
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('delivery_agents')
            .select('full_name')
            .eq('user_id', user.id)
            .single();
          
          if (data && !error) {
            setDeliveryAgentName(data.full_name);
          }
        } catch (error) {
          console.error('Error fetching agent name:', error);
        }
      }
    };
    
    fetchAgentName();
  }, [user]);


  // Play phone ring notification
  const playPhoneRing = async () => {
    try {
      // Haptic feedback (vibration)
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Play multiple haptic patterns to simulate phone ring
      setTimeout(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }, 200);
      setTimeout(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }, 400);
    } catch (error) {
      console.warn("[Orders] Error playing phone ring:", error);
    }
  };

  // Load orders
  const loadOrders = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [available, my] = await Promise.all([
        getAvailableOrders(),
        deliveryAgentName ? getMyOrders(deliveryAgentName) : Promise.resolve([]),
      ]);

      // Check for new orders and play notification
      if (available.length > lastOrderCountRef.current && lastOrderCountRef.current > 0) {
        const newOrderCount = available.length - lastOrderCountRef.current;
        console.log(`[Orders] 🔔 ${newOrderCount} new order(s) available!`);
        await playPhoneRing();
        Alert.alert(
          "New Order!",
          `You have ${newOrderCount} new order${newOrderCount > 1 ? "s" : ""} available for delivery.`,
          [{ text: "OK" }]
        );
      }
      lastOrderCountRef.current = available.length;

      setAvailableOrders(available);
      setMyOrders(my);
    } catch (error) {
      console.error("[Orders] Error loading orders:", error);
      Alert.alert("Error", "Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Set up realtime subscription for new orders
  useEffect(() => {
    if (!deliveryAgentName) return;

    console.log('[Orders] Setting up realtime subscription for new orders');

    // Subscribe to new orders
    const channel = supabase
      .channel('delivery-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `status=in.(Order Ready,Picked Up)`,
        },
        (payload) => {
          console.log('[Orders] 🔔 Order change detected:', payload.eventType);
          loadOrders(false);
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      console.log('[Orders] Cleaning up realtime subscription');
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [deliveryAgentName]);

  // Load orders on mount and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadOrders(false);
    }, [deliveryAgentName])
  );

  // Handle accept order
  const handleAcceptOrder = async (order: Order) => {
    if (!deliveryAgentName) {
      Alert.alert("Error", "Please complete your profile first.");
      return;
    }

    Alert.alert(
      "Accept Order",
      `Do you want to accept order ${order.order_number}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          onPress: async () => {
            try {
              // Fetch phone number from database
              let phoneNumber = '';
              if (user?.id) {
                const { data } = await supabase
                  .from('delivery_agents')
                  .select('phone_number')
                  .eq('user_id', user.id)
                  .single();
                
                phoneNumber = data?.phone_number || '';
              }
              
              const result = await acceptOrder(
                order.id,
                deliveryAgentName,
                phoneNumber
              );

              if (result.success) {
                Alert.alert("Success", "Order accepted! You can now deliver it.");
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                loadOrders(false);
              } else {
                Alert.alert("Error", result.error || "Failed to accept order");
              }
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to accept order");
            }
          },
        },
      ]
    );
  };

  // Handle reject order
  const handleRejectOrder = async (order: Order) => {
    Alert.alert(
      "Reject Order",
      `Do you want to reject order ${order.order_number}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await rejectOrder(order.id);
              if (result.success) {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                loadOrders(false);
              } else {
                Alert.alert("Error", result.error || "Failed to reject order");
              }
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to reject order");
            }
          },
        },
      ]
    );
  };

  // Handle mark as delivered
  const handleMarkDelivered = async (order: Order) => {
    Alert.alert(
      "Mark as Delivered",
      `Have you delivered order ${order.order_number}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Delivered",
          onPress: async () => {
            try {
              const result = await markOrderDelivered(order.id);
              if (result.success) {
                Alert.alert("Success", "Order marked as delivered!");
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                loadOrders(false);
              } else {
                Alert.alert("Error", result.error || "Failed to mark order as delivered");
              }
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to mark order as delivered");
            }
          },
        },
      ]
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  const ordersToShow = activeTab === "available" ? availableOrders : myOrders;

  return (
    <View style={styles.container}>
      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "available" && styles.tabActive]}
          onPress={() => setActiveTab("available")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "available" && styles.tabTextActive,
            ]}
          >
            Available ({availableOrders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "my-orders" && styles.tabActive]}
          onPress={() => setActiveTab("my-orders")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "my-orders" && styles.tabTextActive,
            ]}
          >
            My Orders ({myOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadOrders(true)} />
        }
      >
        {ordersToShow.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Package size={64} color="#999" />
            <Text style={styles.emptyText}>
              {activeTab === "available"
                ? "No orders available at the moment"
                : "You don't have any active orders"}
            </Text>
          </View>
        ) : (
          ordersToShow.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.orderHeaderLeft}>
                  <Package size={24} color="#000" />
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderNumber}>{order.order_number}</Text>
                    <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    order.status === "Order Ready" && styles.statusBadgeReady,
                    order.status === "Out for Delivery" && styles.statusBadgeDelivery,
                  ]}
                >
                  <Text style={styles.statusText}>{order.status}</Text>
                </View>
              </View>

              {order.shop && (
                <View style={styles.shopInfo}>
                  <Text style={styles.shopName}>{order.shop.name}</Text>
                  <View style={styles.shopAddressRow}>
                    <MapPin size={14} color="#666" />
                    <Text style={styles.shopAddress}>{order.shop.address}</Text>
                  </View>
                </View>
              )}

              {order.address && (
                <View style={styles.deliveryInfo}>
                  <Text style={styles.deliveryLabel}>Delivery Address:</Text>
                  <View style={styles.addressRow}>
                    <User size={14} color="#666" />
                    <Text style={styles.addressText}>
                      {order.address.contact_name} - {order.address.phone}
                    </Text>
                  </View>
                  <View style={styles.addressRow}>
                    <MapPin size={14} color="#666" />
                    <Text style={styles.addressText}>
                      {order.address.street}, {order.address.city}, {order.address.state} - {order.address.postal_code}
                    </Text>
                  </View>
                  {order.address.landmark && (
                    <Text style={styles.landmark}>Landmark: {order.address.landmark}</Text>
                  )}
                </View>
              )}

              <View style={styles.orderFooter}>
                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalAmount}>₹{order.total.toFixed(2)}</Text>
                </View>
                {order.otp && (
                  <View style={styles.otpContainer}>
                    <Text style={styles.otpLabel}>OTP:</Text>
                    <Text style={styles.otpValue}>{order.otp}</Text>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              {activeTab === "available" ? (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.button, styles.rejectButton]}
                    onPress={() => handleRejectOrder(order)}
                  >
                    <XCircle size={20} color="#FFF" />
                    <Text style={styles.buttonText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.acceptButton]}
                    onPress={() => handleAcceptOrder(order)}
                  >
                    <CheckCircle size={20} color="#FFF" />
                    <Text style={styles.buttonText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.button, styles.deliveredButton]}
                  onPress={() => handleMarkDelivered(order)}
                >
                  <Truck size={20} color="#FFF" />
                  <Text style={styles.buttonText}>Mark as Delivered</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    marginHorizontal: 4,
  },
  tabActive: {
    backgroundColor: "#000",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  tabTextActive: {
    color: "#FFF",
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  orderCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  orderHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  orderInfo: {
    marginLeft: 12,
    flex: 1,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  orderDate: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F0F0F0",
  },
  statusBadgeReady: {
    backgroundColor: "#FFF3CD",
  },
  statusBadgeDelivery: {
    backgroundColor: "#D1ECF1",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000",
  },
  shopInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  shopName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 6,
  },
  shopAddressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  shopAddress: {
    fontSize: 13,
    color: "#666",
    marginLeft: 6,
  },
  deliveryInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  deliveryLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 6,
  },
  addressText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 6,
    flex: 1,
  },
  landmark: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    fontStyle: "italic",
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  totalContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  totalLabel: {
    fontSize: 14,
    color: "#666",
    marginRight: 8,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },
  otpContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  otpLabel: {
    fontSize: 12,
    color: "#666",
    marginRight: 6,
  },
  otpValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    letterSpacing: 2,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  rejectButton: {
    backgroundColor: "#DC2626",
  },
  acceptButton: {
    backgroundColor: "#059669",
  },
  deliveredButton: {
    backgroundColor: "#2563EB",
    marginTop: 16,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

