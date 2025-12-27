# Complete Fix Guide: Vendor Shop Images Not Displaying

## 📋 Problem Summary

**Current Situation:**
- Shops registered by vendors (Taa, Khiiii, Jaaaa, Kiiiiii) show **red backgrounds** with store icons
- Manually created shops (Fresh Farm Meats, City Chicken Center, Mutton & More) show **real images**

**Root Cause:**
- Vendor app is saving **local file paths** (`file:///data/user/0/...`) instead of uploading to Supabase Storage
- Browsers cannot access local file paths from mobile devices
- Image upload is failing → falling back to local paths

**Console Evidence:**
```
❌ image_url: file:///data/user/0/host.exp.exponent/cache/ImagePicker/...
✅ image_url: https://images.pexels.com/photos/...
```

---

## ✅ Complete Fix (Step-by-Step)

### STEP 1: Set Up Supabase Storage Buckets 🪣

**This is the MOST IMPORTANT step!** The upload is failing because buckets don't exist.

#### Option A: Via Supabase Dashboard (Easiest)

1. Open **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Go to **Storage** (left sidebar)
4. Click **"New bucket"**

**Create Bucket 1:**
- Bucket name: `shop-images`
- ✅ **Public bucket** (IMPORTANT!)
- File size limit: `5` MB
- Allowed MIME types: `image/jpeg, image/png, image/webp, image/jpg`
- Click **"Create bucket"**

**Create Bucket 2:**
- Bucket name: `shop-documents`
- ✅ **Public bucket**
- File size limit: `10` MB
- Allowed MIME types: `image/jpeg, image/png, image/webp, image/jpg, application/pdf`
- Click **"Create bucket"**

**Create Bucket 3:**
- Bucket name: `product-images`
- ✅ **Public bucket**
- File size limit: `5` MB
- Allowed MIME types: `image/jpeg, image/png, image/webp, image/jpg`
- Click **"Create bucket"**

#### Option B: Via SQL Migration (Advanced)

1. Open **Supabase Dashboard** → **SQL Editor**
2. Click **"New query"**
3. Copy content from: `supabase/migrations/20250120000002_create_storage_buckets.sql`
4. Paste and click **"Run"**

#### Verify Buckets Are Created:

Run this SQL query:
```sql
SELECT id, name, public, file_size_limit 
FROM storage.buckets
WHERE id IN ('shop-images', 'shop-documents', 'product-images');
```

Expected result: 3 buckets, all with `public = true`

---

### STEP 2: Fix Existing Shops with Bad URLs 🔧

The 5 shops with local file paths need to be fixed.

#### Option A: Update to Placeholders (Quick Fix)

Run this SQL in **Supabase SQL Editor**:

```sql
-- Update shops with local file paths to use placeholder images
UPDATE shops
SET 
  image_url = 'https://via.placeholder.com/400x300?text=' || REPLACE(name, ' ', '+'),
  store_photos = '[]'::jsonb
WHERE 
  image_url LIKE 'file:///%'
  OR image_url LIKE 'file://data/%';

-- Verify update
SELECT id, name, image_url FROM shops WHERE image_url LIKE '%placeholder%';
```

This will at least show placeholder images instead of errors.

#### Option B: Manually Upload Real Images (Best)

1. Open **Super Admin Dashboard**
2. Go to **Partners** section
3. For each shop (Taa, Khiiii, Jaaaa, Kiiiiii):
   - Click **"View Details"**
   - Scroll to **"Shop Image (Customer App)"** section
   - Click **"Upload Shop Image"**
   - Select an image file
   - Wait for upload to complete
4. Refresh page - images should now display!

#### Option C: Delete and Re-register (Clean Slate)

```sql
-- Delete shops with bad URLs (vendors will need to re-register)
DELETE FROM shops
WHERE image_url LIKE 'file:///%';

-- Verify deletion
SELECT COUNT(*) as remaining_shops FROM shops;
```

Then vendors can re-register through the vendor app (after buckets are set up).

---

### STEP 3: Test New Vendor Registration 📱

Now that buckets are set up, test if image upload works:

1. **Open Vendor App** on phone/emulator
2. **Register a new test shop**
3. **Upload a shop photo**
4. **Watch the console logs**

**✅ Success Logs:**
```
[createShopInSupabase] Uploading store photos...
[uploadShopPhotos] Starting upload...
[uploadImageToStorage] Upload successful: https://...supabase.co/...
✅ [createShopInSupabase] Successfully uploaded 1 photos
✅ [createShopInSupabase] Photo URLs: ["https://..."]
```

**❌ Failure Logs:**
```
❌ [createShopInSupabase] Photo upload FAILED: [...]
```

If it fails, check:
- Supabase buckets exist and are **public**
- Vendor is **logged in** (authenticated)
- Internet connection is working
- Check Supabase Dashboard → Storage → Buckets

---

### STEP 4: Verify in Super Admin Dashboard 🖥️

1. Open **Super Admin Dashboard**
2. Go to **Partners** section
3. Click **"Refresh"** button
4. Check if images display correctly

**Expected Console Logs:**
```
=== FETCHED SHOPS DEBUG ===
Shop 1: Test Shop
  - image_url: https://fcrhcwvpivkadkkbxcom.supabase.co/storage/v1/object/public/shop-images/...
  - shop_image_url: undefined
  - store_photos: ["https://..."]
---
✅ Image loaded successfully for Test Shop
```

**No More Errors:**
- ❌ ~~Not allowed to load local resource~~
- ❌ ~~Image failed to load~~

---

## 🔍 Troubleshooting

### Issue: "Bucket not found" Error

**Solution:**
- Go to Supabase Dashboard → Storage
- Verify buckets exist: `shop-images`, `shop-documents`, `product-images`
- Check bucket names are spelled correctly (no typos)

### Issue: "new row violates row-level security policy"

**Solution:**
Run this SQL to fix RLS policies:

```sql
-- Allow authenticated users to upload to shop-images
CREATE POLICY IF NOT EXISTS "Allow authenticated upload shop images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'shop-images');

-- Allow public read access
CREATE POLICY IF NOT EXISTS "Allow public read shop images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'shop-images');
```

### Issue: Upload Still Saves Local Paths

**Check:**
1. Are buckets created and public?
2. Is vendor authenticated (logged in)?
3. Check vendor app console for upload errors
4. Verify Supabase credentials in `.env` file

---

## ✅ Final Verification Checklist

- [ ] Supabase Storage buckets created (`shop-images`, `shop-documents`, `product-images`)
- [ ] All buckets are **public** (checked in settings)
- [ ] Existing shops updated (placeholders or real images uploaded)
- [ ] New vendor registration uploads images successfully
- [ ] Vendor app console shows "✅ Successfully uploaded X photos"
- [ ] Super Admin shows images (no red backgrounds)
- [ ] Browser console shows "✅ Image loaded successfully"
- [ ] No "Not allowed to load local resource" errors

---

## 📊 Expected Results

### Before Fix:
```
5 shops with red backgrounds ❌
- image_url: file:///data/user/0/...
```

### After Fix:
```
All shops display images ✅
- image_url: https://fcrhcwvpivkadkkbxcom.supabase.co/storage/v1/object/public/shop-images/...
```

---

## 🚀 Quick Commands Summary

```sql
-- 1. Check buckets exist
SELECT id, name, public FROM storage.buckets;

-- 2. Fix existing shops
UPDATE shops
SET image_url = 'https://via.placeholder.com/400x300?text=' || REPLACE(name, ' ', '+')
WHERE image_url LIKE 'file:///%';

-- 3. Verify fix
SELECT name, image_url FROM shops ORDER BY created_at DESC LIMIT 10;
```

---

## 📞 Need Help?

If images still don't display after following all steps:

1. Share Supabase Dashboard screenshot (Storage → Buckets)
2. Share vendor app console logs during registration
3. Share browser console logs from Super Admin
4. Check Supabase Project Settings → API → URL and keys are correct

---

**Made with ❤️ for Taaza Platform**

Last Updated: December 17, 2025

