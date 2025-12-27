# Database Tables Explanation - Taza App

This document explains all the database tables in the Taza meat delivery application and what data they contain.

---

## 📊 Table Overview

### **1. VENDORS Table** 
**Purpose:** Stores complete vendor registration details and profile information

**Contains:**
- **Account Link:**
  - `id` (UUID) - Primary key
  - `user_id` (UUID) - Links to Supabase Auth account

- **Step 1: Basic Details:**
  - `owner_name` - Shop owner's full name
  - `shop_name` - Shop/store name
  - `shop_plot` - Shop/Plot number
  - `floor` - Floor number (optional)
  - `building` - Building/Complex name
  - `pincode` - Postal code
  - `latitude` / `longitude` - GPS coordinates
  - `area` - Area name
  - `city` - City name
  - `store_photos` (TEXT[]) - Array of store photo URLs
  - `shop_type` - Type: 'chicken', 'mutton', 'pork', 'meat', 'multi'

- **Step 2: Contact Details:**
  - `email` - Vendor email (unique)
  - `mobile_number` - Primary contact (unique)
  - `whatsapp_number` - WhatsApp contact

- **Step 3: Working Days & Timings:**
  - `working_days` (TEXT[]) - Array of working days
  - `same_time` (BOOLEAN) - If true, use common timings
  - `common_open_time` - Common opening time (HH:MM)
  - `common_close_time` - Common closing time (HH:MM)
  - `day_times` (JSONB) - Day-wise timings

- **Step 4: Documents:**
  - `pan_document` - PAN card image URL
  - `gst_document` - GSTIN document URL
  - `fssai_document` - FSSAI license URL
  - `shop_license_document` - Shop license URL
  - `aadhaar_document` - Aadhaar card URL

- **Step 5: Bank Details:**
  - `ifsc_code` - Bank IFSC code
  - `account_number` - Bank account number
  - `account_holder_name` - Account holder name
  - `bank_name` - Bank name
  - `bank_branch` - Bank branch
  - `account_type` - Account type (Savings/Current)

- **Step 6: Contract:**
  - `contract_accepted` - Terms acceptance
  - `profit_share` - Profit share percentage (default: 20)
  - `signature` - Vendor signature image URL

- **Status:**
  - `is_active` - Whether vendor account is active
  - `is_verified` - Admin verification status
  - `is_approved` - Admin approval status

- **Timestamps:**
  - `created_at` - Creation timestamp
  - `updated_at` - Last update timestamp

---

### **2. SHOPS Table**
**Purpose:** Stores shop display information for customer app (ALL vendor registration data is copied here)

**Contains:**
- **Basic Info:**
  - `id` (TEXT) - Shop identifier (e.g., 'shop-1' or UUID)
  - `name` - Shop name
  - `address` - Full address string
  - `distance` - Calculated distance (dynamic)
  - `image_url` - Shop image URL
  - `contact_phone` - Contact phone (backward compatibility)

- **Location:**
  - `latitude` / `longitude` - GPS coordinates

- **Complete Vendor Registration Data (copied from vendors table):**
  - `owner_name` - Owner name
  - `shop_plot`, `floor`, `building` - Address components
  - `pincode`, `area`, `city` - Location details
  - `store_photos` (TEXT[]) - Store photo array
  - `shop_type` - Shop type
  - `email`, `mobile_number`, `whatsapp_number` - Contact info
  - `working_days`, `same_time`, `common_open_time`, `common_close_time`, `day_times` - Timings
  - `pan_document`, `gst_document`, `fssai_document`, `shop_license_document`, `aadhaar_document` - Documents
  - `ifsc_code`, `account_number`, `account_holder_name`, `bank_name`, `bank_branch`, `account_type` - Bank details
  - `contract_accepted`, `profit_share`, `signature` - Contract info

- **Vendor Link:**
  - `vendor_id` (UUID) - References vendors.id

- **Status:**
  - `is_active` - Whether shop is active (controls visibility in customer app)

- **Timestamps:**
  - `created_at` - Creation timestamp
  - `updated_at` - Last update timestamp

**Note:** This table is the **single source of truth** for customer app. All vendor registration data is automatically copied here when a vendor registers.

---

### **3. USER_PROFILES Table**
**Purpose:** Extends Supabase auth.users with additional user profile information

**Contains:**
- `id` (UUID) - References auth.users(id)
- `name` - User's full name
- `email` - User's email
- `phone` - User's phone number (unique)
- `gender` - Gender: 'Male', 'Female', 'Other'
- `profile_picture` - Profile picture URL
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

---

### **4. ADDRESSES Table**
**Purpose:** Stores user delivery addresses

**Contains:**
- `id` (UUID) - Primary key
- `user_id` (UUID) - References auth.users(id)
- `contact_name` - Contact person name
- `phone` - Contact phone number
- `street` - Street address
- `city` - City name
- `state` - State name
- `postal_code` - Postal/ZIP code
- `landmark` - Nearby landmark (optional)
- `label` - Address label: 'Home', 'Office', 'Other'
- `is_default` - Whether this is the default address
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

---

### **5. PRODUCTS Table**
**Purpose:** Stores meat products available for purchase

**Contains:**
- `id` (TEXT) - Product identifier
- `name` - Product name
- `category` - Category: 'Chicken', 'Mutton', 'Pork', 'Seafood', 'Fish'
- `weight` - Display weight description (e.g., "2 Packs | Serves 2-3")
- `weight_in_kg` - Weight in kilograms (for calculations)
- `price` - Price for the specified weight
- `price_per_kg` - Price per kilogram
- `original_price` - Original price before discount
- `discount_percentage` - Discount percentage (0-100)
- `image_url` - Product image URL
- `description` - Product description
- `rating` - Product rating (0.0-5.0)
- `is_available` - Whether product is available
- `shop_id` (TEXT) - References shops.id
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

---

### **6. ADDONS Table**
**Purpose:** Stores additional items that can be added to orders (spices, marination, etc.)

**Contains:**
- `id` (UUID) - Primary key
- `name` - Addon name (e.g., "Extra Spice Mix", "Marination Pack")
- `price` - Addon price
- `description` - Addon description
- `is_available` - Whether addon is available
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

---

### **7. COUPONS Table**
**Purpose:** Stores discount coupons for orders

**Contains:**
- `id` (UUID) - Primary key
- `code` - Coupon code (unique, e.g., "SAVE10")
- `description` - Coupon description
- `discount_type` - Type: 'fixed' or 'percentage'
- `discount_value` - Discount amount or percentage
- `min_order_amount` - Minimum order amount required
- `max_discount` - Maximum discount cap (for percentage)
- `valid_from` - Coupon validity start date
- `valid_until` - Coupon validity end date
- `usage_limit` - Maximum usage limit
- `used_count` - Current usage count
- `is_active` - Whether coupon is active
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

---

### **8. PAYMENT_METHODS Table**
**Purpose:** Stores user payment methods (cards, UPI, etc.)

**Contains:**
- `id` (UUID) - Primary key
- `user_id` (UUID) - References auth.users(id)
- `type` - Payment type: 'UPI', 'Card', 'Cash', 'Wallet', 'Net Banking'
- `provider` - Provider name (e.g., 'PhonePe', 'Google Pay', 'HDFC Bank')
- `name` - Display name for payment method
- `details` (JSONB) - Payment method details (encrypted in production)
- `card_number` - Last 4 digits of card (for display)
- `card_expiry` - Card expiry date
- `card_cvv` - Card CVV (encrypted)
- `cardholder_name` - Cardholder name
- `account_number` - Bank account number (for bank transfers)
- `ifsc_code` - Bank IFSC code
- `account_holder_name` - Account holder name
- `bank_name` - Bank name
- `is_default` - Whether this is default payment method
- `is_active` - Whether payment method is active
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

---

### **9. ORDERS Table**
**Purpose:** Stores customer orders

**Contains:**
- `id` (UUID) - Primary key
- `user_id` (UUID) - References auth.users(id)
- `order_number` - Unique order number (e.g., '#TAZ1034')
- `parent_order` - For grouped orders
- `shop_id` (TEXT) - References shops.id
- `address_id` (UUID) - References addresses.id
- `subtotal` - Order subtotal
- `delivery_charge` - Delivery charge (₹10 per km)
- `discount` - Discount amount
- `coupon_id` (UUID) - References coupons.id
- `total` - Total order amount
- `status` - Order status: 'Preparing', 'Order Ready', 'Picked Up', 'Out for Delivery', 'Delivered', 'Cancelled'
- `status_note` - Status note/description
- `payment_method_id` (UUID) - References payment_methods.id
- `payment_method_text` - Payment method as text (for display)
- `otp` - 6-digit OTP for delivery verification
- `delivery_eta` - Estimated delivery time
- `delivered_at` - Actual delivery timestamp
- `delivery_agent_name` - Delivery agent name
- `delivery_agent_mobile` - Delivery agent mobile
- `special_instructions` - Customer special instructions
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

---

### **10. ORDER_ITEMS Table**
**Purpose:** Stores items in each order (snapshot of product details at time of order)

**Contains:**
- `id` (UUID) - Primary key
- `order_id` (UUID) - References orders.id
- `product_id` (TEXT) - References products.id
- `addon_id` (UUID) - References addons.id (for addon items)
- `name` - Product/addon name (snapshot at order time)
- `quantity` - Item quantity
- `weight` - Weight description (snapshot)
- `weight_in_kg` - Weight in kg (snapshot)
- `price` - Price at time of order (snapshot)
- `price_per_kg` - Price per kg (snapshot)
- `image_url` - Product image URL
- `created_at` - Creation timestamp

**Note:** Prices and details are stored as snapshots so they don't change if product prices are updated later.

---

### **11. ORDER_TIMELINE Table**
**Purpose:** Stores order status timeline/events

**Contains:**
- `id` (UUID) - Primary key
- `order_id` (UUID) - References orders.id
- `stage` - Order stage: 'Order Placed', 'Order Ready', 'Picked Up', 'Out for Delivery', 'Delivered', 'Order Cancelled'
- `description` - Stage description
- `timestamp` - When this stage occurred
- `is_completed` - Whether this stage is completed
- `created_at` - Creation timestamp

---

### **12. FAVORITES Table**
**Purpose:** Stores user favorite products

**Contains:**
- `id` (UUID) - Primary key
- `user_id` (UUID) - References auth.users(id)
- `product_id` (TEXT) - References products.id
- `created_at` - Creation timestamp
- **Unique constraint:** (user_id, product_id) - One favorite per product per user

---

### **13. USER_ACTIVITY_LOGS Table**
**Purpose:** Logs user activities for analytics and debugging

**Contains:**
- `id` (UUID) - Primary key
- `user_id` (UUID) - References auth.users(id)
- `activity_type` - Type of activity (e.g., 'vendor_registration', 'order_placed')
- `activity_description` - Activity description
- `entity_type` - Related entity type (e.g., 'order', 'product', 'address')
- `entity_id` - ID of related entity
- `metadata` (JSONB) - Additional metadata
- `ip_address` - User IP address
- `user_agent` - User agent string
- `created_at` - Creation timestamp

---

### **14. LOGIN_SESSIONS Table**
**Purpose:** Manages user login sessions and tokens

**Contains:**
- `id` (UUID) - Primary key
- `user_id` (UUID) - References auth.users(id)
- `token` - Session token
- `ip_address` - Login IP address
- `user_agent` - User agent string
- `login_at` - Login timestamp
- `last_activity_at` - Last activity timestamp
- `expires_at` - Session expiration timestamp
- `is_active` - Whether session is active
- `logout_at` - Logout timestamp (if logged out)

---

## 🔗 Table Relationships

```
auth.users (Supabase Auth)
    ↓
├── user_profiles (extends auth.users)
├── addresses (user delivery addresses)
├── payment_methods (user payment methods)
├── orders (user orders)
│   ├── order_items (items in order)
│   └── order_timeline (order status events)
├── favorites (user favorite products)
├── user_activity_logs (user activity logs)
└── login_sessions (user login sessions)

vendors (vendor registration data)
    ↓
└── shops (shop display data, references vendors.id)
    ↓
    └── products (products sold by shop)
```

---

## 📝 Key Points

1. **VENDORS Table:** Stores complete vendor registration details (all 6 steps of registration)

2. **SHOPS Table:** Contains ALL vendor registration data copied from vendors table. This is the **single source of truth** for customer app display.

3. **When a vendor registers:**
   - Data is saved to `vendors` table
   - Same data is automatically copied to `shops` table
   - Shop appears in customer app immediately (if `is_active = true`)

4. **Customer app reads from:** `shops` table only (no need to join with vendors table)

5. **Order data is snapshotted:** Prices and product details in `order_items` are stored as snapshots so they don't change if product prices are updated later.
