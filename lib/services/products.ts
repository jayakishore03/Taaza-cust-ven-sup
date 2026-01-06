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
 * Only returns products where vendor has set a price (price_per_kg > 0)
 */
export async function getAllProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_available', true)
      .not('shop_id', 'is', null) // Only show products that belong to a vendor
      .gt('price_per_kg', 0) // Only show products where vendor has set a price
      .order('updated_at', { ascending: false }); // Recently updated products first

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

    // Filter products to ensure they have shop_id and price_per_kg > 0
    const filteredData = (data || []).filter((p: any) => {
      return p.shop_id !== null && p.shop_id !== undefined && 
             typeof p.price_per_kg === 'number' && p.price_per_kg > 0;
    });
    
    console.log(`[Products] Found ${filteredData.length} total available products with vendor-set prices (filtered from ${data?.length || 0})`);
    return filteredData.map(dbProductToAppProduct);
  } catch (error: any) {
    console.error('[Products] Exception in getAllProducts:', error);
    return [];
  }
}

/**
 * Get products by category
 * Optionally filter by shop_id to show only products from a specific shop
 * Only returns products where vendor has set a price (price_per_kg > 0) if shopId is provided
 * If shopId is not provided, shows all products in the category (even without prices)
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

    // If shopId is provided, filter by shop_id and require price
    if (shopId) {
      console.log('[Products] Filtering by shop_id:', shopId);
      query = query
        .eq('shop_id', shopId)
        .not('shop_id', 'is', null)
        .gt('price_per_kg', 0); // Only show products where vendor has set a price
    } else {
      // If no shopId, show all products in category (for shop type matching)
      // Still prefer products with prices, but include all available products
      console.log('[Products] No shop_id filter - showing all available products in category');
      // Don't require shop_id or price_per_kg > 0 when filtering by shop type
    }

    const { data, error } = await query.order('updated_at', { ascending: false }); // Recently updated products first

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
          .not('shop_id', 'is', null) // Only show products that belong to a vendor
          .gt('price_per_kg', 0) // Still filter for products with prices
          .order('updated_at', { ascending: false }); // Recently updated products first
        
        const { data: fallbackData, error: fallbackError } = await fallbackQuery;
        if (fallbackError) {
          throw fallbackError;
        }
        // Filter fallback data to ensure they have shop_id and price_per_kg > 0
        const filteredFallback = (fallbackData || []).filter((p: any) => {
          return p.shop_id !== null && p.shop_id !== undefined && 
                 typeof p.price_per_kg === 'number' && p.price_per_kg > 0;
        });
        return filteredFallback.map(dbProductToAppProduct);
      }
      
      throw error;
    }

    console.log(`[Products] Found ${data?.length || 0} products for category: ${category}, shopId: ${shopId || 'all'}`);
    
    // Filter products based on whether shopId was provided
    let filteredData = data || [];
    
    if (shopId) {
      // When filtering by shop_id, ensure products have shop_id and price_per_kg > 0
      filteredData = filteredData.filter((p: any) => {
        const hasShopId = p.shop_id !== null && p.shop_id !== undefined;
        const hasValidPrice = typeof p.price_per_kg === 'number' && p.price_per_kg > 0;
        
        if (!hasShopId || !hasValidPrice) {
          console.log(`[Products] Filtering out product "${p.name}": shop_id=${p.shop_id}, price_per_kg=${p.price_per_kg}`);
        }
        
        return hasShopId && hasValidPrice;
      });
      
      if (filteredData.length !== (data?.length || 0)) {
        console.warn(`[Products] Filtered out ${(data?.length || 0) - filteredData.length} products without vendor-set prices. Showing ${filteredData.length} products.`);
      }
    } else {
      // When filtering by shop type (no shopId), show all available products in the category
      // Don't filter by shop_id or price - show all products that match the category
      console.log(`[Products] Showing all ${filteredData.length} products in category "${category}" (shop type filtering)`);
    }
    
    if (shopId && filteredData.length === 0 && data && data.length > 0) {
      console.warn(`[Products] No products found for shop_id "${shopId}". Products exist but belong to different shops or have no prices set.`);
      // Log all products found (regardless of shop_id) for debugging
      data.forEach((p: any) => {
        console.log(`[Products] Available product: "${p.name}" - shop_id: ${p.shop_id}, price_per_kg: ${p.price_per_kg}, category: ${p.category}`);
      });
    }
    
    if (filteredData && filteredData.length > 0) {
      console.log('[Products] Sample product:', {
        id: filteredData[0].id,
        name: filteredData[0].name,
        shop_id: filteredData[0].shop_id,
        is_available: filteredData[0].is_available,
        category: filteredData[0].category,
        price_per_kg: filteredData[0].price_per_kg,
        price: filteredData[0].price,
      });
      
      // Log all products with their prices for debugging
      if (__DEV__) {
        filteredData.forEach((p: any) => {
          console.log(`[Products] Product: ${p.name} - Price: ₹${p.price} (₹${p.price_per_kg}/kg) - Shop: ${p.shop_id}`);
        });
      }
    } else if (shopId) {
      // If no products found with shop_id, check what products exist in this category (for debugging)
      console.warn(`[Products] No products found for shop_id "${shopId}" in category "${category}". Checking products in database...`);
      
      // Check ALL products in this category (even without shop_id or prices)
      const allCategoryProductsCheck = await supabase
        .from('products')
        .select('id, name, category, shop_id, price_per_kg, is_available')
        .eq('category', category)
        .order('updated_at', { ascending: false }); // Recently updated products first
      
      if (allCategoryProductsCheck.data && allCategoryProductsCheck.data.length > 0) {
        console.log(`[Products] Found ${allCategoryProductsCheck.data.length} total products in category "${category}" in database`);
        const withShopAndPrice = allCategoryProductsCheck.data.filter(p => p.shop_id && p.price_per_kg > 0);
        const withShopNoPrice = allCategoryProductsCheck.data.filter(p => p.shop_id && (!p.price_per_kg || p.price_per_kg <= 0));
        const noShop = allCategoryProductsCheck.data.filter(p => !p.shop_id);
        
        console.log(`[Products] - Products with shop_id and price: ${withShopAndPrice.length}`);
        console.log(`[Products] - Products with shop_id but no price: ${withShopNoPrice.length}`);
        console.log(`[Products] - Products without shop_id: ${noShop.length}`);
        
        if (withShopAndPrice.length > 0) {
          const shopIds = [...new Set(withShopAndPrice.map(p => p.shop_id))];
          console.log(`[Products] Shops with priced products in this category: ${shopIds.join(', ')}`);
        }
        
        // Check specifically for this shop_id
        const thisShopProducts = allCategoryProductsCheck.data.filter(p => p.shop_id === shopId);
        if (thisShopProducts.length > 0) {
          console.log(`[Products] Found ${thisShopProducts.length} products for shop_id "${shopId}" but they don't have prices set.`);
          thisShopProducts.forEach(p => {
            console.log(`[Products]   - "${p.name}": price_per_kg=${p.price_per_kg}, is_available=${p.is_available}`);
          });
        } else {
          console.log(`[Products] No products found with shop_id "${shopId}" in category "${category}". Vendor needs to set prices in vendor app.`);
        }
      } else {
        console.warn(`[Products] No products found in category "${category}" in database at all.`);
      }
    }

    return filteredData.map(dbProductToAppProduct);
  } catch (error: any) {
    console.error('[Products] Exception in getProductsByCategory:', error);
    // Return empty array instead of throwing to prevent app crash
    return [];
  }
}

/**
 * Get product by ID
 * Only returns product if vendor has set a price (price_per_kg > 0)
 */
export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('is_available', true)
    .not('shop_id', 'is', null) // Only show products that belong to a vendor
    .gt('price_per_kg', 0) // Only show products where vendor has set a price
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Error fetching product:', error);
    throw error;
  }

  // Ensure product has shop_id and price_per_kg > 0 before returning
  if (data && data.shop_id !== null && data.shop_id !== undefined && 
      typeof data.price_per_kg === 'number' && data.price_per_kg > 0) {
    return dbProductToAppProduct(data);
  }
  return null;
}

/**
 * Get products by shop ID
 * Only returns products where vendor has set a price (price_per_kg > 0) AND is_available = true
 * This ensures only products that vendors have enabled are shown to customers
 */
export async function getProductsByShop(shopId: string): Promise<Product[]> {
  try {
    console.log('[getProductsByShop] Fetching products for shop_id:', shopId);
    
    // First, check if Supabase client is working
    const testQuery = supabase.from('products').select('count', { count: 'exact', head: true });
    const testResult = await testQuery;
    console.log('[getProductsByShop] Supabase connection test:', testResult);
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('shop_id', shopId)
      .eq('is_available', true) // Only show products that vendor has made available
      .gt('price_per_kg', 0) // Only show products where vendor has set a price
      .order('updated_at', { ascending: false }); // Recently updated products first

    if (error) {
      console.error('[getProductsByShop] Error fetching products by shop:', error);
      console.error('[getProductsByShop] Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      
      // Try a more lenient query to see what products exist
      console.log('[getProductsByShop] Trying lenient query to check what products exist...');
      const lenientQuery = await supabase
        .from('products')
        .select('id, name, shop_id, is_available, price_per_kg, category')
        .eq('shop_id', shopId)
        .order('updated_at', { ascending: false });
      
      if (lenientQuery.data && lenientQuery.data.length > 0) {
        console.log(`[getProductsByShop] Found ${lenientQuery.data.length} products for shop_id "${shopId}" (without filters):`);
        lenientQuery.data.forEach((p: any) => {
          console.log(`  - "${p.name}": is_available=${p.is_available}, price_per_kg=${p.price_per_kg}, category=${p.category}`);
        });
        
        const availableWithPrice = lenientQuery.data.filter((p: any) => 
          p.is_available === true && typeof p.price_per_kg === 'number' && p.price_per_kg > 0
        );
        console.log(`[getProductsByShop] Products that meet criteria (is_available=true, price_per_kg>0): ${availableWithPrice.length}`);
        
        if (availableWithPrice.length === 0) {
          const notAvailable = lenientQuery.data.filter((p: any) => p.is_available !== true);
          const noPrice = lenientQuery.data.filter((p: any) => !p.price_per_kg || p.price_per_kg <= 0);
          console.log(`[getProductsByShop] Breakdown: ${notAvailable.length} not available, ${noPrice.length} without price`);
        }
      } else {
        console.log(`[getProductsByShop] No products found for shop_id "${shopId}" at all.`);
        
        // Check if shop_id exists in shops table
        const shopCheck = await supabase
          .from('shops')
          .select('id, name')
          .eq('id', shopId)
          .single();
        
        if (shopCheck.error) {
          console.error('[getProductsByShop] Shop not found:', shopCheck.error);
        } else {
          console.log('[getProductsByShop] Shop exists:', shopCheck.data);
        }
      }
      
      throw error;
    }

    console.log(`[getProductsByShop] Raw query returned ${data?.length || 0} products`);

    // Filter products to ensure they have shop_id, is_available = true, and price_per_kg > 0
    const filteredData = (data || []).filter((p: any) => {
      return p.shop_id !== null && p.shop_id !== undefined && 
             p.is_available === true &&
             typeof p.price_per_kg === 'number' && p.price_per_kg > 0;
    });
    
    console.log(`[getProductsByShop] After filtering: ${filteredData.length} products`);
    
    if (filteredData.length === 0 && data && data.length > 0) {
      console.warn(`[getProductsByShop] Filtered out ${data.length - filteredData.length} products that don't meet criteria`);
    }
    
    const products = filteredData.map(dbProductToAppProduct);
    console.log(`[getProductsByShop] ✅ Returning ${products.length} products`);
    return products;
  } catch (error: any) {
    console.error('[getProductsByShop] Exception:', error);
    // Return empty array instead of throwing to prevent app crash
    return [];
  }
}

/**
 * Search products by name
 * Only returns products where vendor has set a price (price_per_kg > 0)
 */
export async function searchProducts(query: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_available', true)
    .not('shop_id', 'is', null) // Only show products that belong to a vendor
    .gt('price_per_kg', 0) // Only show products where vendor has set a price
    .ilike('name', `%${query}%`)
    .order('updated_at', { ascending: false }); // Recently updated products first

  if (error) {
    console.error('Error searching products:', error);
    throw error;
  }

  // Filter products to ensure they have shop_id and price_per_kg > 0
  const filteredData = (data || []).filter((p: any) => {
    return p.shop_id !== null && p.shop_id !== undefined && 
           typeof p.price_per_kg === 'number' && p.price_per_kg > 0;
  });
  
  return filteredData.map(dbProductToAppProduct);
}

