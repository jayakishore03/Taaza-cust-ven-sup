# Supabase Shop Registration - Field Mapping

## Overview
All vendor registration details are now saved directly to the Supabase `shops` table. This document outlines the field mapping and table structure.

---

## Registration Data → Supabase Shops Table Mapping

### Step 1: Basic Details

| Registration Field | Supabase Column | Type | Notes |
|-------------------|-----------------|------|-------|
| `ownerName` | `owner_name` | string | Shop owner's full name |
| `storeName` | `name` | string | Shop name |
| `shopPlot` | `shop_plot` | string (nullable) | Shop/Plot number |
| `floor` | `floor` | string (nullable) | Floor number (optional) |
| `building` | `building` | string (nullable) | Building/Complex name |
| `pincode` | `pincode` | string | Postal code |
| `location.latitude` | `latitude` | number (nullable) | GPS latitude |
| `location.longitude` | `longitude` | number (nullable) | GPS longitude |
| `area` | `area` | string (nullable) | Area name (auto-detected) |
| `city` | `city` | string (nullable) | City name (auto-detected) |
| `storePhotos[]` | `store_photos` | string[] | Array of photo URIs |
| `shopType` | `shop_type` | string (nullable) | 'chicken', 'mutton', 'pork', 'meat', 'multi' |

### Step 2: Contact Details

| Registration Field | Supabase Column | Type | Notes |
|-------------------|-----------------|------|-------|
| `email` | `email` | string | Shop email address |
| `mobileNumber` | `mobile_number` | string | Primary contact number |
| `whatsappNumber` | `whatsapp_number` | string (nullable) | WhatsApp number (defaults to mobile) |

### Step 3: Working Days & Timings

| Registration Field | Supabase Column | Type | Notes |
|-------------------|-----------------|------|-------|
| `workingDays[]` | `working_days` | string[] | Array of days: ['Monday', 'Tuesday', ...] |
| `sameTime` | `same_time` | boolean | If true, use common times for all days |
| `commonOpenTime` | `common_open_time` | string (nullable) | Opening time (e.g., '09:00') |
| `commonCloseTime` | `common_close_time` | string (nullable) | Closing time (e.g., '18:00') |
| `dayTimes` | `day_times` | JSON (nullable) | Day-wise timings: `{ "Monday": { "open_time": "09:00", "close_time": "18:00" } }` |

### Step 4: Documents

| Registration Field | Supabase Column | Type | Notes |
|-------------------|-----------------|------|-------|
| `documents.pan` | `pan_document` | string (nullable) | PAN document URI |
| `documents.gst` | `gst_document` | string (nullable) | GSTIN document URI (optional) |
| `documents.fssai` | `fssai_document` | string (nullable) | FSSAI license URI |
| `documents.shopLicense` | `shop_license_document` | string (nullable) | Shop license URI |
| `documents.aadhaar` | `aadhaar_document` | string (nullable) | Aadhaar card URI |

### Step 5: Bank Details

| Registration Field | Supabase Column | Type | Notes |
|-------------------|-----------------|------|-------|
| `bankDetails.ifsc` | `ifsc_code` | string (nullable) | IFSC code |
| `bankDetails.accountNumber` | `account_number` | string (nullable) | Bank account number |
| `bankDetails.bankName` | `bank_name` | string (nullable) | Bank name |
| `bankDetails.accountHolderName` | `account_holder_name` | string (nullable) | Account holder name |

### Step 6: Contract & Signature

| Registration Field | Supabase Column | Type | Notes |
|-------------------|-----------------|------|-------|
| `contractAccepted` | `contract_accepted` | boolean | Terms acceptance |
| `profitShare` | `profit_share` | number | Profit share percentage (default: 20) |
| `signature` | `signature` | string (nullable) | Signature image URI |

### System Fields

| Field | Supabase Column | Type | Notes |
|-------|-----------------|------|-------|
| - | `id` | string (UUID) | Auto-generated shop ID |
| - | `vendor_id` | string (nullable) | Linked to Supabase Auth user |
| - | `is_active` | boolean | Shop status (default: false for new shops) |
| - | `created_at` | timestamp | Auto-generated |
| - | `updated_at` | timestamp | Auto-updated |

---

## Supabase Shops Table Schema

```sql
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_name TEXT NOT NULL,
  name TEXT NOT NULL,
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
  email TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  whatsapp_number TEXT,
  working_days TEXT[],
  same_time BOOLEAN DEFAULT true,
  common_open_time TEXT,
  common_close_time TEXT,
  day_times JSONB,
  pan_document TEXT,
  gst_document TEXT,
  fssai_document TEXT,
  shop_license_document TEXT,
  aadhaar_document TEXT,
  ifsc_code TEXT,
  account_number TEXT,
  bank_name TEXT,
  account_holder_name TEXT,
  contract_accepted BOOLEAN DEFAULT false,
  profit_share INTEGER DEFAULT 20,
  signature TEXT,
  vendor_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Registration Flow

### 1. Create Vendor Account (Supabase Auth)
- Email: `registrationData.email`
- Password: `password`
- Phone: `registrationData.mobileNumber`
- User Metadata: `{ name: ownerName, role: 'vendor' }`

### 2. Create Shop Record (Supabase shops table)
- All registration data is inserted into `shops` table
- Shop is created with `is_active = false` (pending approval)

### 3. Link Shop to Vendor
- Update `shops.vendor_id` with the created user's ID
- This links the shop to the vendor account

---

## Data Flow

```
Registration Form
    ↓
RegistrationContext (AsyncStorage)
    ↓
submitRegistration()
    ↓
completeVendorRegistration()
    ├── createVendorAccount() → Supabase Auth
    ├── createShopInSupabase() → Supabase shops table
    └── linkShopToVendor() → Update vendor_id
    ↓
Success → Store vendor_data in AsyncStorage
```

---

## Important Notes

1. **Document Uploads**: Currently, document URIs are stored as strings. If documents need to be uploaded to Supabase Storage first, that logic should be added before saving to the shops table.

2. **Photo Uploads**: Store photos are stored as an array of URIs. These should be uploaded to Supabase Storage and the URIs saved.

3. **Shop Status**: New shops are created with `is_active = false` and require admin approval before they can be used.

4. **Working Days Format**: 
   - `working_days`: Array of day names: `['Monday', 'Tuesday', ...]`
   - `day_times`: JSON object: `{ "Monday": { "open_time": "09:00", "close_time": "18:00" } }`

5. **Time Format**: Times are stored as strings in "HH:MM" format (24-hour or 12-hour with AM/PM).

---

## Error Handling

- If vendor account creation fails → Return error, don't create shop
- If shop creation fails → Shop not created, but user account exists (may need cleanup)
- If linking fails → Shop exists but not linked (can be fixed later)

---

## Testing

To test the registration:

1. Fill out all registration steps
2. Submit registration
3. Check Supabase:
   - `auth.users` table for new vendor account
   - `shops` table for new shop record
   - Verify all fields are populated correctly
   - Verify `vendor_id` is linked to user account

