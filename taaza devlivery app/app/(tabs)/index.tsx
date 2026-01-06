import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import * as Location from "expo-location";
import { useRouter, useFocusEffect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback } from "react";
import { Platform, Linking, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const stores = [
  { id: '1', name: 'Moms Laundry & Dry Cleaning', address: 'currencynagar', logo: { uri: 'https://lh3.googleusercontent.com/p/AF1QipPi8Ta0mZG0SaVn-IJgDaRzwfv8cpDtulZM7iCp=s1360-w1360-h1020-rw' }, latitude: 16.5062, longitude: 80.6480, distance: 1.2 },
  { id: '2', name: 'Tumbledry Dry Clean & Laundry Service', address: 'Ramavarapadu', logo: { uri: 'https://lh3.googleusercontent.com/p/AF1QipNexlS0H2-zDzVglONCp6BRo23OdS1WhGYCREZL=s1360-w1360-h1020-rw' }, latitude: 16.5070, longitude: 80.6520, distance: 2.8 },
  { id: '3', name: 'Premium Laundry', address: 'Sai Baba Temple Rd', logo: { uri: 'https://lh3.googleusercontent.com/gps-cs-s/AC9h4nrDEv8BUcPmgxu0hCqBmFa4DyHC78xL0gbu2LqfSAgFQsAN0LoKsc6PAPGnLYdAIE3JYAwdYx946ymL3wJXNec-a6XBoFY4av8l0pxv7E-_yOFxqM4EJIx0zTheMksVATIWFsel=s1360-w1360-h1020-rw' }, latitude: 16.5055, longitude: 80.6500, distance: 3.5 },
  { id: '4', name: 'Zeenath saree polish and rolling', address: 'Gurunanak nagar', logo: { uri: 'https://lh3.googleusercontent.com/p/AF1QipND7FFZv4y7NSr3coIVfff8CajhIS_rkBpp42Uo=s1360-w1360-h1020-rw' }, latitude: 16.5080, longitude: 80.6450, distance: 4.1 },
  { id: '5', name: 'Vasudha Dry Cleaners', address: 'Moghalrajpuram', logo: { uri: 'https://lh3.googleusercontent.com/p/AF1QipPtxh_c1ZhM9p1LNTRYdYp7co6J45gVi69FAqTs=s1360-w1360-h1020-rw' }, latitude: 16.5090, longitude: 80.6470, distance: 5.0 },
  { id: '6', name: 'PRESSO LAUNDRY', address: ' Tadepalli', logo: { uri: 'https://lh3.googleusercontent.com/p/AF1QipMh9--b7avnMdJMJYzDOG2AdKmFyjXM2dnW5hxZ=s1360-w1360-h1020-rw' }, latitude: 16.5100, longitude: 80.6490, distance: 5.8 },
];    
 


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

  const openDirections = (lat: number, lon: number) => {
    const scheme = Platform.select({
      ios: `maps://app?daddr=${lat},${lon}`,
      android: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`,
    });
    Linking.canOpenURL(scheme!)
      .then((supported) => {
        if (supported) {
          Linking.openURL(scheme!);
        } else {
          Alert.alert("Error", "Unable to open the maps app.");
        }
      })
      .catch(() => {
        Alert.alert("Error", "Failed to open the maps app.");
      });
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
        {stores.map((store) => (
          <View style={styles.storeCard} key={store.id}>
            <Image source={store.logo} style={styles.storeLogo} />
            <View style={styles.storeDetails}>
              <Text style={styles.storeName}>{store.name}</Text>
              <Text style={styles.storeAddress}>{store.address}</Text>
              <Text style={styles.storeDistance}>{store.distance} km away</Text>
            </View>
            <TouchableOpacity
              style={styles.directionButton}
              onPress={() => openDirections(store.latitude, store.longitude)}
            >
              <Text style={styles.directionButtonText}>Directions</Text>
            </TouchableOpacity>
          </View>
        ))}
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
    paddingBottom: 20, // Base padding, will be adjusted with safe area insets
  },
  storeCard: {
    flexDirection: "row",
    backgroundColor: "#fafafa",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },
  storeLogo: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  storeDetails: {
    flex: 1,
    marginLeft: 15,
  },
  storeName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  storeAddress: {
    fontSize: 14,
    color: "#4B5563", // cool gray
    marginVertical: 3,
  },
  storeDistance: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  directionButton: {
    backgroundColor: "#000",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 7,
  },
  directionButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
