# 🚨 URGENT: Fix Storage Upload Error NOW

## Problem Found

Looking at your console logs, the error is:

```
ERROR [uploadImageToStorage] Upload error: [StorageApiError: new row violates row-level security policy]
```

**Cause**: The Supabase storage buckets either don't exist OR the Row Level Security policies are blocking uploads.

**Solution**: Run ONE SQL file in Supabase Dashboard (takes 30 seconds!)

---

## 🎯 Quick Fix (3 Steps - 2 Minutes)

### Step 1: Open Supabase SQL Editor

1. Go to: **https://supabase.com/dashboard/project/fcrhcwvpivkadkkbxcom**
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"** button

### Step 2: Copy and Run the Fix

1. Open the file: **`URGENT_FIX_STORAGE_BUCKETS.sql`** (in this folder)
2. **Select ALL** content (Ctrl+A)
3. **Copy** (Ctrl+C)
4. Go back to Supabase SQL Editor
5. **Paste** (Ctrl+V)
6. Click **"Run"** button (or press F5)
7. Wait for **"Success. No rows returned"** message

### Step 3: Test Upload Again

1. Go back to your **Vendor App** on your device
2. **Delete the failed shop** (shop-1766057263495-os6wdf3oy) from Super Admin if needed
3. **Register a new shop** with images
4. **Watch the console** - you should see:
   ```
   [uploadImageToStorage] Upload successful: https://...
   ✅ Successfully uploaded X photos
   ```

---

## ✅ What This SQL Does

The SQL script will:

1. ✅ Create 3 storage buckets:
   - `shop-images` (for shop photos)
   - `shop-documents` (for PAN, GST, FSSAI docs)
   - `product-images` (for product images)

2. ✅ Set buckets to **PUBLIC** (allows easy access)

3. ✅ Create **PERMISSIVE policies** that allow:
   - ✅ **PUBLIC uploads** (no auth required during registration)
   - ✅ **PUBLIC reads** (anyone can view images)
   - ✅ **Authenticated updates/deletes** (only logged-in users)

4. ✅ Fix the RLS policy error

---

## 🔍 Verification

After running the SQL, you can verify it worked:

### Check 1: Verify Buckets Created

In Supabase Dashboard:
1. Click **"Storage"** in left sidebar
2. You should see 3 buckets:
   - shop-images
   - shop-documents  
   - product-images

### Check 2: Test Upload in Vendor App

1. Register a new shop in vendor app
2. Upload shop photos
3. Console should show: `[uploadImageToStorage] Upload successful`
4. Check Super Admin - images should display!

---

## 📊 Expected Results After Fix

### ✅ In Console Logs:
```
[uploadImageToStorage] Starting upload...
[uploadImageToStorage] Upload successful: https://fcrhcwvpivkadkkbxcom.supabase.co/storage/v1/object/public/shop-images/shops/shop-123/photo-1.jpeg
✅ Successfully uploaded 2 photos
```

### ✅ In Supabase Storage:
- Navigate to **Storage** → **shop-images** → **shops** → **shop-123**
- You'll see uploaded image files

### ✅ In Super Admin:
- Partners page shows actual shop images (not placeholders)
- View Details shows all uploaded photos
- Documents are viewable

### ✅ In Database:
```sql
SELECT id, name, image_url, store_photos FROM shops WHERE id = 'shop-123';
```
- `image_url` contains: `https://...supabase.co/storage/.../photo-1.jpeg`
- `store_photos` contains: `["https://...jpeg", "https://...jpeg"]`

---

## 🚨 Alternative: Manual Bucket Creation (If SQL Fails)

If the SQL Editor gives an error, create buckets manually:

1. Go to **Storage** in Supabase Dashboard
2. Click **"New bucket"**
3. Create bucket:
   - **Name**: `shop-images`
   - **Public bucket**: ✅ **ENABLED**
   - **File size limit**: 5 MB
   - **Allowed MIME types**: image/jpeg, image/jpg, image/png, image/webp
4. Repeat for `shop-documents` (10 MB limit)
5. Repeat for `product-images` (5 MB limit)

Then run just the policies part of the SQL (lines 53-150 in URGENT_FIX_STORAGE_BUCKETS.sql)

---

## 🎉 Summary

**Problem**: RLS policy blocking storage uploads

**Solution**: Run `URGENT_FIX_STORAGE_BUCKETS.sql` in Supabase SQL Editor

**Time**: 2 minutes

**Result**: Images will upload and display perfectly! ✅

---

## 📝 Important Notes

### About Public Buckets

The buckets are set to **public** which means:
- ✅ Anyone can view images (good for customer app)
- ✅ Anyone can upload (needed during vendor registration before auth)
- ✅ Only authenticated users can update/delete (secure)

### Security for Production

For production, you may want to:
1. Restrict uploads to authenticated users only
2. Add file size validation server-side
3. Add virus scanning
4. Use signed URLs for sensitive documents

But for now, public uploads work perfectly for your use case!

---

## 🆘 Troubleshooting

### Issue: SQL gives "permission denied" error

**Solution**: Make sure you're logged in as the project owner in Supabase Dashboard

### Issue: Buckets already exist

**Solution**: That's fine! The SQL uses `ON CONFLICT DO UPDATE` so it will just update existing buckets

### Issue: Still getting RLS error after running SQL

**Solution**: 
1. Check if policies were created:
   - Go to **Storage** → Click bucket → **Policies** tab
   - You should see policies listed
2. If no policies, run just the policies part again (lines 53-150)

### Issue: Images upload but don't display

**Solution**: Check the `image_url` in database:
```sql
SELECT id, name, image_url FROM shops ORDER BY created_at DESC LIMIT 1;
```
Should start with `https://` not `file://`

---

**Run the SQL NOW and images will work!** 🚀

