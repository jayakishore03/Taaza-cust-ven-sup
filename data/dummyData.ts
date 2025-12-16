export interface Product {
  id: string;
  name: string;
  category: string;
  weight: string;
  weightInKg: number; // Weight in kilograms
  price: number; // Price for the weight specified in weight field
  pricePerKg: number; // Price per kilogram
  image: string | number; // Local require or image URL
  description: string;
  originalPrice?: number;
  discountPercentage?: number;
}

export interface VendorDetails {
  ownerName?: string;
  shopName?: string;
  email?: string;
  mobileNumber?: string;
  whatsappNumber?: string;
  shopType?: string;
  area?: string;
  city?: string;
  pincode?: string;
  workingDays?: string[];
  commonOpenTime?: string;
  commonCloseTime?: string;
  storePhotos?: string[];
}

export interface Shop {
  id: string;
  name: string;
  address: string;
  distance: string;
  image: string;
  latitude?: number;
  longitude?: number;
  vendor?: VendorDetails | null;
}

export interface OrderItem {
  name: string;
  weight: string;
  quantity: number;
  price: number;
}

export type OrderStatus = 'Delivered' | 'Out for Delivery' | 'Preparing' | 'Cancelled';

export interface OrderTimelineEvent {
  stage: string;
  description: string;
  timestamp: string;
  isCompleted: boolean;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  parentOrder: string;
  placedOn: string;
  total: string;
  status: OrderStatus;
  statusNote: string;
  shopName: string;
  shopAddress: string;
  shopContact: string;
  shopImage?: string;
  paymentMethod: string;
  specialInstructions?: string;
  deliveryEta?: string;
  otp: string;
  deliveredAt?: string; // ISO timestamp when order was delivered
  deliveryAgent?: {
    name: string;
    mobile: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    weight: string;
    weightInKg?: number | null;
    price: string;
    pricePerKg?: string | null;
    image: string | number;
    productId?: string | null;
    addonId?: string | null;
  }>;
  timeline: OrderTimelineEvent[];
}

export interface AddOn {
  id: number;
  name: string;
  price: number;
  selected?: boolean;
}

export interface Address {
  id?: string;
  contactName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  landmark?: string;
  label?: string; // 'Home', 'Office', 'Other', etc.
  isDefault?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  profilePicture?: string | number; // Image URI or require() asset
  address: Address; // Default address
  addresses?: Address[]; // Additional addresses
}

export interface AuthCredentials {
  phone: string;
  password: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

// Helper function to calculate price based on weight in kg
export const calculatePriceByWeight = (product: Product, weightInKg: number): number => {
  return product.pricePerKg * weightInKg;
};

// Helper function to get price per kg display
export const getPricePerKgDisplay = (product: Product): string => {
  return `₹${product.pricePerKg.toFixed(2)}/kg`;
};

// Helper function to get image source
// Static image mapping - all local assets mapped to product names
// This is required because require() with dynamic paths doesn't work in React Native
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
  if (LOCAL_IMAGE_MAP[productName]) {
    return LOCAL_IMAGE_MAP[productName];
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

// Helper to get API base URL for image paths
const getApiBaseUrl = () => {
  // First, check environment variable
  if (process.env.EXPO_PUBLIC_API_URL) {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
    // Remove /api suffix if present
    return apiUrl.replace(/\/api\/?$/, '');
  }
  
  // Check if we're in development or production
  if (__DEV__) {
    // Development: Use local IP or localhost
    return 'http://192.168.0.5:3000'; // Update this to your backend URL
  }
  // Production: Use your production backend URL
  return 'https://taaza-customer.vercel.app';
};

export const getImageSource = (image: Product['image'], productName?: string, category?: string) => {
  // Handle require() statements (local assets)
  if (typeof image === 'number') {
    return image;
  }

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

  // Handle string URLs
  if (typeof image === 'string') {
    // If empty or null, try local image by product name, then default
    if (!image || image.trim() === '') {
      if (productName) {
        const localImage = getLocalImagePath(productName, category);
        if (localImage) {
          return localImage;
        }
      }
      if (__DEV__) {
        console.warn('[getImageSource] Empty image URL, using default');
      }
      return require('../assets/images/icon.png');
    }

    // If it's already a full HTTP/HTTPS URL, use it directly
    if (image.startsWith('http://') || image.startsWith('https://')) {
      if (__DEV__) {
        console.log('[getImageSource] Using full URL:', image);
      }
      return { uri: image };
    }

    // If it's a relative path starting with /images/, try to match to local asset first
    if (image.startsWith('/images/')) {
      // Try local asset first if product name is known
      if (productName) {
        const localImage = getLocalImagePath(productName, category);
        if (localImage) {
          if (__DEV__) {
            console.log('[getImageSource] Using local asset instead of URL for:', productName);
          }
          return localImage;
        }
      }
      
      // Fallback to constructing URL
      const baseUrl = getApiBaseUrl();
      const fullUrl = `${baseUrl}${image}`;
      if (__DEV__) {
        console.log('[getImageSource] Constructed URL from relative path:', {
          original: image,
          baseUrl,
          fullUrl,
        });
      }
      return { uri: fullUrl };
    }

    // For other paths, try as URI (might be Supabase storage path or other format)
    if (__DEV__) {
      console.log('[getImageSource] Using as-is URI:', image);
    }
    return { uri: image };
  }

  // Fallback: try local image by product name
  if (productName) {
    const localImage = getLocalImagePath(productName, category);
    if (localImage) {
      return localImage;
    }
  }

  // Final fallback to default image
  if (__DEV__) {
    console.warn('[getImageSource] Invalid image type, using default');
  }
  return require('../assets/images/icon.png');
};

const defaultDiscounts = [5, 7, 9, 12, 15, 18, 20, 17];

const resolveNumericId = (id: string) => {
  const numeric = parseInt(id.replace(/\D/g, ''), 10);
  return Number.isFinite(numeric) ? numeric : 1;
};

export const getProductPricingDetails = (product: Product) => {
  const numericId = resolveNumericId(product.id);
  const discountPercentage =
    product.discountPercentage ??
    defaultDiscounts[numericId % defaultDiscounts.length];

  const currentPrice = product.price;
  const fallbackOriginal = currentPrice / (1 - discountPercentage / 100);
  const originalPrice =
    product.originalPrice && product.originalPrice > currentPrice
      ? product.originalPrice
      : Number(fallbackOriginal.toFixed(2));

  return {
    currentPrice,
    originalPrice,
    discountPercentage: Math.round(discountPercentage),
  };
};

export const dummyShops: Shop[] = [
  {
    id: 'shop-1',
    name: 'Fresh Farm Meats',
    address: '123 Market Street',
    distance: '0.5 km',
    image: 'https://images.pexels.com/photos/3659865/pexels-photo-3659865.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 'shop-2',
    name: 'City Chicken Center',
    address: '56 Downtown Avenue',
    distance: '1.2 km',
    image: 'https://images.pexels.com/photos/262959/pexels-photo-262959.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 'shop-3',
    name: 'Mutton & More',
    address: '88 Food Lane',
    distance: '2.0 km',
    image: 'https://images.pexels.com/photos/1095550/pexels-photo-1095550.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
];

export const dummyOrderItem: OrderItem = {
  name: 'Chicken Curry Cut - Small Pieces',
  weight: '2 Packs | Serves 2-3',
  quantity: 1,
  price: 220,
};

export const dummyOrders: OrderSummary[] = [
  {
    id: 'order-1034',
    orderNumber: '#TAZ1034',
    parentOrder: 'Parent Order #P-55812',
    placedOn: 'Thu, 12 Dec 2024 • 7:15 PM',
    total: '₹1,280.00',
    status: 'Out for Delivery',
    statusNote: 'Rider is en route to your location.',
    shopName: 'Fresh Farm Meats',
    shopAddress: '123 Market Street, Vijayawada',
    shopContact: '+91 98765 43210',
    paymentMethod: 'UPI • HDFC Bank',
    deliveryEta: 'Arriving by 7:45 PM',
    otp: '452891',
    deliveryAgent: {
      name: 'Rajesh Kumar',
      mobile: '+91 98765 12345',
    },
    items: [
      {
        name: 'Chicken Curry Cut - Small Pieces',
        quantity: 2,
        weight: '500 g each',
        price: '₹320.00',
        image: require('../assets/images/Chicken/Chicken Curry Cut - Small Pieces.webp'),
      },
      {
        name: 'Mutton Mince',
        quantity: 1,
        weight: '450 g',
        price: '₹640.00',
        image: require('../assets/images/Mutton/pure goat mince.webp'),
      },
      {
        name: 'Marination Pack',
        quantity: 1,
        weight: 'Add-on',
        price: '₹120.00',
        image: 'https://images.pexels.com/photos/4393660/pexels-photo-4393660.jpeg?auto=compress&cs=tinysrgb&w=400',
      },
    ],
    timeline: [
      {
        stage: 'Order Placed',
        description: 'We have received your order request.',
        timestamp: '7:15 PM',
        isCompleted: true,
      },
      {
        stage: 'Order Ready',
        description: 'Fresh cuts are packed and ready for pickup.',
        timestamp: '7:25 PM',
        isCompleted: true,
      },
      {
        stage: 'Picked Up',
        description: 'Delivery partner has picked up your order.',
        timestamp: '7:32 PM',
        isCompleted: true,
      },
      {
        stage: 'Out for Delivery',
        description: 'Order is on the way to your doorstep.',
        timestamp: '7:33 PM',
        isCompleted: true,
      },
      {
        stage: 'Delivered',
        description: 'Enjoy your fresh order!',
        timestamp: '—',
        isCompleted: false,
      },
    ],
  },
  {
    id: 'order-1033',
    orderNumber: '#TAZ1033',
    parentOrder: 'Parent Order #P-55811',
    placedOn: 'Tue, 10 Dec 2024 • 8:40 PM',
    total: '₹940.00',
    status: 'Preparing',
    statusNote: 'Butcher is hand-cutting your order.',
    shopName: 'City Chicken Center',
    shopAddress: '56 Downtown Avenue, Vijayawada',
    shopContact: '+91 91234 56780',
    paymentMethod: 'Cash on Delivery',
    deliveryEta: 'Arriving by 9:10 PM',
    otp: '678234',
    items: [
      {
        name: 'Chicken Boneless Cubes',
        quantity: 1,
        weight: '450 g',
        price: '₹520.00',
        image: require('../assets/images/Chicken/Chicken Boneless Cubes.webp'),
      },
      {
        name: 'Marination Pack',
        quantity: 1,
        weight: 'Add-on',
        price: '₹120.00',
        image: 'https://images.pexels.com/photos/4393660/pexels-photo-4393660.jpeg?auto=compress&cs=tinysrgb&w=400',
      },
      {
        name: 'Spring Chicken Curry Cut',
        quantity: 1,
        weight: '800 g',
        price: '₹300.00',
        image: require('../assets/images/Chicken/Tender Spring Chicken Curry Cut.webp'),
      },
    ],
    timeline: [
      {
        stage: 'Order Placed',
        description: 'We have received your order request.',
        timestamp: '8:40 PM',
        isCompleted: true,
      },
      {
        stage: 'Order Ready',
        description: 'Fresh cuts are packed and ready for pickup.',
        timestamp: '—',
        isCompleted: false,
      },
      {
        stage: 'Picked Up',
        description: 'Delivery partner has picked up your order.',
        timestamp: '—',
        isCompleted: false,
      },
      {
        stage: 'Out for Delivery',
        description: 'Order is on the way to your doorstep.',
        timestamp: '—',
        isCompleted: false,
      },
      {
        stage: 'Delivered',
        description: 'Enjoy your fresh order!',
        timestamp: '—',
        isCompleted: false,
      },
    ],
  },
  {
    id: 'order-1029',
    orderNumber: '#TAZ1029',
    parentOrder: 'Parent Order #P-55805',
    placedOn: 'Fri, 06 Dec 2024 • 6:05 PM',
    total: '₹1,560.00',
    status: 'Delivered',
    statusNote: 'Delivered on Fri, 06 Dec 2024 • 7:10 PM',
    shopName: 'Mutton & More',
    shopAddress: '88 Food Lane, Vijayawada',
    shopContact: '+91 99887 66554',
    paymentMethod: 'Debit Card • SBI',
    otp: '891456',
    deliveredAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(), // Delivered 3 minutes ago (OTP already expired)
    deliveryAgent: {
      name: 'Amit Sharma',
      mobile: '+91 91234 56789',
    },
    items: [
      {
        name: 'Goat Curry Cut',
        quantity: 1,
        weight: '1 kg',
        price: '₹1,120.00',
        image: require('../assets/images/Mutton/goat curry cut.webp'),
      },
      {
        name: 'Goat Liver Chunks',
        quantity: 1,
        weight: '250 g',
        price: '₹440.00',
        image: require('../assets/images/Mutton/mutton liver chunks.jpeg'),
      },
    ],
    timeline: [
      {
        stage: 'Order Placed',
        description: 'We have received your order request.',
        timestamp: '6:05 PM',
        isCompleted: true,
      },
      {
        stage: 'Order Ready',
        description: 'Fresh cuts are packed and ready for pickup.',
        timestamp: '6:32 PM',
        isCompleted: true,
      },
      {
        stage: 'Picked Up',
        description: 'Delivery partner has picked up your order.',
        timestamp: '6:40 PM',
        isCompleted: true,
      },
      {
        stage: 'Out for Delivery',
        description: 'Order is on the way to your doorstep.',
        timestamp: '6:42 PM',
        isCompleted: true,
      },
      {
        stage: 'Delivered',
        description: 'Enjoy your fresh order!',
        timestamp: '7:10 PM',
        isCompleted: true,
      },
    ],
  },
  {
    id: 'order-1024',
    orderNumber: '#TAZ1024',
    parentOrder: 'Parent Order #P-55796',
    placedOn: 'Mon, 02 Dec 2024 • 5:25 PM',
    total: '₹720.00',
    status: 'Cancelled',
    statusNote: 'Cancelled on Mon, 02 Dec 2024 • 5:40 PM',
    shopName: 'Fresh Farm Meats',
    shopAddress: '123 Market Street, Vijayawada',
    shopContact: '+91 98765 43210',
    paymentMethod: 'UPI • PhonePe',
    otp: '234567',
    items: [
      {
        name: 'Chicken Drumstick - Pack of 6',
        quantity: 1,
        weight: '600 g',
        price: '₹320.00',
        image: require('../assets/images/Chicken/Chicken Drumstick - Pack Of 6.webp'),
      },
      {
        name: 'Chicken Wings with Skin',
        quantity: 1,
        weight: '500 g',
        price: '₹400.00',
        image: require('../assets/images/Chicken/Chicken Wings with Skin.webp'),
      },
    ],
    timeline: [
      {
        stage: 'Order Placed',
        description: 'We have received your order request.',
        timestamp: '5:25 PM',
        isCompleted: true,
      },
      {
        stage: 'Order Cancelled',
        description: 'Amount will be refunded within 24 hours.',
        timestamp: '5:40 PM',
        isCompleted: true,
      },
    ],
  },
];

export const dummyAddOns: AddOn[] = [
  { id: 1, name: 'Extra Spice Mix', price: 40, selected: false },
  { id: 2, name: 'Marination Pack', price: 80, selected: false },
];

export const dummyCookingInstructions = [
  'Keep refrigerated',
  'Cook within 24 hours',
  'Wash before cooking',
];

export const dummyAddress: Address = {
  id: 'addr-1',
  contactName: 'Sucharita Hatta',
  phone: '9876543210',
  street: '15A, Kolkata',
  city: 'Kolkata',
  state: 'West Bengal',
  postalCode: '700001',
  landmark: '',
  label: 'Home',
  isDefault: true,
};

export const dummyUser: UserProfile = {
  id: 'user-1',
  name: 'Sucharita Hatta',
  email: 'sucharita.hatta@example.com',
  phone: '9876543210',
  address: dummyAddress,
  addresses: [dummyAddress],
};

export const dummyCredentials: AuthCredentials = {
  phone: '9876543210',
  password: 'password123',
};

export const dummyProducts: Product[] = [
  // Chicken Products
  {
    id: '1',
    name: 'Whole Chicken  with Skin',
    category: 'Chicken',
    weight: '1 kg',
    weightInKg: 1.0,
    price: 220.00,
    pricePerKg: 220.00,
    image: require('../assets/images/Chicken/full chcken.jpg'),
    description: 'Our chicken curry cut is a premium cut that is perfect for making delicious curries. The chicken tender cut has exquisite pieces for creating delicious and the juiciest bites.',
  },
  {
    id: '2',
    name: 'Legs With Skin',
    category: 'Chicken',
    weight: '1 kg',
    weightInKg: 1.0,
    price: 432.00,
    pricePerKg: 432.00,
    image: require('../assets/images/Chicken/chicken legs.jpg'),
    description: 'Premium boneless chicken cuts, perfect for grilling, frying, or making your favorite chicken dishes.',
  },
  {
    id: '3',
    name: 'Legs Without Skin',
    category: 'Chicken',
    weight: '500 g',
    weightInKg: 0.5,
    price: 180.00,
    pricePerKg: 360.00,
    image: require('../assets/images/Chicken/chicken skinless legs.webp'),
    description: 'Fresh whole chicken leg, perfect for roasting or grilling. Tender and juicy.',
  },
  {
    id: '4',
    name: 'Liver',
    category: 'Chicken',
    weight: '500 g',
    weightInKg: 0.5,
    price: 250.00,
    pricePerKg: 500.00,
    image: require('../assets/images/Chicken/chicken-liver.webp'),
    description: 'Crispy chicken wings, perfect for appetizers or snacks. Great for parties.',
  },
  {
    id: '5',
    name: 'Chicken Breast Fillet',
    category: 'Chicken',
    weight: '1 kg',
    weightInKg: 1.0,
    price: 380.00,
    pricePerKg: 380.00,
    image: require('../assets/images/Chicken/Chicken Breast Fillet.jpg'),
    description: 'Premium chicken breast fillets, lean and protein-rich. Perfect for healthy meals.',
  },
  {
    id: '6',
    name: 'Chicken Curry Cut - Small Pieces',
    category: 'Chicken',
    weight: '500 g',
    weightInKg: 0.5,
    price: 160.00,
    pricePerKg: 320.00,
    image: require('../assets/images/Chicken/Chicken Curry Cut - Small Pieces.webp'),
    description: 'Juicy bone-in and boneless chicken pieces ideal for flavorful curries.',
  },
  {
    id: '7',
    name: 'Chicken Curry Cut - Small Pieces (Large Pack)',
    category: 'Chicken',
    weight: '1 kg',
    weightInKg: 1.0,
    price: 322.00,
    pricePerKg: 322.00,
    image: require('../assets/images/Chicken/Chicken Curry Cut - Small Pieces (Large Pack).webp'),
    description: 'Family-sized curry cut pack with generous juicy pieces perfect for big meals.',
  },
  {
    id: '8',
    name: 'Chicken Breast - Boneless',
    category: 'Chicken',
    weight: '450 g',
    weightInKg: 0.45,
    price: 274.50,
    pricePerKg: 610.00,
    image: require('../assets/images/Chicken/Chicken Breast - Boneless.webp'),
    description: 'Lean and tender chicken breast portions perfect for grills, salads, and healthy cooking.',
  },
  {
    id: '9',
    name: 'Chicken Boneless - Mini Bites',
    category: 'Chicken',
    weight: '250 g',
    weightInKg: 0.25,
    price: 218.00,
    pricePerKg: 872.00,
    image: require('../assets/images/Chicken/Chicken Boneless - Mini Bites.webp'),
    description: 'Juicy mini-sized boneless chicken bites great for snacks, stir fries, and wraps.',
  },
  {
    id: '10',
    name: 'Premium Chicken Thigh Boneless',
    category: 'Chicken',
    weight: '450 g',
    weightInKg: 0.45,
    price: 304.00,
    pricePerKg: 676.00,
    image: require('../assets/images/Chicken/Premium Chicken Thigh Boneless.webp'),
    description: 'Succulent, meaty boneless chicken thighs perfect for roasting, grilling, or curries.',
  },
  {
    id: '11',
    name: 'Tender Spring Chicken Curry Cut',
    category: 'Chicken',
    weight: '800 g',
    weightInKg: 0.8,
    price: 305.00,
    pricePerKg: 381.00,
    image: require('../assets/images/Chicken/Tender Spring Chicken Curry Cut.webp'),
    description: 'Tender spring chicken pieces carefully cut for wholesome curries and gravies.',
  },
  {
    id: '12',
    name: 'Chicken Drumstick - Pack of 6',
    category: 'Chicken',
    weight: '600 g',
    weightInKg: 0.6,
    price: 273.00,
    pricePerKg: 455.00,
    image: require('../assets/images/Chicken/Chicken Drumstick - Pack Of 6.webp'),
    description: 'Juicy bone-in chicken drumsticks from the leg, great for frying, baking, or grilling.',
  },
  {
    id: '13',
    name: 'Chicken Breast Boneless (Large Pack)',
    category: 'Chicken',
    weight: '900 g',
    weightInKg: 0.9,
    price: 545.00,
    pricePerKg: 606.00,
    image: require('../assets/images/Chicken/Chicken Breast Boneless (Large Pack).webp'),
    description: 'Skinless, boneless chicken breast pieces perfect for meal prep and family feasts.',
  },
  {
    id: '14',
    name: 'Chicken Boneless Cubes',
    category: 'Chicken',
    weight: '450 g',
    weightInKg: 0.45,
    price: 260.00,
    pricePerKg: 578.00,
    image: require('../assets/images/Chicken/Chicken Boneless Cubes.webp'),
    description: 'Boneless chicken cubes made from leg and breast portions for versatile cooking.',
  },
  {
    id: '15',
    name: 'Chicken Drumsticks - Pack of 2 (Mini Pack)',
    category: 'Chicken',
    weight: '200 g',
    weightInKg: 0.2,
    price: 129.00,
    pricePerKg: 645.00,
    image: require('../assets/images/Chicken/Chicken Drumsticks - Pack of 2 (Mini Pack).webp'),
    description: 'Convenient mini pack of drumsticks, ideal for single servings and quick meals.',
  },
  {
    id: '16',
    name: 'Chicken Mince (Keema)',
    category: 'Chicken',
    weight: '450 g',
    weightInKg: 0.45,
    price: 279.00,
    pricePerKg: 620.00,
    image: require('../assets/images/Chicken/Chicken Mince (Keema).webp'),
    description: 'Moist and tender chicken mince for kebabs, keema, momos, and flavorful curries.',
  },
  {
    id: '17',
    name: 'Premium Chicken Leg Curry Cut',
    category: 'Chicken',
    weight: '300 g',
    weightInKg: 0.3,
    price: 206.00,
    pricePerKg: 687.00,
    image: require('../assets/images/Chicken/Premium Chicken Leg Curry Cut.webp'),
    description: 'Juicy bone-in leg pieces trimmed for aromatic curries or biryanis.',
  },
  {
    id: '18',
    name: 'Classic Chicken Soup Bones',
    category: 'Chicken',
    weight: '250 g',
    weightInKg: 0.25,
    price: 99.00,
    pricePerKg: 396.00,
    image: require('../assets/images/Chicken/Classic Chicken Soup Bones.webp'),
    description: 'Cleaned chicken bones specially cut for rich stocks, soups, and broths.',
  },
  {
    id: '19',
    name: 'Premium Chicken Tangdi Biryani Cut',
    category: 'Chicken',
    weight: '500 g',
    weightInKg: 0.5,
    price: 285.00,
    pricePerKg: 570.00,
    image: require('../assets/images/Chicken/Premium Chicken Tangdi Biryani Cut.webp'),
    description: 'Juicy tangdi drumsticks and whole thigh pieces designed especially for biryanis.',
  },
  {
    id: '20',
    name: 'Chicken Curry Cut with Skin - Small Pieces',
    category: 'Chicken',
    weight: '500 g',
    weightInKg: 0.5,
    price: 176.00,
    pricePerKg: 352.00,
    image: require('../assets/images/Chicken/Chicken Curry Cut with Skin - Small Pieces.webp'),
    description: 'Flavor-packed skin-on chicken curry cut offering crispy bites and juicy meat.',
  },
  {
    id: '21',
    name: 'Chicken Leg With Thigh - Pack of 3',
    category: 'Chicken',
    weight: '450 g',
    weightInKg: 0.45,
    price: 266.00,
    pricePerKg: 591.00,
    image: require('../assets/images/Chicken/Chicken Leg With Thigh - Pack of 3.webp'),
    description: 'Large bone-in chicken legs with thigh portions ideal for biryanis and grills.',
  },
  {
    id: '22',
    name: 'Chicken Mince/Keema - 250g (Mini Pack)',
    category: 'Chicken',
    weight: '250 g',
    weightInKg: 0.25,
    price: 180.00,
    pricePerKg: 720.00,
    image: require('../assets/images/Chicken/Chicken Mince (Keema) 250g.webp'),
    description: 'Mini pack of finely ground chicken mince perfect for quick snacks and fillings.',
  },
  {
    id: '23',
    name: 'Classic Chicken Biryani Cut',
    category: 'Chicken',
    weight: '500 g',
    weightInKg: 0.5,
    price: 215.00,
    pricePerKg: 430.00,
    image: require('../assets/images/Chicken/Classic Chicken Biryani Cut.png'),
    description: 'Five juicy biryani-ready chicken pieces that cook evenly for fluffy rice dishes.',
  },
  {
    id: '24',
    name: 'Chicken Lollipop - Pack of 10',
    category: 'Chicken',
    weight: '400 g',
    weightInKg: 0.4,
    price: 189.00,
    pricePerKg: 473.00,
    image: require('../assets/images/Chicken/Chicken Lollipop - Pack of 10.webp'),
    description: 'Meaty chicken lollipops trimmed and frenched for crispy party starters.',
  },
  {
    id: '26',
    name: 'Chicken Wings with Skin',
    category: 'Chicken',
    weight: '450 g',
    weightInKg: 0.45,
    price: 177.00,
    pricePerKg: 393.00,
    image: require('../assets/images/Chicken/Chicken Wings with Skin.webp'),
    description: 'Cut and cleaned chicken wings with skin for crispy frying or saucy tossing.',
  },
  {
    id: '28',
    name: 'Chicken Curry Cut - Large Pieces (Large Pack)',
    category: 'Chicken',
    weight: '1 kg',
    weightInKg: 1.0,
    price: 322.00,
    pricePerKg: 322.00,
    image: require('../assets/images/Chicken/Chicken Curry Cut - Large Pieces (Large Pack).webp'),
    description: 'Bulk pack of large curry cut pieces for family feasts and gatherings.',
  },
  // Mutton Products
  {
    id: '39',
    name: 'Goat Curry Cut',
    category: 'Mutton',
    weight: '500 g',
    weightInKg: 0.5,
    price: 579.00,
    pricePerKg: 1158.00,
    image: require('../assets/images/Mutton/goat curry cut.webp'),
    description: 'Balanced bone-in and boneless goat cuts that deliver rich gravies every time.',
  },
  {
    id: '40',
    name: 'Pure Goat Mince',
    category: 'Mutton',
    weight: '450 g',
    weightInKg: 0.45,
    price: 494.00,
    pricePerKg: 1098.00,
    image: require('../assets/images/Mutton/pure goat mince.webp'),
    description: 'Finely ground goat mince that is ideal for curries, kebabs, samosas, and more.',
  },
  {
    id: '41',
    name: 'Mutton Liver (Small Pack)',
    category: 'Mutton',
    weight: '100 g',
    weightInKg: 0.1,
    price: 159.00,
    pricePerKg: 1590.00,
    image: require('../assets/images/Mutton/mutton liver small pack.webp'),
    description: 'Cut and cleaned mutton liver pieces that cook quickly for pan-fried delicacies.',
  },
  {
    id: '42',
    name: 'Mutton Liver - Chunks',
    category: 'Mutton',
    weight: '250 g',
    weightInKg: 0.25,
    price: 322.00,
    pricePerKg: 1288.00,
    image: require('../assets/images/Mutton/mutton liver chunks.jpeg'),
    description: 'Generous liver chunks, trimmed and cleaned for slow roasting or pan-frying.',
  },
  {
    id: '43',
    name: 'Premium Lamb (Mutton) - Curry Cut',
    category: 'Mutton',
    weight: '500 g',
    weightInKg: 0.5,
    price: 574.00,
    pricePerKg: 1148.00,
    image: require('../assets/images/Mutton/primium lamb mutton curry cut.webp'),
    description: 'Balanced lamb curry cut with the right mix of fat and meat for luxurious gravies.',
  },
  {
    id: '44',
    name: 'Pure Goat Mince (Mini Pack)',
    category: 'Mutton',
    weight: '250 g',
    weightInKg: 0.25,
    price: 289.00,
    pricePerKg: 1156.00,
    image: require('../assets/images/Mutton/pure goat mince mini pack.jpg'),
    description: 'Convenient mini pack of goat mince, perfect for quick weeknight recipes.',
  },
  {
    id: '45',
    name: 'Mutton Paya',
    category: 'Mutton',
    weight: '600 g',
    weightInKg: 0.6,
    price: 275.00,
    pricePerKg: 458.00,
    image: require('../assets/images/Mutton/mutton paya.webp'),
    description: 'Fresh and flavourful lamb trotters that add depth to soups, stews, and curries.',
  },
  {
    id: '46',
    name: 'Mutton Kidney (Small Pack)',
    category: 'Mutton',
    weight: '100 g',
    weightInKg: 0.1,
    price: 151.00,
    pricePerKg: 1510.00,
    image: require('../assets/images/Mutton/mutton kidney small pack.webp'),
    description: 'Neatly halved mutton kidneys ready for pan-fried or grilled delicacies.',
  },
  {
    id: '47',
    name: 'Mutton Soup Bones',
    category: 'Mutton',
    weight: '350 g',
    weightInKg: 0.35,
    price: 359.00,
    pricePerKg: 1026.00,
    image: require('../assets/images/Mutton/mutton soup bones.jpeg'),
    description: 'Cleaned mutton bones that simmer into deeply flavourful stocks and soups.',
  },
  {
    id: '49',
    name: 'Goat Boneless (Mini Pack)',
    category: 'Mutton',
    weight: '250 g',
    weightInKg: 0.25,
    price: 412.00,
    pricePerKg: 1648.00,
    image: require('../assets/images/Mutton/goat boneless mini pack.jpg'),
    description: 'Bite-sized goat boneless cuts, trimmed for pan-frying and quick sautés.',
  },
  {
    id: '50',
    name: 'Goat Chops',
    category: 'Mutton',
    weight: '200 g',
    weightInKg: 0.2,
    price: 285.00,
    pricePerKg: 1425.00,
    image: require('../assets/images/Mutton/goat chops.jpg'),
    description: 'Rich goat rib and T-bone steaks that grill beautifully every single time.',
  },
  {
    id: '51',
    name: 'Mutton Paya/Trotters (Whole)',
    category: 'Mutton',
    weight: '1 kg',
    weightInKg: 1.0,
    price: 505.00,
    pricePerKg: 505.00,
    image: require('../assets/images/Mutton/mutton paya&trotters whole.jpg'),
    description: 'Cleaned front and hind trotters, perfect for collagen-rich soups and gravies.',
  },
  {
    id: '52',
    name: 'Mutton Brain (Bheja)',
    category: 'Mutton',
    weight: '200 g',
    weightInKg: 0.2,
    price: 268.00,
    pricePerKg: 1340.00,
    image: require('../assets/images/Mutton/mutton brain bheja.jpg'),
    description: 'Premium mutton brain cleaned for rich, creamy bheja fry and specialty dishes.',
  },
  {
    id: '53',
    name: 'Goat Biryani Cut',
    category: 'Mutton',
    weight: '500 g',
    weightInKg: 0.5,
    price: 642.00,
    pricePerKg: 1284.00,
    image: require('../assets/images/Mutton/goat biryani cut.jpeg'),
    description: 'Fat-rich goat cuts chosen exclusively for flavour-packed biryanis.',
  },
  {
    id: '54',
    name: 'Lamb (Mutton) - Mince',
    category: 'Mutton',
    weight: '450 g',
    weightInKg: 0.45,
    price: 665.00,
    pricePerKg: 1478.00,
    image: require('../assets/images/Mutton/lamb mutton mince.webp'),
    description: 'Finely ground lamb mince that keeps kebabs, curries, and pies moist.',
  },
  {
    id: '56',
    name: 'Mutton Spleen (Thilli/Manneral/Suvarotti)',
    category: 'Mutton',
    weight: '150 g',
    weightInKg: 0.15,
    price: 249.00,
    pricePerKg: 1660.00,
    image: require('../assets/images/Mutton/mutton spleen (thilli-manneral-suvarotti).webp'),
    description: 'Cleaned whole mutton spleen, ready for traditional pan-fried or grilled recipes.',
  },
  {
    id: '57',
    name: 'Mutton Kapura - Medium',
    category: 'Mutton',
    weight: '250 g',
    weightInKg: 0.25,
    price: 239.00,
    pricePerKg: 956.00,
    image: require('../assets/images/Mutton/mutton kapura - medium.webp'),
    description: 'Cleaned kapura portions, perfect for pan-fried delicacies and grills.',
  },
  {
    id: '58',
    name: 'Mutton Heart',
    category: 'Mutton',
    weight: '200 g',
    weightInKg: 0.2,
    price: 207.00,
    pricePerKg: 1035.00,
    image: require('../assets/images/Mutton/mutton heart.jpg'),
    description: 'Cleaned, rich-flavoured mutton heart pieces ideal for slow cooking or grilling.',
  },
  {
    id: '59',
    name: 'Mutton Kapura - Large',
    category: 'Mutton',
    weight: '250 g',
    weightInKg: 0.25,
    price: 299.00,
    pricePerKg: 1196.00,
    image: require('../assets/images/Mutton/mutton kapura - large.webp'),
    description: 'Large tender kapura portions that stay juicy in pan-fried delicacies.',
  },
  {
    id: '60',
    name: 'Mutton Lungs',
    category: 'Mutton',
    weight: '250 g',
    weightInKg: 0.25,
    price: 98.00,
    pricePerKg: 392.00,
    image: require('../assets/images/Mutton/mutton lungs.jpg'),
    description: 'Light and airy mutton lungs ideal for sautéing, stewing, or spicy fries.',
  },
  {
    id: '61',
    name: 'Mutton Head Meat Medium (Thale Mamsa)',
    category: 'Mutton',
    weight: '1 kg',
    weightInKg: 1.0,
    price: 275.00,
    pricePerKg: 275.00,
    image: require('../assets/images/Mutton/mutton head meat medium(thala mamsam).webp'),
    description: 'Head meat pieces perfect for broths, soups, and traditional slow-cooked meals.',
  },
  {
    id: '62',
    name: 'Goat Shoulder Curry & Liver Combo',
    category: 'Mutton',
    weight: '750 g',
    weightInKg: 0.75,
    price: 1099.00,
    pricePerKg: 1465.00,
    image: require('../assets/images/Mutton/goat curry cut.webp'),
    description: 'Combo saver with 500g goat shoulder curry cut and 250g mutton liver chunks.',
  },
  {
    id: '63',
    name: 'Mutton Boti & Intestine (1 Set)',
    category: 'Mutton',
    weight: '1 kg',
    weightInKg: 1.0,
    price: 350.00,
    pricePerKg: 350.00,
    image: require('../assets/images/Mutton/mutton boti.webp'),
    description: 'Cleaned mutton boti and intestines, great for slow-cooked traditional recipes.',
  },
  // Pork Products
  {
    id: '64',
    name: 'Fresh Pork Belly',
    category: 'Pork',
    weight: '500 g',
    weightInKg: 0.5,
    price: 450.00,
    pricePerKg: 900.00,
    image: require('../assets/images/PORK/fresh pork belly.webp'),
    description: 'Premium pork belly with perfect layers of meat and fat, ideal for roasting, braising, or making crispy pork belly.',
  },
  {
    id: '65',
    name: 'Fresh Pork Curry Cut Boneless',
    category: 'Pork',
    weight: '500 g',
    weightInKg: 0.5,
    price: 380.00,
    pricePerKg: 760.00,
    image: require('../assets/images/PORK/fresh pork curry cut boneless.webp'),
    description: 'Tender boneless pork pieces cut perfectly for curries, stir-fries, and quick cooking dishes.',
  },
  {
    id: '66',
    name: 'Fresh Pork Curry Cut with Bone',
    category: 'Pork',
    weight: '500 g',
    weightInKg: 0.5,
    price: 320.00,
    pricePerKg: 640.00,
    image: require('../assets/images/PORK/Fresh Pork curry cut with bone.webp'),
    description: 'Bone-in pork curry cut pieces that add rich flavor to curries, stews, and traditional dishes.',
  },
  {
    id: '67',
    name: 'Fresh Pork Keema (Minced)',
    category: 'Pork',
    weight: '450 g',
    weightInKg: 0.45,
    price: 340.00,
    pricePerKg: 756.00,
    image: require('../assets/images/PORK/fresh pork keema minced.webp'),
    description: 'Finely minced fresh pork perfect for kebabs, samosas, keema curry, and stuffed dishes.',
  },
  {
    id: '68',
    name: 'Fresh Pork Red Meat Only Curry Cut',
    category: 'Pork',
    weight: '500 g',
    weightInKg: 0.5,
    price: 420.00,
    pricePerKg: 840.00,
    image: require('../assets/images/PORK/fresh pork red meat only curry cut.webp'),
    description: 'Lean pork curry cut with minimal fat, perfect for healthy cooking and protein-rich meals.',
  },
  {
    id: '69',
    name: 'Fresh Pork Ribs',
    category: 'Pork',
    weight: '600 g',
    weightInKg: 0.6,
    price: 480.00,
    pricePerKg: 800.00,
    image: require('../assets/images/PORK/fresh pork ribs.webp'),
    description: 'Meaty pork ribs perfect for grilling, slow-cooking, or making finger-licking BBQ ribs.',
  },
  {
    id: '70',
    name: 'Pork Chops',
    category: 'Pork',
    weight: '400 g',
    weightInKg: 0.4,
    price: 360.00,
    pricePerKg: 900.00,
    image: require('../assets/images/PORK/pork chops.webp'),
    description: 'Thick-cut premium pork chops, tender and juicy, ideal for pan-frying, grilling, or baking.',
  },
];

// Helper function to get products by category
export const getProductsByCategory = (category: string): Product[] => {
  return dummyProducts.filter(product => product.category === category);
};

// Helper function to get product by id
export const getProductById = (id: string): Product | undefined => {
  return dummyProducts.find(product => product.id === id);
};

// App Constants
export const CATEGORIES = ['Chicken', 'Mutton', 'Pork', 'Seafood'] as const;

export const DELIVERY_CHARGE = 40;

export const COUPON_CODES = {
  SAVE10: 40,
  DISCOUNT15: 60,
} as const;

export const WEIGHT_OPTIONS = [0.5, 1.0, 1.5, 2.0] as const;

export const DEFAULT_WEIGHT = 1.0;

export const DEFAULT_QUANTITY = 1; 