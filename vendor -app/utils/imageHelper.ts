/**
 * Image Helper for Vendor App
 * Maps product names to local asset images (same as customer app)
 */

// Static image mapping - all local assets mapped to product names
// Note: These images should be copied to vendor -app/assets/images/Chicken/, Mutton/, PORK/
// All images have been copied from customer app
const LOCAL_IMAGE_MAP: Record<string, any> = {
  // Chicken products
  'Whole Chicken  with Skin': require('../assets/images/Chicken/full chcken.jpg'),
  'Legs With Skin': require('../assets/images/Chicken/chicken legs.jpg'),
  'Legs Without Skin': require('../assets/images/Chicken/chicken skinless legs.webp'),
  'Liver': require('../assets/images/Chicken/chicken-liver.webp'),
  'Chicken Breast Fillet': require('../assets/images/Chicken/Chicken Breast Fillet.jpg'),
  'Chicken Curry Cut - Small Pieces': require('../assets/images/Chicken/Chicken Curry Cut - Small Pieces.webp'),
  'Chicken Curry Cut - Small Pieces (Large Pack)': require('../assets/images/Chicken/Chicken Curry Cut - Small Pieces (Large Pack).webp'),
  'Chicken Breast - Boneless': require('../assets/images/Chicken/Chicken Breast - Boneless.webp'),
  'Chicken Boneless - Mini Bites': require('../assets/images/Chicken/Chicken Boneless - Mini Bites.webp'),
  'Premium Chicken Thigh Boneless': require('../assets/images/Chicken/Premium Chicken Thigh Boneless.webp'),
  'Tender Spring Chicken Curry Cut': require('../assets/images/Chicken/Tender Spring Chicken Curry Cut.webp'),
  'Chicken Drumstick - Pack of 6': require('../assets/images/Chicken/Chicken Drumstick - Pack Of 6.webp'),
  'Chicken Breast Boneless (Large Pack)': require('../assets/images/Chicken/Chicken Breast Boneless (Large Pack).webp'),
  'Chicken Boneless Cubes': require('../assets/images/Chicken/Chicken Boneless Cubes.webp'),
  'Chicken Drumsticks - Pack of 2 (Mini Pack)': require('../assets/images/Chicken/Chicken Drumsticks - Pack of 2 (Mini Pack).webp'),
  'Chicken Mince (Keema)': require('../assets/images/Chicken/Chicken Mince (Keema).webp'),
  'Chicken Mince/Keema - 250g (Mini Pack)': require('../assets/images/Chicken/Chicken Mince (Keema) 250g.webp'),
  'Premium Chicken Leg Curry Cut': require('../assets/images/Chicken/Premium Chicken Leg Curry Cut.webp'),
  'Classic Chicken Soup Bones': require('../assets/images/Chicken/Classic Chicken Soup Bones.webp'),
  'Premium Chicken Tangdi Biryani Cut': require('../assets/images/Chicken/Premium Chicken Tangdi Biryani Cut.webp'),
  'Chicken Curry Cut with Skin - Small Pieces': require('../assets/images/Chicken/Chicken Curry Cut with Skin - Small Pieces.webp'),
  'Chicken Leg With Thigh - Pack of 3': require('../assets/images/Chicken/Chicken Leg With Thigh - Pack of 3.webp'),
  'Classic Chicken Biryani Cut': require('../assets/images/Chicken/Classic Chicken Biryani Cut.png'),
  'Chicken Lollipop - Pack of 10': require('../assets/images/Chicken/Chicken Lollipop - Pack of 10.webp'),
  'Chicken Wings with Skin': require('../assets/images/Chicken/Chicken Wings with Skin.webp'),
  'Chicken Curry Cut - Large Pieces (Large Pack)': require('../assets/images/Chicken/Chicken Curry Cut - Large Pieces (Large Pack).webp'),
  
  // Mutton products
  'Goat Curry Cut': require('../assets/images/Mutton/goat curry cut.webp'),
  'Pure Goat Mince': require('../assets/images/Mutton/pure goat mince.webp'),
  'Mutton Liver (Small Pack)': require('../assets/images/Mutton/mutton liver small pack.webp'),
  'Mutton Liver - Chunks': require('../assets/images/Mutton/mutton liver chunks.jpeg'),
  'Premium Lamb (Mutton) - Curry Cut': require('../assets/images/Mutton/primium lamb mutton curry cut.webp'),
  'Pure Goat Mince (Mini Pack)': require('../assets/images/Mutton/pure goat mince mini pack.jpg'),
  'Mutton Paya': require('../assets/images/Mutton/mutton paya.webp'),
  'Mutton Kidney (Small Pack)': require('../assets/images/Mutton/mutton kidney small pack.webp'),
  'Mutton Soup Bones': require('../assets/images/Mutton/mutton soup bones.jpeg'),
  'Goat Boneless (Mini Pack)': require('../assets/images/Mutton/goat boneless mini pack.jpg'),
  'Goat Chops': require('../assets/images/Mutton/goat chops.jpg'),
  'Mutton Paya/Trotters (Whole)': require('../assets/images/Mutton/mutton paya&trotters whole.jpg'),
  'Mutton Brain (Bheja)': require('../assets/images/Mutton/mutton brain bheja.jpg'),
  'Goat Biryani Cut': require('../assets/images/Mutton/goat biryani cut.jpeg'),
  'Lamb (Mutton) - Mince': require('../assets/images/Mutton/lamb mutton mince.webp'),
  'Mutton Spleen (Thilli/Manneral/Suvarotti)': require('../assets/images/Mutton/mutton spleen (thilli-manneral-suvarotti).webp'),
  'Mutton Kapura - Medium': require('../assets/images/Mutton/mutton kapura - medium.webp'),
  'Mutton Heart': require('../assets/images/Mutton/mutton heart.jpg'),
  'Mutton Kapura - Large': require('../assets/images/Mutton/mutton kapura - large.webp'),
  'Mutton Lungs': require('../assets/images/Mutton/mutton lungs.jpg'),
  'Mutton Head Meat Medium (Thale Mamsa)': require('../assets/images/Mutton/mutton head meat medium(thala mamsam).webp'),
  'Goat Shoulder Curry & Liver Combo': require('../assets/images/Mutton/goat curry cut.webp'),
  'Mutton Boti': require('../assets/images/Mutton/mutton boti.webp'),
  
  // Pork products
  'Fresh Pork Belly': require('../assets/images/PORK/fresh pork belly.webp'),
  'Fresh Pork Curry Cut Boneless': require('../assets/images/PORK/fresh pork curry cut boneless.webp'),
  'Fresh Pork Curry Cut - Boneless': require('../assets/images/PORK/fresh pork curry cut boneless.webp'), // Alias for compatibility
  'Fresh Pork Curry Cut with Bone': require('../assets/images/PORK/Fresh Pork curry cut with bone.webp'),
  'Fresh Pork Keema (Minced)': require('../assets/images/PORK/fresh pork keema minced.webp'),
  'Fresh Pork Red Meat Only Curry Cut': require('../assets/images/PORK/fresh pork red meat only curry cut.webp'),
  'Fresh Pork Red Meat Only - Curry Cut': require('../assets/images/PORK/fresh pork red meat only curry cut.webp'), // Alias for compatibility
  'Fresh Pork Ribs': require('../assets/images/PORK/fresh pork ribs.webp'),
  'Pork Chops': require('../assets/images/PORK/pork chops.webp'),
};

// Helper function to get local image require path
const getLocalImagePath = (productName: string, category?: string): any => {
  // Try exact match first
  const image = LOCAL_IMAGE_MAP[productName];
  if (image) {
    return image;
  }

  // Try partial match (in case product name has slight variations)
  const normalizedName = productName.trim();
  for (const [key, value] of Object.entries(LOCAL_IMAGE_MAP)) {
    if (key.toLowerCase().includes(normalizedName.toLowerCase()) || 
        normalizedName.toLowerCase().includes(key.toLowerCase())) {
      if (__DEV__) {
        console.log(`[getLocalImagePath] Found partial match: "${productName}" -> "${key}"`);
      }
      return value;
    }
  }

  return null;
};

/**
 * Get image source for a product
 * Tries local assets first, then falls back to URLs
 */
export const getImageSource = (
  imageUrl: string | null | undefined,
  productName?: string,
  category?: string
) => {
  // First, try to get local image if product name is provided
  if (productName) {
    const localImage = getLocalImagePath(productName, category);
    if (localImage) {
      if (__DEV__) {
        console.log('[getImageSource] Using local asset for:', productName);
      }
      return localImage;
    }
  }

  // If no image URL provided, try local image by product name, then default
  if (!imageUrl || imageUrl.trim() === '') {
    if (productName) {
      const localImage = getLocalImagePath(productName, category);
      if (localImage) {
        return localImage;
      }
    }
    return require('../assets/images/taaza.png');
  }

  // For Supabase storage URLs (starts with https:// and contains supabase)
  if (imageUrl.startsWith('https://') && imageUrl.includes('supabase')) {
    return { uri: imageUrl };
  }

  // For any HTTP/HTTPS URLs, use uri
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return { uri: imageUrl };
  }

  // For relative paths starting with /images/ (backend served images)
  // Try local asset first if product name is known
  if (imageUrl.startsWith('/images/')) {
    if (productName) {
      const localImage = getLocalImagePath(productName, category);
      if (localImage) {
        if (__DEV__) {
          console.log('[getImageSource] Using local asset instead of URL for:', productName);
        }
        return localImage;
      }
    }
    
    // Fallback to constructing URL from API config
    const { API_CONFIG } = require('../config/api');
    const baseUrl = API_CONFIG.BASE_URL.replace('/api', ''); // Remove /api from base URL
    const fullUrl = `${baseUrl}${imageUrl}`;
    return { uri: fullUrl };
  }

  // For other relative paths, try as URI
  return { uri: imageUrl };
};

