import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Circle, CheckCircle2, Package, Truck, Home, Clock, CheckCircle, Phone, User } from 'lucide-react-native';
import { Linking } from 'react-native';
import {
  type OrderSummary,
  type OrderTimelineEvent,
} from '../../../data/dummyData';
import { ordersApi } from '../../../lib/api/orders';
import { getAuthToken } from '../../../lib/auth/helper';
import { useAuth } from '../../../contexts/AuthContext';

// Define order stages with icons
const ORDER_STAGES = [
  {
    stage: 'Order Placed',
    description: 'We have received your order request.',
    icon: <Package size={20} color="#FFFFFF" strokeWidth={2} />,
  },
  {
    stage: 'Order Ready',
    description: 'Fresh cuts are packed and ready for pickup.',
    icon: <Clock size={20} color="#FFFFFF" strokeWidth={2} />,
  },
  {
    stage: 'Out for Delivery',
    description: 'Your order is on the way to you.',
    icon: <Truck size={20} color="#FFFFFF" strokeWidth={2} />,
  },
  {
    stage: 'Delivered',
    description: 'Your order has been delivered.',
    icon: <Home size={20} color="#FFFFFF" strokeWidth={2} />,
  },
];

// Helper function to get all stages (always show all 4 stages)
function getOrderStages(currentStatus: string, timeline: OrderTimelineEvent[] = []) {
  // Map status to timeline stages (handle statuses not in ORDER_STAGES)
  const statusToStageMap: Record<string, string> = {
    'Preparing': 'Order Ready', // Map Preparing to Order Ready
    'Order Ready': 'Order Ready',
    'Ready': 'Order Ready',
    'Picked Up': 'Out for Delivery', // Map Picked Up to Out for Delivery
    'Out for Delivery': 'Out for Delivery',
    'Delivered': 'Delivered',
  };
  
  // Get the effective status for timeline display
  const effectiveStatus = statusToStageMap[currentStatus] || currentStatus;
  
  // Always return all 4 stages
  return ORDER_STAGES.map((stage) => {
    const timelineEvent = timeline?.find(e => e.stage === stage.stage);
    const stageIndex = ORDER_STAGES.findIndex(s => s.stage === stage.stage);
    const currentIndex = ORDER_STAGES.findIndex(s => s.stage === effectiveStatus);
    
    // Determine if stage is completed, current, or inactive
    let isCompleted = false;
    let isCurrent = false;
    let isInactive = false;
    
    if (timelineEvent) {
      // Use timeline data if available
      isCompleted = timelineEvent.isCompleted || false;
      isCurrent = stage.stage === effectiveStatus && !isCompleted;
    } else {
      // Fallback logic
      if (stageIndex < currentIndex) {
        isCompleted = true;
      } else if (stageIndex === currentIndex) {
        isCurrent = true;
      } else {
        isInactive = true;
      }
    }
    
    // Special case: Order Placed is always completed when order exists
    if (stage.stage === 'Order Placed') {
      isCompleted = true;
      isCurrent = false;
      isInactive = false;
    }
    
    return {
      ...stage,
      timestamp: timelineEvent?.timestamp || null,
      isCompleted,
      isCurrent,
      isInactive,
    };
  });
}

// Helper function to check if stage is completed
function isStageCompleted(stage: string, currentStatus: string, timeline: OrderTimelineEvent[] = []) {
  // "Order Placed" is always completed when an order exists
  if (stage === 'Order Placed') {
    return true;
  }
  
  // Map status to timeline stages
  const statusToStageMap: Record<string, string> = {
    'Preparing': 'Order Ready',
    'Order Ready': 'Order Ready',
    'Ready': 'Order Ready',
    'Picked Up': 'Out for Delivery',
    'Out for Delivery': 'Out for Delivery',
    'Delivered': 'Delivered',
  };
  const effectiveStatus = statusToStageMap[currentStatus] || currentStatus;
  
  // Check timeline for completed status
  if (timeline && timeline.length > 0) {
    const timelineEvent = timeline.find(e => e.stage === stage);
    if (timelineEvent) {
      return timelineEvent.isCompleted;
    }
  }
  
  // Fallback: check if stage index is less than current status index
  const stageIndex = ORDER_STAGES.findIndex(s => s.stage === stage);
  const currentIndex = ORDER_STAGES.findIndex(s => s.stage === effectiveStatus);
  return stageIndex < currentIndex;
}

// Helper function to check if stage is current
function isCurrentStage(stage: string, currentStatus: string) {
  // Map status to timeline stages
  const statusToStageMap: Record<string, string> = {
    'Preparing': 'Order Ready',
    'Order Ready': 'Order Ready',
    'Ready': 'Order Ready',
    'Picked Up': 'Out for Delivery',
    'Out for Delivery': 'Out for Delivery',
    'Delivered': 'Delivered',
  };
  const effectiveStatus = statusToStageMap[currentStatus] || currentStatus;
  return stage === effectiveStatus;
}

// Helper function to check if order has been picked up
function isOrderPickedUp(status: string, timeline: OrderTimelineEvent[] = []) {
  // Check if status is Out for Delivery or Delivered (order is with delivery agent)
  const pickedUpStatuses = ['Out for Delivery', 'Delivered'];
  if (pickedUpStatuses.includes(status)) {
    return true;
  }
  
  // Also check timeline for "Out for Delivery" event
  if (timeline && timeline.length > 0) {
    return timeline.some(event => event.stage === 'Out for Delivery' && event.isCompleted);
  }
  
  return false;
}

// Helper function to get status badge style
function getStatusBadgeStyle(status: string) {
  switch (status) {
    case 'Preparing':
      return { backgroundColor: '#FEF3C7' };
    case 'Out for Delivery':
      return { backgroundColor: '#DBEAFE' };
    case 'Delivered':
      return { backgroundColor: '#D1FAE5' };
    case 'Cancelled':
      return { backgroundColor: '#FEE2E2' };
    default:
      return { backgroundColor: '#F3F4F6' };
  }
}

// Helper function to get status badge text style
function getStatusBadgeTextStyle(status: string) {
  switch (status) {
    case 'Preparing':
      return { color: '#D97706' };
    case 'Out for Delivery':
      return { color: '#1D4ED8' };
    case 'Delivered':
      return { color: '#059669' };
    case 'Cancelled':
      return { color: '#DC2626' };
    default:
      return { color: '#6B7280' };
  }
}

export default function OrderTrackingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previousStatus, setPreviousStatus] = useState<string | null>(null);
  const blinkAnimations = useRef<Record<string, Animated.Value>>({});

  // Initialize animations for all stages
  useEffect(() => {
    ORDER_STAGES.forEach(stage => {
      if (!blinkAnimations.current[stage.stage]) {
        blinkAnimations.current[stage.stage] = new Animated.Value(1);
      }
    });
  }, []);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId || !user) {
        setIsLoading(false);
        return;
      }

      try {
        // Set API token
        await getAuthToken();

        // Fetch order from backend API
        const orderData = await ordersApi.getById(orderId);
        
        // Check if status changed to trigger blinking animation
        if (previousStatus && orderData.status !== previousStatus) {
          // Status changed - trigger blink animation for the new status
          const statusToStageMap: Record<string, string> = {
            'Preparing': 'Order Ready',
            'Order Ready': 'Order Ready',
            'Ready': 'Order Ready',
            'Picked Up': 'Out for Delivery',
            'Out for Delivery': 'Out for Delivery',
            'Delivered': 'Delivered',
          };
          const effectiveStatus = statusToStageMap[orderData.status] || orderData.status;
          
          // Initialize animation for this stage if not exists
          if (!blinkAnimations.current[effectiveStatus]) {
            blinkAnimations.current[effectiveStatus] = new Animated.Value(1);
          }
          
          // Start blinking animation
          Animated.loop(
            Animated.sequence([
              Animated.timing(blinkAnimations.current[effectiveStatus], {
                toValue: 0.3,
                duration: 500,
                useNativeDriver: true,
              }),
              Animated.timing(blinkAnimations.current[effectiveStatus], {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
              }),
            ])
          ).start();
          
          // Stop blinking after 3 seconds
          setTimeout(() => {
            if (blinkAnimations.current[effectiveStatus]) {
              blinkAnimations.current[effectiveStatus].stopAnimation();
              Animated.timing(blinkAnimations.current[effectiveStatus], {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }).start();
            }
          }, 3000);
        }
        
        setOrder(orderData);
        setPreviousStatus(orderData.status);
      } catch (error) {
        console.error('Error fetching order:', error);
        Alert.alert('Error', 'Failed to load order tracking', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
    
    // Poll for order updates every 5 seconds
    const pollInterval = setInterval(fetchOrder, 5000);
    
    return () => clearInterval(pollInterval);
  }, [orderId, user, router, previousStatus]);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <View style={styles.headerCard}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#FFFFFF" strokeWidth={2} />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Track order</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.loadingText}>Loading tracking...</Text>
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
        <Text style={styles.missingTitle}>Tracking unavailable</Text>
        <Text style={styles.missingSubtitle}>
          We couldn&apos;t find updates for this order. Please go back and try
          again.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/(tabs)/orders')}
        >
          <Text style={styles.backButtonText}>Return to Orders</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerCard}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Track order</Text>
            <Text style={styles.headerSubtitle}>{order.orderNumber}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusLabel}>Order Status</Text>
            <View style={[styles.statusBadge, getStatusBadgeStyle(order.status)]}>
              <Text style={[styles.statusBadgeText, getStatusBadgeTextStyle(order.status)]}>
                {order.status}
              </Text>
            </View>
          </View>
          <Text style={styles.statusNote}>{order.statusNote}</Text>
          {order.deliveryEta && (
            <View style={styles.etaContainer}>
              <Clock size={14} color="#6B7280" />
              <Text style={styles.deliveryEta}>Estimated delivery: {order.deliveryEta}</Text>
            </View>
          )}
        </View>

        {/* Show delivery agent details if available */}
        {order.deliveryAgent && order.deliveryAgent.name && (
          <View style={styles.deliveryAgentCard}>
            <View style={styles.deliveryAgentHeader}>
              <View style={styles.deliveryAgentIconContainer}>
                <User size={20} color="#1D4ED8" strokeWidth={2} />
              </View>
              <View style={styles.deliveryAgentHeaderText}>
            <Text style={styles.deliveryAgentTitle}>Delivery Agent</Text>
                <Text style={styles.deliveryAgentSubtitle}>
                  {order.status === 'Out for Delivery' || order.status === 'Delivered' 
                    ? 'Your order is with this agent' 
                    : 'Assigned delivery agent'}
                </Text>
              </View>
            </View>
            <View style={styles.deliveryAgentInfo}>
              <View style={styles.deliveryAgentDetails}>
                <Text style={styles.deliveryAgentName}>{order.deliveryAgent.name}</Text>
                {order.deliveryAgent.mobile && (
                <Text style={styles.deliveryAgentMobile}>{order.deliveryAgent.mobile}</Text>
                )}
              </View>
              {order.deliveryAgent.mobile && (
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={() => {
                    Linking.openURL(`tel:${order.deliveryAgent.mobile}`);
                  }}
                >
                  <Phone size={18} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.callButtonText}>Call</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>Order timeline</Text>
          <Text style={styles.timelineSubtitle}>
            Follow each step from fresh cut to doorstep
          </Text>

          <View style={styles.timeline}>
            {getOrderStages(order.status, order.timeline).map((stage, index, arr) => {
              const isLast = index === arr.length - 1;
              const isCompleted = stage.isCompleted || false;
              const isCurrent = stage.isCurrent || false;
              const isInactive = stage.isInactive || false;
              
              // Get blinking animation for current stage
              const animationValue = blinkAnimations.current[stage.stage];
              const shouldBlink = isCurrent && animationValue;
              
              return (
                <View key={stage.stage} style={styles.timelineRow}>
                  <View style={styles.timelineIndicator}>
                    <Animated.View style={[
                      styles.timelineIconContainer,
                      isCompleted && styles.timelineIconContainerCompleted,
                      isCurrent && styles.timelineIconContainerCurrent,
                      isInactive && styles.timelineIconContainerInactive,
                      shouldBlink && animationValue ? { opacity: animationValue } : {},
                    ]}>
                      {isCompleted ? (
                        <CheckCircle size={24} color="#FFFFFF" strokeWidth={2.5} fill="#059669" />
                      ) : isCurrent ? (
                        <View style={styles.currentStageIndicator}>
                          {stage.icon}
                        </View>
                      ) : (
                        <Circle size={24} color={isInactive ? "#D1D5DB" : "#9CA3AF"} strokeWidth={2} />
                      )}
                    </Animated.View>
                    {!isLast && (
                      <View
                        style={[
                          styles.timelineConnector,
                          isCompleted && styles.timelineConnectorActive,
                          isInactive && styles.timelineConnectorInactive,
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineHeader}>
                      <Text
                        style={[
                          styles.timelineStage,
                          isCompleted && styles.timelineStageCompleted,
                          isCurrent && styles.timelineStageCurrent,
                          isInactive && styles.timelineStageInactive,
                        ]}
                      >
                        {stage.stage}
                      </Text>
                      {isCurrent && (
                        <View style={styles.currentBadge}>
                          <Text style={styles.currentBadgeText}>Current</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[
                      styles.timelineDescription,
                      isCurrent && styles.timelineDescriptionCurrent,
                      isInactive && styles.timelineDescriptionInactive,
                    ]}>
                      {stage.description}
                    </Text>
                    {stage.timestamp && (
                      <Text style={styles.timelineTimestamp}>
                        {stage.timestamp}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF5',
  },
  header: {
    paddingHorizontal: 20,
  },
  headerCard: {
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#FEE2E2',
    marginTop: 2,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 13,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusNote: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    marginTop: 4,
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  deliveryEta: {
    fontSize: 12,
    color: '#6B7280',
  },
  deliveryAgentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  deliveryAgentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deliveryAgentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryAgentHeaderText: {
    flex: 1,
    gap: 2,
  },
  deliveryAgentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  deliveryAgentSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  deliveryAgentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  deliveryAgentDetails: {
    flex: 1,
    gap: 4,
  },
  deliveryAgentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  deliveryAgentMobile: {
    fontSize: 14,
    color: '#6B7280',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1D4ED8',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  timelineSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  timeline: {
    gap: 18,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineIndicator: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 32,
  },
  timelineIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineIconContainerCompleted: {
    backgroundColor: '#059669',
  },
  timelineIconContainerCurrent: {
    backgroundColor: '#1D4ED8',
  },
  timelineIconContainerInactive: {
    backgroundColor: '#F3F4F6',
  },
  currentStageIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineConnector: {
    width: 3,
    minHeight: 40,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
    marginLeft: 14.5,
  },
  timelineConnectorActive: {
    backgroundColor: '#059669',
  },
  timelineConnectorInactive: {
    backgroundColor: '#E5E7EB',
  },
  timelineContent: {
    flex: 1,
    gap: 6,
    paddingTop: 4,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timelineStage: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  timelineStageCompleted: {
    color: '#059669',
  },
  timelineStageCurrent: {
    color: '#1D4ED8',
    fontSize: 16,
  },
  timelineStageInactive: {
    color: '#9CA3AF',
  },
  currentBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
    textTransform: 'uppercase',
  },
  timelineDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },
  timelineDescriptionCurrent: {
    color: '#1F2937',
    fontWeight: '500',
  },
  timelineDescriptionInactive: {
    color: '#9CA3AF',
  },
  timelineTimestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  missingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  missingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 24,
  },
  backButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 24,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
});

