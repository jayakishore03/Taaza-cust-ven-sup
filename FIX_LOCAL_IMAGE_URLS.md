# Fix Local Image URLs Issue

## 🐛 Problem Summary

Vendor shops are showing **local file paths** instead of uploaded images:
```
❌ file:///data/user/0/host.exp.exponent/cache/ImagePicker/...
✅ https://fcrhcwvpivkadkkbxcom.supabase.co/storage/v1/object/public/shop-images/...
```

**Root Cause:** Image upload to Supabase Storage is **failing**, so the vendor app falls back to saving local file paths, which browsers cannot access.

---

## ✅ Solutions

### Solution 1: Set Up Supabase Storage Buckets (Most Important!)

The image upload is failing because the Supabase Storage buckets might not be created yet.

#### Step 1: Check If Buckets Exist

1. Go to **Supabase Dashboard** → **Storage**
2. Check if these buckets exist:
   - `shop-images`
   - `shop-documents`
   - `product-images`

#### Step 2: Run Migration to Create Buckets

If buckets don't exist, run this migration:

```bash
# Navigate to project root
cd "C:\Users\DELL\OneDrive\Desktop\taaza"

# Run Supabase migration
npx supabase migration up
```

Or run the SQL script manually in Supabase SQL Editor:
- Open: `supabase/migrations/20250120000002_create_storage_buckets.sql`
- Copy all content
- Go to Supabase Dashboard → SQL Editor
- Paste and execute

#### Step 3: Verify Buckets Are Public

Run this SQL query in Supabase SQL Editor:

```sql
-- Check buckets
SELECT id, name, public, file_size_limit 
FROM storage.buckets
WHERE id IN ('shop-images', 'shop-documents', 'product-images');
```

**Expected Result:**
```
| id             | name           | public | file_size_limit |
|----------------|----------------|--------|-----------------|
| shop-images    | shop-images    | true   | 5242880         |
| shop-documents | shop-documents | true   | 10485760        |
| product-images | product-images | true   | 5242880         |
```

All `public` should be `true`!

#### Step 4: Check Storage Policies

```sql
-- Check policies
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'objects'
  AND (policyname LIKE '%shop%' OR policyname LIKE '%product%')
ORDER BY policyname;
```

---

### Solution 2: Fix Existing Shops with Local URLs

**IMPORTANT:** The existing shops with local file paths cannot load those images. You need to either:

**Option A: Delete and Re-register**
1. Delete the shops with local file paths from database
2. Re-register them through vendor app (after fixing buckets)

**Option B: Manually Upload Images via Admin Dashboard**
1. Open Super Admin Dashboard
2. Go to Partners → View Details for each shop
3. Click "Upload Shop Image"
4. Upload a new image

**Option C: Update Database with Valid URLs** (temporary workaround)

Run this SQL to set placeholder images:

```sql
-- Update shops with local file paths to use placeholder
UPDATE shops
SET 
  image_url = 'https://via.placeholder.com/400x300?text=' || name,
  store_photos = '[]'::jsonb
WHERE image_url LIKE 'file:///%'
  OR image_url LIKE 'file://data/%';

-- Verify update
SELECT id, name, image_url 
FROM shops 
WHERE image_url LIKE 'https://via.placeholder%';
```

---

### Solution 3: Test Image Upload in Vendor App

After setting up buckets, test the upload:

#### In Vendor App:

1. Start the vendor app
2. Register a new test shop
3. Upload a shop photo
4. Check the console logs:

**Success:**
```
✅ [createShopInSupabase] Successfully uploaded 1 photos
✅ [createShopInSupabase] Photo URLs: ["https://...supabase.co/..."]
```

**Failure:**
```
❌ [createShopInSupabase] Photo upload FAILED: [...]
```

If it fails, check:
- Supabase buckets exist and are public
- Vendor is authenticated (logged in)
- Internet connection is working
- No CORS errors in console

---

## 🔍 Debugging Steps

### 1. Check Vendor App Console During Registration

Look for these logs:
```
[createShopInSupabase] Uploading store photos...
[createShopInSupabase] Attempting to upload photos: [...]
[uploadShopPhotos] Starting upload...
[uploadImageToStorage] Upload successful: https://...
```

### 2. Common Upload Errors

#### Error: "Bucket not found"
**Fix:** Run the storage bucket migration

#### Error: "new row violates row-level security policy"
**Fix:** Check RLS policies allow authenticated users to upload

#### Error: "File size exceeds limit"
**Fix:** Images must be < 5MB

#### Error: "Invalid bucket id"
**Fix:** Bucket name must be exactly `shop-images` (no spaces or typos)

---

## 🚀 Quick Fix Commands

### 1. Create Buckets via Supabase Dashboard

1. Go to **Storage** → **New bucket**
2. Create bucket:
   - Name: `shop-images`
   - Public bucket: ✅ **Checked**
   - File size limit: 5 MB
   - Allowed MIME types: `image/jpeg, image/png, image/webp`

3. Repeat for `shop-documents` and `product-images`

### 2. Clean Up Bad Data

```sql
-- Delete shops with local file paths (they need to re-register)
DELETE FROM shops
WHERE image_url LIKE 'file:///%'
  OR image_url LIKE 'file://data/%';
```

### 3. Test Upload Manually

Try uploading an image via Supabase Dashboard:
1. Storage → shop-images bucket
2. Click "Upload file"
3. Upload any image
4. Check if public URL works

---

## ✅ Verification Checklist

After applying fixes:

- [ ] Supabase Storage buckets exist (`shop-images`, `shop-documents`, `product-images`)
- [ ] All buckets are **public** (checked in bucket settings)
- [ ] Storage policies allow authenticated users to upload
- [ ] Vendor app console shows "✅ Successfully uploaded X photos"
- [ ] New shop registrations save `https://` URLs (not `file://`)
- [ ] Super Admin Dashboard displays shop images correctly
- [ ] No "Not allowed to load local resource" errors in browser console

---

## 📱 Expected Flow (After Fix)

1. Vendor registers shop and selects photo from gallery
2. Photo uploads to Supabase Storage: `shop-images/shops/{shop-id}/photo-1.jpeg`
3. Public URL returned: `https://fcrhcwvpivkadkkbxcom.supabase.co/storage/v1/object/public/shop-images/shops/{shop-id}/photo-1.jpeg`
4. URL saved to `shops.image_url` in database
5. Super Admin Dashboard fetches shop and displays image ✅
6. Customer app also shows the same image ✅

---

## 🆘 If Upload Still Fails

Check these:

1. **Supabase Project URL** - Verify correct URL in `.env` files
2. **Supabase Anon Key** - Check it's valid and not expired
3. **User Authentication** - Vendor must be logged in (authenticated)
4. **expo-file-system** - Verify package is installed:
   ```bash
   cd "vendor -app"
   npm install expo-file-system
   ```
5. **base64-arraybuffer** - Verify package is installed:
   ```bash
   npm install base64-arraybuffer
   ```

---

Made with ❤️ for Taaza Platform

