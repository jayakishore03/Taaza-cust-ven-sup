# 📱 Taza Project - Complete Flow Documentation

## 🎯 Project Overview

**Taza** is a full-stack meat delivery platform with three main applications:
1. **Customer Mobile App** (React Native/Expo) - For end users to order meat
2. **Vendor Mobile App** (React Native/Expo) - For shop owners to manage orders
3. **Backend API** (Express.js on Vercel) - RESTful API serving both apps
4. **Database** (Supabase PostgreSQL) - Centralized data storage

---

## 🏗️ Architecture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND APPLICATIONS                          │
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────┐              │
│  │  Customer App    │         │   Vendor App      │              │
│  │  (Expo Router)   │         │   (Expo Router)  │              │
│  │                  │         │                  │              │
│  │  - Home          │         │  - Login         │              │
│  │  - Products      │         │  - Registration   │              │
│  │  - Cart          │         │  - Orders        │              │
│  │  - Orders        │         │  - Store         │              │
│  │  - Profile       │         │  - Profile       │              │
│  └──────────────────┘         └──────────────────┘              │
│         │                              │                          │
│         └──────────────┬───────────────┘                          │
│                        │                                          │
│                        │ HTTPS/REST API Calls                     │
│                        │ (Authorization: Bearer Token)            │
└────────────────────────┼──────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND API (Express.js on Vercel)                  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Entry Point: backend/api/index.js (Vercel Serverless)   │   │
│  │  OR backend/src/server.js (Local Development)            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                         │                                         │
│         ┌───────────────┼───────────────┐                        │
│         │               │               │                        │
│    ┌────▼────┐    ┌─────▼─────┐   ┌────▼────┐                  │
│    │ Routes │    │Middleware │   │Controllers│                 │
│    │        │    │           │   │           │                 │
│    │ - auth │    │ - auth    │   │ Business  │                 │
│    │ - products│ │ - error   │   │ Logic     │                 │
│    │ - orders │  │ Handler  │   │           │                 │
│    │ - shops  │  │          │   │           │                 │
│    │ - users  │  │          │   │           │                 │
│    │ - vendor │  │          │   │           │                 │
│    └─────────┘   └──────────┘   └───────────┘                  │
│         │                                                         │
│         │ Supabase Client / PostgreSQL Connection                │
└─────────┼─────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│         DATABASE (Supabase PostgreSQL)                           │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Core Tables:                                             │   │
│  │  - user_profiles (customers & vendors)                   │   │
│  │  - shops (vendor shops)                                  │   │
│  │  - products (meat products)                              │   │
│  │  - orders (customer orders)                              │   │
│  │  - order_items (order line items)                        │   │
│  │  - addresses (delivery addresses)                        │   │
│  │  - coupons (discount codes)                               │   │
│  │  - addons (additional items)                             │   │
│  │  - payment_methods (payment options)                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Storage Buckets:                                         │   │
│  │  - shop-images (shop photos)                             │   │
│  │  - product-images (product photos)                       │   │
│  │  - documents (vendor documents)                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure

### **Root Directory Structure**
```
taaza/
├── app/                          # Customer App (Expo Router)
│   ├── _layout.tsx              # Root layout with providers
│   ├── (tabs)/                  # Tab navigation
│   │   ├── index.tsx           # Home screen
│   │   ├── cart.tsx            # Shopping cart
│   │   ├── orders.tsx          # Order history
│   │   └── profile.tsx          # User profile
│   ├── signin.tsx               # Sign in
│   ├── signup.tsx               # Sign up
│   ├── checkout.tsx             # Checkout flow
│   ├── payment.tsx              # Payment processing
│   └── product-details.tsx      # Product details
│
├── vendor -app/                  # Vendor App (Expo Router)
│   ├── app/
│   │   ├── _layout.tsx          # Root layout
│   │   ├── (auth)/              # Authentication screens
│   │   │   ├── login.tsx        # Vendor login
│   │   │   └── forgot-password.tsx
│   │   ├── (tabs)/              # Tab navigation
│   │   │   ├── index.tsx       # Orders dashboard
│   │   │   ├── store.tsx       # Store management
│   │   │   ├── profile.tsx      # Vendor profile
│   │   │   ├── documents.tsx    # Document management
│   │   │   └── banking.tsx      # Bank details
│   │   └── partner-registration/ # Registration flow
│   │       ├── index.tsx        # Step 1: Contact
│   │       ├── bank.tsx         # Step 2: Bank
│   │       ├── documents.tsx     # Step 3: Documents
│   │       ├── working-days.tsx # Step 4: Working days
│   │       └── contract.tsx      # Step 5: Contract
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx      # Vendor auth state
│   │   └── RegistrationContext.tsx # Registration state
│   │
│   └── services/
│       ├── api.ts               # API client
│       ├── shops.ts             # Shop services
│       └── products.ts          # Product services
│
├── backend/                      # Backend API
│   ├── api/
│   │   └── index.js             # Vercel serverless entry
│   ├── src/
│   │   ├── server.js            # Express server (local dev)
│   │   ├── routes/              # API routes
│   │   │   ├── auth.js          # Authentication
│   │   │   ├── products.js      # Products
│   │   │   ├── orders.js        # Orders
│   │   │   ├── shops.js         # Shops
│   │   │   ├── users.js         # Users
│   │   │   ├── vendor.js        # Vendor operations
│   │   │   ├── payments.js      # Payment processing
│   │   │   └── ...
│   │   ├── controllers/         # Business logic
│   │   │   ├── authController.js
│   │   │   ├── ordersController.js
│   │   │   ├── productsController.js
│   │   │   └── ...
│   │   ├── middleware/          # Express middleware
│   │   │   ├── auth.js          # Token verification
│   │   │   └── errorHandler.js  # Error handling
│   │   ├── config/              # Configuration
│   │   │   ├── database.js      # Supabase client
│   │   │   └── postgres.js      # PostgreSQL connection
│   │   └── services/            # External services
│   │       └── emailService.js  # Email sending
│   └── vercel.json              # Vercel configuration
│
├── contexts/                     # Shared React contexts
│   ├── AuthContext.tsx          # Customer auth
│   ├── CartContext.tsx          # Shopping cart
│   └── ProductsContext.tsx      # Product cache
│
├── lib/                          # Shared utilities
│   ├── api/                      # API clients
│   │   ├── client.ts            # Base API client
│   │   ├── auth.ts              # Auth endpoints
│   │   ├── products.ts          # Product endpoints
│   │   ├── orders.ts            # Order endpoints
│   │   └── ...
│   ├── auth/                     # Auth helpers
│   │   └── helper.ts            # Token management
│   ├── services/                 # Business services
│   │   ├── products.ts          # Product service
│   │   ├── orders.ts            # Order service
│   │   └── ...
│   └── supabase.ts              # Supabase client
│
└── components/                   # Shared components
    ├── SplashVideo.tsx          # App splash screen
    └── RazorpayCheckout.tsx     # Payment component
```

---

## 🔄 Complete Application Flow

### **1. Customer App Flow**

#### **A. App Initialization**
```
App Start
  ↓
SplashVideo Component (plays intro video)
  ↓
Root Layout (_layout.tsx)
  ├── AuthProvider (checks for existing session)
  ├── ProductsProvider (pre-loads all products)
  └── CartProvider (initializes empty cart)
  ↓
Tab Navigation (Home, Cart, Orders, Profile)
```

#### **B. Authentication Flow**
```
User opens app
  ↓
Check AsyncStorage for existing token
  ↓
If token exists:
  ├── Verify token with backend (/api/auth/verify)
  ├── Fetch user profile (/api/users/profile)
  └── Set user in AuthContext
  ↓
If no token or invalid:
  └── Show signin screen
  ↓
User signs in:
  ├── POST /api/auth/signin (phone + password)
  ├── Backend validates credentials
  ├── Returns token (custom JWT or Supabase token)
  └── Store token in AsyncStorage
  ↓
User authenticated → Navigate to home
```

#### **C. Product Browsing Flow**
```
Home Screen loads
  ↓
ProductsContext (already loaded on app start)
  ├── Fetches all products by category
  │   ├── GET /api/products?category=chicken
  │   ├── GET /api/products?category=mutton
  │   ├── GET /api/products?category=pork
  │   └── GET /api/products?category=seafood
  └── Caches products in context state
  ↓
Home screen displays cached products (instant)
  ↓
User can:
  ├── Filter by category
  ├── Search products
  ├── View product details
  └── Add to cart
```

#### **D. Shopping Cart Flow**
```
User adds product to cart
  ↓
CartContext.addToCart(product, quantity)
  ├── Check if product already in cart (same weight)
  ├── If exists: increment quantity
  └── If new: add to cart items
  ↓
Cart screen shows:
  ├── All cart items
  ├── Total price (weight-based calculation)
  └── Proceed to checkout button
  ↓
User clicks checkout
  └── Navigate to checkout screen
```

#### **E. Order Creation Flow**
```
Checkout Screen
  ↓
Step 1: Select Delivery Address
  ├── Fetch user addresses: GET /api/users/addresses
  ├── User selects or adds new address
  └── Set selected address
  ↓
Step 2: Apply Coupon (Optional)
  ├── User enters coupon code
  ├── Validate coupon: GET /api/coupons/:code
  └── Apply discount
  ↓
Step 3: Add Special Instructions (Optional)
  └── User enters instructions
  ↓
Step 4: Choose Payment Method
  ├── Cash on Delivery (COD)
  ├── UPI (Razorpay)
  └── Card (Razorpay)
  ↓
Step 5: Create Order
  ├── POST /api/orders
  │   ├── Backend validates:
  │   │   ├── User authentication
  │   │   ├── Cart items
  │   │   ├── Address
  │   │   └── Payment method
  │   ├── Calculate:
  │   │   ├── Subtotal
  │   │   ├── Delivery charge (based on distance)
  │   │   ├── Discount (if coupon applied)
  │   │   └── Total
  │   ├── Create order in database:
  │   │   ├── Insert into orders table
  │   │   ├── Insert order_items
  │   │   ├── Generate order_number (#TAZ1001)
  │   │   ├── Generate OTP (6 digits)
  │   │   └── Set status: 'pending'
  │   └── If Razorpay:
  │       ├── Create Razorpay order
  │       └── Return payment details
  ↓
If COD:
  └── Order created → Clear cart → Navigate to orders
  ↓
If Razorpay:
  ├── Open RazorpayCheckout component (WebView)
  ├── User completes payment
  ├── Verify payment: POST /api/payments/verify
  ├── Update order payment_status
  └── Order created → Clear cart → Navigate to orders
```

#### **F. Order Tracking Flow**
```
Orders Screen
  ↓
Fetch user orders: GET /api/orders
  ├── Backend queries orders table
  ├── Filters by user_id
  ├── Joins with shops, addresses, order_items
  └── Returns orders with full details
  ↓
Display orders:
  ├── Order number (#TAZ1001)
  ├── Shop name
  ├── Order status (pending → confirmed → preparing → out_for_delivery → delivered)
  ├── Total amount
  ├── Delivery address
  └── OTP (if order is delivered)
  ↓
User clicks order
  └── Navigate to order details
  ↓
Order Details Screen
  ├── Show order timeline
  ├── Show order items
  ├── Show delivery address
  └── Show tracking status
```

---

### **2. Vendor App Flow**

#### **A. Vendor Registration Flow**
```
Vendor opens app
  ↓
Intro screen (if first time)
  ↓
Partner Registration Flow:
  ↓
Step 1: Contact Information
  ├── Name, Email, Phone, Password
  ├── POST /api/vendor/register
  └── Create user_profiles entry
  ↓
Step 2: Bank Details
  ├── Account number, IFSC, Bank name
  └── Save to registration context
  ↓
Step 3: Documents Upload
  ├── Aadhar card
  ├── PAN card
  ├── Shop license
  └── Upload to Supabase Storage (documents bucket)
  ↓
Step 4: Working Days
  ├── Select working days
  └── Select working hours
  ↓
Step 5: Contract Agreement
  ├── Read terms
  └── Accept contract
  ↓
Submit Registration
  ├── POST /api/vendor/register (complete data)
  ├── Backend creates:
  │   ├── Shop entry (status: pending_approval)
  │   ├── Links documents
  │   └── Sets is_verified: false
  └── Wait for admin approval
```

#### **B. Vendor Login Flow**
```
Vendor Login Screen
  ↓
User enters phone + password
  ↓
POST /api/auth/signin
  ├── Backend validates credentials
  ├── Checks if user is vendor (has shop)
  └── Returns token
  ↓
Store token in AsyncStorage
  ↓
Fetch vendor profile: GET /api/vendor/profile
  ├── Returns shop details
  ├── Returns registration status
  └── Returns verification status
  ↓
Navigate to dashboard
```

#### **C. Vendor Orders Management Flow**
```
Orders Dashboard (Home Tab)
  ↓
Fetch vendor orders: GET /api/vendor/orders
  ├── Backend queries orders table
  ├── Filters by shop_id
  ├── Joins with user_profiles, addresses
  └── Returns orders with customer details
  ↓
Display orders:
  ├── Order number
  ├── Customer name & phone
  ├── Order items
  ├── Delivery address
  ├── Order status
  └── Special instructions
  ↓
Vendor updates order status:
  ├── pending → confirmed
  ├── confirmed → preparing
  ├── preparing → out_for_delivery
  └── out_for_delivery → delivered
  ↓
PATCH /api/orders/:id/status
  ├── Backend validates vendor owns shop
  ├── Updates order status
  ├── Adds timeline entry
  └── If delivered: Generate OTP
```

#### **D. Store Management Flow**
```
Store Tab
  ↓
Display shop information:
  ├── Shop name, address, phone
  ├── Shop images
  ├── Shop type
  └── Working hours
  ↓
Manage Products:
  ├── View all products
  ├── Add new product
  │   ├── Product name, category
  │   ├── Weight options & prices
  │   ├── Upload product image
  │   └── POST /api/products (vendor endpoint)
  ├── Edit product
  └── Delete product
  ↓
Update Shop Details:
  ├── Edit shop name, address
  ├── Upload shop images
  └── Update working hours
```

---

### **3. Backend API Flow**

#### **A. Request Flow**
```
Client Request
  ↓
Vercel Serverless Function (api/index.js)
  OR
Express Server (src/server.js - local dev)
  ↓
CORS Middleware (allows cross-origin requests)
  ↓
Helmet Middleware (security headers)
  ↓
Morgan Middleware (request logging)
  ↓
JSON Parser (parse request body)
  ↓
Route Handler (e.g., /api/orders)
  ↓
Authentication Middleware (if required)
  ├── Extract token from Authorization header
  ├── Verify token
  ├── Get user from token
  └── Attach user to request
  ↓
Controller Function
  ├── Validate request data
  ├── Business logic
  ├── Database operations (Supabase)
  └── Return response
  ↓
Error Handler (if error occurs)
  ├── Log error
  ├── Format error response
  └── Return error to client
```

#### **B. Authentication Middleware Flow**
```
Request with Authorization header
  ↓
Extract token: Bearer <token>
  ↓
Decode token (custom JWT or Supabase token)
  ↓
Verify token:
  ├── If custom token: Verify signature
  ├── If Supabase token: Verify with Supabase
  └── Check expiration
  ↓
If valid:
  ├── Get user_id from token
  ├── Fetch user from database
  └── Attach user to req.user
  ↓
If invalid:
  └── Return 401 Unauthorized
```

#### **C. Order Creation Flow (Backend)**
```
POST /api/orders
  ↓
Authentication Middleware
  ├── Verify token
  └── Get user from token
  ↓
ordersController.createOrder()
  ├── Validate request body:
  │   ├── items (array of products)
  │   ├── address_id
  │   ├── shop_id
  │   ├── payment_method
  │   └── special_instructions (optional)
  ├── Calculate:
  │   ├── Subtotal (sum of item prices)
  │   ├── Delivery charge (based on distance)
  │   ├── Discount (if coupon applied)
  │   └── Total
  ├── Generate order_number:
  │   └── #TAZ + (order_count + 1000)
  ├── Generate OTP:
  │   └── 6-digit random number
  ├── Create order in database:
  │   ├── INSERT INTO orders
  │   ├── INSERT INTO order_items (for each item)
  │   └── INSERT INTO order_timeline
  ├── If Razorpay:
  │   ├── Create Razorpay order
  │   └── Return payment details
  └── Return order details
```

---

## 🔐 Authentication System

### **Token Types**
1. **Custom Backend Token**
   - Base64 encoded JSON
   - Contains: user_id, phone, exp (expiration)
   - Valid for 30 days
   - Stored in AsyncStorage

2. **Supabase Auth Token**
   - JWT from Supabase Auth
   - Used for vendor authentication
   - Managed by Supabase

### **Token Flow**
```
Sign In
  ↓
Backend validates credentials
  ↓
Generate/Return token
  ↓
Frontend stores in AsyncStorage
  ↓
All API requests include: Authorization: Bearer <token>
  ↓
Middleware verifies token
  ↓
If valid: Process request
If invalid: Return 401
```

---

## 💳 Payment Flow

### **Cash on Delivery (COD)**
```
User selects COD
  ↓
Create order with payment_method: 'cod'
  ↓
Set payment_status: 'pending'
  ↓
Order created
  ↓
Payment collected on delivery
  ↓
Vendor updates payment_status: 'paid'
```

### **Razorpay Payment**
```
User selects UPI/Card
  ↓
Create order with payment_method: 'razorpay'
  ↓
Backend creates Razorpay order:
  ├── POST to Razorpay API
  ├── Get order_id and amount
  └── Return payment details
  ↓
Frontend opens RazorpayCheckout (WebView)
  ↓
User completes payment in WebView
  ↓
Razorpay redirects to success URL
  ↓
Frontend calls: POST /api/payments/verify
  ├── Backend verifies payment with Razorpay
  ├── Update order payment_status: 'paid'
  └── Return success
  ↓
Order confirmed
```

---

## 🗄️ Database Operations

### **Supabase Client Usage**
```javascript
// Backend uses Supabase client
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Query example
const { data, error } = await supabase
  .from('orders')
  .select('*, shops(*), addresses(*)')
  .eq('user_id', userId);
```

### **Key Database Operations**
1. **User Operations**
   - Create user profile
   - Update profile
   - Manage addresses

2. **Product Operations**
   - Fetch products by category
   - Filter by shop
   - Search products

3. **Order Operations**
   - Create order
   - Fetch user orders
   - Update order status
   - Track order timeline

4. **Shop Operations**
   - Fetch shops
   - Calculate distance
   - Filter by type

---

## 📱 Key Features Implementation

### **1. Product Caching**
- Products pre-loaded on app start
- Cached in ProductsContext
- Instant display on home screen
- Background refresh capability

### **2. Location Services**
- Get user location (expo-location)
- Reverse geocoding (coordinates → address)
- Calculate distance to shops
- Delivery charge based on distance

### **3. Image Handling**
- Local assets (mapped in dummyData.ts)
- Remote URLs (Supabase Storage)
- Fallback to placeholder images
- Image upload for vendors

### **4. Order Tracking**
- Real-time status updates
- Order timeline (JSONB)
- OTP for delivery verification
- Status progression tracking

---

## 🚀 Deployment

### **Backend (Vercel)**
- URL: `https://taaza-customer.vercel.app`
- Entry: `backend/api/index.js`
- Environment variables configured in Vercel dashboard

### **Frontend (Expo)**
- Development: `expo start`
- Production: EAS Build or Expo Build
- API URL configured in `lib/api/client.ts`

### **Database (Supabase)**
- PostgreSQL database
- Storage buckets for images
- Row Level Security (RLS) enabled
- Environment variables in both frontend and backend

---

## 🔄 Data Synchronization

### **Product Updates**
- Products cached on app start
- Manual refresh available
- Real-time updates not implemented (future enhancement)

### **Order Updates**
- Orders fetched on demand
- Status updates require refresh
- Real-time updates not implemented (future enhancement)

---

## 📊 Key Metrics & Status Tracking

### **Order Status Flow**
```
pending → confirmed → preparing → out_for_delivery → delivered
```

### **Vendor Registration Status**
```
pending_approval → approved → verified → active
```

### **Payment Status**
```
pending → paid → failed
```

---

## 🛠️ Development Workflow

### **Local Development**
1. Start backend: `cd backend && npm run dev`
2. Start customer app: `npm start`
3. Start vendor app: `cd vendor -app && npm start`

### **Environment Variables**
- Frontend: `.env` or `app.json` (Expo config)
- Backend: `.env` file
- Vercel: Environment variables in dashboard

---

## 📝 Summary

This is a comprehensive meat delivery platform with:
- ✅ Full customer ordering flow
- ✅ Vendor management system
- ✅ Payment integration (COD + Razorpay)
- ✅ Order tracking
- ✅ Product management
- ✅ Authentication system
- ✅ Image storage
- ✅ Location services

The architecture follows a clean separation of concerns with:
- Frontend apps (React Native/Expo)
- Backend API (Express.js)
- Database (Supabase PostgreSQL)
- Storage (Supabase Storage)

All components communicate via RESTful API with JWT authentication.

