import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  Easing,
  StatusBar,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

const { width } = Dimensions.get("window");
const BASE_WIDTH = 375;
const scale = (size: number) => (width / BASE_WIDTH) * size;

export default function LandingScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    if (!loading && user) {
      router.replace("/(tabs)");
    }
  }, [user, loading]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 900,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + scale(20),
          paddingBottom: insets.bottom + scale(20),
        },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Image
          source={require("../assets/images/logom.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Taaza</Text>
        <Text style={styles.subtitle}>
          Deliver fresh products, get paid easily.
        </Text>
      </Animated.View>

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.feature}>
          <Text style={styles.featureTitle}>Flexible Schedule ⏰</Text>
          <Text style={styles.featureText}>
            Choose your own hours and earn on your terms.
          </Text>
        </View>
        <View style={styles.feature}>
          <Text style={styles.featureTitle}>Transparent Earnings 💸</Text>
          <Text style={styles.featureText}>
            See exactly what you'll earn with clear, upfront pricing.
          </Text>
        </View>
        <View style={styles.feature}>
          <Text style={styles.featureTitle}>Simple & Easy Pickups 🧺</Text>
          <Text style={styles.featureText}>
            Get notified of nearby delivery requests.
          </Text>
        </View>
      </Animated.View>

      {/* Buttons */}
      <Animated.View
        style={[
          styles.buttonContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.85}
          onPress={() => router.push("/auth/register")}
        >
          <Text style={styles.primaryButtonText}>Join Now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.85}
          onPress={() => router.push("/auth/login")}
        >
          <Text style={styles.secondaryButtonText}>Sign In</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "space-between",
    paddingHorizontal: scale(20),
  },
  header: {
    alignItems: "center",
    marginBottom: scale(30),
  },
  logo: {
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
    borderWidth: 2,
    borderColor: "#000000",
    marginBottom: scale(15),
  },
  title: {
    fontSize: scale(34),
    fontWeight: "800",
    color: "#000000",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: scale(16),
    color: "#444444",
    marginTop: scale(8),
    textAlign: "center",
    paddingHorizontal: scale(12),
  },
  content: {
    flex: 1,
    justifyContent: "center",
    gap: scale(18),
    marginBottom: scale(20),
  },
  feature: {
    backgroundColor: "#F9F9F9",
    padding: scale(18),
    borderRadius: scale(14),
    borderWidth: 1,
    borderColor: "#E6E6E6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: Platform.OS === "ios" ? 0.1 : 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  featureTitle: {
    fontSize: scale(20),
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: scale(6),
  },
  featureText: {
    fontSize: scale(15),
    color: "#666666",
    lineHeight: scale(22),
  },
  buttonContainer: {
    gap: scale(12),
  },
  primaryButton: {
    backgroundColor: "#000000",
    paddingVertical: scale(16),
    borderRadius: scale(12),
    alignItems: "center",
    width: "100%",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: scale(18),
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: scale(16),
    borderRadius: scale(12),
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#000000",
    width: "100%",
  },
  secondaryButtonText: {
    color: "#000000",
    fontSize: scale(18),
    fontWeight: "700",
  },
  loadingText: {
    fontSize: scale(18),
    color: "#666666",
    alignSelf: "center",
  },
});
