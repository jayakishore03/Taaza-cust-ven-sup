# 📊 Supabase & Vercel Deployment Status

## 🔗 Supabase Connection

### **Project Details**
- **Supabase URL**: `https://fcrhcwvpivkadkkbxcom.supabase.co`
- **Project ID**: `fcrhcwvpivkadkkbxcom`
- **Status**: ✅ **CONNECTED**

### **Connection Architecture**
```
Frontend (React Native/Expo)
    ↓
Backend API (Express.js on Vercel)
    ↓
Supabase Database (PostgreSQL)
```

### **Environment Variables Required**

**Frontend (.env):**
```env
EXPO_PUBLIC_SUPABASE_URL=https://fcrhcwvpivkadkkbxcom.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Backend (Vercel Environment Variables):**
```env
SUPABASE_URL=https://fcrhcwvpivkadkkbxcom.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
DATABASE_URL=postgresql://postgres.fcrhcwvpivkadkkbxcom:password@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.fcrhcwvpivkadkkbxcom:password@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
```

---

## 📋 Database Tables

### **Core Tables**

#### 1. **shops**
- **Purpose**: Shop/store information for customer app
- **Key Fields**: `id`, `name`, `address`, `latitude`, `longitude`, `image_url`, `is_active`
- **Relationships**: Referenced by `products.shop_id`

#### 2. **products**
- **Purpose**: Meat products available for purchase
- **Key Fields**: `id`, `name`, `category`, `weight_in_kg`, `price`, `price_per_kg`, `image_url`, `shop_id`
- **Categories**: 'Chicken', 'Mutton', 'Pork', 'Seafood', 'Fish'

#### 3. **user_profiles**
- **Purpose**: Extended user profile information
- **Key Fields**: `id` (references `auth.users`), `name`, `email`, `phone`, `gender`, `profile_picture`
- **Relationships**: One-to-one with Supabase Auth users

#### 4. **addresses**
- **Purpose**: User delivery addresses
- **Key Fields**: `id`, `user_id`, `contact_name`, `street`, `city`, `state`, `postal_code`, `is_default`
- **Relationships**: Many-to-one with `user_profiles`

#### 5. **orders**
- **Purpose**: Customer orders
- **Key Fields**: `id`, `user_id`, `order_number`, `shop_id`, `address_id`, `subtotal`, `delivery_charge`, `total`, `status`, `otp`
- **Status Values**: 'Preparing', 'Order Ready', 'Picked Up', 'Out for Delivery', 'Delivered', 'Cancelled'

#### 6. **order_items**
- **Purpose**: Items in each order (snapshot of product details)
- **Key Fields**: `id`, `order_id`, `product_id`, `name`, `quantity`, `weight_in_kg`, `price`, `image_url`
- **Note**: Prices are snapshotted at order time

#### 7. **order_timeline**
- **Purpose**: Order status timeline/events
- **Key Fields**: `id`, `order_id`, `stage`, `description`, `timestamp`, `is_completed`

#### 8. **payment_methods**
- **Purpose**: User saved payment methods
- **Key Fields**: `id`, `user_id`, `type`, `provider`, `name`, `card_number`, `is_default`
- **Types**: 'UPI', 'Card', 'Cash', 'Wallet', 'Net Banking'

#### 9. **coupons**
- **Purpose**: Discount coupons
- **Key Fields**: `id`, `code`, `discount_type`, `discount_value`, `min_order_amount`, `valid_from`, `valid_until`, `usage_limit`, `used_count`

#### 10. **addons**
- **Purpose**: Additional items (spices, marination, etc.)
- **Key Fields**: `id`, `name`, `price`, `description`, `is_available`

#### 11. **favorites**
- **Purpose**: User favorite products
- **Key Fields**: `id`, `user_id`, `product_id`
- **Unique Constraint**: (user_id, product_id)

#### 12. **users** (Custom Auth Table)
- **Purpose**: User accounts (if not using Supabase Auth)
- **Key Fields**: `id`, `name`, `email`, `phone`, `password`, `is_active`, `is_verified`

#### 13. **login_sessions**
- **Purpose**: User login sessions and tokens
- **Key Fields**: `id`, `user_id`, `token`, `ip_address`, `expires_at`, `is_active`

#### 14. **user_activity_logs**
- **Purpose**: User activity tracking
- **Key Fields**: `id`, `user_id`, `activity_type`, `activity_description`, `metadata` (JSONB)

#### 15. **vendors** (Vendor Registration)
- **Purpose**: Complete vendor registration details
- **Key Fields**: All vendor registration data (6 steps: Basic Details, Contact, Timings, Documents, Bank, Contract)

---

## 🪣 Supabase Storage Buckets (S3-like Storage)

### **Required Buckets**

#### 1. **shop-images**
- **Purpose**: Shop/store photos
- **Public**: ✅ Yes
- **File Size Limit**: 5MB
- **Allowed MIME Types**: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`
- **Public URL Format**: `https://fcrhcwvpivkadkkbxcom.supabase.co/storage/v1/object/public/shop-images/{filename}`

#### 2. **shop-documents**
- **Purpose**: Vendor documents (PAN, GST, FSSAI, Aadhaar, Shop License)
- **Public**: ✅ Yes
- **File Size Limit**: 10MB
- **Allowed MIME Types**: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`, `application/pdf`
- **Public URL Format**: `https://fcrhcwvpivkadkkbxcom.supabase.co/storage/v1/object/public/shop-documents/{filename}`

#### 3. **product-images**
- **Purpose**: Product photos
- **Public**: ✅ Yes
- **File Size Limit**: 5MB
- **Allowed MIME Types**: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`
- **Public URL Format**: `https://fcrhcwvpivkadkkbxcom.supabase.co/storage/v1/object/public/product-images/{filename}`

### **Storage Policies**

All buckets have the following policies:
- ✅ **Public Read Access**: Anyone can view images
- ✅ **Authenticated Upload**: Only authenticated users can upload
- ✅ **Authenticated Update**: Users can update their own files
- ✅ **Authenticated Delete**: Users can delete their own files

---

## 🚀 Vercel Deployment

### **Deployment URL**
- **Production**: https://taaza-customer.vercel.app/
- **API Base URL**: https://taaza-customer.vercel.app/api

### **API Endpoints**

#### **Test Endpoint**
- **URL**: `GET /api/test`
- **Purpose**: Check environment variables and connection status
- **Response**: Shows if `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are set

#### **Main Endpoints**
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `GET /api/shops` - Get all shops
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create new order
- `POST /api/auth/signin` - User sign in
- `POST /api/auth/signup` - User sign up
- And more...

### **Vercel Configuration**
- **File**: `backend/vercel.json`
- **Routing**: All requests (`/*`) are routed to `/api/index`

---

## ✅ Verification Checklist

### **Supabase Connection**
- [ ] Check if `SUPABASE_URL` is set in Vercel
- [ ] Check if `SUPABASE_ANON_KEY` is set in Vercel
- [ ] Check if `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel
- [ ] Check if `DATABASE_URL` or `DIRECT_URL` is set in Vercel

### **Database Tables**
- [ ] Verify all 15 tables exist in Supabase
- [ ] Check if tables have data (run seed script if needed)
- [ ] Verify foreign key relationships

### **Storage Buckets**
- [ ] Verify `shop-images` bucket exists and is public
- [ ] Verify `shop-documents` bucket exists and is public
- [ ] Verify `product-images` bucket exists and is public
- [ ] Check storage policies are configured correctly

### **Vercel Deployment**
- [ ] Test API endpoint: `https://taaza-customer.vercel.app/api/test`
- [ ] Test products endpoint: `https://taaza-customer.vercel.app/api/products`
- [ ] Check Vercel logs for any errors

---

## 🔧 How to Check in Supabase Dashboard

### **1. Check Database Tables**
1. Go to: https://supabase.com/dashboard
2. Select project: `fcrhcwvpivkadkkbxcom`
3. Click **"Table Editor"** in left sidebar
4. You should see all 15 tables listed

### **2. Check Storage Buckets**
1. Go to: https://supabase.com/dashboard
2. Select project: `fcrhcwvpivkadkkbxcom`
3. Click **"Storage"** in left sidebar
4. You should see 3 buckets: `shop-images`, `shop-documents`, `product-images`
5. Click on each bucket to verify:
   - ✅ **Public** checkbox is checked
   - ✅ File size limits are set correctly
   - ✅ MIME types are configured

### **3. Check Environment Variables in Vercel**
1. Go to: https://vercel.com/dashboard
2. Select project: `taaza-customer`
3. Go to **Settings** → **Environment Variables**
4. Verify all required variables are set:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL` or `DIRECT_URL`

---

## 📝 SQL Queries to Verify

### **Check Tables**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### **Check Storage Buckets**
```sql
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id IN ('shop-images', 'shop-documents', 'product-images')
ORDER BY id;
```

### **Check Storage Policies**
```sql
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'objects'
  AND (policyname LIKE '%shop%' OR policyname LIKE '%product%')
ORDER BY policyname;
```

### **Check Table Row Counts**
```sql
SELECT 
  'shops' as table_name, COUNT(*) as row_count FROM shops
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'user_profiles', COUNT(*) FROM user_profiles
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'addresses', COUNT(*) FROM addresses;
```

---

## 🐛 Troubleshooting

### **Issue: Tables Not Found**
- **Solution**: Run the migration SQL in Supabase SQL Editor
- **File**: `backend/COMPLETE_MIGRATION.sql`

### **Issue: Storage Buckets Not Found**
- **Solution**: Run the storage bucket migration
- **File**: `supabase/migrations/20250120000002_create_storage_buckets.sql`

### **Issue: "Supabase not configured" Error**
- **Solution**: Check Vercel environment variables are set correctly
- **Test**: Visit `https://taaza-customer.vercel.app/api/test`

### **Issue: Images Not Displaying**
- **Solution**: 
  1. Verify storage buckets are public
  2. Check image URLs in database are using Supabase Storage URLs
  3. Verify storage policies allow public read access

---

## 📞 Quick Links

- **Supabase Dashboard**: https://supabase.com/dashboard/project/fcrhcwvpivkadkkbxcom
- **Vercel Dashboard**: https://vercel.com/dashboard
- **API Test Endpoint**: https://taaza-customer.vercel.app/api/test
- **API Products**: https://taaza-customer.vercel.app/api/products

---

**Last Updated**: Based on current codebase analysis
**Status**: ✅ Supabase Connected | ✅ Tables Defined | ✅ Storage Buckets Configured

