/**
 * Product Service
 * Handles all product-related database operations
 */

import { supabase } from '../supabase';
import type { Product } from '../../data/dummyData';

export interface ProductFromDB {
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
}

/**
 * Convert database product to app Product type
 */
export function dbProductToAppProduct(dbProduct: ProductFromDB): Product {
  // Log image URL for debugging
  if (__DEV__ && dbProduct.image_url) {
    console.log('[dbProductToAppProduct] Product image URL:', {
      productName: dbProduct.name,
      imageUrl: dbProduct.image_url,
      imageUrlType: typeof dbProduct.image_url,
    });
  }

  // Ensure price_per_kg and price are valid numbers
  const pricePerKg = typeof dbProduct.price_per_kg === 'number' ? dbProduct.price_per_kg : 0;
  const price = typeof dbProduct.price === 'number' ? dbProduct.price : (pricePerKg * (dbProduct.weight_in_kg || 1));

  if (__DEV__) {
    console.log('[dbProductToAppProduct] Converting product:', {
      name: dbProduct.name,
      price_per_kg: dbProduct.price_per_kg,
      price: dbProduct.price,
      calculatedPrice: price,
      weightInKg: dbProduct.weight_in_kg,
    });
  }

  return {
    id: dbProduct.id,
    name: dbProduct.name,
    category: dbProduct.category,
    weight: dbProduct.weight || '',
    weightInKg: dbProduct.weight_in_kg,
    price: price,
    pricePerKg: pricePerKg,
    image: dbProduct.image_url || '', // Ensure it's always a string, never null/undefined
    description: dbProduct.description,
    originalPrice: dbProduct.original_price || undefined,
    discountPercentage: dbProduct.discount_percentage || undefined,
  };
}

/**
 * Get all products
 */
export async function getAllProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Products] Error fetching all products:', error);
      console.error('[Products] Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw error;
    }

    console.log(`[Products] Found ${data?.length || 0} total available products`);
    return (data || []).map(dbProductToAppProduct);
  } catch (error: any) {
    console.error('[Products] Exception in getAllProducts:', error);
    return [];
  }
}

/**
 * Get products by category
 * Optionally filter by shop_id to show only products from a specific shop
 */
export async function getProductsByCategory(
  category: string, 
  shopId?: string
): Promise<Product[]> {
  try {
    console.log('[Products] Fetching products:', { category, shopId });
    
    // First, check if Supabase client is working
    const testQuery = supabase.from('products').select('count', { count: 'exact', head: true });
    const testResult = await testQuery;
    console.log('[Products] Supabase connection test:', testResult);
    
    let query = supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .eq('is_available', true);

    // Filter by shop_id if provided
    if (shopId) {
      console.log('[Products] Filtering by shop_id:', shopId);
      query = query.eq('shop_id', shopId);
    } else {
      console.log('[Products] No shop_id filter - showing all available products in category');
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('[Products] Error fetching products by category:', error);
      console.error('[Products] Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      
      // If error is about RLS or permissions, try without shop filter
      if (error.code === 'PGRST301' || error.message?.includes('permission') || error.message?.includes('RLS')) {
        console.warn('[Products] Permission error, trying without shop filter...');
        const fallbackQuery = supabase
          .from('products')
          .select('*')
          .eq('category', category)
          .eq('is_available', true)
          .order('created_at', { ascending: false });
        
        const { data: fallbackData, error: fallbackError } = await fallbackQuery;
        if (fallbackError) {
          throw fallbackError;
        }
        return (fallbackData || []).map(dbProductToAppProduct);
      }
      
      throw error;
    }

    console.log(`[Products] Found ${data?.length || 0} products for category: ${category}, shopId: ${shopId || 'all'}`);
    
    if (data && data.length > 0) {
      console.log('[Products] Sample product:', {
        id: data[0].id,
        name: data[0].name,
        shop_id: data[0].shop_id,
        is_available: data[0].is_available,
        category: data[0].category,
        price_per_kg: data[0].price_per_kg,
        price: data[0].price,
      });
      
      // Log all products with their prices for debugging
      if (__DEV__) {
        data.forEach((p: any) => {
          console.log(`[Products] Product: ${p.name} - Price: ₹${p.price} (₹${p.price_per_kg}/kg)`);
        });
      }
    } else if (shopId) {
      // If no products found with shop_id, try without shop filter to see if products exist
      console.warn('[Products] No products found with shop_id filter. Checking products without shop filter...');
      const allCategoryProducts = await supabase
        .from('products')
        .select('*')
        .eq('category', category)
        .eq('is_available', true)
        .order('created_at', { ascending: false });
      
      if (allCategoryProducts.data && allCategoryProducts.data.length > 0) {
        console.log(`[Products] Found ${allCategoryProducts.data.length} products in category without shop filter`);
        console.log('[Products] Sample products shop_ids:', allCategoryProducts.data.slice(0, 3).map(p => ({ name: p.name, shop_id: p.shop_id })));
      }
    }

    return (data || []).map(dbProductToAppProduct);
  } catch (error: any) {
    console.error('[Products] Exception in getProductsByCategory:', error);
    // Return empty array instead of throwing to prevent app crash
    return [];
  }
}

/**
 * Get product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('is_available', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Error fetching product:', error);
    throw error;
  }

  return data ? dbProductToAppProduct(data) : null;
}

/**
 * Get products by shop ID
 */
export async function getProductsByShop(shopId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', shopId)
    .eq('is_available', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products by shop:', error);
    throw error;
  }

  return (data || []).map(dbProductToAppProduct);
}

/**
 * Search products by name
 */
export async function searchProducts(query: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_available', true)
    .ilike('name', `%${query}%`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error searching products:', error);
    throw error;
  }

  return (data || []).map(dbProductToAppProduct);
}

