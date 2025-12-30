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
} from 'react-native';
import Constants from 'expo-constants';
import { 
  getAllProducts, 
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

// Memoized Product Card Component to prevent re-renders and keyboard dismissal
const ProductCard = memo(({ 
  product, 
  initialPrice, 
  onPriceChange, 
  onToggleAvailability 
}: {
  product: ProductState;
  initialPrice: string;
  onPriceChange: (productId: string, text: string) => void;
  onToggleAvailability: (productId: string) => void;
}) => {
  // Use local state for the input value to prevent re-renders from parent
  const [localPrice, setLocalPrice] = useState(initialPrice);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<any>(null);

  // Update local state when initialPrice changes from outside (but not while focused)
  useEffect(() => {
    if (!isFocused && initialPrice !== localPrice) {
      setLocalPrice(initialPrice);
    }
  }, [initialPrice]);

  const handlePriceChange = (text: string) => {
    // Remove leading zeros and allow empty string or numeric only
    let cleanedValue = text;
    
    // Remove leading zeros (but keep single zero or decimal point)
    if (cleanedValue.length > 1 && cleanedValue.startsWith('0') && !cleanedValue.startsWith('0.')) {
      cleanedValue = cleanedValue.replace(/^0+/, '') || '0';
    }
    
    // Allow empty string or numeric only (including decimals)
    if (cleanedValue === '' || /^\d*\.?\d*$/.test(cleanedValue)) {
      setLocalPrice(cleanedValue);
      // Debounce the parent update to prevent re-renders
      onPriceChange(product.id, cleanedValue);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Ensure keyboard stays open
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <View style={styles.productCard}>
      {/* Product Image */}
      <Image
        source={getImageSource(product.image_url, product.name, product.category)}
        style={styles.productImage}
        resizeMode="cover"
        defaultSource={require('../../assets/images/taaza.png')}
        onError={() => {
          if (__DEV__) {
            console.warn('[StoreScreen] Image failed to load:', product.name, product.image_url);
          }
        }}
      />
      
      {/* Product Info Section */}
      <View style={styles.productContent}>
        {/* Product Name and Availability Badge */}
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{product.name}</Text>
          {product.is_available && (
            <View style={styles.availableBadgeContainer}>
              <Text style={styles.availableBadge}>Available</Text>
            </View>
          )}
        </View>

        {/* Product Details - Weight, Description */}
        {(product.weight || product.description) && (
          <View style={styles.productDetailsSection}>
            {product.weight && (
              <Text style={styles.productDetailText}>
                📦 Weight: {product.weight}
              </Text>
            )}
            {product.description && (
              <Text style={styles.productDetailText} numberOfLines={2}>
                📝 {product.description}
              </Text>
            )}
            {product.price && product.price > 0 && (
              <Text style={styles.productDetailText}>
                💰 Current Price: ₹{product.price.toFixed(2)}
              </Text>
            )}
            {product.original_price && product.original_price > product.price! && (
              <View style={styles.discountInfo}>
                <Text style={styles.originalPriceText}>
                  ₹{product.original_price.toFixed(2)}
                </Text>
                {product.discount_percentage > 0 && (
                  <Text style={styles.discountText}>
                    {product.discount_percentage}% OFF
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Price Input */}
        <View style={styles.priceSection}>
          <Text style={styles.priceLabel}>Price per kg:</Text>
          <View style={[styles.rateInputContainer, isFocused && styles.rateInputFocused]}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              ref={inputRef}
              style={styles.rateInput}
              keyboardType="decimal-pad"
              value={localPrice}
              onChangeText={handlePriceChange}
              placeholder="Enter price"
              maxLength={10}
              onFocus={handleFocus}
              onBlur={handleBlur}
              selectionColor="#111"
              returnKeyType="done"
              blurOnSubmit={false}
              editable={true}
              importantForAutofill="no"
              autoCorrect={false}
              autoCapitalize="none"
              keyboardAppearance="default"
              showSoftInputOnFocus={true}
            />
          </View>
        </View>

        {/* Availability Toggle */}
        <View style={styles.availabilitySection}>
          <Text style={styles.availabilityLabel}>
            {product.is_available ? 'Available' : 'Not Available'}
          </Text>
          <Switch
            value={product.is_available}
            onValueChange={() => onToggleAvailability(product.id)}
            thumbColor={product.is_available ? '#111111' : '#f4f3f4'}
            trackColor={{ false: '#767577', true: '#4CAF50' }}
          />
        </View>
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  // Only re-render if product availability changes or initial price changes (but not while typing)
  // This prevents re-renders when user is typing
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.is_available === nextProps.product.is_available &&
    prevProps.initialPrice === nextProps.initialPrice
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
  const inputRefs = useRef<Record<string, any>>({});

  // Load products from Supabase on mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      
      // Get vendor's shop ID
      const vendorShopId = await getVendorShopId();
      setShopId(vendorShopId);

      // Get all products from Supabase
      const allProducts = await getAllProducts();
      
      if (allProducts && allProducts.length > 0) {
        // Map products to our state
        // Load all products from customer app's Supabase (base catalog)
        // Prices will be set by vendor, starting from empty
        const productStates: ProductState[] = allProducts.map((product) => ({
          id: product.id,
          name: product.name,
          category: product.category,
          // Always start as available (ON) by default
          // If product already has shop_id matching vendor, use its existing status
          // Otherwise, default to available (true)
          is_available: product.shop_id === vendorShopId ? (product.is_available !== undefined ? product.is_available : true) : true,
          // Use existing price if product belongs to this vendor's shop, otherwise start with 0
          price_per_kg: product.shop_id === vendorShopId ? (product.price_per_kg || 0) : 0,
          image_url: product.image_url,
          weight: product.weight || null,
          weight_in_kg: product.weight_in_kg || 1,
          description: product.description || '',
          price: product.price || 0,
          original_price: product.original_price || null,
          discount_percentage: product.discount_percentage || 0,
        }));

        // Initialize prices - start with empty/0 for all products
        // Vendors will set their own prices
        const initialPrices: Record<string, string> = {};
        productStates.forEach((product) => {
          // Use existing price if product already has a price set
          let priceValue = '';
          if (product.price_per_kg && product.price_per_kg > 0) {
            // Use existing price
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
                <Text style={styles.sectionTitle}>Manage Products & Prices</Text>
                <Text style={styles.sectionSubtitle}>
                  Set your prices per kg for each product. Toggle ON to make products available. 
                  Changes will be saved to Supabase and immediately reflect in the customer app.
                </Text>

                {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
                  <View key={category} style={styles.categorySection}>
                    <Text style={styles.categoryTitle}>{category}</Text>
                    {categoryProducts.map((product) => {
                      return (
                        <ProductCard
                          key={product.id}
                          product={product}
                          initialPrice={prices[product.id] || ''}
                          onPriceChange={updatePrice}
                          onToggleAvailability={toggleProductAvailability}
                        />
                      );
                    })}
                  </View>
                ))}

                <Text style={styles.infoText}>
                  💡 Set your prices per kilogram for each product. Prices are saved to Supabase and 
                  will immediately appear in the customer app when they select your shop. 
                  Products must have a price greater than 0 to be available.
                </Text>
              </View>
            )}
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
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  productImage: {
    width: 120,
    height: 120,
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  productContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  productName: {
    fontSize: 18,
    color: '#111111',
    fontWeight: '600',
    flex: 1,
  },
  availableBadgeContainer: {
    marginLeft: 8,
  },
  availableBadge: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '700',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
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
