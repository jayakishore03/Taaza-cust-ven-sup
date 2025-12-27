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
 * Get all products from Supabase (all products, not filtered by shop)
 * This shows all available products in the system
 */
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    return (data || []) as Product[];
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
      .order('category', { ascending: true })
      .order('name', { ascending: true });

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
 * Sync product availability and price for a shop
 * This will update the product's shop_id, is_available, and price_per_kg
 */
export const syncProductToShop = async (
  shopId: string,
  productId: string,
  isAvailable: boolean,
  pricePerKg: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Check if product exists
    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    // Calculate price based on weight
    const calculatedPrice = pricePerKg * (product.weight_in_kg || 1);
    
    // Update the product in Supabase
    const updateData = {
      shop_id: shopId,
      is_available: isAvailable,
      price_per_kg: pricePerKg,
      price: calculatedPrice,
      updated_at: new Date().toISOString(),
    };

    console.log('[syncProductToShop] Updating product:', {
      productId,
      productName: product.name,
      shopId,
      isAvailable,
      pricePerKg,
      calculatedPrice,
      weightInKg: product.weight_in_kg,
    });

    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('[syncProductToShop] Error updating product:', error);
      return { success: false, error: error.message };
    }

    console.log('[syncProductToShop] Product updated successfully:', {
      productId: updatedProduct?.id,
      name: updatedProduct?.name,
      price_per_kg: updatedProduct?.price_per_kg,
      price: updatedProduct?.price,
      is_available: updatedProduct?.is_available,
      shop_id: updatedProduct?.shop_id,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error in syncProductToShop:', error);
    return { success: false, error: error.message || 'Failed to sync product' };
  }
};

