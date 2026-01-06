# 📱 Taza - Complete Project Overview (End-to-End)

## 🎯 Project Summary

**Taza** is a full-stack meat delivery application with:
- **Customer Mobile App** (React Native/Expo)
- **Vendor Mobile App** (React Native/Expo)
- **Backend API** (Express.js on Vercel)
- **Database** (Supabase PostgreSQL)
- **Payment Integration** (Razorpay)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React Native/Expo)             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Customer App │  │ Vendor App  │  │ Super Admin  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND API (Express.js on Vercel)             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Routes: auth, products, orders, shops, users, etc │   │
│  │  Middleware: auth, errorHandler                    │   │
│  │  Controllers: Business logic                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Supabase Client
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         DATABASE (Supabase PostgreSQL)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Tables: users, shops, products, orders, addresses  │   │
│  │  Storage: shop-images, product-images, documents   │   │
│  │  Auth: Supabase Auth + Custom Backend Tokens        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure

### **Frontend (Root Directory)**
```
taaza/
├── app/                    # Expo Router pages
│   ├── _layout.tsx        # Root layout with providers
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx     # Home screen
│   │   ├── cart.tsx      # Shopping cart
│   │   ├── orders.tsx    # Order history
│   │   └── profile.tsx   # User profile
│   ├── signin.tsx        # Sign in screen
│   ├── signup.tsx        # Sign up screen
│   ├── checkout.tsx       # Checkout flow
│   ├── payment.tsx       # Payment processing
│   └── product-details.tsx # Product details
│
├── contexts/              # React Context providers
│   ├── AuthContext.tsx   # Authentication state
│   ├── CartContext.tsx   # Shopping cart state
│   └── ProductsContext.tsx # Products cache
│
├── lib/                   # Utilities and services
│   ├── api/              # API client modules
│   │   ├── client.ts     # Base API client
│   │   ├── auth.ts       # Auth endpoints
│   │   ├── products.ts   # Products endpoints
│   │   ├── orders.ts     # Orders endpoints
│   │   └── ...
│   ├── auth/             # Auth helpers
│   ├── services/         # Business logic services
│   └── supabase.ts       # Supabase client
│
├── components/            # Reusable components
│   ├── SplashVideo.tsx   # App splash screen
│   └── RazorpayCheckout.tsx # Payment component
│
├── data/                  # Type definitions & dummy data
│   └── dummyData.ts      # Interfaces & helpers
│
└── vendor-app/            # Vendor mobile app
    └── (similar structure)
```

### **Backend (backend/ directory)**
```
backend/
├── src/
│   ├── server.js         # Express server entry point
│   ├── routes/           # API route definitions
│   │   ├── auth.js      # Authentication routes
│   │   ├── products.js  # Product routes
│   │   ├── orders.js    # Order routes
│   │   ├── shops.js    # Shop routes
│   │   └── ...
│   ├── controllers/     # Business logic
│   │   ├── authController.js
│   │   ├── productsController.js
│   │   ├── ordersController.js
│   │   └── ...
│   ├── middleware/       # Express middleware
│   │   ├── auth.js      # Authentication middleware
│   │   └── errorHandler.js # Error handling
│   ├── config/          # Configuration
│   │   ├── database.js  # Supabase client setup
│   │   └── postgres.js  # Direct PostgreSQL connection
│   ├── services/        # External services
│   │   └── emailService.js # Email sending
│   └── utils/           # Utility functions
│
├── api/                  # Vercel serverless functions
│   └── index.js         # Serverless entry point
│
└── vercel.json          # Vercel configuration
```

---

## 🔑 Key Features

### **1. Authentication System**
- **Dual Token System:**
  - Custom backend tokens (base64 encoded JSON)
  - Supabase Auth tokens
- **Features:**
  - Phone + Password sign in
  - Email OTP verification
  - Password reset via OTP (WhatsApp)
  - Email-based password reset for vendors
  - Session persistence with AsyncStorage

**Files:**
- `contexts/AuthContext.tsx` - Frontend auth state
- `lib/auth/helper.ts` - Auth helper functions
- `backend/src/controllers/authController.js` - Backend auth logic
- `backend/src/middleware/auth.js` - Token verification

### **2. Product Management**
- **Product Caching:**
  - Pre-fetch all products on app start
  - Instant product loading from cache
  - Background refresh capability
- **Product Filtering:**
  - By category (Chicken, Mutton, Pork, Seafood)
  - By shop type
  - Search functionality
- **Product Details:**
  - Weight-based pricing
  - Multiple weight options
  - Product images (local assets + remote URLs)

**Files:**
- `contexts/ProductsContext.tsx` - Product cache
- `lib/services/products.ts` - Product service
- `backend/src/controllers/productsController.js` - Product API

### **3. Shopping Cart**
- **Features:**
  - Add/remove items
  - Quantity management
  - Weight-based pricing
  - Shop-specific cart (one shop per cart)
  - Cart persistence

**Files:**
- `contexts/CartContext.tsx` - Cart state management
- `app/(tabs)/cart.tsx` - Cart UI

### **4. Order Management**
- **Order Flow:**
  1. Add items to cart
  2. Select delivery address
  3. Apply coupons (optional)
  4. Add special instructions
  5. Choose payment method
  6. Create order
  7. Track order status
- **Order Status:**
  - `pending` → `confirmed` → `preparing` → `out_for_delivery` → `delivered`
- **OTP System:**
  - OTP generated for order delivery
  - Expires after 2 minutes for delivered orders
  - Displayed in orders screen

**Files:**
- `app/checkout.tsx` - Checkout flow
- `app/payment.tsx` - Payment processing
- `app/(tabs)/orders.tsx` - Order history
- `backend/src/controllers/ordersController.js` - Order logic

### **5. Payment Integration**
- **Payment Methods:**
  - Cash on Delivery (COD)
  - UPI (via Razorpay)
  - Card (via Razorpay)
- **Razorpay Integration:**
  - Order creation
  - Payment verification
  - WebView checkout component

**Files:**
- `app/payment.tsx` - Payment UI
- `components/RazorpayCheckout.tsx` - Razorpay component
- `backend/src/controllers/paymentController.js` - Payment API

### **6. Location Services**
- **Features:**
  - Get user location
  - Reverse geocoding (coordinates → address)
  - Calculate distance to shops
  - Show nearby shops
  - Delivery charge calculation based on distance

**Files:**
- `app/(tabs)/index.tsx` - Location fetching
- Uses `expo-location` package

### **7. Shop Management**
- **Shop Types:**
  - Chicken shops
  - Mutton shops
  - Pork shops
  - Seafood shops
  - Multi-category shops
- **Shop Features:**
  - Shop images (Supabase Storage)
  - Distance calculation
  - Shop status (active/inactive)
  - Vendor registration

**Files:**
- `backend/src/controllers/shopsController.js`
- `lib/api/shops.ts`

### **8. User Profile & Addresses**
- **Profile Management:**
  - Name, email, phone
  - Profile picture
  - Gender
- **Address Management:**
  - Multiple delivery addresses
  - Set default address
  - Add/edit/delete addresses
  - Address validation

**Files:**
- `app/(tabs)/profile.tsx` - Profile UI
- `app/delivery-addresses.tsx` - Address management
- `backend/src/controllers/usersController.js`

---

## 🗄️ Database Schema (Supabase)

### **Core Tables**

#### **user_profiles**
- `id` (UUID, references auth.users)
- `name`, `email`, `phone`
- `gender`, `profile_picture`
- `created_at`, `updated_at`

#### **shops**
- `id` (UUID)
- `name`, `address`, `phone`
- `latitude`, `longitude`
- `image_url`, `store_photos[]`
- `shop_type` (chicken, mutton, pork, meat, multi)
- `is_active`, `is_verified`, `is_approved`
- `user_id` (for vendor authentication)

#### **products**
- `id` (UUID)
- `name`, `category`, `description`
- `weight_in_kg`, `price`, `price_per_kg`
- `image_url`
- `shop_id` (references shops)
- `is_available`

#### **addresses**
- `id` (UUID)
- `user_id` (references user_profiles)
- `contact_name`, `street`, `city`, `state`, `postal_code`
- `is_default`
- `latitude`, `longitude`

#### **orders**
- `id` (UUID)
- `order_number` (e.g., #TAZ1001)
- `user_id` (references user_profiles)
- `shop_id` (references shops)
- `address_id` (references addresses)
- `items` (JSONB)
- `subtotal`, `delivery_charge`, `discount`, `total`
- `payment_method`, `payment_status`
- `status` (pending, confirmed, preparing, out_for_delivery, delivered)
- `otp` (for delivery verification)
- `special_instructions`
- `timeline` (JSONB)
- `created_at`, `updated_at`

#### **order_items**
- `id` (UUID)
- `order_id` (references orders)
- `product_id` (references products)
- `quantity`, `weight_in_kg`, `price_per_kg`, `total_price`

#### **coupons**
- `id` (UUID)
- `code`, `description`
- `discount_type` (percentage, fixed)
- `discount_value`
- `min_order_amount`
- `max_discount`
- `valid_from`, `valid_until`
- `is_active`

#### **addons**
- `id` (UUID)
- `name`, `description`, `price`
- `is_available`

---

## 🔌 API Endpoints

### **Authentication** (`/api/auth`)
- `POST /signup` - User registration
- `POST /signin` - User login
- `GET /verify` - Verify token
- `POST /check-phone` - Check if phone exists
- `POST /forgot-password` - Send password reset OTP
- `POST /verify-reset-otp` - Verify reset OTP
- `POST /reset-password` - Reset password

### **Products** (`/api/products`)
- `GET /` - Get all products
- `GET /category/:category` - Get products by category
- `GET /:id` - Get product by ID

### **Orders** (`/api/orders`)
- `GET /` - Get user's orders (requires auth)
- `GET /:id` - Get order by ID (requires auth)
- `POST /` - Create new order (requires auth)
- `PATCH /:id/status` - Update order status (requires auth)

### **Shops** (`/api/shops`)
- `GET /` - Get all shops
- `GET /:id` - Get shop by ID

### **Users** (`/api/users`)
- `GET /profile` - Get user profile (requires auth)
- `PATCH /profile` - Update profile (requires auth)
- `GET /addresses` - Get user addresses (requires auth)
- `POST /addresses` - Add address (requires auth)
- `PATCH /addresses/:id` - Update address (requires auth)
- `DELETE /addresses/:id` - Delete address (requires auth)
- `PATCH /addresses/:id/default` - Set default address (requires auth)

### **Payments** (`/api/payments`)
- `POST /create-order` - Create Razorpay order
- `POST /verify` - Verify payment
- `GET /status/:orderId` - Get payment status

### **Vendor** (`/api/vendor`)
- `POST /register` - Vendor registration
- `GET /profile` - Get vendor profile
- `GET /orders` - Get vendor orders

---

## 🚀 Deployment

### **Backend (Vercel)**
- **URL:** `https://taaza-customer.vercel.app`
- **Entry Point:** `backend/api/index.js`
- **Configuration:** `backend/vercel.json`
- **Environment Variables:**
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NODE_ENV=production`

### **Frontend (Expo)**
- **Development:** `expo start`
- **Build:** `expo build` or EAS Build
- **API URL:** Configured in `lib/api/client.ts`

---

## 🔐 Security Features

1. **Authentication:**
   - JWT tokens (custom + Supabase)
   - Token expiration (30 days)
   - Secure password hashing

2. **Authorization:**
   - Route-level authentication middleware
   - User-specific data access
   - Row Level Security (RLS) in Supabase

3. **API Security:**
   - CORS configuration
   - Helmet security headers
   - Input validation
   - Error handling

---

## 📦 Key Dependencies

### **Frontend**
- `expo` - React Native framework
- `expo-router` - File-based routing
- `@supabase/supabase-js` - Supabase client
- `expo-location` - Location services
- `react-native-webview` - WebView for Razorpay
- `@react-native-async-storage/async-storage` - Local storage

### **Backend**
- `express` - Web framework
- `@supabase/supabase-js` - Supabase client
- `pg` - PostgreSQL client
- `razorpay` - Payment gateway
- `cors` - CORS middleware
- `helmet` - Security headers
- `morgan` - HTTP logging

---

## 🎨 UI/UX Features

1. **Splash Screen:**
   - Video splash on app launch
   - Smooth transition to main app

2. **Navigation:**
   - Tab-based navigation (Home, Cart, Orders, Profile)
   - Stack navigation for detail screens
   - Deep linking support

3. **Error Handling:**
   - Global error handlers
   - User-friendly error messages
   - Network error handling
   - Loading states

4. **Performance:**
   - Product caching for instant loading
   - Image optimization
   - Lazy loading
   - Pull-to-refresh

---

## 🔄 Data Flow

### **Product Loading Flow:**
```
App Start
  ↓
ProductsContext mounts
  ↓
Fetch all products (parallel by category)
  ↓
Cache in ProductsContext state
  ↓
HomeScreen uses cached products (instant)
```

### **Order Creation Flow:**
```
User adds items to cart
  ↓
Goes to checkout
  ↓
Selects address, applies coupon
  ↓
Chooses payment method
  ↓
POST /api/orders (with auth token)
  ↓
Backend creates order in Supabase
  ↓
If Razorpay: Create payment → Verify → Update order
  ↓
Return order details to frontend
  ↓
Clear cart, redirect to orders screen
```

### **Authentication Flow:**
```
User signs in
  ↓
POST /api/auth/signin
  ↓
Backend validates credentials
  ↓
Returns token (custom or Supabase)
  ↓
Frontend stores token in AsyncStorage
  ↓
Token attached to all API requests
  ↓
Middleware validates token on each request
```

---

## 🛠️ Development Setup

### **Frontend:**
```bash
npm install
expo start
```

### **Backend (Local):**
```bash
cd backend
npm install
# Create .env file with Supabase credentials
npm run dev
```

### **Environment Variables:**
- Frontend: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Backend: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PORT`

---

## 📝 Key Implementation Details

1. **Image Handling:**
   - Local assets mapped in `data/dummyData.ts`
   - Remote URLs from Supabase Storage
   - Fallback to placeholder images

2. **Price Calculation:**
   - Weight-based pricing (`price_per_kg * weight_in_kg`)
   - Multiple weight options per product
   - Dynamic pricing display

3. **Delivery Charges:**
   - Calculated based on distance
   - Free delivery for first 3 orders
   - Distance-based pricing tiers

4. **Order Numbering:**
   - Sequential order numbers (#TAZ1001, #TAZ1002, etc.)
   - Generated based on order count

5. **OTP System:**
   - 6-digit OTP for order delivery
   - Expires after 2 minutes for delivered orders
   - Displayed in order details

---

## 🎯 Current Status

✅ **Working Features:**
- User authentication
- Product browsing and search
- Shopping cart
- Order creation and tracking
- Payment integration (COD + Razorpay)
- Location services
- Address management
- Profile management

✅ **Deployment:**
- Backend deployed on Vercel
- Database on Supabase
- All environment variables configured

---

## 📚 Additional Resources

- **Vendor App:** `vendor-app/` directory
- **Super Admin:** `meat super admin/` directory
- **Database Migrations:** `supabase/migrations/`
- **Documentation:** Various `.md` files in root

---

## 🔮 Future Enhancements

- Push notifications
- Real-time order updates
- In-app chat support
- Loyalty program
- Referral system
- Advanced analytics

---

**Last Updated:** December 26, 2024
**Version:** 1.0.0

