/**
 * Test/Debug Controller for Shops
 * Helps diagnose why vendor shops aren't appearing
 */

import { supabase } from '../config/database.js';

/**
 * Get all shops with detailed info (for debugging)
 * GET /api/test/shops
 */
export const getAllShopsDebug = async (req, res, next) => {
  try {
    // Get all shops (including inactive)
    const { data: allShops, error: allError } = await supabase
      .from('shops')
      .select('*')
      .order('created_at', { ascending: false });

    if (allError) {
      throw allError;
    }

    // Get active shops only
    const { data: activeShops, error: activeError } = await supabase
      .from('shops')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (activeError) {
      throw activeError;
    }

    // Get shops with vendor_id
    const { data: vendorShops, error: vendorError } = await supabase
      .from('shops')
      .select('*')
      .not('vendor_id', 'is', null)
      .order('created_at', { ascending: false });

    if (vendorError) {
      throw vendorError;
    }

    // Get vendors
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('id, shop_name, email, is_active, is_approved, created_at')
      .order('created_at', { ascending: false });

    if (vendorsError) {
      throw vendorsError;
    }

    res.json({
      success: true,
      debug: {
        total_shops: allShops?.length || 0,
        active_shops: activeShops?.length || 0,
        vendor_shops: vendorShops?.length || 0,
        total_vendors: vendors?.length || 0,
        shops: allShops?.map(shop => ({
          id: shop.id,
          name: shop.name,
          is_active: shop.is_active,
          vendor_id: shop.vendor_id,
          has_vendor_id: !!shop.vendor_id,
          created_at: shop.created_at,
        })) || [],
        vendors: vendors || [],
      },
    });
  } catch (error) {
    next(error);
  }
};
