# Debug Shop Images Not Displaying

## 🔍 How to Debug

I've added detailed console logging to help identify why vendor images aren't displaying.

### Step 1: Check Browser Console

1. Open the Super Admin Dashboard in your browser
2. Open Developer Tools (F12 or right-click → Inspect)
3. Go to the **Console** tab
4. Click the **Refresh** button in the Partners section

### Step 2: Look for These Logs

You should see logs like this:

```
=== FETCHED SHOPS DEBUG ===
Shop 1: Kiiiiii
  - image_url: https://...supabase.co/storage/v1/object/public/shop-images/...
  - shop_image_url: null
  - store_photos: ["https://...", "https://..."]
---
Shop 2: Jaaaa
  - image_url: null
  - shop_image_url: null
  - store_photos: []
---
```

### Step 3: Check Image Load Status

For each image that loads (or fails), you'll see:

**Success:**
```
✅ Image loaded successfully for Fresh Farm Meats
```

**Failure:**
```
❌ Image failed to load for Kiiiiii:
  image_url: "https://..."
  shop_image_url: null
  store_photos: []
  attempted_src: "https://..."
```

---

## 🐛 Common Issues & Solutions

### Issue 1: image_url is `null` or `undefined`

**Cause:** Vendors didn't upload images during registration, or upload failed

**Solution:**
1. Check if vendors actually selected photos during registration
2. Verify Supabase Storage is set up correctly
3. Check vendor app console logs during registration

### Issue 2: image_url is a local file path

**Example:** `file:///data/user/0/.../photo.jpg`

**Cause:** Images weren't uploaded to Supabase Storage

**Solution:**
- Check that `vendor -app/services/imageUpload.ts` is being called
- Verify `uploadShopPhotos()` function is working
- Check Supabase Storage buckets exist

### Issue 3: Image URL exists but fails to load

**Causes:**
1. **CORS issues** - Supabase bucket not public
2. **Deleted files** - Images were removed from storage
3. **Wrong bucket** - Images in wrong Supabase bucket
4. **Network issues** - Can't reach Supabase

**Solutions:**

#### Check Supabase Storage Bucket Settings

1. Go to Supabase Dashboard → Storage
2. Find `shop-images` bucket
3. Verify it's set to **Public**
4. Check files exist in the bucket

#### Check Image URL Format

Correct format:
```
https://fcrhcwvpivkadkkbxcom.supabase.co/storage/v1/object/public/shop-images/shops/[shop-id]/photo-1.jpg
```

Wrong formats:
```
file:///data/user/0/...                     ❌ Local file path
https://via.placeholder.com/400x300         ❌ Placeholder
/storage/v1/object/public/...               ❌ Missing domain
```

### Issue 4: store_photos is not an array

**Example:** `store_photos: null` or `store_photos: "[url1, url2]"` (string instead of array)

**Cause:** Database column type mismatch

**Solution:** Check the shops table schema

```sql
-- store_photos should be JSONB or TEXT[] (array)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'shops' AND column_name = 'store_photos';
```

---

## 🔧 Quick Fixes

### Fix 1: Manually Check Database

Run this query in Supabase SQL Editor:

```sql
SELECT 
  id,
  name,
  image_url,
  shop_image_url,
  store_photos,
  CASE 
    WHEN image_url IS NOT NULL THEN 'Has image_url'
    WHEN shop_image_url IS NOT NULL THEN 'Has shop_image_url'
    WHEN store_photos IS NOT NULL AND jsonb_array_length(store_photos::jsonb) > 0 THEN 'Has store_photos'
    ELSE 'NO IMAGES'
  END as image_status
FROM shops
ORDER BY created_at DESC
LIMIT 10;
```

### Fix 2: Check Supabase Storage Files

1. Go to Supabase Dashboard
2. Storage → shop-images
3. Navigate to `shops/` folder
4. Check if folders exist for each shop ID
5. Verify image files are present

### Fix 3: Re-upload Images via Admin Dashboard

For shops without images:

1. Click "View Details" on the partner card
2. Scroll to "Shop Image (Customer App)" section
3. Click "Upload Shop Image"
4. Select an image file
5. Wait for upload to complete

---

## 📊 Expected vs Actual

### What SHOULD Happen (Vendor Registration)

```
1. Vendor selects photo → Local URI
2. uploadShopPhotos() called → Upload to Supabase
3. Returns public URL → "https://..."
4. Saved to database → image_url field
5. Admin dashboard displays image ✅
```

### What MIGHT Be Happening (If Images Don't Show)

```
1. Vendor selects photo → Local URI
2. Upload function NOT called ❌
3. Local URI saved to database → "file://..."
4. Admin dashboard tries to load local file ❌
5. Image fails to load → Red background shown
```

---

## 🧪 Test Steps

1. **Open browser console** (F12)
2. **Refresh Partners page**
3. **Copy all console logs** and share them
4. **Take screenshot** of what's logged
5. **Check Supabase Storage** → shop-images bucket

---

## 📞 Report Issue

If images still don't show, provide:

1. ✅ Console logs from browser
2. ✅ Screenshot of Supabase Storage → shop-images bucket
3. ✅ SQL query result from "Fix 1" above
4. ✅ Screenshot of what's displayed in admin dashboard
5. ✅ Vendor app console logs (if available)

---

Made with ❤️ for debugging Taaza platform

