import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, TextInput, RefreshControl } from 'react-native';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, RefreshCw, Search, X, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import {
  getImageSource,
  getProductPricingDetails,
  type Product,
  type Shop,
  CATEGORIES,
} from '../../data/dummyData';
import { useCart } from '../../contexts/CartContext';
import { productsApi, shopsApi } from '../../lib/api';
import { getAuthToken } from '../../lib/auth/helper';
import { useAuth } from '../../contexts/AuthContext';
import { useProducts } from '../../contexts/ProductsContext';

const categories = [...CATEGORIES];

// Map shop type to product category
const getCategoryFromShopType = (shopType: string | undefined): string => {
  if (!shopType) return 'Chicken'; // Default
  
  const shopTypeLower = shopType.toLowerCase();
  switch (shopTypeLower) {
    case 'chicken':
      return 'Chicken';
    case 'mutton':
      return 'Mutton';
    case 'pork':
      return 'Pork';
    case 'meat':
      return 'Seafood'; // As per user requirement
    case 'multi':
      return 'Chicken'; // Default for multi, but will show all categories
    default:
      return 'Chicken';
  }
};

// Get available categories based on shop type
const getAvailableCategories = (shopType: string | undefined): string[] => {
  if (!shopType) return ['All', ...CATEGORIES];
  
  const shopTypeLower = shopType.toLowerCase();
  if (shopTypeLower === 'multi') {
    return ['All', ...CATEGORIES]; // Show all categories for multi shops
  }
  
  // For specific shop types, show "All" and the specific category
  const category = getCategoryFromShopType(shopType);
  return ['All', category];
};

// Helper function to parse distance string and convert to kilometers
const parseDistanceToKm = (distanceStr: string | undefined): number => {
  if (!distanceStr) return Infinity;
  
  // Remove any extra spaces and convert to lowercase
  const cleanDistance = distanceStr.trim().toLowerCase();
  
  // Check if it's in meters (e.g., "500 m", "1.5 m")
  if (cleanDistance.includes('m') && !cleanDistance.includes('km')) {
    const meters = parseFloat(cleanDistance.replace(' m', '').replace('m', ''));
    return isNaN(meters) ? Infinity : meters / 1000; // Convert to km
  }
  
  // Check if it's in kilometers (e.g., "5.2 km", "10 km")
  if (cleanDistance.includes('km')) {
    const km = parseFloat(cleanDistance.replace(' km', '').replace('km', ''));
    return isNaN(km) ? Infinity : km;
  }
  
  // Try to parse as number (assume km if no unit)
  const num = parseFloat(cleanDistance);
  return isNaN(num) ? Infinity : num;
};

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All'); // Default to "All" to show all products
  const [location, setLocation] = useState<string>('Fetching location...');
  const [userCoordinates, setUserCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoadingShops, setIsLoadingShops] = useState<boolean>(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { addToCart, selectedShop, setSelectedShop } = useCart();
  const { user } = useAuth();
  const { getProductsByShopType, isLoading: isLoadingAllProducts, refreshProducts, isRefreshing } = useProducts();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const realtimeSubscriptionRef = useRef<any>(null);
  const productsPollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Set API token when user is authenticated
  useEffect(() => {
    if (user) {
      getAuthToken();
    }
  }, [user]);

  // Function to reverse geocode coordinates to address
  const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
    try {
      // Add timeout to prevent hanging (3 seconds)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Geocoding timeout')), 3000);
      });

      const geocodePromise = Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const addresses = await Promise.race([geocodePromise, timeoutPromise]);

      if (addresses && Array.isArray(addresses) && addresses.length > 0) {
        const address = addresses[0];
        const parts = [];
        
        if (address.street) parts.push(address.street);
        if (address.streetNumber) parts.push(address.streetNumber);
        if (address.district) {
          parts.push(address.district);
        }
        if (address.city || address.region) {
          parts.push(address.city || address.region);
        }
        
        return parts.length > 0 ? parts.join(', ') : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    } catch (error) {
      // Silently fail and return coordinates - don't log timeout errors
      if (error instanceof Error && !error.message.includes('timeout')) {
        console.error('Reverse geocoding error:', error);
      }
      // Return coordinates as fallback
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
  };

  // Function to get current location
  const getCurrentLocation = async () => {
    try {
      setIsLoadingLocation(true);
      
      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setLocation('Location unavailable');
        setIsLoadingLocation(false);
        // Don't show alert - location is optional for the app
        return;
      }

      // Get current position with timeout
      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const timeoutPromise = new Promise<Location.LocationObject>((_, reject) => {
        setTimeout(() => reject(new Error('Location timeout')), 10000);
      });

      const locationData = await Promise.race([locationPromise, timeoutPromise]);

      const { latitude, longitude } = locationData.coords;
      
      // Store coordinates for distance calculation
      setUserCoordinates({ latitude, longitude });
      
      // Set coordinates first as immediate fallback
      const coordinatesString = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      setLocation(coordinatesString);
      
      // Try to reverse geocode in background (non-blocking)
      // This won't block the UI if geocoding fails or times out
      reverseGeocode(latitude, longitude)
        .then((address) => {
          // Only update if we got a better address than coordinates
          if (address && address !== coordinatesString) {
            setLocation(address);
          }
        })
        .catch(() => {
          // Silently fail - coordinates are already displayed
          // No need to log or show error
        });
    } catch (error) {
      // Handle errors gracefully without logging or showing alerts
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check for common location errors that should be handled silently
      const isLocationUnavailable = 
        errorMessage.includes('unavailable') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('Location timeout') ||
        errorMessage.includes('location services') ||
        errorMessage.includes('permission') ||
        errorMessage.includes('denied');
      
      if (isLocationUnavailable) {
        setLocation('Location unavailable');
        // Don't log or show alerts for expected location errors
      } else {
        // Only log unexpected errors in development
        if (__DEV__) {
          console.warn('Location error:', errorMessage);
        }
        setLocation('Location unavailable');
        // Don't show alert - location is optional for the app
      }
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Function to fetch shops (reusable)
  const fetchShops = async (withCoordinates = false) => {
    try {
      setIsLoadingShops(true);
      let shopsData;
      
      if (withCoordinates && userCoordinates) {
        // Fetch shops with coordinates to get accurate distances
        shopsData = await shopsApi.getAll(userCoordinates.latitude, userCoordinates.longitude);
      } else {
        // Fetch shops without coordinates first
        shopsData = await shopsApi.getAll();
      }
      
      if (__DEV__) {
        console.log(`✅ Shops loaded${withCoordinates ? ' (with location)' : ' (initial)'}:`, shopsData.length);
        console.log('📦 Shops data:', JSON.stringify(shopsData, null, 2));
      }
      
      // Ensure shopsData is an array
      if (Array.isArray(shopsData)) {
        setShops(shopsData);
      } else {
        console.warn('⚠️ Shops data is not an array:', typeof shopsData);
        setShops([]);
      }
    } catch (error) {
      // Log error in development mode for debugging
      if (__DEV__) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Failed to load shops:', errorMessage);
      }
      // Set empty shops array on error
      setShops([]);
    } finally {
      setIsLoadingShops(false);
    }
  };

  // Load shops from backend on mount (without coordinates)
  useEffect(() => {
    fetchShops(false);
  }, []); // Only run on mount

  // Refresh shops and products when screen comes into focus (to get updated data)
  useFocusEffect(
    useCallback(() => {
      // Refresh shops when screen comes into focus
      // This ensures shops list is updated when vendor changes shop status
      if (userCoordinates) {
        fetchShops(true);
      } else {
        fetchShops(false);
      }
      
      // Refresh products for selected shop when screen comes into focus
      // This ensures products are updated when vendor makes changes
      if (selectedShop) {
        const refreshProducts = async () => {
          try {
            const { getProductsByShop } = await import('../../lib/services/products');
            const updatedProducts = await getProductsByShop(selectedShop.id);
            setProducts(updatedProducts);
            console.log('[HomeScreen] ✅ Products refreshed on focus:', updatedProducts.length, 'products');
          } catch (error) {
            console.error('[HomeScreen] Error refreshing products on focus:', error);
          }
        };
        refreshProducts();
      }
    }, [userCoordinates, selectedShop])
  );

  // Re-fetch shops when coordinates become available to update distances
  useEffect(() => {
    if (!userCoordinates) return; // Skip if no coordinates yet
    
    // Fetch shops with coordinates to get accurate distances
    fetchShops(true);
  }, [userCoordinates]);

  // Debug: Log shops state changes
  useEffect(() => {
    if (__DEV__) {
      console.log('🔍 Shops state changed:', {
        count: shops.length,
        isLoading: isLoadingShops,
        shops: shops.map(s => ({ id: s.id, name: s.name }))
      });
    }
  }, [shops, isLoadingShops]);

  // Load products when shop changes - Fetch shop-specific products with realtime updates
  useEffect(() => {
    const loadShopProducts = async () => {
      if (!selectedShop) {
        setProducts([]);
        return;
      }
      
      try {
        setIsLoadingProducts(true);
        const startTime = Date.now();
        
        console.log('[HomeScreen] Loading products for shop:', selectedShop.id, selectedShop.name);
        console.log('[HomeScreen] Shop details:', {
          id: selectedShop.id,
          name: selectedShop.name,
          shopType: selectedShop.vendor?.shopType,
        });
        
        // Get products for this specific shop (filtered by shop_id) from Supabase service
        const { getProductsByShop } = await import('../../lib/services/products');
        const shopProducts = await getProductsByShop(selectedShop.id);
        
        const loadTime = Date.now() - startTime;
        console.log(`[HomeScreen] ⚡ Products loaded in ${loadTime}ms (${shopProducts.length} products)`);
        
        if (shopProducts.length === 0) {
          console.warn('[HomeScreen] ⚠️ No products found for shop:', selectedShop.name);
          console.warn('[HomeScreen] Possible reasons:');
          console.warn('  1. Products not assigned to this shop (shop_id mismatch)');
          console.warn('  2. Products have is_available = false');
          console.warn('  3. Products have price_per_kg = 0 or null');
          console.warn('  4. Products not synced from base products to this shop');
        }
        
        // Log prices for verification
        if (__DEV__ && shopProducts.length > 0) {
          shopProducts.slice(0, 5).forEach((product) => {
            console.log(`[HomeScreen] Product: ${product.name} - Category: ${product.category} - Price: ₹${product.price} (₹${product.pricePerKg}/kg)`);
          });
        }
        
        setProducts(shopProducts);
      } catch (error: any) {
        console.error('[HomeScreen] ❌ Error loading shop products:', error);
        console.error('[HomeScreen] Error details:', {
          message: error?.message,
          code: error?.code,
          stack: error?.stack,
        });
        
        // Show user-friendly error message
        if (__DEV__) {
          Alert.alert(
            'Error Loading Products',
            `Failed to load products for ${selectedShop?.name || 'this shop'}. Check console for details.`,
            [{ text: 'OK' }]
          );
        }
        
        setProducts([]);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    loadShopProducts();

    // Set up realtime subscription for instant updates when vendor changes products
    if (selectedShop) {
      // Clean up previous subscription if exists
      if (realtimeSubscriptionRef.current) {
        console.log('[HomeScreen] Cleaning up previous realtime subscription');
        realtimeSubscriptionRef.current.unsubscribe();
        realtimeSubscriptionRef.current = null;
      }

      // Clean up previous polling if exists
      if (productsPollingIntervalRef.current) {
        clearInterval(productsPollingIntervalRef.current);
        productsPollingIntervalRef.current = null;
      }

      // Set up new subscription asynchronously
      (async () => {
        try {
          const { supabase } = await import('../../lib/supabase');
          
          console.log('[HomeScreen] Setting up realtime subscription for shop:', selectedShop.id);
          
          // Subscribe to product changes for this shop
          const subscription = supabase
            .channel(`shop-products-${selectedShop.id}`)
            .on(
              'postgres_changes',
              {
                event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
                schema: 'public',
                table: 'products',
                filter: `shop_id=eq.${selectedShop.id}`, // Only listen to this shop's products
              },
              async (payload) => {
                console.log('[HomeScreen] 🔔 Realtime product change detected:', payload.eventType);
                
                // Immediately reload products when any change is detected
                try {
                  const { getProductsByShop } = await import('../../lib/services/products');
                  const updatedProducts = await getProductsByShop(selectedShop.id);
                  setProducts(updatedProducts);
                  console.log('[HomeScreen] ✅ Products updated instantly in realtime:', updatedProducts.length, 'products');
                } catch (error) {
                  console.error('[HomeScreen] Error reloading products after realtime update:', error);
                }
              }
            )
            .subscribe((status) => {
              console.log('[HomeScreen] Realtime subscription status:', status);
              if (status === 'SUBSCRIBED') {
                console.log('[HomeScreen] ✅ Realtime subscription active');
              } else if (status === 'CHANNEL_ERROR') {
                console.warn('[HomeScreen] ⚠️ Realtime subscription error, falling back to polling');
              }
            });

          realtimeSubscriptionRef.current = subscription;

          // Set up polling as backup (every 2 seconds) to ensure updates are received
          // This ensures changes reflect even if realtime doesn't work
          productsPollingIntervalRef.current = setInterval(async () => {
            try {
              const { getProductsByShop } = await import('../../lib/services/products');
              const updatedProducts = await getProductsByShop(selectedShop.id);
              setProducts(prevProducts => {
                // Only update if products actually changed (to avoid unnecessary re-renders)
                const prevIds = prevProducts.map(p => `${p.id}-${p.pricePerKg}-${p.price}`).sort().join(',');
                const newIds = updatedProducts.map(p => `${p.id}-${p.pricePerKg}-${p.price}`).sort().join(',');
                if (prevIds !== newIds) {
                  console.log('[HomeScreen] 🔄 Products changed detected via polling, updating...');
                  return updatedProducts;
                }
                return prevProducts;
              });
            } catch (error) {
              console.error('[HomeScreen] Error polling products:', error);
            }
          }, 2000); // Poll every 2 seconds
        } catch (error) {
          console.error('[HomeScreen] Error setting up realtime subscription:', error);
        }
      })();
    } else {
      // Clean up subscription if no shop is selected
      if (realtimeSubscriptionRef.current) {
        console.log('[HomeScreen] Cleaning up realtime subscription (no shop selected)');
        realtimeSubscriptionRef.current.unsubscribe();
        realtimeSubscriptionRef.current = null;
      }
      if (productsPollingIntervalRef.current) {
        clearInterval(productsPollingIntervalRef.current);
        productsPollingIntervalRef.current = null;
      }
    }

    // Cleanup subscription and polling when shop changes or component unmounts
    return () => {
      if (realtimeSubscriptionRef.current) {
        console.log('[HomeScreen] Cleaning up realtime subscription for shop:', selectedShop?.id);
        realtimeSubscriptionRef.current.unsubscribe();
        realtimeSubscriptionRef.current = null;
      }
      if (productsPollingIntervalRef.current) {
        clearInterval(productsPollingIntervalRef.current);
        productsPollingIntervalRef.current = null;
      }
    };
  }, [selectedShop]);

  // Get location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const handleLocationPress = () => {
    getCurrentLocation();
  };

  const handleOrderNow = () => {
    router.push('/product-details');
  };


  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    Alert.alert('Added to Cart', `${product.name} has been added to your cart!`, [
      { text: 'Continue Shopping', style: 'cancel' },
      { text: 'View Cart', onPress: () => router.push('/(tabs)/cart') },
    ]);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleShopSelect = (shop: Shop) => {
    setSelectedShop(shop);
    // Reset to "All" category to show all products for the shop
    setSelectedCategory('All');
  };

  const handleChangeShop = () => {
    setSelectedShop(null);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    // Refresh both products and shops
    await Promise.all([
      refreshProducts(),
      fetchShops(userCoordinates ? true : false)
    ]);
  };

  // Filter products based on category and search query
  const filteredProducts = products.filter((product) => {
    // Filter by search query if provided
    if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
      const matchesSearch = (
      product.name?.toLowerCase().includes(query) ||
      product.category?.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query)
    );
      if (!matchesSearch) return false;
    }
    
    // If no category is selected or "All" is selected, show all products
    // Otherwise filter by selected category
    if (!selectedCategory || selectedCategory === 'All') {
      return true;
    }
    
    return product.category === selectedCategory;
  });

  // Filter shops to only show those within 10km and sort by distance (closest first)
  const nearbyShops = shops
    .filter((shop) => {
      const distanceKm = parseDistanceToKm(shop.distance);
      return distanceKm <= 10; // Only show shops within 10km
    })
    .sort((a, b) => {
      // Sort by distance in ascending order (closest first)
      const distanceA = parseDistanceToKm(a.distance);
      const distanceB = parseDistanceToKm(b.distance);
      return distanceA - distanceB;
  });

  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#DC2626"
            colors={['#DC2626']}
          />
        }
      >
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          {selectedShop ? (
            <View style={styles.headerWithBack}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={handleChangeShop}
                activeOpacity={0.7}
              >
                <ArrowLeft size={24} color="#DC2626" strokeWidth={2} />
              </TouchableOpacity>
          <TouchableOpacity 
            style={styles.locationBar}
            onPress={handleLocationPress}
            activeOpacity={0.8}
          >
            <MapPin size={20} color="#FFFFFF" strokeWidth={2} />
            <View style={styles.locationText}>
              <View style={styles.locationLabelRow}>
                <Text style={styles.deliveryLabel}>Deliver to</Text>
                {isLoadingLocation && (
                  <ActivityIndicator size="small" color="#FFFFFF" style={styles.loadingIndicator} />
                )}
                {!isLoadingLocation && (
                  <RefreshCw size={14} color="#FEE2E2" strokeWidth={2} style={styles.refreshIcon} />
                )}
              </View>
              <Text style={styles.address} numberOfLines={1}>
                {location}
              </Text>
            </View>
          </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.locationBar}
              onPress={handleLocationPress}
              activeOpacity={0.8}
            >
              <MapPin size={20} color="#FFFFFF" strokeWidth={2} />
              <View style={styles.locationText}>
                <View style={styles.locationLabelRow}>
                  <Text style={styles.deliveryLabel}>Deliver to</Text>
                  {isLoadingLocation && (
                    <ActivityIndicator size="small" color="#FFFFFF" style={styles.loadingIndicator} />
                  )}
                  {!isLoadingLocation && (
                    <RefreshCw size={14} color="#FEE2E2" strokeWidth={2} style={styles.refreshIcon} />
                  )}
                </View>
                <Text style={styles.address} numberOfLines={1}>
                  {location}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.banner}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerSubtitle}>Combo Offer</Text>
            <Text style={styles.bannerTitle}>Delicious Delight</Text>
            <Text style={styles.bannerDescription}>Flat 15% off on combo orders</Text>
            <TouchableOpacity style={styles.orderButton} onPress={handleOrderNow}>
              <Text style={styles.orderButtonText}>Order now</Text>
            </TouchableOpacity>
          </View>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/1070968/pexels-photo-1070968.jpeg?auto=compress&cs=tinysrgb&w=400' }}
            style={styles.bannerImage}
          />
        </View>

        {!selectedShop ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Nearby Shops</Text>
              <View style={styles.sectionSubtitleContainer}>
                <MapPin size={16} color="#DC2626" strokeWidth={2} />
                <Text style={styles.sectionSubtitle}>Choose a shop to explore items</Text>
              </View>
            </View>

            <View style={styles.shopsList}>
              {isLoadingShops && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#DC2626" />
                  <Text style={styles.loadingText}>Loading shops...</Text>
                </View>
              )}
              {!isLoadingShops && nearbyShops.length === 0 && (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconContainer}>
                    <MapPin size={48} color="#DC2626" strokeWidth={1.5} />
                  </View>
                  <Text style={styles.emptyTitle}>No shops nearby</Text>
                  <Text style={styles.emptyMessage}>
                    We're expanding our delivery network! More shops are coming to your area soon.
                  </Text>
                  <Text style={styles.emptySubtext}>
                    Check back later or explore shops in nearby areas
                  </Text>
                  {__DEV__ && shops.length > 0 && (
                    <Text style={[styles.emptyText, { fontSize: 10, marginTop: 8, color: '#9CA3AF' }]}>
                      Debug: {shops.length} total shops, {nearbyShops.length} within 10km
                    </Text>
                  )}
                </View>
              )}
              {!isLoadingShops && nearbyShops.length > 0 && nearbyShops.map((shop) => (
                <TouchableOpacity
                  key={shop.id}
                  style={styles.shopCard}
                  onPress={() => handleShopSelect(shop)}
                  activeOpacity={0.85}
                >
                  <Image 
                    source={
                      shop.image && shop.image.startsWith('http') 
                        ? { uri: shop.image } 
                        : require('../../assets/images/icon.png')
                    }
                    style={styles.shopImage} 
                    defaultSource={require('../../assets/images/icon.png')}
                    onError={(error) => {
                      console.warn('[HomeScreen] Shop image failed to load:', shop.name, shop.image);
                    }}
                    resizeMode="cover"
                  />
                  <View style={styles.shopInfo}>
                    <Text style={styles.shopName}>{shop.name}</Text>
                    {shop.vendor?.shopType && (
                      <Text style={styles.shopType}>🏪 {shop.vendor.shopType.charAt(0).toUpperCase() + shop.vendor.shopType.slice(1)}</Text>
                    )}
                    {shop.address && (
                      <Text style={styles.shopAddress} numberOfLines={1}>📍 {shop.address}</Text>
                    )}
                    <Text style={styles.shopDistance}>🚗 {shop.distance}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <View style={styles.selectedShopCard}>
                <Image 
                  source={
                    selectedShop.image && selectedShop.image.startsWith('http') 
                      ? { uri: selectedShop.image } 
                      : require('../../assets/images/icon.png')
                  }
                  style={styles.selectedShopImage} 
                  defaultSource={require('../../assets/images/icon.png')}
                  onError={(error) => {
                    console.warn('[HomeScreen] Selected shop image failed to load:', selectedShop.name, selectedShop.image);
                  }}
                  resizeMode="cover"
                />
                <View style={styles.selectedShopInfo}>
                  <Text style={styles.selectedShopLabel}>Selected Shop</Text>
                  <Text style={styles.selectedShopName}>{selectedShop.name}</Text>
                  {selectedShop.vendor?.shopType && (
                    <Text style={styles.selectedShopType}>
                      🏪 {selectedShop.vendor.shopType.charAt(0).toUpperCase() + selectedShop.vendor.shopType.slice(1)} Shop
                    </Text>
                  )}
                  <Text style={styles.selectedShopDetails}>{selectedShop.address} • {selectedShop.distance}</Text>
                </View>
                <TouchableOpacity style={styles.changeShopButton} onPress={handleChangeShop}>
                  <Text style={styles.changeShopText}>Change</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.searchSection}>
              <View style={styles.searchContainer}>
                <Search size={20} color="#9CA3AF" strokeWidth={2} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search products..."
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
                    <X size={18} color="#9CA3AF" strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
              contentContainerStyle={styles.categoryContainer}
              bounces={false}
            >
              {(() => {
                // Get available categories based on shop type
                const shopType = selectedShop?.vendor?.shopType;
                const availableCategories = getAvailableCategories(shopType);
                
                return availableCategories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category && styles.categoryChipActive,
                  ]}
                  onPress={() => handleCategoryChange(category)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === category && styles.categoryTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
                ));
              })()}
            </ScrollView>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Best Recommended</Text>
              </View>

              {isLoadingAllProducts ? (
                <View style={styles.emptyContainer}>
                  <ActivityIndicator size="small" color="#DC2626" />
                  <Text style={styles.emptyText}>Loading products...</Text>
                </View>
              ) : filteredProducts.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text
                    style={[
                      styles.emptyText,
                      selectedCategory === 'Seafood' && styles.comingSoonText,
                    ]}
                  >
                    {searchQuery.trim() 
                      ? `No products found for "${searchQuery}"` 
                      : selectedCategory === 'Seafood' 
                        ? 'Coming soon' 
                        : 'No products found in this category'}
                  </Text>
                  {searchQuery.trim() && (
                    <TouchableOpacity onPress={handleClearSearch} style={styles.clearSearchButton}>
                      <Text style={styles.clearSearchText}>Clear search</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.productsGrid}>
                  {filteredProducts.map((product) => {
                    const { currentPrice, originalPrice, discountPercentage } = getProductPricingDetails(product);
                    const displayWeight = product.weight?.trim()
                      ? product.weight
                      : product.weightInKg >= 1
                        ? `${product.weightInKg} kg`
                        : `${Math.round(product.weightInKg * 1000)} g`;

                    return (
                      <TouchableOpacity
                        key={product.id}
                        style={styles.productCard}
                        onPress={() => router.push({
                          pathname: '/product-details',
                          params: { productId: product.id }
                        })}
                      >
                        <Image 
                          source={getImageSource(product.image, product.name, product.category)} 
                          style={styles.productImage}
                          defaultSource={require('../../assets/images/icon.png')}
                          onError={(error) => {
                            console.warn('[HomeScreen] Image failed to load:', product.name, product.image);
                          }}
                          resizeMode="cover"
                        />
                        <View style={styles.productInfo}>
                          <Text style={styles.productName}>{product.name || ''}</Text>
                          <Text style={styles.productWeight}>{displayWeight}</Text>
                          <View style={styles.productPricingWrapper}>
                            <Text style={styles.productCurrentPrice}>
                              ₹{Math.round(currentPrice)}
                            </Text>
                            <Text style={styles.productOriginalPrice}>
                              ₹{Math.round(originalPrice)}
                            </Text>
                            <Text style={styles.productDiscount}>
                              {discountPercentage}% off
                            </Text>
                          </View>
                          <View style={styles.productFooter}>
                            <Text style={styles.productPricePerKg}>
                              ₹{product.pricePerKg.toFixed(2)}/kg
                            </Text>
                          </View>
                          <TouchableOpacity 
                            style={styles.addButton}
                            onPress={() => handleAddToCart(product)}
                          >
                            <Text style={styles.addButtonText}>+ ADD</Text>
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

          </>
        )}

        <View style={{ height: 20 }} />
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
    paddingTop: 10,
  },
  headerWithBack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationText: {
    marginLeft: 8,
    flex: 1,
  },
  locationLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deliveryLabel: {
    color: '#FEE2E2',
    fontSize: 12,
  },
  loadingIndicator: {
    marginLeft: 4,
  },
  refreshIcon: {
    marginLeft: 4,
  },
  address: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
    flexShrink: 1,
  },
  banner: {
    backgroundColor: '#FCD34D',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  bannerContent: {
    flex: 1,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 4,
  },
  bannerDescription: {
    fontSize: 13,
    color: '#78350F',
    marginTop: 4,
  },
  orderButton: {
    backgroundColor: '#1F2937',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  orderButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  bannerImage: {
    width: 100,
    height: 100,
    borderRadius: 15,
  },
  categoryScroll: {
    marginTop: 20,
    marginBottom: 8,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    paddingBottom: 12,
    gap: 10,
    alignItems: 'center',
  },
  categoryChip: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginRight: 10,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryChipActive: {
    backgroundColor: '#FCD34D',
  },
  categoryText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#1F2937',
    fontWeight: '600',
  },
  section: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionSubtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
    flexDirection: 'column',
  },
  productImage: {
    width: '100%',
    height: 130,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  productInfo: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
    flexDirection: 'column',
    minHeight: 140,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    minHeight: 36,
    marginBottom: 4,
  },
  productWeight: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  productPricingWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 6,
  },
  productCurrentPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  productOriginalPrice: {
    fontSize: 13,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  productDiscount: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 10,
  },
  productPricePerKg: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  addButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 'auto',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  shopsList: {
    gap: 16,
  },
  shopCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
    height: 110,
  },
  shopImage: {
    width: 110,
    height: 110,
  },
  shopInfo: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  shopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shopName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  shopOwner: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '500',
  },
  shopAddress: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 6,
  },
  shopContact: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  shopType: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
    fontWeight: '500',
  },
  shopAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
    marginTop: 2,
  },
  shopDistance: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
  },
  shopAction: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  selectedShopCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedShopImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
  },
  selectedShopInfo: {
    flex: 1,
  },
  selectedShopLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectedShopName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 4,
  },
  selectedShopType: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  selectedShopDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  changeShopButton: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  changeShopText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 12,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyMessage: {
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  comingSoonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  searchSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  clearSearchButton: {
    marginTop: 16,
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  clearSearchText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
