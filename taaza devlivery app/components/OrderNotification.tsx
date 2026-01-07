import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Dimensions } from 'react-native';
import { MapPin, Clock, Phone } from 'lucide-react-native';
import { Audio } from 'expo-av';

const { width } = Dimensions.get('window');

interface OrderItem {
  name: string;
  quantity: number;
  weight: string;
  price: number;
}

interface OrderNotificationProps {
  notification: {
    id: string;
    shop_name: string;
    shop_address: string;
    customer_address: string;
    distance_km: number;
    expires_at: string;
    order_items?: string; // JSON string
    order_total?: number;
  } | null;
  onAccept: () => void;
  onReject: () => void;
}

export default function OrderNotification({ notification, onAccept, onReject }: OrderNotificationProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const scaleAnim = new Animated.Value(1);

  useEffect(() => {
    if (notification) {
      // Play ringing sound
      playRingingSound();
      
      // Calculate time left
      updateTimeLeft();
      const interval = setInterval(updateTimeLeft, 1000);

      // Animate the modal
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      return () => {
        clearInterval(interval);
        stopSound();
      };
    } else {
      stopSound();
    }
  }, [notification]);

  const playRingingSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' }, // Notification sound
        { shouldPlay: true, isLooping: true }
      );
      setSound(sound);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  const stopSound = async () => {
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      } catch (error) {
        console.error('Error stopping sound:', error);
      }
    }
  };

  const updateTimeLeft = () => {
    if (notification) {
      const expiresAt = new Date(notification.expires_at).getTime();
      const now = Date.now();
      const left = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeLeft(left);
      
      if (left === 0) {
        onReject(); // Auto-reject when time expires
      }
    }
  };

  const handleAccept = async () => {
    await stopSound();
    onAccept();
  };

  const handleReject = async () => {
    await stopSound();
    onReject();
  };

  if (!notification) return null;

  return (
    <Modal
      visible={!!notification}
      animationType="slide"
      transparent={true}
      onRequestClose={handleReject}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Phone size={32} color="#FFF" />
            </View>
            <Text style={styles.headerTitle}>New Delivery Request</Text>
            <View style={styles.timerContainer}>
              <Clock size={16} color="#FF6B35" />
              <Text style={styles.timerText}>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</Text>
            </View>
          </View>

          {/* Order Details */}
          <View style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Pickup From:</Text>
              <View style={styles.locationCard}>
                <MapPin size={20} color="#000" />
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName}>{notification.shop_name}</Text>
                  <Text style={styles.locationAddress}>{notification.shop_address}</Text>
                </View>
              </View>
            </View>

            <View style={styles.arrow}>
              <Text style={styles.arrowText}>↓</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Deliver To:</Text>
              <View style={styles.locationCard}>
                <MapPin size={20} color="#000" />
                <View style={styles.locationInfo}>
                  <Text style={styles.locationAddress}>{notification.customer_address}</Text>
                </View>
              </View>
            </View>

            <View style={styles.distanceCard}>
              <Text style={styles.distanceLabel}>Total Distance</Text>
              <Text style={styles.distanceValue}>{notification.distance_km.toFixed(1)} km</Text>
            </View>

            {/* Order Items */}
            {notification.order_items && (() => {
              try {
                const items: OrderItem[] = JSON.parse(notification.order_items);
                return (
                  <View style={styles.orderSection}>
                    <Text style={styles.orderSectionTitle}>Order Items ({items.length})</Text>
                    {items.slice(0, 3).map((item, index) => (
                      <View key={index} style={styles.orderItem}>
                        <View style={styles.orderItemInfo}>
                          <Text style={styles.orderItemName}>{item.name}</Text>
                          <Text style={styles.orderItemDetails}>
                            Qty: {item.quantity} {item.weight ? `• ${item.weight}` : ''}
                          </Text>
                        </View>
                        <Text style={styles.orderItemPrice}>₹{item.price}</Text>
                      </View>
                    ))}
                    {items.length > 3 && (
                      <Text style={styles.moreItems}>+{items.length - 3} more items</Text>
                    )}
                  </View>
                );
              } catch (error) {
                console.error('Error parsing order items:', error);
                return null;
              }
            })()}

            {/* Order Total */}
            {notification.order_total && (
              <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>Order Total</Text>
                <Text style={styles.totalValue}>₹{notification.order_total.toFixed(2)}</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.rejectButton]}
              onPress={handleReject}
            >
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={handleAccept}
            >
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    width: width - 40,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    backgroundColor: '#000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timerText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F7F7F7',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  arrow: {
    alignItems: 'center',
    marginVertical: 8,
  },
  arrowText: {
    fontSize: 24,
    color: '#000',
  },
  distanceCard: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  distanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  distanceValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 0,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#F7F7F7',
    borderWidth: 2,
    borderColor: '#DDD',
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  acceptButton: {
    backgroundColor: '#000',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  orderSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  orderSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  orderItemDetails: {
    fontSize: 12,
    color: '#666',
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  moreItems: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  totalCard: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
  },
});


