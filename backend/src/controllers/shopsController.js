/**
 * Shops Controller
 */

import { supabase } from '../config/database.js';

/**
 * Shop address mapping (based on coordinates)
 * This mapping is used to return addresses to frontend
 * Addresses are not stored in database, only coordinates are stored
 */
const SHOP_ADDRESSES = {
  'shop-1': 'Benz Circle, Vijayawada, Andhra Pradesh',
  'shop-2': 'Patamata, Vijayawada, Andhra Pradesh - 520010',
  'shop-3': 'Kanaka Durga Varadhi, National Highway 65, Krishna Lanka, Vijayawada, Andhra Pradesh - 520013',
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

/**
 * Format distance for display
 */
function formatDistance(distanceInKm) {
  if (distanceInKm < 1) {
    return `${(distanceInKm * 1000).toFixed(0)} m`;
  }
  return `${distanceInKm.toFixed(2)} km`;
}

/**
 * Build address from vendor details
 */
function buildAddressFromVendor(vendor) {
  if (!vendor) return 'Address not available';
  
  const addressParts = [];
  
  // Add shop plot/building details
  if (vendor.shop_plot) addressParts.push(vendor.shop_plot);
  if (vendor.building) addressParts.push(vendor.building);
  if (vendor.floor) addressParts.push(`Floor ${vendor.floor}`);
  
  // Add area
  if (vendor.area) addressParts.push(vendor.area);
  
  // Add city
  if (vendor.city) addressParts.push(vendor.city);
  
  // Add pincode
  if (vendor.pincode) addressParts.push(vendor.pincode);
  
  return addressParts.length > 0 ? addressParts.join(', ') : 'Address not available';
}

/**
 * Format shop for response
 * NOTE: All vendor registration data is now stored in shops table
 * Vendor parameter is optional and only used for backward compatibility
 */
function formatShop(dbShop, vendor = null, userLat = null, userLon = null) {
  let distance = dbShop.distance || '0 km';
  
  // Calculate distance if user location and shop coordinates are available
  const shopLat = dbShop.latitude ? parseFloat(dbShop.latitude) : null;
  const shopLon = dbShop.longitude ? parseFloat(dbShop.longitude) : null;
  
  if (userLat !== null && userLon !== null && shopLat !== null && shopLon !== null) {
    const distanceInKm = calculateDistance(userLat, userLon, shopLat, shopLon);
    distance = formatDistance(distanceInKm);
  }
  
  // Build address from shop data (all data is in shops table)
  let address = dbShop.address;
  if (!address || address === 'Address not available') {
    // Build from shop table fields if address is not set
    const addressParts = [];
    if (dbShop.shop_plot) addressParts.push(dbShop.shop_plot);
    if (dbShop.building) addressParts.push(dbShop.building);
    if (dbShop.floor) addressParts.push(`Floor ${dbShop.floor}`);
    if (dbShop.area) addressParts.push(dbShop.area);
    if (dbShop.city) addressParts.push(dbShop.city);
    if (dbShop.pincode) addressParts.push(dbShop.pincode);
    
    if (addressParts.length > 0) {
      address = addressParts.join(', ');
    } else {
      address = SHOP_ADDRESSES[dbShop.id] || 'Address not available';
    }
  }
  
  // Use shop name
  const shopName = dbShop.name;
  
  // Get shop image from shop store_photos array or image_url
  let shopImage = dbShop.image_url;
  if (dbShop.store_photos && Array.isArray(dbShop.store_photos) && dbShop.store_photos.length > 0) {
    shopImage = dbShop.store_photos[0];
  }
  
  return {
    id: dbShop.id,
    name: shopName,
    address,
    distance,
    image: shopImage,
    latitude: shopLat,
    longitude: shopLon,
    // Include vendor details from shops table (all registration data is in shops table)
    vendor: {
      ownerName: dbShop.owner_name || null,
      shopName: dbShop.name || null,
      email: dbShop.email || null,
      mobileNumber: dbShop.mobile_number || null,
      whatsappNumber: dbShop.whatsapp_number || null,
      shopType: dbShop.shop_type || null,
      area: dbShop.area || null,
      city: dbShop.city || null,
      pincode: dbShop.pincode || null,
      workingDays: dbShop.working_days || [],
      commonOpenTime: dbShop.common_open_time || null,
      commonCloseTime: dbShop.common_close_time || null,
      storePhotos: dbShop.store_photos || [],
    },
  };
}

/**
 * Get all shops
 * GET /api/shops?lat=latitude&lon=longitude
 */
export const getAllShops = async (req, res, next) => {
  try {
    // Get user location from query parameters (optional)
    const userLat = req.query.lat ? parseFloat(req.query.lat) : null;
    const userLon = req.query.lon ? parseFloat(req.query.lon) : null;

    // Fetch shops - only show approved shops (is_approved = true)
    // All vendor registration data is stored directly in shops table (no vendors table)
    const { data: shopsData, error: shopsError } = await supabase
      .from('shops')
      .select('*')
      .eq('is_active', true)
      .eq('is_approved', true) // Only show approved shops
      .order('created_at', { ascending: false });

    if (shopsError) {
      console.error('[getAllShops] Error fetching shops:', shopsError);
      throw shopsError;
    }

    // Debug: Log shop count
    console.log('[getAllShops] Total approved active shops found:', shopsData?.length || 0);
    if (shopsData && shopsData.length > 0) {
      const userShops = shopsData.filter(s => s.user_id);
      const hardcodedShops = shopsData.filter(s => s.id && (s.id.startsWith('shop-') || s.id === 'shop-1' || s.id === 'shop-2' || s.id === 'shop-3'));
      console.log('[getAllShops] User-registered shops:', userShops.length);
      console.log('[getAllShops] Hardcoded shops:', hardcodedShops.length);
      console.log('[getAllShops] Shop IDs:', shopsData.map(s => ({ id: s.id, name: s.name, user_id: s.user_id })));
    }

    // Format ALL approved active shops with distance calculation
    // IMPORTANT: shops table contains ALL vendor registration data
    // - All shop details come from shops table (no need to join vendors table)
    // - Only shops with is_active=true AND is_approved=true are displayed
    let shops = (shopsData || []).map(shop => {
      return formatShop(shop, null, userLat, userLon); // No vendor join needed
    });

    // Sort by distance if user location is provided
    if (userLat !== null && userLon !== null) {
      shops.sort((a, b) => {
        // Extract numeric distance for sorting
        const getDistanceValue = (distanceStr) => {
          if (!distanceStr) return Infinity;
          if (distanceStr.includes('m')) {
            return parseFloat(distanceStr.replace(' m', '')) / 1000; // Convert meters to km
          }
          if (distanceStr.includes('km')) {
            return parseFloat(distanceStr.replace(' km', ''));
          }
          return parseFloat(distanceStr) || Infinity;
        };
        return getDistanceValue(a.distance) - getDistanceValue(b.distance);
      });
    } else {
      // Default sorting by created_at if no location
      // Note: created_at is not in the formatted shop, so we'll keep original order
    }

    res.json({
      success: true,
      data: shops,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get shop by ID
 * GET /api/shops/:id
 */
/**
 * Get shop by ID
 * GET /api/shops/:id?lat=latitude&lon=longitude
 */
export const getShopById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get user location from query parameters (optional)
    const userLat = req.query.lat ? parseFloat(req.query.lat) : null;
    const userLon = req.query.lon ? parseFloat(req.query.lon) : null;

    // Fetch shop
    const { data: shopData, error: shopError } = await supabase
      .from('shops')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (shopError) {
      if (shopError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: { message: 'Shop not found' },
        });
      }
      throw shopError;
    }

    // All vendor registration data is stored directly in shops table (no vendors table)
    // Only show approved shops
    if (!shopData.is_approved) {
      return res.status(404).json({
        success: false,
        error: { message: 'Shop not found or not approved' },
      });
    }

    res.json({
      success: true,
      data: formatShop(shopData, null, userLat, userLon),
    });
  } catch (error) {
    next(error);
  }
};

