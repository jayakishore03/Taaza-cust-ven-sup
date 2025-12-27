# Supabase Storage Setup Guide

## Overview
This guide explains how to set up Supabase Storage buckets for shop images, product images, and documents.

---

## ⚠️ Important: Why This Is Needed

**Problem**: Shop images were not displaying in the customer app because local file URIs (e.g., `file:///data/...`) were being stored in the database instead of public URLs.

**Solution**: Upload images to Supabase Storage and store public URLs in the database.

---

## 🪣 Required Storage Buckets

You need to create **3 storage buckets** in Supabase:

1. **`shop-images`** - For shop/store photos
2. **`shop-documents`** - For vendor documents (PAN, GST, FSSAI, Aadhaar, Shop License)
3. **`product-images`** - For product photos

---

## 📋 Step-by-Step Setup

### Step 1: Access Supabase Storage

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project: **fcrhcwvpivkadkkbxcom**
3. Click on **Storage** in the left sidebar

### Step 2: Create Storage Buckets

For each bucket (`shop-images`, `shop-documents`, `product-images`):

1. Click **"New bucket"** button
2. Enter the bucket name (e.g., `shop-images`)
3. Set the bucket as **Public** (important for image display)
4. Click **"Create bucket"**

**Bucket Settings:**
```
Name: shop-images
Public: ✅ Yes (checked)
Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp
File size limit: 5MB
```

```
Name: shop-documents
Public: ✅ Yes (checked)
Allowed MIME types: image/jpeg, image/jpg, image/png, application/pdf
File size limit: 10MB
```

```
Name: product-images
Public: ✅ Yes (checked)
Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp
File size limit: 5MB
```

### Step 3: Configure Bucket Policies

For each bucket, set up the following policies to allow uploads:

1. Go to **Storage** > Select your bucket > **Policies** tab
2. Click **"New Policy"**
3. Select **"For full customization"**
4. Add the following policies:

#### Policy 1: Allow Authenticated Users to Upload

```sql
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'shop-images');
```

```sql
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'shop-documents');
```

```sql
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');
```

#### Policy 2: Allow Public Read Access

```sql
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'shop-images');
```

```sql
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'shop-documents');
```

```sql
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');
```

#### Policy 3: Allow Users to Delete Their Own Files

```sql
CREATE POLICY "Allow users to delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'shop-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

```sql
CREATE POLICY "Allow users to delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'shop-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
```

```sql
CREATE POLICY "Allow users to delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Step 4: Verify Setup

Run this SQL query in Supabase SQL Editor to verify buckets are created:

```sql
SELECT * FROM storage.buckets;
```

You should see three buckets:
- `shop-images` (public: true)
- `shop-documents` (public: true)
- `product-images` (public: true)

---

## 🔄 How Images Are Now Handled

### Vendor App (Registration Flow)

1. Vendor selects images using image picker → Gets local URI (e.g., `file:///...`)
2. Images are uploaded to Supabase Storage using `uploadShopPhotos()` function
3. Supabase returns public URLs (e.g., `https://fcrhcwvpivkadkkbxcom.supabase.co/storage/v1/object/public/shop-images/...`)
4. Public URLs are saved to database in `image_url` and `store_photos` fields

### Customer App (Display Flow)

1. Customer app fetches shops from database
2. Shop objects include `image_url` field with Supabase Storage public URL
3. Images are displayed using `<Image source={{ uri: shop.image }} />`
4. Fallback to default image if URL is invalid or image fails to load

---

## 📁 Folder Structure in Storage

Storage files are organized by shop/user:

```
shop-images/
  └── shops/
      ├── [shop-id-1]/
      │   ├── photo-1.jpg
      │   ├── photo-2.jpg
      │   └── photo-3.jpg
      └── [shop-id-2]/
          ├── photo-1.jpg
          └── photo-2.jpg

shop-documents/
  └── shops/
      ├── [shop-id-1]/
      │   ├── pan.jpg
      │   ├── gst.jpg
      │   ├── fssai.jpg
      │   ├── shop-license.jpg
      │   └── aadhaar.jpg
      └── [shop-id-2]/
          └── ...

product-images/
  └── shops/
      ├── [shop-id-1]/
      │   ├── chicken-curry-cut.jpg
      │   ├── mutton-boneless.jpg
      │   └── ...
      └── [shop-id-2]/
          └── ...
```

---

## 🛠️ Testing Image Upload

### Test in Vendor App

1. Open vendor app
2. Go to registration flow
3. Upload shop photos
4. Check console logs for upload success:
   ```
   [uploadImageToStorage] Starting upload...
   [uploadImageToStorage] Upload successful: https://...
   [createShopInSupabase] Successfully uploaded 3 photos
   ```

### Test in Customer App

1. Open customer app
2. Navigate to home screen
3. Check if shop images are displayed
4. If images fail to load, check console for errors:
   ```
   [HomeScreen] Shop image failed to load: [shop-name] [image-url]
   ```

---

## 🐛 Troubleshooting

### Images Not Uploading

**Error**: `Failed to upload image`

**Solution**:
1. Check that buckets are created with correct names
2. Verify bucket policies allow authenticated uploads
3. Check network connection
4. Verify Supabase credentials in `.env`

### Images Not Displaying

**Error**: Image shows placeholder/default icon

**Possible causes**:
1. Image URL is a local file URI (not uploaded to storage)
2. Bucket is not public
3. CORS policy blocking requests
4. Invalid image URL in database

**Solution**:
1. Check that `image_url` field contains a Supabase Storage URL (starts with `https://` and contains `supabase`)
2. Make sure buckets are set to **public**
3. Enable CORS in Supabase (usually enabled by default)
4. Check console logs for error details

### Permission Denied

**Error**: `Permission denied for bucket`

**Solution**:
1. Verify storage policies are created (see Step 3)
2. Check that user is authenticated
3. Verify bucket_id matches in policies

---

## 📝 Code Files Changed

### New Files Created
- `vendor -app/services/imageUpload.ts` - Image upload service

### Files Modified
- `vendor -app/services/shops.ts` - Shop creation now uploads images
- `app/(tabs)/index.tsx` - Customer app home screen with fallback images
- `app/(tabs)/orders.tsx` - Orders screen with fallback images

---

## ✅ Verification Checklist

- [ ] All 3 storage buckets created (`shop-images`, `shop-documents`, `product-images`)
- [ ] All buckets are set to **public**
- [ ] Storage policies configured for upload, read, and delete
- [ ] Vendor app uploads images successfully (check logs)
- [ ] Customer app displays shop images
- [ ] Fallback images work when image URLs are invalid
- [ ] Documents upload successfully during vendor registration

---

## 🚀 Next Steps

1. **Create storage buckets** following Step 2
2. **Add storage policies** following Step 3
3. **Test vendor registration** - Upload shop photos and verify URLs in database
4. **Test customer app** - Verify shop images display correctly
5. **Update existing shops** - If you have existing shops with local URIs, you'll need to re-upload their images

---

## 📧 Support

If you encounter issues:
1. Check Supabase Storage logs in dashboard
2. Check console logs in both apps
3. Verify network requests in browser dev tools
4. Check that Supabase credentials are correct in `.env` files

---

## 🔗 Useful Links

- Supabase Storage Docs: https://supabase.com/docs/guides/storage
- Supabase Storage Policies: https://supabase.com/docs/guides/storage/security/access-control
- Expo File System: https://docs.expo.dev/versions/latest/sdk/filesystem/
- React Native Image: https://reactnative.dev/docs/image

