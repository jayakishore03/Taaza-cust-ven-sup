import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { Search, X } from 'lucide-react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { 
  getAllProducts,
  getShopProducts,
  getVendorShopId, 
  syncProductToShop,
  type Product 
} from '../../services/products';
import { API_CONFIG } from '../../config/api';
import { getImageSource } from '../../utils/imageHelper';

interface ProductState {
  id: string;
  name: string;
  category: string;
  is_available: boolean;
  price_per_kg: number;
  image_url: string;
  weight?: string | null;
  weight_in_kg?: number;
  description?: string;
  price?: number;
  original_price?: number | null;
  discount_percentage?: number;
}

// Helper function to calculate pricing details (similar to customer app)
const getProductPricingDetails = (product: ProductState, pricePerKgOverride?: number) => {
  // Use override price if provided, otherwise use product's price_per_kg
  const pricePerKg = pricePerKgOverride !== undefined ? pricePerKgOverride : (product.price_per_kg || 0);
  
  // Calculate price based on weight and price per kg (like customer app)
  const weightInKg = product.weight_in_kg || 1.0;
  const calculatedPrice = pricePerKg * weightInKg;
  
  // Use stored price if available and valid, otherwise use calculated price
  const currentPrice = (product.price && product.price > 0) ? product.price : calculatedPrice;
  
  const discountPercentage = product.discount_percentage || 0;
  
  // Calculate original price
  let originalPrice = currentPrice;
  if (product.original_price && product.original_price > currentPrice) {
    originalPrice = product.original_price;
  } else if (discountPercentage > 0 && currentPrice > 0) {
    originalPrice = currentPrice / (1 - discountPercentage / 100);
  }

  return {
    currentPrice,
    originalPrice: Math.round(originalPrice),
    discountPercentage: Math.round(discountPercentage),
  };
};

// Product Card Component - Grid View (similar to customer app)
const ProductCard = memo(({ 
  product, 
  pricePerKg,
  onEdit 
}: {
  product: ProductState;
  pricePerKg: number;
  onEdit: (product: ProductState) => void;
}) => {
  // Use the actual price_per_kg (from prices state or product)
  const actualPricePerKg = pricePerKg > 0 ? pricePerKg : (product.price_per_kg || 0);
  
  // Calculate pricing details with the actual price per kg
  const { currentPrice, originalPrice, discountPercentage } = getProductPricingDetails(product, actualPricePerKg);
  const displayWeight = product.weight?.trim()
    ? product.weight
    : product.weight_in_kg && product.weight_in_kg >= 1
      ? `${product.weight_in_kg} kg`
      : product.weight_in_kg
        ? `${Math.round(product.weight_in_kg * 1000)} g`
        : '1 kg';

  return (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => onEdit(product)}
    >
      <Image 
        source={getImageSource(product.image_url, product.name, product.category)} 
        style={styles.productImage}
        defaultSource={require('../../assets/images/taaza.png')}
        onError={() => {
          if (__DEV__) {
            console.warn('[StoreScreen] Image failed to load:', product.name, product.image_url);
          }
        }}
        resizeMode="cover"
      />
      {!product.is_available && (
        <View style={styles.unavailableBadge}>
          <Text style={styles.unavailableBadgeText}>Unavailable</Text>
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.name || ''}</Text>
        <Text style={styles.productWeight}>{displayWeight}</Text>
        <View style={styles.productPricingWrapper}>
          {actualPricePerKg > 0 ? (
            <>
              <Text style={styles.productCurrentPrice}>
                ₹{Math.round(currentPrice)}
              </Text>
              {originalPrice > currentPrice && (
                <Text style={styles.productOriginalPrice}>
                  ₹{Math.round(originalPrice)}
                </Text>
              )}
              {discountPercentage > 0 && originalPrice > currentPrice && (
                <Text style={styles.productDiscount}>
                  {discountPercentage}% off
                </Text>
              )}
            </>
          ) : (
            <Text style={styles.productNoPrice}>Set price</Text>
          )}
        </View>
        <View style={styles.productFooter}>
          {actualPricePerKg > 0 ? (
            <Text style={styles.productPricePerKg}>
              ₹{actualPricePerKg.toFixed(2)}/kg
            </Text>
          ) : (
            <Text style={styles.productPricePerKg}>Price not set</Text>
          )}
        </View>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => onEdit(product)}
        >
          <Text style={styles.editButtonText}>EDIT</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.is_available === nextProps.product.is_available &&
    prevProps.pricePerKg === nextProps.pricePerKg
  );
});

ProductCard.displayName = 'ProductCard';

export default function StoreScreen() {
  const [products, setProducts] = useState<ProductState[]>([]);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopType, setShopType] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingProduct, setEditingProduct] = useState<ProductState | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editAvailable, setEditAvailable] = useState(true);
  const inputRefs = useRef<Record<string, any>>({});

  // Load products from Supabase on mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Reload products when screen comes into focus (to get latest updates)
  useFocusEffect(
    useCallback(() => {
      console.log('[StoreScreen] Screen focused - reloading products to get latest updates...');
      loadProducts();
    }, [])
  );

  // Helper function to map shop_type to product category
  const getCategoryFromShopType = (shopType: string | null): string | null => {
    if (!shopType) return null;
    
    const shopTypeMap: Record<string, string> = {
      'chicken': 'Chicken',
      'mutton': 'Mutton',
      'pork': 'Pork',
      'meat': 'Meat',
    };
    
    return shopTypeMap[shopType.toLowerCase()] || null;
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      
      // Get vendor's shop ID and shop type
      const vendorShopId = await getVendorShopId();
      setShopId(vendorShopId);

      // Get shop type from vendor data FIRST (before loading products)
      let shopTypeFromData: string | null = null;
      try {
        const vendorDataStr = await AsyncStorage.getItem('vendor_data');
        if (vendorDataStr) {
          const vendorData = JSON.parse(vendorDataStr);
          shopTypeFromData = vendorData?.shop?.shop_type || vendorData?.shop?.shopType || null;
          setShopType(shopTypeFromData);
          console.log('[StoreScreen] Shop type loaded:', shopTypeFromData);
        }
      } catch (error) {
        console.warn('[StoreScreen] Error loading shop type:', error);
      }

      // Get base products (shop_id IS NULL) - these are templates
      const baseProducts = await getAllProducts();
      
      // Get shop-specific products (shop_id = vendorShopId) - vendor's custom prices/availability
      let shopProducts: Product[] = [];
      if (vendorShopId) {
        shopProducts = await getShopProducts(vendorShopId);
      }
      
      // Create a map of shop-specific products by name for quick lookup
      const shopProductsMap = new Map<string, Product>();
      shopProducts.forEach((sp) => {
        shopProductsMap.set(sp.name, sp);
      });

      if (baseProducts && baseProducts.length > 0) {
        // Filter base products based on shop type (use shopTypeFromData, not state)
        let filteredProducts = baseProducts;
        
        if (shopTypeFromData && shopTypeFromData.toLowerCase() !== 'multi') {
          const targetCategory = getCategoryFromShopType(shopTypeFromData);
          if (targetCategory) {
            filteredProducts = baseProducts.filter(
              (product) => product.category?.toLowerCase() === targetCategory.toLowerCase()
            );
            console.log(`[StoreScreen] Filtered products by shop type "${shopTypeFromData}" (category: "${targetCategory}"): ${filteredProducts.length} products`);
          } else {
            console.log(`[StoreScreen] Unknown shop type "${shopTypeFromData}", showing all products`);
          }
        } else {
          console.log('[StoreScreen] Shop type is "multi" or not set, showing all products');
        }

        // Map base products to our state, merging with shop-specific data if available
        // Vendor app shows base products (templates) but with shop-specific prices/availability if set
        const productStates: ProductState[] = filteredProducts.map((baseProduct) => {
          // Check if this shop has a custom version of this product
          const shopProduct = shopProductsMap.get(baseProduct.name);
          
          // Use shop-specific price/availability if exists, otherwise use base product defaults
          const pricePerKg = shopProduct?.price_per_kg || baseProduct.price_per_kg || 0;
          const isAvailable = shopProduct?.is_available !== undefined ? shopProduct.is_available : false;
          
          return {
            id: baseProduct.id, // Use base product ID (vendor will sync using this ID)
            name: baseProduct.name,
            category: baseProduct.category,
            is_available: isAvailable,
            price_per_kg: pricePerKg,
            image_url: baseProduct.image_url,
            weight: baseProduct.weight || null,
            weight_in_kg: baseProduct.weight_in_kg || 1,
            description: baseProduct.description || '',
            // Calculate price based on weight and price_per_kg
            price: pricePerKg * (baseProduct.weight_in_kg || 1),
            original_price: baseProduct.original_price || null,
            discount_percentage: baseProduct.discount_percentage || 0,
          };
        });

        // Initialize prices - use default prices from Supabase, vendor can override
        const initialPrices: Record<string, string> = {};
        productStates.forEach((product) => {
          // Always use the price_per_kg (default or vendor's custom price)
          let priceValue = '';
          if (product.price_per_kg && product.price_per_kg > 0) {
            // Format price: remove trailing zeros but keep decimals if needed
            priceValue = product.price_per_kg.toString().replace(/\.?0+$/, '');
            if (priceValue.includes('.') && priceValue.endsWith('.')) {
              priceValue = priceValue.slice(0, -1);
            }
          }
          initialPrices[product.id] = priceValue;
        });

        console.log('[StoreScreen] Loaded products:', productStates.length);
        console.log('[StoreScreen] Initialized prices:', Object.keys(initialPrices).length, 'products');
        if (__DEV__) {
          // Log first few prices for debugging
          const samplePrices = Object.entries(initialPrices).slice(0, 3);
          samplePrices.forEach(([id, price]) => {
            const product = productStates.find(p => p.id === id);
            console.log(`[StoreScreen] Product: ${product?.name} - Price: ₹${price}/kg`);
          });
        }
        
        setProducts(productStates);
        setPrices(initialPrices);
      } else {
        Alert.alert('Info', 'No products found in the system. Please contact support.');
      }
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleProductAvailability = (productId: string) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? { ...product, is_available: !product.is_available }
          : product
      )
    );
  };

  const updatePrice = useCallback((productId: string, value: string) => {
    // Remove leading zeros and allow empty string or numeric only
    let cleanedValue = value;
    
    // Remove leading zeros (but keep single zero or decimal point)
    if (cleanedValue.length > 1 && cleanedValue.startsWith('0') && !cleanedValue.startsWith('0.')) {
      cleanedValue = cleanedValue.replace(/^0+/, '') || '0';
    }
    
    // Allow empty string or numeric only (including decimals)
    if (cleanedValue === '' || /^\d*\.?\d*$/.test(cleanedValue)) {
      // Update state immediately without checking to prevent focus loss
      setPrices((prev) => ({
        ...prev,
        [productId]: cleanedValue,
      }));
    }
  }, []);

  const handleSave = async () => {
    if (!shopId) {
      Alert.alert('Error', 'Shop ID not found. Please log in again.');
      return;
    }

    try {
      setSaving(true);
      
      // Update all products
      const updatePromises = products.map(async (product) => {
        // Get price from state (user input)
        const priceString = prices[product.id] || '';
        const pricePerKg = priceString ? parseFloat(priceString) : 0;
        
        console.log(`[StoreScreen] Saving product: ${product.name}`, {
          productId: product.id,
          priceString,
          pricePerKg,
          isAvailable: product.is_available,
        });
        
        // Validate price if product is available
        if (product.is_available && (isNaN(pricePerKg) || pricePerKg <= 0)) {
          return { 
            success: false, 
            product: product.name, 
            error: `Price is required when product is available. Please enter a price greater than 0.` 
          };
        }
        
        // Use the entered price, or 0 if product is not available
        const finalPrice = product.is_available ? pricePerKg : 0;

        // Sync product to shop (updates both availability and price)
        // This will save to Supabase and reflect in customer app
        const result = await syncProductToShop(
          shopId,
          product.id,
          product.is_available,
          finalPrice
        );
        
        if (!result.success) {
          console.error(`[StoreScreen] Failed to save ${product.name}:`, result.error);
        }
        
        return { 
          success: result.success, 
          product: product.name, 
          error: result.error 
        };
      });

      const results = await Promise.all(updatePromises);
      const failed = results.filter((r) => !r.success);
      
      if (failed.length === 0) {
        Alert.alert('Success', 'All products updated successfully! Prices will now reflect in the customer app.');
        // Reload products to reflect changes from Supabase
        await loadProducts();
      } else {
        const failedNames = failed.map((f) => `${f.product} (${f.error})`).join('\n');
        Alert.alert(
          'Partial Success',
          `Updated ${results.length - failed.length} products.\n\nFailed:\n${failedNames}`
        );
        // Still reload to get updated data
        await loadProducts();
      }
    } catch (error: any) {
      console.error('Error saving products:', error);
      Alert.alert('Error', error.message || 'Failed to save products. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle product edit
  const handleEditProduct = (product: ProductState) => {
    setEditingProduct(product);
    setEditPrice(prices[product.id] || (product.price_per_kg > 0 ? product.price_per_kg.toString() : ''));
    setEditAvailable(product.is_available);
  };

  // Save edited product
  const handleSaveEdit = async () => {
    if (!editingProduct) return;

    const priceValue = parseFloat(editPrice);
    if (isNaN(priceValue) || priceValue < 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    // Save to backend first
    try {
      if (shopId) {
        const result = await syncProductToShop(shopId, editingProduct.id, editAvailable, priceValue);
        if (result.success) {
          // Immediately reload products from Supabase to get latest updates
          console.log('[StoreScreen] Product saved successfully, reloading products...');
          await loadProducts();
          
          Alert.alert('Success', 'Product updated successfully!');
        } else {
          Alert.alert('Error', result.error || 'Failed to save product');
        }
      }
    } catch (error: any) {
      console.error('Error saving product:', error);
      Alert.alert('Error', error.message || 'Failed to save product');
    }

    setEditingProduct(null);
  };

  // Get unique categories
  const categories = useMemo(() => {
    const cats = ['All', ...Array.from(new Set(products.map(p => p.category)))];
    return cats;
  }, [products]);

  // Filter products by category and search query
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [products, selectedCategory, searchQuery]);

  // Group products by category - memoized to prevent unnecessary re-renders
  const productsByCategory = useMemo(() => {
    return products.reduce((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = [];
      }
      acc[product.category].push(product);
      return acc;
    }, {} as Record<string, ProductState[]>);
  }, [products]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Manage Products & Prices</Text>
          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
            onPress={handleSave} 
            activeOpacity={0.8}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#111111" />
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false} 
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="none"
          >
            {Object.keys(productsByCategory).length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No products found</Text>
                <TouchableOpacity onPress={loadProducts} style={styles.refreshButton}>
                  <Text style={styles.refreshButtonText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Products</Text>
                {shopType && (
                  <Text style={styles.shopTypeInfo}>
                    Shop Type: {shopType.charAt(0).toUpperCase() + shopType.slice(1)}
                    {shopType.toLowerCase() !== 'multi' && ' - Showing matching products only'}
                  </Text>
                )}
                <Text style={styles.sectionSubtitle}>
                  Tap on a product to set price and availability
                </Text>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                  <View style={styles.searchInputWrapper}>
                    <Search size={20} color="#6B7280" style={styles.searchIcon} />
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
                      <TouchableOpacity
                        onPress={() => setSearchQuery('')}
                        style={styles.clearSearchButton}
                      >
                        <X size={18} color="#6B7280" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Category Filter */}
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryScroll}
                  contentContainerStyle={styles.categoryContainer}
                >
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryChip,
                        selectedCategory === category && styles.categoryChipActive
                      ]}
                      onPress={() => setSelectedCategory(category)}
                    >
                      <Text style={[
                        styles.categoryText,
                        selectedCategory === category && styles.categoryTextActive
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Products Grid */}
                <View style={styles.productsGrid}>
                  {filteredProducts.map((product) => {
                    // Get price from prices state or product
                    const priceString = prices[product.id] || '';
                    const pricePerKg = priceString ? parseFloat(priceString) : (product.price_per_kg || 0);
                    
                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        pricePerKg={pricePerKg}
                        onEdit={handleEditProduct}
                      />
                    );
                  })}
                </View>

                {filteredProducts.length === 0 && (
                  <View style={styles.emptyProductsContainer}>
                    <Text style={styles.emptyProductsText}>No products in this category</Text>
                  </View>
                )}
              </View>
            )}

        {/* Edit Product Modal */}
        <Modal
          visible={editingProduct !== null}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setEditingProduct(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingProduct?.name || 'Edit Product'}
                </Text>
                <TouchableOpacity onPress={() => setEditingProduct(null)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>Price per kg (₹)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="decimal-pad"
                    value={editPrice}
                    onChangeText={setEditPrice}
                    placeholder="Enter price per kg"
                    autoFocus
                  />
                </View>

                <View style={styles.modalSwitchGroup}>
                  <Text style={styles.modalLabel}>Availability</Text>
                  <View style={styles.modalSwitchRow}>
                    <Text style={styles.modalSwitchLabel}>
                      {editAvailable ? 'Available' : 'Not Available'}
                    </Text>
                    <Switch
                      value={editAvailable}
                      onValueChange={setEditAvailable}
                      thumbColor={editAvailable ? '#111111' : '#f4f3f4'}
                      trackColor={{ false: '#767577', true: '#4CAF50' }}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.modalSaveButton}
                  onPress={handleSaveEdit}
                >
                  <Text style={styles.modalSaveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: Constants.statusBarHeight + 16,
    paddingBottom: 14,
    paddingHorizontal: 20,
    backgroundColor: '#F9FAFB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111111',
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#111111',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginLeft: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 20,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  serviceText: {
    fontSize: 16,
    color: '#111111',
    fontWeight: '500',
    flex: 1,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  rateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    height: 44,
    minWidth: 100,
  },
  rateInputFocused: {
    borderColor: '#111111',
    shadowColor: '#111',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  currencySymbol: {
    fontSize: 18,
    color: '#111111',
    marginRight: 6,
  },
  rateInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#111111',
    padding: 0,
    margin: 0,
  },
  infoText: {
    marginTop: 10,
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: '#111111',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  categoryScroll: {
    marginTop: 10,
    marginBottom: 20,
  },
  categoryContainer: {
    paddingVertical: 8,
    paddingBottom: 12,
    gap: 10,
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
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginTop: 10,
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
    overflow: 'hidden', // Ensure badge doesn't overflow card boundaries
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
    flexWrap: 'wrap',
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
  productNoPrice: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
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
  editButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 'auto',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  unavailableBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(156, 163, 175, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unavailableBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  emptyProductsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyProductsText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111111',
  },
  modalClose: {
    fontSize: 24,
    color: '#6B7280',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalInputGroup: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111111',
  },
  modalSwitchGroup: {
    marginBottom: 20,
  },
  modalSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalSwitchLabel: {
    fontSize: 16,
    color: '#111111',
    fontWeight: '500',
  },
  modalSaveButton: {
    backgroundColor: '#111111',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  modalSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111111',
    padding: 0,
    margin: 0,
  },
  clearSearchButton: {
    padding: 4,
    marginLeft: 8,
  },
  shopTypeInfo: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  availabilitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  availabilityLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  productDetailsSection: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  productDetailText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    lineHeight: 16,
  },
  discountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  originalPriceText: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
