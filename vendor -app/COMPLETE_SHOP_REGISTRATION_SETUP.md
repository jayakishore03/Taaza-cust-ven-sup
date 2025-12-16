# Complete Shop Registration Setup Guide

## Overview
This guide explains how all vendor registration details are now saved to the Supabase `shops` table, including all documents, bank details, and other information. Shops will be visible in the customer app immediately after registration.

---

## ✅ What Was Done

### 1. Database Migration
Created a migration file that adds all missing columns to the `shops` table:
- **File**: `supabase/migrations/20250117000000_add_complete_shop_registration_fields.sql`

**New Columns Added:**
- Owner details: `owner_name`, `shop_plot`, `floor`, `building`, `pincode`, `area`, `city`
- Shop media: `store_photos` (array), `shop_type`
- Contact: `email`, `mobile_number`, `whatsapp_number`
- Working hours: `working_days`, `same_time`, `common_open_time`, `common_close_time`, `day_times`
- Documents: `pan_document`, `gst_document`, `fssai_document`, `shop_license_document`, `aadhaar_document`
- Bank details: `ifsc_code`, `account_number`, `account_holder_name`, `bank_name`, `bank_branch`, `account_type`
- Contract: `contract_accepted`, `profit_share`, `signature`
- Vendor link: `vendor_id`

### 2. Updated Shop Creation Function
Updated `createShopInSupabase()` in `vendor -app/services/shops.ts` to:
- Save **ALL** registration fields to the shops table
- Include all document image URLs
- Include all bank details
- Set `is_active = true` so shops appear in customer app immediately
- Set `vendor_id` during creation (no separate update needed)
- Construct full address from components
- Use first store photo as `image_url`

### 3. Updated Shop Interface
Updated the `Shop` interface to include all new fields for type safety.

---

## 🚀 Setup Instructions

### Step 1: Run the Migration

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the migration file: `supabase/migrations/20250117000000_add_complete_shop_registration_fields.sql`
4. Copy the entire SQL content
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration

**OR** if you're using Supabase CLI:
```bash
cd supabase
supabase migration up
```

### Step 2: Verify Migration

After running the migration, verify the columns were added:

```sql
-- Check shops table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'shops'
ORDER BY ordinal_position;
```

You should see all the new columns listed.

### Step 3: Test Registration

1. Complete a vendor registration in the vendor app
2. Check the Supabase `shops` table to verify all data was saved:
   ```sql
   SELECT * FROM shops ORDER BY created_at DESC LIMIT 1;
   ```
3. Verify the shop appears in the customer app (should be visible immediately)

---

## 📊 Complete Data Saved

### Step 1: Basic Details ✅
- Owner name
- Shop name
- Shop/Plot number
- Floor (optional)
- Building name
- Pincode
- GPS coordinates (latitude, longitude)
- Area (auto-detected)
- City (auto-detected)
- Store photos (array of image URLs)
- Shop type (chicken/mutton/pork/meat/multi)

### Step 2: Contact Details ✅
- Email address
- Mobile number
- WhatsApp number

### Step 3: Working Days ✅
- Selected working days (array)
- Same time for all days (boolean)
- Common opening/closing times
- Day-wise timings (JSON object)

### Step 4: Documents ✅
- PAN document (image URL)
- GST document (image URL, optional)
- FSSAI document (image URL)
- Shop License document (image URL)
- Aadhaar document (image URL)

### Step 5: Bank Details ✅
- IFSC code
- Account number
- Account holder name
- Bank name
- Bank branch (optional)
- Account type (optional)

### Step 6: Contract ✅
- Contract accepted (boolean)
- Profit share percentage
- Signature (image URL)

### Additional Fields ✅
- Vendor ID (links to auth.users)
- Shop status (is_active = true)
- Created/Updated timestamps

---

## 🎯 Shop Visibility in Customer App

### Current Behavior
- **New shops are set to `is_active = true`** immediately after registration
- Shops appear in customer app right away
- No admin approval needed (can be changed if required)

### To Require Admin Approval
If you want shops to require admin approval before showing:

1. In `vendor -app/services/shops.ts`, change:
   ```typescript
   is_active: true, // Change to false
   ```

2. Create an admin interface to approve shops:
   ```sql
   -- Approve a shop
   UPDATE shops 
   SET is_active = true 
   WHERE id = 'shop-id-here';
   ```

---

## 📝 Data Structure Example

After registration, a shop record in Supabase will look like:

```json
{
  "id": "uuid-here",
  "owner_name": "John Doe",
  "name": "John's Meat Shop",
  "address": "Shop 12, Floor 2, ABC Building, Downtown, Mumbai, 400001",
  "shop_plot": "Shop 12",
  "floor": "2",
  "building": "ABC Building",
  "pincode": "400001",
  "latitude": 19.0760,
  "longitude": 72.8777,
  "area": "Downtown",
  "city": "Mumbai",
  "store_photos": ["https://...", "https://..."],
  "shop_type": "chicken",
  "image_url": "https://...",
  "email": "john@example.com",
  "mobile_number": "+919876543210",
  "whatsapp_number": "+919876543210",
  "working_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  "same_time": true,
  "common_open_time": "09:00",
  "common_close_time": "18:00",
  "day_times": null,
  "pan_document": "https://...",
  "gst_document": "https://...",
  "fssai_document": "https://...",
  "shop_license_document": "https://...",
  "aadhaar_document": "https://...",
  "ifsc_code": "SBIN0001234",
  "account_number": "1234567890",
  "account_holder_name": "John Doe",
  "bank_name": "State Bank of India",
  "bank_branch": "Mumbai Main Branch",
  "account_type": "Savings",
  "contract_accepted": true,
  "profit_share": 20,
  "signature": "https://...",
  "vendor_id": "user-uuid-here",
  "is_active": true,
  "created_at": "2025-01-17T10:00:00Z",
  "updated_at": "2025-01-17T10:00:00Z"
}
```

---

## 🔍 Querying Shops

### Get All Active Shops (Customer App)
```sql
SELECT * FROM shops 
WHERE is_active = true 
ORDER BY created_at DESC;
```

### Get Shop by Vendor
```sql
SELECT * FROM shops 
WHERE vendor_id = 'user-uuid-here';
```

### Get Shops by Type
```sql
SELECT * FROM shops 
WHERE shop_type = 'chicken' 
AND is_active = true;
```

### Get Shops in a City
```sql
SELECT * FROM shops 
WHERE city = 'Mumbai' 
AND is_active = true;
```

### Get Shops with All Details
```sql
SELECT 
  id,
  name,
  owner_name,
  email,
  mobile_number,
  shop_type,
  city,
  is_active,
  created_at,
  -- Documents
  pan_document IS NOT NULL as has_pan,
  fssai_document IS NOT NULL as has_fssai,
  aadhaar_document IS NOT NULL as has_aadhaar,
  -- Bank
  ifsc_code IS NOT NULL as has_bank_details
FROM shops
WHERE is_active = true;
```

---

## 🔐 Security Notes

### Sensitive Data
The shops table now contains sensitive information:
- Bank account numbers
- Personal documents (PAN, Aadhaar)
- Contact information

### Recommendations
1. **Enable Row Level Security (RLS)** on the shops table
2. **Restrict access** to sensitive fields (bank details, documents)
3. **Use Supabase Storage** for document images instead of external URLs
4. **Encrypt sensitive fields** if required by regulations

### Example RLS Policy
```sql
-- Allow public to see basic shop info
CREATE POLICY "Public can view active shops"
ON shops FOR SELECT
USING (is_active = true);

-- Only vendors can see their own full details
CREATE POLICY "Vendors can view own shop"
ON shops FOR SELECT
USING (auth.uid() = vendor_id);
```

---

## 🐛 Troubleshooting

### Issue: Migration fails with "column already exists"
**Solution**: The column already exists. The migration uses `ADD COLUMN IF NOT EXISTS`, so it should be safe to run again.

### Issue: Shop not appearing in customer app
**Check**:
1. Verify `is_active = true` in the shops table
2. Check customer app is querying with `is_active = true` filter
3. Verify shop has required fields (name, address, image_url)

### Issue: Documents not saving
**Check**:
1. Verify document URLs are valid
2. Check if documents need to be uploaded to Supabase Storage first
3. Verify column names match (pan_document, fssai_document, etc.)

### Issue: Bank details not saving
**Check**:
1. Verify migration added bank detail columns
2. Check registration data includes bankDetails object
3. Verify column names: ifsc_code, account_number, etc.

---

## 📚 Related Files

- **Migration**: `supabase/migrations/20250117000000_add_complete_shop_registration_fields.sql`
- **Shop Service**: `vendor -app/services/shops.ts`
- **Registration Context**: `vendor -app/contexts/RegistrationContext.tsx`
- **Registration Data Doc**: `vendor -app/REGISTRATION_DATA_COLLECTED.md`

---

## ✅ Checklist

- [ ] Run the migration in Supabase
- [ ] Verify all columns were added
- [ ] Test vendor registration
- [ ] Verify shop appears in customer app
- [ ] Check all documents are saved
- [ ] Verify bank details are saved
- [ ] Test shop queries
- [ ] Set up RLS policies (if needed)
- [ ] Configure document storage (if using Supabase Storage)

---

## 🎉 Success!

Once the migration is complete and you've tested registration, all vendor registration details will be saved to the Supabase shops table, and shops will be visible in the customer app immediately after registration!

