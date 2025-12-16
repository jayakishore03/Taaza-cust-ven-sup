# Vendors Table Setup Guide

## Overview
A separate `vendors` table has been created in Supabase to store all vendor registration details. This provides better data organization and allows vendors to have multiple shops in the future.

---

## 📊 Database Structure

### Vendors Table
The `vendors` table stores **all registration details** for each vendor:
- Personal information (owner name, contact details)
- Shop details (name, address, location, photos)
- Working hours and timings
- Documents (PAN, FSSAI, Aadhaar, etc.)
- Bank details
- Contract information

### Shops Table
The `shops` table stores shop-specific information and references the vendor:
- Links to vendor via `vendor_id` (references `vendors.id`)
- Shop display information for customer app
- Shop status and availability

---

## 🗄️ Table Relationships

```
auth.users (Supabase Auth)
    ↓
vendors (All registration details)
    ↓
shops (Shop display info, references vendors.id)
```

**Key Relationships:**
- `vendors.user_id` → `auth.users(id)` (One vendor per user account)
- `shops.vendor_id` → `vendors(id)` (One or more shops per vendor)

---

## 🚀 Setup Instructions

### Step 1: Run the Migration

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the migration file: `supabase/migrations/20250118000000_create_vendors_table.sql`
4. Copy the entire SQL content
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration

**OR** if you're using Supabase CLI:
```bash
cd supabase
supabase migration up
```

### Step 2: Verify Migration

After running the migration, verify the tables were created:

```sql
-- Check vendors table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'vendors'
ORDER BY ordinal_position;

-- Check shops table has vendor_id column
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'shops' AND column_name = 'vendor_id';
```

### Step 3: Test Registration

1. Complete a vendor registration in the vendor app
2. Check the `vendors` table:
   ```sql
   SELECT * FROM vendors ORDER BY created_at DESC LIMIT 1;
   ```
3. Check the `shops` table:
   ```sql
   SELECT * FROM shops ORDER BY created_at DESC LIMIT 1;
   ```
4. Verify the relationship:
   ```sql
   SELECT 
     v.id as vendor_id,
     v.owner_name,
     v.shop_name,
     s.id as shop_id,
     s.name as shop_display_name
   FROM vendors v
   LEFT JOIN shops s ON s.vendor_id = v.id
   ORDER BY v.created_at DESC LIMIT 1;
   ```

---

## 📋 Complete Data Flow

### Registration Process

1. **Create Auth Account** → `auth.users`
   - Email, password, phone
   - User metadata (name, role: 'vendor')

2. **Create Vendor Record** → `vendors` table
   - ALL registration details saved here
   - Links to `auth.users` via `user_id`

3. **Create Shop Record** → `shops` table
   - Shop display information
   - Links to `vendors` via `vendor_id`
   - Set `is_active = true` to show in customer app

---

## 🔍 Querying Vendors

### Get All Vendors
```sql
SELECT * FROM vendors 
ORDER BY created_at DESC;
```

### Get Vendor by User ID
```sql
SELECT * FROM vendors 
WHERE user_id = 'user-uuid-here';
```

### Get Vendor with Shop
```sql
SELECT 
  v.*,
  s.id as shop_id,
  s.name as shop_name,
  s.is_active as shop_is_active
FROM vendors v
LEFT JOIN shops s ON s.vendor_id = v.id
WHERE v.user_id = 'user-uuid-here';
```

### Get Pending Approvals
```sql
SELECT * FROM vendors 
WHERE is_verified = false OR is_approved = false
ORDER BY created_at DESC;
```

### Get Approved Vendors
```sql
SELECT * FROM vendors 
WHERE is_verified = true AND is_approved = true
ORDER BY created_at DESC;
```

### Get Vendors by City
```sql
SELECT * FROM vendors 
WHERE city = 'Mumbai' 
AND is_active = true;
```

### Get Vendors by Shop Type
```sql
SELECT * FROM vendors 
WHERE shop_type = 'chicken' 
AND is_active = true;
```

---

## 📊 Vendors Table Schema

```sql
CREATE TABLE vendors (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  
  -- Basic Details
  owner_name TEXT NOT NULL,
  shop_name TEXT NOT NULL,
  shop_plot TEXT,
  floor TEXT,
  building TEXT,
  pincode TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  area TEXT,
  city TEXT,
  store_photos TEXT[],
  shop_type TEXT,
  
  -- Contact
  email TEXT NOT NULL UNIQUE,
  mobile_number TEXT NOT NULL UNIQUE,
  whatsapp_number TEXT,
  
  -- Working Hours
  working_days TEXT[],
  same_time BOOLEAN,
  common_open_time TEXT,
  common_close_time TEXT,
  day_times JSONB,
  
  -- Documents
  pan_document TEXT,
  gst_document TEXT,
  fssai_document TEXT,
  shop_license_document TEXT,
  aadhaar_document TEXT,
  
  -- Bank Details
  ifsc_code TEXT,
  account_number TEXT,
  account_holder_name TEXT,
  bank_name TEXT,
  bank_branch TEXT,
  account_type TEXT,
  
  -- Contract
  contract_accepted BOOLEAN,
  profit_share INTEGER,
  signature TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔄 Registration Flow (Updated)

```
Step 1: Create Auth Account
  ↓
Step 2: Create Vendor Record (vendors table)
  - Saves ALL registration details
  - Links to auth.users via user_id
  ↓
Step 3: Create Shop Record (shops table)
  - Saves shop display info
  - Links to vendors via vendor_id
  ↓
Success: Vendor and Shop created
```

---

## ✅ Benefits of Separate Vendors Table

1. **Data Organization**: All vendor registration data in one place
2. **Scalability**: Vendors can have multiple shops in the future
3. **Admin Management**: Easy to query and manage vendors
4. **Verification Workflow**: Separate verification/approval status
5. **Data Integrity**: Clear separation between vendor profile and shop display

---

## 🔐 Security Considerations

### Row Level Security (RLS)

Consider adding RLS policies:

```sql
-- Vendors can view their own data
CREATE POLICY "Vendors can view own data"
ON vendors FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all vendors
CREATE POLICY "Admins can view all vendors"
ON vendors FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);
```

---

## 📝 Important Notes

1. **Vendor ID vs User ID**:
   - `vendors.user_id` = `auth.users(id)` (authentication)
   - `shops.vendor_id` = `vendors(id)` (vendor profile)

2. **Data Duplication**:
   - Some data exists in both `vendors` and `shops` tables
   - `vendors` = Complete registration data
   - `shops` = Display data for customer app

3. **Status Fields**:
   - `is_active`: Vendor account is active
   - `is_verified`: Documents verified by admin
   - `is_approved`: Vendor approved to operate

4. **Future Enhancements**:
   - One vendor can have multiple shops
   - Vendor profile management
   - Document re-verification
   - Vendor analytics

---

## 🧪 Testing Queries

### Test Complete Registration Data
```sql
-- Get vendor with all details
SELECT 
  v.id,
  v.owner_name,
  v.shop_name,
  v.email,
  v.mobile_number,
  v.city,
  v.shop_type,
  v.is_active,
  v.is_verified,
  v.is_approved,
  -- Count documents
  CASE WHEN v.pan_document IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN v.fssai_document IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN v.aadhaar_document IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN v.shop_license_document IS NOT NULL THEN 1 ELSE 0 END as documents_count,
  -- Shop info
  s.id as shop_id,
  s.name as shop_display_name,
  s.is_active as shop_is_active
FROM vendors v
LEFT JOIN shops s ON s.vendor_id = v.id
ORDER BY v.created_at DESC
LIMIT 1;
```

---

## ✅ Checklist

- [ ] Run the migration in Supabase
- [ ] Verify vendors table was created
- [ ] Verify shops.vendor_id column exists
- [ ] Test vendor registration
- [ ] Verify data in vendors table
- [ ] Verify data in shops table
- [ ] Verify relationship between vendors and shops
- [ ] Test queries
- [ ] Set up RLS policies (if needed)

---

## 🎉 Success!

Once the migration is complete, all vendor registration details will be saved to the `vendors` table, and shops will reference vendors via `vendor_id`. This provides better data organization and scalability for future features!

