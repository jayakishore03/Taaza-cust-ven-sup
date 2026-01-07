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


export default function LandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, loading: authLoading } = useAuth();
  const [onDuty, setOnDuty] = useState(false);
  const [locationName, setLocationName] = useState("Fetching Location...");
  const [locationLoading, setLocationLoading] = useState(true);
  const hasShownAuthAlert = useRef(false);

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
      } catch {
        setLocationName("Vijayawada");
      } finally {
        setLocationLoading(false);
      }
    })();
  }, []);

  const toggleOnDuty = () => {
    setOnDuty((prev) => !prev);
    Alert.alert(
      "Status Changed",
      `You are now ${!onDuty ? "On Duty" : "Off Duty"}.`
    );
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
