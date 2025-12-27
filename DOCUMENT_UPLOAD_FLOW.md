# Document Upload Flow - How It Works

## 📄 Overview

During vendor registration, vendors upload documents (PAN, GST, FSSAI, Aadhaar, Shop License). These documents are automatically uploaded to Supabase Storage and saved as **public URLs**, not as local file paths.

---

## 🔄 Complete Flow

### Step 1: Vendor Uploads Documents (Registration Form)

**File:** `vendor -app/app/partner-registration/documents.tsx`

When vendor selects a document:
```typescript
// User picks document
const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });

// Document is saved to context
documents: {
  pan: { 
    uri: 'file:///data/user/0/.../document.pdf',  // Local file path
    name: 'pan_card.pdf',
    type: 'application/pdf'
  },
  gst: { uri: '...', name: '...', type: '...' },
  // etc.
}
```

**At this stage:** Documents are LOCAL files on the vendor's device.

---

### Step 2: Registration Submission

**File:** `vendor -app/services/shops.ts` → `createShopInSupabase()`

When vendor completes registration, documents are automatically uploaded:

```typescript
// 1. Extract document URIs from registration data
let panDocUrl = registrationData.documents?.pan?.uri;
let gstDocUrl = registrationData.documents?.gst?.uri;
// etc.

// 2. Upload each document to Supabase Storage
if (panDocUrl && !panDocUrl.startsWith('https://')) {
  const result = await uploadDocument(panDocUrl, shopId, 'pan');
  if (result.success && result.url) {
    panDocUrl = result.url; // NOW it's a Supabase URL!
    // Example: https://fcrhcwvpivkadkkbxcom.supabase.co/storage/v1/object/public/shop-documents/shops/shop-123/pan.pdf
  }
}

// 3. Save Supabase URLs to database
const shopData = {
  ...
  pan_document: panDocUrl,  // Supabase URL (not local path!)
  gst_document: gstDocUrl,
  fssai_document: fssaiDocUrl,
  shop_license_document: shopLicenseDocUrl,
  aadhaar_document: aadhaarDocUrl,
  ...
};
```

**Result:** All documents are uploaded to Supabase Storage, and public URLs are saved to database.

---

### Step 3: Document Storage in Supabase

**Bucket:** `shop-documents`

**Folder Structure:**
```
shop-documents/
└── shops/
    ├── shop-abc123/
    │   ├── pan.pdf
    │   ├── gst.pdf
    │   ├── fssai.pdf
    │   ├── shop-license.pdf
    │   └── aadhaar.pdf
    └── shop-xyz789/
        └── ...
```

**Public URLs Generated:**
```
https://fcrhcwvpivkadkkbxcom.supabase.co/storage/v1/object/public/shop-documents/shops/shop-abc123/pan.pdf
https://fcrhcwvpivkadkkbxcom.supabase.co/storage/v1/object/public/shop-documents/shops/shop-abc123/gst.pdf
etc.
```

---

### Step 4: Database Storage

**Table:** `shops`

**Columns:**
```sql
shops (
  id                      text PRIMARY KEY,
  name                    text,
  ...
  pan_document            text,  -- Supabase Storage URL
  gst_document            text,  -- Supabase Storage URL
  fssai_document          text,  -- Supabase Storage URL
  shop_license_document   text,  -- Supabase Storage URL
  aadhaar_document        text,  -- Supabase Storage URL
  ...
)
```

**Example Data:**
```
id: 'shop-abc123'
name: 'Fresh Meat Shop'
pan_document: 'https://fcrhcwvpivkadkkbxcom.supabase.co/.../pan.pdf'
gst_document: 'https://fcrhcwvpivkadkkbxcom.supabase.co/.../gst.pdf'
```

---

## ✅ What This Means

### ✨ Before (Old - Broken)
```
Registration → Local file path → Database
              ("file:///data/.../pan.pdf")
```
❌ **Problem:** Other devices can't access local file paths!

### ✅ After (New - Fixed)
```
Registration → Upload to Supabase Storage → Get public URL → Database
              ("https://...supabase.co/.../pan.pdf")
```
✅ **Result:** Anyone can view the document using the public URL!

---

## 🔧 Technical Details

### Upload Function

**File:** `vendor -app/services/imageUpload.ts`

```typescript
export async function uploadDocument(
  uri: string,              // Local file path
  shopId: string,           // Shop ID for folder organization
  documentType: string      // 'pan', 'gst', 'fssai', etc.
): Promise<UploadResult> {
  // 1. Read local file as base64
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // 2. Convert to ArrayBuffer
  const arrayBuffer = decode(base64);

  // 3. Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('shop-documents')
    .upload(`shops/${shopId}/${documentType}`, arrayBuffer, {
      contentType: 'application/pdf',
      upsert: false,
    });

  // 4. Get public URL
  const { data: urlData } = supabase.storage
    .from('shop-documents')
    .getPublicUrl(`shops/${shopId}/${documentType}`);

  // 5. Return public URL
  return { success: true, url: urlData.publicUrl };
}
```

---

## 📊 Upload Process Timeline

```
User Action                    System Action                      Result
──────────────────────────────────────────────────────────────────────────
1. User selects PAN document → Saves local URI to context    → ✓ In memory
2. User completes form       → -                              → -
3. Clicks "Submit"           → Start registration process     → -
4. -                         → Upload PAN to Supabase Storage → ✓ In cloud
5. -                         → Get public URL                 → ✓ URL ready
6. -                         → Save URL to database           → ✓ Persisted
7. -                         → Repeat for GST, FSSAI, etc.   → ✓ All docs uploaded
8. Registration complete     → Shop is active                 → ✓ Success!
```

---

## 🛠️ Console Logs to Watch

When registration completes, you'll see:

```
[createShopInSupabase] Creating shop with ALL vendor registration data...
[createShopInSupabase] Generated shop ID: shop-abc123
[createShopInSupabase] Uploading store photos...
[createShopInSupabase] Successfully uploaded 3 photos
[createShopInSupabase] Uploading documents...
[createShopInSupabase] Uploading PAN document...
[uploadImageToStorage] Starting upload... { uri: 'file:///.../pan.pdf', bucket: 'shop-documents' }
[uploadImageToStorage] Upload successful: https://fcrhcwvpivkadkkbxcom.supabase.co/.../pan.pdf
[createShopInSupabase] PAN document uploaded: https://...
[createShopInSupabase] Uploading GST document...
[uploadImageToStorage] Upload successful: https://...
[createShopInSupabase] GST document uploaded: https://...
[createShopInSupabase] Uploading FSSAI document...
[uploadImageToStorage] Upload successful: https://...
[createShopInSupabase] FSSAI document uploaded: https://...
[createShopInSupabase] Document upload complete!
[createShopInSupabase] Shop created successfully!
```

---

## 🔍 Verification

### Check in Supabase Dashboard

1. **Storage → shop-documents bucket**
   - Navigate to `shops/[shop-id]/`
   - You should see files: `pan.pdf`, `gst.pdf`, etc.

2. **Table Editor → shops table**
   - Find your shop by ID
   - Check columns: `pan_document`, `gst_document`, etc.
   - Values should be full Supabase URLs (start with `https://`)

### Check in Database

```sql
SELECT 
  id,
  name,
  pan_document,
  gst_document,
  fssai_document,
  shop_license_document,
  aadhaar_document
FROM shops
WHERE id = 'your-shop-id';
```

**Expected Result:**
```
id: 'shop-abc123'
name: 'Fresh Meat Shop'
pan_document: 'https://fcrhcwvpivkadkkbxcom.supabase.co/storage/v1/object/public/shop-documents/shops/shop-abc123/pan.pdf'
gst_document: 'https://fcrhcwvpivkadkkbxcom.supabase.co/storage/v1/object/public/shop-documents/shops/shop-abc123/gst.pdf'
...
```

---

## 🐛 Troubleshooting

### Issue: Documents not uploading

**Check:**
1. Is `shop-documents` bucket created? → Run storage migration SQL
2. Are storage policies configured? → Check policies in Supabase Dashboard
3. Is user authenticated? → Check login status
4. Network connection? → Try again with good internet

**Console Error:**
```
[uploadImageToStorage] Upload error: { message: "Bucket not found" }
```
→ **Solution:** Create storage buckets (see `SETUP_SUPABASE_STORAGE.md`)

### Issue: Documents saved as local paths

**Check:**
```sql
SELECT pan_document FROM shops WHERE id = 'shop-123';
```

If result is: `file:///data/...` ❌
→ **Problem:** Documents didn't upload to storage

If result is: `https://...supabase.co/...` ✅
→ **Success:** Documents uploaded correctly

---

## 📋 Summary

| Aspect | Details |
|--------|---------|
| **What gets uploaded** | PAN, GST, FSSAI, Aadhaar, Shop License |
| **Where it's stored** | Supabase Storage → `shop-documents` bucket |
| **Format in database** | Public URLs (not local file paths) |
| **When it happens** | During registration submission |
| **Automatic?** | Yes! No manual action needed |
| **Accessible by** | Anyone with the URL (public bucket) |

---

## ✅ Requirements Checklist

- [x] Documents uploaded during registration
- [x] Stored in Supabase Storage (not locally)
- [x] Public URLs saved to database
- [x] Organized by shop ID in folders
- [x] Automatic upload on registration
- [x] Error handling if upload fails
- [x] Console logs for debugging
- [x] Works for all document types

---

## 🎯 Result

**Before:** Documents saved as `file:///data/...` ❌  
**After:** Documents saved as `https://...supabase.co/...` ✅

All documents are now properly uploaded to Supabase Storage and saved as public URLs in the database! 🎉

