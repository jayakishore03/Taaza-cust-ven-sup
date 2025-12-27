import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import { Feather } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRegistration } from '@/contexts/RegistrationContext';

const SCREEN = Dimensions.get('window');
const TOTAL_STEPS = 6;

const SHOP_TYPES = [
  { id: 'chicken', label: 'Chicken', icon: '🍗' },
  { id: 'mutton', label: 'Mutton', icon: '🍖' },
  { id: 'pork', label: 'Pork', icon: '🥩' },
  { id: 'meat', label: 'Meat', icon: '🥓' },
  { id: 'multi', label: 'Multi', icon: '🛒' },
];

export default function Step1BasicDetails() {
  const router = useRouter();
  const { registrationData, updateRegistrationData } = useRegistration();
  const [shopType, setShopType] = useState<string | null>(registrationData.shopType || null);
  const [form, setForm] = useState({
    ownerName: registrationData.ownerName || '',
    storeName: registrationData.storeName || '',
    shopPlot: registrationData.shopPlot || '',
    floor: registrationData.floor || '',
    building: registrationData.building || '',
    pincode: registrationData.pincode || '',
    storePhotos: registrationData.storePhotos || [],
    location: registrationData.location || null,
    shopType: registrationData.shopType || '',
  });
  const [locationDetails, setLocationDetails] = useState({ 
    area: registrationData.area || '', 
    city: registrationData.city || '', 
    pincode: registrationData.pincode || '' 
  });
  const [isLocationLoading, setIsLocationLoading] = useState(true);

  const getLocation = async () => {
    setIsLocationLoading(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Location Permission Denied',
        'Please allow location access to automatically get your store location. You can enter it manually later.',
        [{ text: 'OK' }]
      );
      setIsLocationLoading(false);
      return;
    }
    let location = await Location.getCurrentPositionAsync({});
    setForm((f) => ({ ...f, location: location.coords }));

    let geocode = await Location.reverseGeocodeAsync(location.coords);
    if (geocode && geocode.length > 0) {
      const { subregion, city, postalCode } = geocode[0];
      setLocationDetails({
        area: subregion || '',
        city: city || '',
        pincode: postalCode || '',
      });
      // Auto-fill pincode if available from geocoding
      if (postalCode) {
        setForm((f) => ({ ...f, pincode: postalCode }));
      }
    }
    setIsLocationLoading(false);
  };

  useEffect(() => {
    if (shopType) {
      getLocation();
    }
  }, [shopType]);

  const pickStorePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Photo Library Permission Denied',
        'Please allow photo library access to upload images of your store.',
        [{ text: 'OK' }]
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const selected = result.assets || [];
      setForm((f) => ({
        ...f,
        storePhotos: [...f.storePhotos, ...selected.map((a) => ({ uri: a.uri }))],
      }));
    }
  };

  const removePhoto = (uriToRemove) => {
    setForm((f) => ({
      ...f,
      storePhotos: f.storePhotos.filter((photo) => photo.uri !== uriToRemove),
    }));
  };

  const handleShopTypeSelect = (type: string) => {
    setShopType(type);
    setForm((f) => ({ ...f, shopType: type }));
  };

  const handleNext = async () => {
    // Validate required fields
    if (!form.ownerName || !form.storeName) {
      Alert.alert('Incomplete Form', 'Please fill in owner name and shop name before proceeding.');
      return;
    }
    if (!form.shopPlot || !form.building) {
      Alert.alert('Incomplete Form', 'Please fill in shop/plot number and building name before proceeding.');
      return;
    }
    if (!form.pincode || form.pincode.length < 6) {
      Alert.alert('Incomplete Form', 'Please enter a valid 6-digit pincode before proceeding.');
      return;
    }
    
    // Save all Step 1 data to registration context before navigating
    await updateRegistrationData({
      ownerName: form.ownerName,
      storeName: form.storeName,
      shopPlot: form.shopPlot,
      floor: form.floor,
      building: form.building,
      pincode: form.pincode,
      location: form.location,
      area: locationDetails.area,
      city: locationDetails.city,
      storePhotos: form.storePhotos,
      shopType: form.shopType || shopType,
    });
    
    router.push('/partner-registration/contact');
  };

  // Show shop type selection first
  if (!shopType) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#f9f9f9" />
        <ScrollView
          style={styles.container}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.headerSpacer} />
              <Text style={styles.stepLabel}>
                {'STEP 1 / ' + TOTAL_STEPS + ': SELECT SHOP TYPE'}
              </Text>
          
              <View style={styles.stepIndicatorContainer}>
                {Array.from({ length: TOTAL_STEPS }, (_, i) => {
                  const isCompleted = i < 0;
                  const isCurrent = i === 0;
                  const isUpcoming = i > 0;
                  
                  return (
                    <React.Fragment key={i}>
                      <View
                        style={[
                          styles.stepBox,
                          isCompleted && styles.completedStep,
                          isCurrent && styles.activeStep,
                          isUpcoming && styles.inactiveStep,
                        ]}
                      >
                        <Text
                          style={
                            isCompleted || isCurrent
                              ? styles.stepTextActive
                              : styles.stepTextInactive
                          }
                        >
                          {i + 1}
                        </Text>
                      </View>
                      {i < TOTAL_STEPS - 1 && (
                        <View
                          style={[
                            styles.stepLine,
                            isCompleted && styles.stepLineCompleted,
                          ]}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </View>

          <View style={styles.shopTypeContainer}>
            <Text style={styles.shopTypeTitle}>What type of shop do you have?</Text>
            <Text style={styles.shopTypeSubtitle}>Select the primary category for your shop</Text>
            
            {SHOP_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={styles.shopTypeOption}
                onPress={() => handleShopTypeSelect(type.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.shopTypeIcon}>{type.icon}</Text>
                <Text style={styles.shopTypeLabel}>{type.label}</Text>
                <Feather name="chevron-right" size={20} color="#6B7280" />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const selectedShopType = shopType ? SHOP_TYPES.find(t => t.id === shopType) : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9f9f9" />
      <ScrollView
        style={styles.container}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.headerSpacer} />
        <TouchableOpacity 
          style={styles.backToTypeButton}
          onPress={() => setShopType(null)}
        >
          <Feather name="arrow-left" size={18} color="#6B7280" />
          <Text style={styles.backToTypeText}>Change Shop Type</Text>
        </TouchableOpacity>
        <Text style={styles.stepLabel}>
          {'STEP 1 / ' + TOTAL_STEPS + ': BASIC DETAILS'}
        </Text>
        {selectedShopType && (
          <View style={styles.selectedTypeBadge}>
            <Text style={styles.selectedTypeText}>
              {selectedShopType.icon}{' '}{selectedShopType.label}{' '}Shop
            </Text>
          </View>
        )}
        <View style={styles.stepIndicatorContainer}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => {
            const isCompleted = i < 0; // Step 1 is the first step, so no completed steps
            const isCurrent = i === 0;
            const isUpcoming = i > 0;
            
            return (
              <React.Fragment key={i}>
                <View
                  style={[
                    styles.stepBox,
                    isCompleted && styles.completedStep,
                    isCurrent && styles.activeStep,
                    isUpcoming && styles.inactiveStep,
                  ]}
                >
                  <Text
                    style={
                      isCompleted || isCurrent
                        ? styles.stepTextActive
                        : styles.stepTextInactive
                    }
                  >
                    {i + 1}
                  </Text>
                </View>
                {i < TOTAL_STEPS - 1 && (
                  <View
                    style={[
                      styles.stepLine,
                      isCompleted && styles.stepLineCompleted,
                    ]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <FontAwesome5 name="user-tie" size={18} color="#000" />
          <Text style={styles.sectionHeaderText}>Shop Owner Details</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Shop Owner's Full Name"
          placeholderTextColor="#999"
          value={form.ownerName}
          onChangeText={(t) => setForm((f) => ({ ...f, ownerName: t }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Taaza Shop Name"
          placeholderTextColor="#999"
          value={form.storeName}
          onChangeText={(t) => setForm((f) => ({ ...f, storeName: t }))}
        />

        <View style={styles.sectionHeader}>
          <Feather name="map-pin" size={18} color="#000" />
          <Text style={styles.sectionHeaderText}>Shop Address</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Shop/Plot Number *"
          placeholderTextColor="#999"
          value={form.shopPlot}
          onChangeText={(t) => setForm((f) => ({ ...f, shopPlot: t }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Floor (Optional)"
          placeholderTextColor="#999"
          value={form.floor}
          onChangeText={(t) => setForm((f) => ({ ...f, floor: t }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Building/Complex Name *"
          placeholderTextColor="#999"
          value={form.building}
          onChangeText={(t) => setForm((f) => ({ ...f, building: t }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Pincode *"
          placeholderTextColor="#999"
          keyboardType="number-pad"
          maxLength={6}
          value={form.pincode}
          onChangeText={(t) => setForm((f) => ({ ...f, pincode: t.replace(/[^0-9]/g, '') }))}
        />
        {locationDetails.pincode && !form.pincode && (
          <TouchableOpacity 
            style={styles.autoFillButton}
            onPress={() => setForm((f) => ({ ...f, pincode: locationDetails.pincode }))}
          >
            <Feather name="map-pin" size={16} color="#3B82F6" />
            <Text style={styles.autoFillText}>Use detected pincode: {locationDetails.pincode}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.photosBlock}>
          <View style={styles.sectionHeader}>
            <Feather name="image" size={18} color="#000" />
            <Text style={styles.sectionHeaderText}>Shop Photos</Text>
          </View>
          <TouchableOpacity style={styles.photoButton} onPress={pickStorePhoto}>
            <Text style={styles.photoButtonText}>Upload Photos</Text>
          </TouchableOpacity>
          {form.storePhotos.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoPreviewContainer}>
              {form.storePhotos.map((photo, idx) => (
                <View key={idx} style={styles.photoWrapper}>
                  <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />
                  <TouchableOpacity style={styles.removePhotoBtn} onPress={() => removePhoto(photo.uri)}>
                    <Feather name="x-circle" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {form.location && (
          <View style={styles.mapBlock}>
            <View style={styles.sectionHeader}>
              <Feather name="map-pin" size={18} color="#000" />
              <Text style={styles.sectionHeaderText}>Shop Location</Text>
            </View>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: form.location.latitude,
                longitude: form.location.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              region={{
                latitude: form.location.latitude,
                longitude: form.location.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Marker
                coordinate={{
                  latitude: form.location.latitude,
                  longitude: form.location.longitude,
                }}
                title="Your Shop"
                pinColor="#000"
              />
            </MapView>
            <View style={styles.locationTextContainer}>
              <Feather name="check-circle" size={13} color="green" />
              <Text style={styles.locationText}>Shop location fetched successfully.</Text>
            </View>
            {(locationDetails.area || locationDetails.city) && (
              <Text style={styles.locationDetailText}>
                {[locationDetails.area, locationDetails.city].filter(Boolean).join(', ')}
              </Text>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingTop: Platform.OS === 'android' ? 30 : 0,
    paddingBottom: 40,
  },
  headerSpacer: {
    height: Platform.OS === 'android' ? 8 : 0,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    marginTop: 12,
    paddingHorizontal: 10,
  },
  stepBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  completedStep: {
    backgroundColor: '#1F2937',
    shadowColor: '#1F2937',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  activeStep: {
    backgroundColor: '#1F2937',
    shadowColor: '#1F2937',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  inactiveStep: {
    backgroundColor: '#E5E7EB',
  },
  stepTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  stepTextInactive: {
    color: '#9CA3AF',
    fontWeight: '700',
    fontSize: 14,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 6,
    borderRadius: 1,
  },
  stepLineCompleted: {
    backgroundColor: '#1F2937',
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionHeaderText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    color: '#111827',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
    fontWeight: '500',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  photosBlock: {
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  photoButton: {
    backgroundColor: '#1F2937',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  photoButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  photoPreviewContainer: {
    marginBottom: 8,
  },
  photoWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  photoThumbnail: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  mapBlock: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  map: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  locationTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  locationDetailText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '500',
  },
  nextButton: {
    backgroundColor: '#1F2937',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.5,
  },
  shopTypeContainer: {
    marginTop: 20,
  },
  shopTypeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  shopTypeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
    textAlign: 'center',
  },
  shopTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  shopTypeIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  shopTypeLabel: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  backToTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  backToTypeText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    marginLeft: 8,
  },
  selectedTypeBadge: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 24,
    alignSelf: 'center',
  },
  selectedTypeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  autoFillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  autoFillText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});
