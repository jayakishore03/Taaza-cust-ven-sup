# Supabase Storage Setup Guide

This guide explains how to set up Supabase Storage for shop and document images in the Super Admin Dashboard.

## 📦 What You'll Store

- **Shop Images**: Main shop photos displayed in customer app
- **Document Images**: PAN, GST, FSSAI, Shop License, Aadhaar documents

---

## 🚀 Setup Steps

### Step 1: Create Storage Bucket

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **"New bucket"**
5. Create a bucket with these settings:
   - **Name**: `shop-images`
   - **Public bucket**: ✅ **YES** (Enable)
   - **File size limit**: 5 MB
   - **Allowed MIME types**: `image/*`

### Step 2: Set Up Storage Policies

After creating the bucket, set up Row Level Security (RLS) policies:

#### Option A: Public Read Access (Recommended for MVP)

Run this SQL in the Supabase SQL Editor:

```sql
-- Allow public read access to shop images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'shop-images');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'shop-images');

-- Allow authenticated users to update
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'shop-images');
```

#### Option B: Completely Public (Easy for Testing)

Run this SQL:

```sql
-- Allow anyone to read
CREATE POLICY "Public Read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'shop-images');

-- Allow anyone to insert (for testing only!)
CREATE POLICY "Public Insert"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'shop-images');

-- Allow anyone to update (for testing only!)
CREATE POLICY "Public Update"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'shop-images');
```

### Step 3: Verify Setup

Test that your bucket is accessible:

```typescript
const { data, error } = await supabase.storage.from('shop-images').list();
console.log('Bucket accessible:', !error);
```

---

## 📸 How It Works

### Image Upload Flow

1. **Admin clicks "Upload Shop Image"** in Partners detail view
2. **Selects image file** (max 5MB, JPG/PNG/WEBP)
3. **Image uploads to Supabase Storage**:
   - Path: `shops/{shopId}/{shopId}_shop_{timestamp}.{ext}`
   - Example: `shops/123/123_shop_1234567890.jpg`
4. **Database updates**:
   - `shops.image_url` = public URL
5. **Customer app displays** the new image immediately

### Document Viewing Flow

1. **Admin clicks on partner** in Partners list
2. **Views partner details modal**
3. **Documents section shows**:
   - PAN Card
   - GST Certificate
   - FSSAI License
   - Shop License
   - Aadhaar Card
4. **Click "View Document"** to see full-size image

---

## 🗂️ Storage Structure

```
shop-images/
├── shops/
│   ├── {shop-id-1}/
│   │   ├── {shop-id-1}_shop_1234567890.jpg
│   │   ├── {shop-id-1}_pan_1234567891.jpg
│   │   ├── {shop-id-1}_gst_1234567892.jpg
│   │   └── ...
│   ├── {shop-id-2}/
│   │   └── ...
```

---

## 🔧 Code Implementation

### Upload Function (Already Implemented)

```typescript
const handleImageUpload = async (file: File, shopId: string, imageType: string) => {
  // 1. Create unique filename
  const fileName = `${shopId}_${imageType}_${Date.now()}.${file.name.split('.').pop()}`;
  const filePath = `shops/${shopId}/${fileName}`;
  
  // 2. Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('shop-images')
    .upload(filePath, file);
  
  // 3. Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('shop-images')
    .getPublicUrl(filePath);
  
  // 4. Update database
  await supabase
    .from('shops')
    .update({ image_url: publicUrl })
    .eq('id', shopId);
};
```

---

## 📋 Features

### ✅ Implemented Features

1. **View Documents**:
   - Click to view PAN, GST, FSSAI, Shop License, Aadhaar
   - Full-screen image viewer modal
   - Error handling for missing images

2. **Upload Shop Image**:
   - File size validation (max 5MB)
   - Format validation (JPG, PNG, WEBP)
   - Progress indicator
   - Automatic database update
   - Customer app sync

3. **Image Display**:
   - Shop images in customer app
   - Document previews in admin dashboard
   - Fallback for missing images

---

## 🔒 Security Best Practices

### For Production:

1. **Use authenticated uploads only**
2. **Validate file types** on server side
3. **Scan uploaded files** for malware
4. **Set proper MIME type restrictions**
5. **Use signed URLs** for sensitive documents
6. **Implement file size limits** (already done: 5MB)

### Current Implementation:

- ✅ Public bucket for easy customer app access
- ✅ File size validation (5MB)
- ✅ MIME type checking (client-side)
- ⚠️ Needs: Server-side validation
- ⚠️ Needs: Malware scanning for production

---

## 🚨 Troubleshooting

### Issue: "Storage bucket not found"

**Solution**: Make sure you created the bucket named exactly `shop-images`

```sql
-- Check if bucket exists
SELECT * FROM storage.buckets WHERE name = 'shop-images';
```

### Issue: "Permission denied"

**Solution**: Check RLS policies are set up correctly

```sql
-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'objects';
```

### Issue: "CORS error when uploading"

**Solution**: Make sure your Supabase project allows requests from your domain

1. Go to Supabase Dashboard → Project Settings → API
2. Add your domain to allowed origins

### Issue: Images not showing in customer app

**Solution**: Verify the `image_url` field is updated

```sql
-- Check if image_url is set
SELECT id, name, image_url FROM shops WHERE image_url IS NOT NULL;
```

---

## 📱 Customer App Integration

The customer app automatically displays shop images from the `shops.image_url` field:

```typescript
// Customer app fetches shops
const { data: shops } = await supabase
  .from('shops')
  .select('*')
  .eq('is_active', true);

// Displays image
<Image source={{ uri: shop.image_url }} />
```

**No code changes needed** in customer app - it just works! 🎉

---

## 🎯 Next Steps

1. ✅ Create `shop-images` bucket in Supabase
2. ✅ Set up RLS policies
3. ✅ Test image upload in admin dashboard
4. ✅ Verify images appear in customer app
5. 🚀 Deploy to production!

---

## 📞 Support

If you encounter issues:
1. Check Supabase Dashboard logs
2. Verify bucket name is `shop-images`
3. Confirm RLS policies are active
4. Test with a small image first (< 1MB)

---

Made with ❤️ for Taaza Meat Delivery Platform


