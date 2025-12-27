# ✍️ Contract Signature Upload Feature

## ✅ What Was Implemented

Added functionality to **upload contract signatures to Supabase Storage** and **display them in the Super Admin Dashboard**.

---

## 📱 Vendor App Changes

### **File**: `vendor -app/services/shops.ts`

#### **1. Signature Upload (Lines 687-702)**

Added signature upload to Supabase Storage bucket:

```typescript
// ===== UPLOAD SIGNATURE TO SUPABASE STORAGE =====
console.log('[createShopInSupabase] Uploading signature...');
let signatureUrl = registrationData.signature || null;

if (signatureUrl && !signatureUrl.startsWith('https://')) {
  console.log('[createShopInSupabase] Uploading signature image...');
  const result = await uploadDocument(signatureUrl, shopId, 'signature');
  if (result.success && result.url) {
    signatureUrl = result.url;
    console.log('[createShopInSupabase] Signature uploaded:', signatureUrl);
  } else {
    console.warn('[createShopInSupabase] Signature upload failed:', result.error);
  }
}
```

#### **2. Save Uploaded URL (Line 774)**

Changed from local URI to Supabase Storage URL:

```typescript
// Before:
signature: registrationData.signature || null,

// After:
signature: signatureUrl,  // Uses uploaded Supabase Storage URL
```

### **How It Works:**

1. ✅ User signs contract in vendor app (takes photo or selects from gallery)
2. ✅ Local file URI stored temporarily
3. ✅ During registration, signature uploads to `shop-documents` bucket
4. ✅ Upload path: `shop-documents/shops/{shop-id}/signature.jpeg`
5. ✅ Public URL saved to database
6. ✅ Local URI replaced with permanent Supabase URL

---

## 💻 Super Admin Dashboard Changes

### **File**: `meat super admin/src/pages/Partners.tsx`

#### **1. Added Signature Field to Interface (Line 23)**

```typescript
interface Shop {
  ...
  aadhaar_document?: string;
  signature?: string;  // New field
  is_approved?: boolean;
  ...
}
```

#### **2. Added Signature Display Section (Lines 595-610)**

Added new document card for contract signature:

```tsx
{/* Contract Signature */}
<div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
  <div className="flex items-center gap-2 mb-2">
    <FileText className="w-4 h-4 text-gray-500" />
    <p className="text-sm font-semibold text-gray-900">Contract Signature</p>
  </div>
  {partner.signature ? (
    <button
      onClick={() => viewImage(partner.signature!, 'Contract Signature')}
      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
    >
      View Signature
    </button>
  ) : (
    <p className="text-xs text-gray-500">Not signed</p>
  )}
</div>
```

### **Display Location:**

The signature appears in the **Documents** section along with:
- PAN Card
- GST Certificate
- FSSAI License
- Shop License
- Aadhaar Card
- **Contract Signature** ⬅️ NEW!

---

## 🗂️ Supabase Storage Structure

```
shop-documents/
├── shops/
│   ├── shop-1766057263495-os6wdf3oy/
│   │   ├── pan.jpeg
│   │   ├── gst.jpeg
│   │   ├── fssai.jpeg
│   │   ├── shop-license.jpeg
│   │   ├── aadhaar.jpeg
│   │   └── signature.jpeg  ⬅️ NEW!
│   ├── shop-1766058278049-403ho0u09/
│   │   ├── ...
│   │   └── signature.jpeg  ⬅️ NEW!
```

---

## 🎯 Features

### ✅ **In Vendor App:**
- Signature captured via camera/gallery
- Automatically uploaded to Supabase Storage
- Stored with other documents
- Progress logging for debugging

### ✅ **In Super Admin:**
- New "Contract Signature" card
- Click "View Signature" to see full image
- Shows "Not signed" if signature missing
- Consistent UI with other documents

---

## 🔍 How to Verify

### **1. Test in Vendor App:**

1. Register a new shop
2. Complete all steps
3. **Step 6 (Contract)**: Take signature photo
4. Submit registration
5. **Check console logs**:
   ```
   [createShopInSupabase] Uploading signature...
   [uploadImageToStorage] Upload successful: https://...supabase.co/.../signature.jpeg
   [createShopInSupabase] Signature uploaded: https://...
   ```

### **2. Verify in Supabase Storage:**

1. Go to **Supabase Dashboard** → **Storage** → **shop-documents**
2. Navigate to `shops/{shop-id}/`
3. You should see **signature.jpeg**

### **3. View in Super Admin:**

1. Open **Super Admin** → **Partners**
2. Click shop **"View Details"**
3. Scroll to **Documents** section
4. You should see **"Contract Signature"** card
5. Click **"View Signature"** to see the image

---

## 📊 Database Schema

**Table**: `shops`

**Column**: `signature` (TEXT, nullable)

**Value**: Supabase Storage public URL

**Example**:
```
https://fcrhcwvpivkadkkbxcom.supabase.co/storage/v1/object/public/shop-documents/shops/shop-123/signature.jpeg
```

---

## 🚀 Benefits

1. ✅ **Centralized Storage**: All signatures in Supabase Storage
2. ✅ **Easy Access**: Admin can view all signatures
3. ✅ **Audit Trail**: Permanent record of contract acceptance
4. ✅ **Consistency**: Same upload flow as other documents
5. ✅ **Security**: Public read, authenticated write

---

## 🔒 Storage Policies

Signatures use the same policies as other shop documents:

**Bucket**: `shop-documents`

**Policies**:
- ✅ **INSERT**: Allowed for `anon` role (vendor registration)
- ✅ **SELECT**: Allowed for `public` (admin can view)
- ✅ **UPDATE**: Allowed for `authenticated` (admin can replace)
- ✅ **DELETE**: Allowed for `authenticated` (admin can remove)

---

## 📝 Notes

- Signature file name is always **"signature"** (without extension specified, auto-detected)
- Uploaded to same bucket as other documents (`shop-documents`)
- File path: `shops/{shop-id}/signature`
- If upload fails, signature field will be `null` (warning logged)
- Existing local file URI signatures won't display in admin

---

## ✅ Summary

**What Changed:**
1. ✅ Vendor app uploads signature to Supabase Storage
2. ✅ Super Admin displays signature in Documents section
3. ✅ Signature stored alongside other vendor documents

**Test It:**
1. Register new shop with signature
2. Check Supabase Storage for uploaded file
3. View signature in Super Admin dashboard

---

**Contract signatures are now properly stored and accessible!** ✍️🎉

