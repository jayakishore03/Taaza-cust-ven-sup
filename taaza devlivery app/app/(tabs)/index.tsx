import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as Location from "expo-location";
import { useRouter, useFocusEffect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import OrderNotification from "@/components/OrderNotification";


export default function LandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, loading: authLoading } = useAuth();
  const [onDuty, setOnDuty] = useState(false);
  const [locationName, setLocationName] = useState("Fetching Location...");
  const [locationLoading, setLocationLoading] = useState(true);
  const hasShownAuthAlert = useRef(false);
  const [currentNotification, setCurrentNotification] = useState<any>(null);
  const notificationCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Check authentication when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Wait for auth to finish loading
      if (authLoading) return;

      // Check if user is not authenticated
      if (!user && !hasShownAuthAlert.current) {
        hasShownAuthAlert.current = true;
        
        // Show popup and redirect to login
        setTimeout(() => {
          Alert.alert(
            'Login Required',
            'Your registration is completed. Please login using your details to access the dashboard.',
            [
              {
                text: 'Go to Sign In',
                onPress: () => {
                  router.replace('/auth/login');
                }
              }
            ],
            { cancelable: false }
          );
        }, 300);
      }
    }, [user, authLoading, router])
  );

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationName("Vijayawada");
          setLocationLoading(false);
          return;
        }
        const location = await Location.getCurrentPositionAsync({});
        const [address] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        setLocationName(address.city || "Vijayawada");
        
        // Update location in backend
        if (user) {
          updateLocationInBackend(location.coords.latitude, location.coords.longitude);
        }
      } catch {
        setLocationName("Vijayawada");
      } finally {
        setLocationLoading(false);
      }
    })();
  }, [user]);

  // Check for new notifications when on duty
  useEffect(() => {
    if (onDuty && user) {
      checkForNotifications();
      notificationCheckInterval.current = setInterval(checkForNotifications, 5000); // Check every 5 seconds
    } else {
      if (notificationCheckInterval.current) {
        clearInterval(notificationCheckInterval.current);
      }
    }

    return () => {
      if (notificationCheckInterval.current) {
        clearInterval(notificationCheckInterval.current);
      }
    };
  }, [onDuty, user]);

  const updateLocationInBackend = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/delivery-agents/${user?.id}/location`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latitude, longitude }),
      });
      
      if (response.ok) {
        console.log('✅ Location updated');
      }
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const checkForNotifications = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/delivery-agents/${user.id}/notifications`);
      const result = await response.json();
      
      if (result.success && result.data && result.data.length > 0) {
        setCurrentNotification(result.data[0]); // Show first pending notification
      }
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  };

  const toggleOnDuty = async () => {
    const newStatus = !onDuty;
    setOnDuty(newStatus);
    
    // Update duty status in backend
    if (user) {
      try {
        await fetch(`${process.env.EXPO_PUBLIC_API_URL}/delivery-agents/${user.id}/duty-status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ is_on_duty: newStatus }),
        });
      } catch (error) {
        console.error('Error updating duty status:', error);
      }
    }
    
    Alert.alert(
      "Status Changed",
      `You are now ${newStatus ? "On Duty" : "Off Duty"}.`
    );
  };

  const handleAcceptOrder = async () => {
    if (!currentNotification) return;
    
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/delivery-agents/notifications/${currentNotification.id}/accept`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ agent_user_id: user?.id }),
        }
      );
      
      const result = await response.json();
      
      if (result.success) {
        setCurrentNotification(null);
        Alert.alert('Order Accepted', 'Order has been assigned to you!');
        router.push('/orders'); // Navigate to orders tab
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      Alert.alert('Error', 'Failed to accept order');
    }
  };

  const handleRejectOrder = async () => {
    if (!currentNotification) return;
    
    try {
      await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/delivery-agents/notifications/${currentNotification.id}/reject`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ agent_user_id: user?.id }),
        }
      );
      
      setCurrentNotification(null);
    } catch (error) {
      console.error('Error rejecting order:', error);
    }
  };

  // Show loading while checking auth or location
  if (authLoading || locationLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Don't show dashboard content if user is not authenticated
  // The popup will redirect them to login
  if (!user) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Please login to continue...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={toggleOnDuty}
        activeOpacity={0.8}
        style={[
          styles.onDutyButton,
          onDuty ? styles.onDutyActive : styles.onDutyInactive,
        ]}
      >
        <Text
          style={[
            styles.onDutyText,
            onDuty ? styles.onDutyTextActive : styles.onDutyTextInactive,
          ]}
        >
          {onDuty ? "On Duty" : "Off Duty"}
        </Text>
      </TouchableOpacity>

      <View style={styles.locationContainer}>
        <Text style={styles.locationText}>You are in {locationName}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + Math.max(insets.bottom, 0) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateEmoji}>📦</Text>
          <Text style={styles.emptyStateTitle}>
            {onDuty ? "Waiting for Orders" : "You're Off Duty"}
          </Text>
          <Text style={styles.emptyStateSubtitle}>
            {onDuty 
              ? "New delivery requests will appear here" 
              : "Toggle 'On Duty' to start receiving orders"}
          </Text>
        </View>
      </ScrollView>

      {/* Order Notification Modal */}
      <OrderNotification
        notification={currentNotification}
        onAccept={handleAcceptOrder}
        onReject={handleRejectOrder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  onDutyButton: {
    position: "absolute",
    top: 45,
    right: 20,
    zIndex: 10,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  onDutyActive: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  onDutyInactive: {
    borderColor: "#000",
  },
  onDutyText: {
    fontWeight: "700",
    fontSize: 14,
  },
  onDutyTextActive: {
    color: "#fff",
  },
  onDutyTextInactive: {
    color: "#000",
  },
  locationContainer: {
    marginBottom: 20,
  },
  locationText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
  },
  scrollContent: {
    paddingBottom: 20,
    flex: 1,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyStateEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
});
