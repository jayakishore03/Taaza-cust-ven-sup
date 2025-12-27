# Vendor Verification Workflow

## ✅ New Flow: Verification Before Shop Creation

The system now requires **admin verification** before a shop appears in the customer app.

---

## 🔄 Complete Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. VENDOR REGISTERS (Vendor App)                            │
│    - Fills registration form (6 steps)                      │
│    - Submits registration                                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. VENDOR ACCOUNT CREATED                                    │
│    - createVendorAccount()                                   │
│    - Creates Supabase Auth account                           │
│    - Returns: userId                                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. VENDOR RECORD CREATED (vendors table)                    │
│    - createVendorInSupabase()                                │
│    - Saves ALL registration data to vendors table            │
│    - Status: is_verified = false, is_approved = false       │
│    - NO SHOP CREATED YET                                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. ADMIN VERIFIES VENDOR                                     │
│    - Admin reviews vendor documents                          │
│    - Admin sets: is_verified = true                          │
│    - (Optional: Admin can verify without approving)          │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. ADMIN APPROVES VENDOR ⭐                                  │
│    - Admin sets: is_approved = true                          │
│    - This triggers shop creation automatically               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. SHOP CREATED AUTOMATICALLY (shops table)                   │
│    - Database trigger OR backend endpoint creates shop        │
│    - ALL vendor data copied to shops table                   │
│    - Shop status: is_active = true                            │
│    - Shop appears in customer app immediately                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. CUSTOMER APP DISPLAYS SHOP ✅                              │
│    - Backend fetches from shops table                        │
│    - Only shops with is_active = true are shown              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Implementation Details

### 1. Vendor Registration (No Shop Creation)

**File:** `vendor -app/services/shops.ts`

**Function:** `completeVendorRegistration()`

**What Changed:**
- ✅ Removed shop creation from registration
- ✅ Only creates vendor account and vendor record
- ✅ Sets `is_verified = false`, `is_approved = false`
- ✅ Returns success without creating shop

**Code:**
```typescript
// Step 3: Shop creation is SKIPPED during registration
// Shop will be created automatically when vendor is approved by admin
console.log('[completeVendorRegistration] Vendor registration completed. Shop will be created after admin approval.');
```

---

### 2. Shop Creation Function

**File:** `vendor -app/services/shops.ts`

**Function:** `createShopFromVendor(vendor: Vendor)`

**Purpose:** Creates shop from vendor data when vendor is approved

**Features:**
- ✅ Checks if shop already exists (prevents duplicates)
- ✅ Copies ALL vendor data to shops table
- ✅ Sets required fields with defaults if missing
- ✅ Sets `is_active = true` (shop appears immediately)

---

### 3. Admin Approval Endpoint

**File:** `backend/src/controllers/vendorController.js`

**Endpoint:** `POST /api/vendor/approve/:vendorId`

**Request Body:**
```json
{
  "is_verified": true,
  "is_approved": true
}
```

**What It Does:**
1. Updates vendor `is_verified` and `is_approved` status
2. If `is_approved = true`, creates shop automatically
3. Returns vendor and shop data

**Example:**
```bash
POST /api/vendor/approve/1ffb06cd-a04d-...
Content-Type: application/json

{
  "is_verified": true,
  "is_approved": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "vendor": { ... },
    "shop": { ... },
    "message": "Vendor approved and shop created successfully"
  }
}
```

---

### 4. Database Trigger (Automatic Shop Creation)

**File:** `supabase/migrations/20250119000000_auto_create_shop_on_vendor_approval.sql`

**What It Does:**
- ✅ Automatically creates shop when `is_approved` changes to `true`
- ✅ Fires AFTER vendor update
- ✅ Checks if shop exists (prevents duplicates)
- ✅ Copies ALL vendor data to shops table
- ✅ Sets `is_active = true`

**Trigger Details:**
- **Trigger Name:** `trigger_create_shop_on_vendor_approval`
- **Function:** `create_shop_on_vendor_approval()`
- **Fires:** When `is_approved` changes from `false` to `true`

**To Apply:**
```sql
-- Run this migration in Supabase SQL Editor
-- Or apply via Supabase CLI
```

---

## 🔍 How to Approve a Vendor

### Option 1: Using Admin Endpoint (Recommended)

```bash
POST /api/vendor/approve/{vendorId}
{
  "is_verified": true,
  "is_approved": true
}
```

### Option 2: Direct Database Update

```sql
-- Update vendor to approved
UPDATE vendors 
SET is_approved = true, is_verified = true
WHERE id = 'vendor-uuid-here';

-- Shop will be created automatically by trigger
```

### Option 3: Using Supabase Dashboard

1. Go to `vendors` table
2. Find the vendor
3. Update `is_approved` to `true`
4. Shop will be created automatically

---

## ✅ Verification Checklist

### After Vendor Registers:
- [ ] Vendor record exists in `vendors` table
- [ ] `is_verified = false`, `is_approved = false`
- [ ] NO shop in `shops` table yet

### After Admin Approves:
- [ ] Vendor `is_approved = true` in `vendors` table
- [ ] Shop created in `shops` table
- [ ] Shop `is_active = true`
- [ ] Shop `vendor_id` links to vendor
- [ ] Shop appears in customer app

---

## 🐛 Troubleshooting

### Issue: Shop Not Created After Approval

**Check:**
1. Is trigger installed? Run migration
2. Is `is_approved` actually `true`?
3. Check database logs for trigger errors
4. Check if shop already exists (trigger won't create duplicate)

**Debug SQL:**
```sql
-- Check vendor status
SELECT id, shop_name, is_verified, is_approved 
FROM vendors 
WHERE id = 'vendor-uuid';

-- Check if shop exists
SELECT id, name, vendor_id, is_active 
FROM shops 
WHERE vendor_id = 'vendor-uuid';
```

### Issue: Shop Created But Not Appearing

**Check:**
1. Is shop `is_active = true`?
2. Is backend query correct? (fetches `is_active = true`)
3. Check backend logs: `[getAllShops] Vendor-registered shops: X`

---

## 📝 Summary

**New Workflow:**
1. ✅ Vendor registers → saves to `vendors` table only
2. ✅ Admin verifies → sets `is_verified = true`
3. ✅ Admin approves → sets `is_approved = true`
4. ✅ Shop created automatically → appears in customer app

**Key Changes:**
- ❌ Shop NOT created during registration
- ✅ Shop created only when vendor is approved
- ✅ Database trigger handles automatic shop creation
- ✅ Admin endpoint available for manual approval

**Benefits:**
- ✅ Only verified vendors appear in customer app
- ✅ Admin controls which shops are visible
- ✅ Prevents unverified shops from appearing
- ✅ Clear separation: vendors (registration) vs shops (display)
