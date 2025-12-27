# Troubleshooting: Vendor Shops Not Appearing in Customer App

## Problem
Vendor-registered shops are not appearing in the customer app. Only old hardcoded shops (shop-1, shop-2, shop-3) are displayed.

---

## ✅ Solution Steps

### Step 1: Verify Shop Creation is Working

1. **Register a new vendor** through the vendor app
2. **Check the console logs** for these messages:
   ```
   [createShopInSupabase] ✅ Shop created successfully
   [completeVendorRegistration] Shop created, shopId: <id>
   [completeVendorRegistration] Shop is_active: true - Will be visible in customer app
   ```

3. **If you see errors**, check:
   - `[createShopInSupabase] Error creating shop:` - This means shop creation failed
   - Common errors:
     - Missing columns in shops table (run migration)
     - Invalid data format
     - Supabase connection issues

### Step 2: Check Database Directly

Run this SQL query in Supabase SQL Editor:

```sql
-- Check all shops
SELECT 
  id, 
  name, 
  is_active, 
  vendor_id,
  created_at,
  CASE 
    WHEN vendor_id IS NOT NULL THEN 'Vendor Shop'
    WHEN id LIKE 'shop-%' THEN 'Hardcoded Shop'
    ELSE 'Other'
  END as shop_type
FROM shops
ORDER BY created_at DESC;
```

**Expected Result:**
- You should see vendor shops with `vendor_id` NOT NULL
- `is_active` should be `true` for shops to appear

### Step 3: Use Debug Endpoint

Call the debug endpoint to see all shops:

```bash
GET http://your-backend-url/api/shops/debug/all
```

This will show:
- Total shops count
- Active shops count
- Vendor shops count
- All shop details

### Step 4: Verify Shops Table Has All Columns

Run this migration if not already run:

```sql
-- File: supabase/migrations/20250117000000_add_complete_shop_registration_fields.sql
```

This adds all vendor registration fields to shops table.

### Step 5: Check Backend Logs

When customer app calls `/api/shops`, check backend logs for:

```
[getAllShops] Total active shops found: X
[getAllShops] Vendor-registered shops: X
[getAllShops] Hardcoded shops: X
[getAllShops] Shop IDs: [...]
```

**If vendor shops count is 0:**
- Shops are not being created, OR
- Shops are created but `is_active = false`, OR
- Shops are created but `vendor_id` is NULL

---

## 🔧 Common Issues & Fixes

### Issue 1: Shop Creation Fails Silently

**Symptom:** Vendor registration succeeds but no shop appears

**Fix:** 
- Check `[createShopInSupabase] Error creating shop:` in logs
- Verify all required fields are provided
- Check if shops table has all columns (run migration)

### Issue 2: Shop Created but `is_active = false`

**Symptom:** Shop exists in database but doesn't appear in customer app

**Fix:**
```sql
-- Activate the shop
UPDATE shops 
SET is_active = true 
WHERE vendor_id = '<vendor_id>';
```

### Issue 3: Shop Created but Missing Data

**Symptom:** Shop appears but missing vendor details (owner name, contact, etc.)

**Fix:**
- Verify `createShopInSupabase` is copying all vendor data
- Check if shops table has all columns
- Re-run vendor registration

### Issue 4: Supabase Client Not Configured

**Symptom:** Shop creation fails with "Supabase not configured"

**Fix:**
- Check `vendor -app/lib/supabase.ts`
- Verify `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set
- Restart vendor app after setting environment variables

---

## 📋 Verification Checklist

- [ ] Vendor registration completes successfully
- [ ] Shop is created in shops table (check database)
- [ ] Shop has `is_active = true`
- [ ] Shop has `vendor_id` set (references vendors.id)
- [ ] Shop has all vendor data (owner_name, email, mobile_number, etc.)
- [ ] Backend `/api/shops` returns the shop
- [ ] Customer app displays the shop

---

## 🧪 Test the Complete Flow

1. **Register a vendor:**
   ```
   Vendor App → Complete Registration → Check logs
   ```

2. **Verify in database:**
   ```sql
   SELECT * FROM shops WHERE vendor_id IS NOT NULL ORDER BY created_at DESC LIMIT 1;
   ```

3. **Test API:**
   ```bash
   curl http://your-backend/api/shops
   ```

4. **Check customer app:**
   - Open customer app
   - Go to home screen
   - Verify new shop appears in "Nearby Shops"

---

## 📞 If Still Not Working

1. **Check vendor app logs** for shop creation errors
2. **Check backend logs** for shop fetching errors
3. **Check database** directly to see if shops exist
4. **Use debug endpoint** `/api/shops/debug/all` to see all shops
5. **Verify Supabase connection** in both apps

---

## 🔍 Debug Commands

```sql
-- Find all vendor shops
SELECT s.*, v.shop_name as vendor_shop_name 
FROM shops s
LEFT JOIN vendors v ON s.vendor_id = v.id
WHERE s.vendor_id IS NOT NULL
ORDER BY s.created_at DESC;

-- Check if shops are active
SELECT id, name, is_active, vendor_id 
FROM shops 
WHERE is_active = true;

-- Count shops by type
SELECT 
  CASE 
    WHEN vendor_id IS NOT NULL THEN 'Vendor Shop'
    ELSE 'Other'
  END as shop_type,
  COUNT(*) as count
FROM shops
GROUP BY shop_type;
```
