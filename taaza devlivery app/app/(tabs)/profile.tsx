import React, { useState, useEffect } from "react";
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
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import {
  User,
  Phone,
  Mail,
  CircleCheck as CheckCircle,
  Clock,
  Circle as XCircle,
  LogOut,
} from "lucide-react-native";

interface RiderProfile {
  full_name: string;
  email: string;
  phone_number: string;
  alternate_phone: string;
  vehicle_type: string;
  verification_status: string;
  is_active: boolean;
  created_at: string;
  profile_picture_url?: string;
  driving_licence_url?: string;
  id_card_url?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();

  // Example profile data
  const [profile, setProfile] = useState<RiderProfile | null>({
    full_name: "Ojas Ghambeera",
    email: "saikirankonapala26@gmail.com",
    phone_number: "+91-9492664870",
    alternate_phone: "+91-8919079058",
    vehicle_type: "bike",
    verification_status: "verified",
    is_active: true,
    created_at: "2023-03-15T12:34:56Z",
    profile_picture_url: "",
    driving_licence_url: "",
    id_card_url: "",
  });

  const [loading, setLoading] = useState(false);

  // Show/hide options for Documents
  const [showDrivingLicenceOptions, setShowDrivingLicenceOptions] = useState(false);
  const [showIDCardOptions, setShowIDCardOptions] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('delivery_agents')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (data && !error) {
          setProfile(data);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/");
        },
      },
    ]);
  };

  const getVehicleIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      bike: "🏍️",
      auto: "🛺",
      van: "🚐",
    };
    return icons[type] || "🚗";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle size={24} color="#000" />;
      case "pending":
        return <Clock size={24} color="#444" />;
      case "rejected":
        return <XCircle size={24} color="#333" />;
      default:
        return <Clock size={24} color="#999" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "#000";
      case "pending":
        return "#444";
      case "rejected":
        return "#333";
      default:
        return "#999";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "verified":
        return "Verified";
      case "pending":
        return "Pending Verification";
      case "rejected":
        return "Verification Rejected";
      default:
        return "Unknown";
    }
  };

  const viewDocument = (url: string, name: string) => {
    if (!url) {
      Alert.alert("Unavailable", `${name} not uploaded.`);
      return;
    }
    Alert.alert("View Document", `Opening ${name}...`);
    // Add real document viewing logic here
  };

  const changeDocument = (name: string) => {
    Alert.alert("Change Document", `Feature to change ${name} coming soon.`);
    // Add real document change logic here
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Profile not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.profileCard}>
          <Image
            source={
              profile.profile_picture_url
                ? { uri: profile.profile_picture_url }
                : require("../../assets/images/default_avatar.webp")
            }
            style={styles.avatar}
          />
          <Text style={styles.name}>{profile.full_name}</Text>
          <View style={styles.statusBadge}>
            {getStatusIcon(profile.verification_status)}
            <Text style={{ color: getStatusColor(profile.verification_status), ...styles.statusText }}>
              {getStatusText(profile.verification_status)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Mail size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{profile.email}</Text>
              </View>
            </View>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Phone size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Primary Phone</Text>
                <Text style={styles.infoValue}>{profile.phone_number}</Text>
                <TouchableOpacity onPress={() => Alert.alert("Change Mobile Number", "Feature coming soon")}>
                  <Text style={styles.changeText}>Change Mobile Number</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Phone size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Alternate Phone</Text>
                <Text style={styles.infoValue}>{profile.alternate_phone}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documents</Text>
          <TouchableOpacity style={styles.docCard} onPress={() => setShowDrivingLicenceOptions(!showDrivingLicenceOptions)}>
            <View style={styles.docRow}>
              <Text style={styles.docLabel}>Driving Licence</Text>
              {getStatusIcon(profile.verification_status)}
            </View>
            {showDrivingLicenceOptions && (
              <View style={styles.docButtons}>
                <TouchableOpacity onPress={() => viewDocument(profile.driving_licence_url || "", "Driving Licence")}>
                  <Text style={styles.docButton}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => changeDocument("Driving Licence")}>
                  <Text style={styles.docButton}>Change</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.docCard} onPress={() => setShowIDCardOptions(!showIDCardOptions)}>
            <View style={styles.docRow}>
              <Text style={styles.docLabel}>ID Card</Text>
              {getStatusIcon(profile.verification_status)}
            </View>
            {showIDCardOptions && (
              <View style={styles.docButtons}>
                <TouchableOpacity onPress={() => viewDocument(profile.id_card_url || "", "ID Card")}>
                  <Text style={styles.docButton}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => changeDocument("ID Card")}>
                  <Text style={styles.docButton}>Change</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Information</Text>
          <View style={styles.vehicleCard}>
            <Text style={styles.vehicleIcon}>{getVehicleIcon(profile.vehicle_type)}</Text>
            <Text style={styles.vehicleType}>{profile.vehicle_type.charAt(0).toUpperCase() + profile.vehicle_type.slice(1)}</Text>
            <Text style={styles.vehicleStatus}>{profile.is_active ? "Active" : "Inactive"}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <LogOut size={20} color="#b91c1c" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Member since {new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20, backgroundColor: "#fff" },
  headerTitle: { fontSize: 28, fontWeight: "900", color: "#000" },
  profileCard: {
    alignItems: "center",
    marginHorizontal: 24,
    padding: 24,
    backgroundColor: "#fafafa",
    borderRadius: 16,
    marginBottom: 24,
  },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: "#ddd", marginBottom: 16 },
  name: { fontSize: 24, fontWeight: "900", color: "#000", marginBottom: 12 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#fff", borderRadius: 20 },
  statusText: { fontSize: 14, fontWeight: "700" },
  section: { paddingHorizontal: 24, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: "#000", marginBottom: 12 },
  infoCard: { backgroundColor: "#f7f7f7", padding: 16, borderRadius: 12, marginBottom: 12 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: "#666", marginBottom: 4 },
  infoValue: { fontSize: 16, fontWeight: "700", color: "#000" },
  changeText: { marginTop: 6, fontSize: 13, color: "#007AFF", fontWeight: "600" },
  docCard: { backgroundColor: "#f7f7f7", padding: 18, borderRadius: 16, marginBottom: 16 },
  docRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  docLabel: { fontSize: 16, fontWeight: "700", color: "#000" },
  docButtons: { flexDirection: "row", gap: 16, marginTop: 12 },
  docButton: { color: "#007AFF", fontWeight: "700", fontSize: 14 },
  vehicleCard: {
    backgroundColor: "#f7f7f7",
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  vehicleIcon: { fontSize: 48, marginBottom: 12 },
  vehicleType: { fontSize: 20, fontWeight: "700", color: "#000", marginBottom: 8 },
  vehicleStatus: { fontSize: 14, color: "#111", fontWeight: "700" },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fee2e2",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  signOutText: { fontSize: 16, fontWeight: "700", color: "#b91c1c" },
  scrollContent: { paddingBottom: 80 },
  footer: { alignItems: "center", paddingVertical: 24 },
  footerText: { fontSize: 14, color: "#999" },
  error: { fontSize: 16, color: "#666" },
});
