/**
 * Product Service for Vendor App
 * Handles product management with Supabase
 */

import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Product {
  id: string;
  name: string;
  category: string;
  weight: string | null;
  weight_in_kg: number;
  price: number;
  price_per_kg: number;
  original_price: number | null;
  discount_percentage: number;
  image_url: string;
  description: string;
  rating: number;
  is_available: boolean;
  shop_id: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Get vendor's shop ID from stored data
 */
export const getVendorShopId = async (): Promise<string | null> => {
  try {
    const vendorDataStr = await AsyncStorage.getItem('vendor_data');
    if (vendorDataStr) {
      const vendorData = JSON.parse(vendorDataStr);
      return vendorData?.shop?.id || vendorData?.shop_id || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting vendor shop ID:', error);
    return null;
  }
};

/**
 * Get all base products from Supabase (products with shop_id IS NULL)
 * These are template products that vendors can use to create their shop-specific products
 * This function also includes products that may not have a base version (shop_id IS NULL)
 * to ensure all unique product names are visible to vendors
 */
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    // First, get all base products (shop_id IS NULL) - these are preferred
    const { data: baseData, error: baseError } = await supabase
      .from('products')
      .select('*')
      .is('shop_id', null) // Get base/template products (shop_id IS NULL)
      .order('updated_at', { ascending: false }) // Recently updated products first
      .order('category', { ascending: true })
      .order('name', { ascending: true })
      .limit(10000);

    if (baseError) {
      console.error('Error fetching base products:', baseError);
      throw baseError;
    }

    // Also get all products to find unique product names that might not have base versions
    const { data: allData, error: allError } = await supabase
      .from('products')
      .select('*')
      .order('updated_at', { ascending: false }) // Recently updated products first
      .order('category', { ascending: true })
      .order('name', { ascending: true })
      .limit(10000);

    if (allError) {
      console.warn('Error fetching all products (non-critical):', allError);
    }

    console.log(`[getAllProducts] Found ${baseData?.length || 0} base products (shop_id IS NULL)`);
    console.log(`[getAllProducts] Found ${allData?.length || 0} total products in database`);
    
    // Log category breakdown for base products
    if (baseData && baseData.length > 0) {
      const categoryCounts = baseData.reduce((acc: Record<string, number>, product: any) => {
        const category = product.category || 'Unknown';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});
      console.log('[getAllProducts] Base products by category:', categoryCounts);
      if (categoryCounts['Mutton']) {
        console.log(`[getAllProducts] Base mutton products: ${categoryCounts['Mutton']}`);
      }
    }

    // Log all products breakdown for comparison
    if (allData && allData.length > 0) {
      const allCategoryCounts = allData.reduce((acc: Record<string, number>, product: any) => {
        const category = product.category || 'Unknown';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});
      console.log('[getAllProducts] All products by category (including shop-specific):', allCategoryCounts);
      if (allCategoryCounts['Mutton']) {
        console.log(`[getAllProducts] Total mutton products in database: ${allCategoryCounts['Mutton']}`);
      }
    }

    // Create a map of unique products by name, preferring base products (shop_id IS NULL)
    const productMap = new Map<string, Product>();
    
    // First, add all base products (these are preferred)
    if (baseData) {
      baseData.forEach((product: any) => {
        productMap.set(product.name, product as Product);
      });
    }
    
    // Then, add any products that don't have a base version
    // This ensures all unique product names are visible even if they don't have shop_id IS NULL
    if (allData) {
      allData.forEach((product: any) => {
        if (!productMap.has(product.name)) {
          // Use this product even if it has shop_id (to ensure all products are visible)
          // Note: This product will still work with syncProductToShop because it uses the base product ID
          productMap.set(product.name, product as Product);
        }
      });
    }

    const uniqueProducts = Array.from(productMap.values());
    
    // Sort by updated_at (recently updated first), then category and name
    uniqueProducts.sort((a, b) => {
      // First, sort by updated_at (most recent first)
      const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      if (dateB !== dateA) {
        return dateB - dateA; // Descending order (newest first)
      }
      // Then by category
      if (a.category !== b.category) {
        return (a.category || '').localeCompare(b.category || '');
      }
      // Finally by name
      return (a.name || '').localeCompare(b.name || '');
    });

    console.log(`[getAllProducts] Returning ${uniqueProducts.length} unique products`);
    
    const muttonCount = uniqueProducts.filter(p => p.category?.toLowerCase() === 'mutton').length;
    if (muttonCount > 0) {
      console.log(`[getAllProducts] Mutton products in final result: ${muttonCount}`);
    }

    return uniqueProducts;
  } catch (error) {
    console.error('Error in getAllProducts:', error);
    return [];
  }
};

/**
 * Get products for a specific shop
 */
export const getShopProducts = async (shopId: string): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('shop_id', shopId)
      .order('updated_at', { ascending: false }) // Recently updated products first
      .order('category', { ascending: true })
      .order('name', { ascending: true })
      .limit(10000); // Explicitly set high limit to fetch all products

    if (error) {
      console.error('Error fetching shop products:', error);
      throw error;
    }

    return (data || []) as Product[];
  } catch (error) {
    console.error('Error in getShopProducts:', error);
    return [];
  }
};

/**
 * Update product availability and price
 */
export const updateProduct = async (
  productId: string,
  updates: {
    is_available?: boolean;
    price_per_kg?: number;
    price?: number;
    shop_id?: string | null;
  }
): Promise<{ success: boolean; error?: string }> => {
  try {
    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId);

    if (error) {
      console.error('Error updating product:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in updateProduct:', error);
    return { success: false, error: error.message || 'Failed to update product' };
  }
};

/**
 * Create or update product for a shop
 * If product exists, update it; if not, create a new entry linked to the shop
 */
export const upsertShopProduct = async (
  shopId: string,
  product: {
    name: string;
    category: string;
    weight?: string | null;
    weight_in_kg?: number;
    price: number;
    price_per_kg: number;
    original_price?: number | null;
    discount_percentage?: number;
    image_url: string;
    description?: string;
    is_available: boolean;
  }
): Promise<{ success: boolean; data?: Product; error?: string }> => {
  try {
    // First, check if a product with this name and shop_id exists
    const { data: existing } = await supabase
      .from('products')
      .select('*')
      .eq('name', product.name)
      .eq('shop_id', shopId)
      .single();

    if (existing) {
      // Update existing product
      const { data, error } = await supabase
        .from('products')
        .update({
          ...product,
          shop_id: shopId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as Product };
    } else {
      // Create new product
      const { data, error } = await supabase
        .from('products')
        .insert({
          ...product,
          shop_id: shopId,
          id: `${shopId}_${Date.now()}`, // Generate unique ID
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as Product };
    }
  } catch (error: any) {
    console.error('Error in upsertShopProduct:', error);
    return { success: false, error: error.message || 'Failed to save product' };
  }
};

/**
 * Copy base products to a shop when shop is registered
 * This creates shop-specific product copies from base products (shop_id IS NULL)
 */
export const copyBaseProductsToShop = async (
  shopId: string,
  shopType: string | null
): Promise<{ success: boolean; copiedCount?: number; error?: string }> => {
  try {
    console.log(`[copyBaseProductsToShop] Copying base products to shop ${shopId} (shop type: ${shopType})`);

    // Map shop type to category
    const getCategoryFromShopType = (type: string | null): string | null => {
      if (!type) return null;
      const typeLower = type.toLowerCase();
      const categoryMap: Record<string, string> = {
        'chicken': 'Chicken',
        'mutton': 'Mutton',
        'pork': 'Pork',
        'meat': 'Seafood',
      };
      return categoryMap[typeLower] || null;
    };

    // Get base products (shop_id IS NULL)
    let query = supabase
      .from('products')
      .select('*')
      .is('shop_id', null)
      .limit(10000); // Explicitly set high limit to fetch all products

    // Filter by shop type category if shop type is specified and not 'multi'
    if (shopType && shopType.toLowerCase() !== 'multi') {
      const category = getCategoryFromShopType(shopType);
      if (category) {
        query = query.eq('category', category);
        console.log(`[copyBaseProductsToShop] Filtering base products by category: ${category}`);
      }
    }

    const { data: baseProducts, error: fetchError } = await query;

    if (fetchError) {
      console.error('[copyBaseProductsToShop] Error fetching base products:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!baseProducts || baseProducts.length === 0) {
      console.log('[copyBaseProductsToShop] No base products found to copy');
      return { success: true, copiedCount: 0 };
    }

    console.log(`[copyBaseProductsToShop] Found ${baseProducts.length} base products to copy`);

    // Check which products already exist for this shop (to avoid duplicates)
    const { data: existingProducts } = await supabase
      .from('products')
      .select('name')
      .eq('shop_id', shopId);

    const existingNames = new Set((existingProducts || []).map((p: any) => p.name));

    // Create shop-specific copies of base products
    const productsToInsert = baseProducts
      .filter((baseProduct: any) => !existingNames.has(baseProduct.name))
      .map((baseProduct: any) => ({
        id: `${shopId}_${baseProduct.id}_${Date.now()}`, // Unique ID for shop-specific product
        name: baseProduct.name,
        category: baseProduct.category,
        weight: baseProduct.weight,
        weight_in_kg: baseProduct.weight_in_kg,
        price: baseProduct.price,
        price_per_kg: baseProduct.price_per_kg, // Use base price initially
        original_price: baseProduct.original_price,
        discount_percentage: baseProduct.discount_percentage,
        image_url: baseProduct.image_url,
        description: baseProduct.description,
        rating: baseProduct.rating || 0,
        is_available: false, // Start as unavailable - vendor will enable and set price
        shop_id: shopId, // Link to this shop
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

    if (productsToInsert.length === 0) {
      console.log('[copyBaseProductsToShop] All products already exist for this shop');
      return { success: true, copiedCount: 0 };
    }

    // Insert shop-specific products
    const { error: insertError } = await supabase
      .from('products')
      .insert(productsToInsert);

    if (insertError) {
      console.error('[copyBaseProductsToShop] Error inserting shop products:', insertError);
      return { success: false, error: insertError.message };
    }

    console.log(`[copyBaseProductsToShop] Successfully copied ${productsToInsert.length} products to shop ${shopId}`);
    return { success: true, copiedCount: productsToInsert.length };
  } catch (error: any) {
    console.error('[copyBaseProductsToShop] Exception:', error);
    return { success: false, error: error.message || 'Failed to copy products to shop' };
  }
};

/**
 * Sync product availability and price for a shop
 * Creates or updates a shop-specific product copy (does NOT modify base products)
 */
export const syncProductToShop = async (
  shopId: string,
  baseProductId: string, // ID of the product (preferably base product with shop_id IS NULL)
  isAvailable: boolean,
  pricePerKg: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    // First, try to get the product by ID (preferably base product)
    let baseProduct: any = null;
    const { data: productById, error: productByIdError } = await supabase
      .from('products')
      .select('*')
      .eq('id', baseProductId)
      .single();

    if (!productByIdError && productById) {
      // If it's a base product (shop_id IS NULL), use it
      if (!productById.shop_id) {
        baseProduct = productById;
      } else {
        // If it's not a base product, try to find a base product with the same name
        const { data: baseProductByName, error: baseByNameError } = await supabase
          .from('products')
          .select('*')
          .eq('name', productById.name)
          .is('shop_id', null)
          .limit(1)
          .single();
        
        if (!baseByNameError && baseProductByName) {
          baseProduct = baseProductByName;
        } else {
          // If no base product exists, use the product we found (even if it has shop_id)
          // This handles cases where products don't have base versions
          baseProduct = productById;
        }
      }
    }

    if (!baseProduct) {
      console.error('[syncProductToShop] Product not found:', baseProductId);
      return { success: false, error: 'Product not found' };
    }

    // Check if shop-specific product already exists (by name and shop_id)
    const { data: existingShopProducts, error: findError } = await supabase
      .from('products')
      .select('*')
      .eq('shop_id', shopId)
      .eq('name', baseProduct.name);

    // Calculate price based on weight
    const calculatedPrice = pricePerKg * (baseProduct.weight_in_kg || 1);

    // If shop-specific product exists, update it (use first match if multiple)
    const existingShopProduct = existingShopProducts && existingShopProducts.length > 0 ? existingShopProducts[0] : null;

    if (existingShopProduct) {
      // CRITICAL: Verify this product belongs to this shop and is NOT a base product
      if (existingShopProduct.shop_id !== shopId) {
        console.error('[syncProductToShop] Product shop_id mismatch!', {
          productId: existingShopProduct.id,
          productShopId: existingShopProduct.shop_id,
          expectedShopId: shopId,
        });
        return { success: false, error: 'Product does not belong to this shop' };
      }

      // Update existing shop-specific product (ensure we're updating only this shop's product)
      const { error: updateError } = await supabase
        .from('products')
        .update({
          is_available: isAvailable,
          price_per_kg: pricePerKg,
          price: calculatedPrice,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingShopProduct.id)
        .eq('shop_id', shopId) // Double-check shop_id to ensure we're only updating this shop's product
        .not('shop_id', 'is', null); // Ensure we're NOT updating base products

      if (updateError) {
        console.error('[syncProductToShop] Error updating shop product:', updateError);
        return { success: false, error: updateError.message };
      }

      console.log('[syncProductToShop] Updated shop-specific product:', {
        productId: existingShopProduct.id,
        name: baseProduct.name,
        shopId,
        isAvailable,
        pricePerKg,
      });
    } else {
      // Create new shop-specific product copy
      const newProductId = `${shopId}_${baseProductId}_${Date.now()}`;
      const { error: insertError } = await supabase
        .from('products')
        .insert({
          id: newProductId,
          name: baseProduct.name,
          category: baseProduct.category,
          weight: baseProduct.weight,
          weight_in_kg: baseProduct.weight_in_kg,
          price: calculatedPrice,
          price_per_kg: pricePerKg,
          original_price: baseProduct.original_price,
          discount_percentage: baseProduct.discount_percentage,
          image_url: baseProduct.image_url,
          description: baseProduct.description,
          rating: baseProduct.rating || 0,
          is_available: isAvailable,
          shop_id: shopId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('[syncProductToShop] Error creating shop product:', insertError);
        return { success: false, error: insertError.message };
      }

      console.log('[syncProductToShop] Created shop-specific product:', {
        productId: newProductId,
        name: baseProduct.name,
        shopId,
        isAvailable,
        pricePerKg,
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in syncProductToShop:', error);
    return { success: false, error: error.message || 'Failed to sync product' };
  }
};

