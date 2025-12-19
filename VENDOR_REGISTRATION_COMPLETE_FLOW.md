# Complete Vendor Registration Flow & Image Upload Process

## 📋 Overview

This document explains the **COMPLETE** vendor registration flow from start to finish.

---

## 🔄 Complete Flow

### 1️⃣ **Vendor Registration (Vendor App)**

**What Happens:**
1. Vendor opens vendor app and starts registration
2. Vendor fills in details:
   - Shop name, address, contact info
   - Working hours
   - Bank details
3. **Vendor uploads shop photos** (1-5 images)
4. **Vendor uploads documents:**
   - PAN Card
   - GST Certificate
   - FSSAI License
   - Shop License
   - Aadhaar Card
5. Vendor signs contract and submits

**CRITICAL: What SHOULD Happen (Current Issue):**
- ✅ Images/documents should upload to **Supabase Storage buckets**
- ✅ Public URLs should be saved to database
- ❌ **CURRENT PROBLEM:** Images saving as local paths (`file:///...`)

**Why Local Paths Don't Work:**
- Local paths only exist on vendor's phone
- Web browser cannot access `file:///data/user/0/...`
- Customer app on different device cannot access vendor's local files
- **Solution:** Upload to Supabase Storage → Get public URLs → Save URLs to database

---

### 2️⃣ **Data Storage (Supabase)**

**After Registration Completes:**

```
Database (shops table):
- name: "Fresh Chicken Shop"
- owner_name: "John Doe"
- email: "john@example.com"
- mobile_number: "9876543210"
- image_url: "https://...supabase.co/storage/.../shop-images/shops/shop-123/photo-1.jpeg" ✅
- store_photos: ["https://.../photo-1.jpeg", "https://.../photo-2.jpeg"] ✅
- pan_document: "https://.../shop-documents/shops/shop-123/pan.pdf" ✅
- gst_document: "https://.../shop-documents/shops/shop-123/gst.pdf" ✅
- is_approved: false (waiting for admin approval)
- is_verified: false
- user_id: "uuid-of-vendor-user"
```

**Supabase Storage Buckets:**
```
shop-images/
  shops/
    shop-123/
      photo-1.jpeg
      photo-2.jpeg
      photo-3.jpeg

shop-documents/
  shops/
    shop-123/
      pan.pdf
      gst.pdf
      fssai.pdf
      shop-license.pdf
      aadhaar.pdf
```

---

### 3️⃣ **Admin Review (Super Admin Website)**

**What Admin Sees:**

1. Admin opens Super Admin Dashboard
2. Navigates to **"Partners"** section
3. Sees list of ALL shops (approved + pending)
4. Each shop card shows:
   - Shop name
   - Owner name
   - Contact details
   - **Shop image** (from Supabase Storage)
   - Status badge: "Pending Approval" or "Active"

**Admin Actions:**

1. Click **"View Details"** on a shop
2. Admin can see:
   - All shop details
   - Shop images (from Supabase Storage)
   - All uploaded documents (PAN, GST, FSSAI, etc.)
   - Bank details
3. Admin reviews documents
4. Admin clicks:
   - **"Approve"** → Sets `is_approved = true`, `is_verified = true`
   - **"Reject"** → Sets `is_approved = false` or deletes shop

---

### 4️⃣ **Customer App Display (Customer App)**

**What Customer Sees:**

```sql
-- Customer app fetches ONLY approved shops
SELECT * FROM shops 
WHERE is_approved = true 
  AND is_active = true
ORDER BY distance;
```

**Result:**
- ✅ Only approved shops appear in customer app
- ✅ Shop images display (from Supabase Storage URLs)
- ✅ Customer can browse and order from approved shops
- ❌ Pending/rejected shops are NOT visible

---

## 🐛 Current Problem & Solution

### ❌ **Current Problem**

**Console logs show:**
```
image_url: file:///data/user/0/host.exp.exponent/cache/ImagePicker/...
```

This means:
- Images are **NOT** uploading to Supabase Storage
- Local file paths are being saved to database
- Super Admin Dashboard cannot display images
- Customer app cannot display images

### ✅ **Solution (3 Steps)**

#### **Step 1: Run SQL Migration** ⭐ CRITICAL

This creates the Supabase Storage buckets:

```bash
# Run the SQL file in Supabase SQL Editor
supabase/migrations/COMPLETE_MIGRATION_NO_VENDORS_TABLE.sql
```

This will:
- ✅ Create buckets: `shop-images`, `shop-documents`, `product-images`
- ✅ Set buckets to **public** (so images are accessible)
- ✅ Create storage policies (authenticated users can upload)
- ✅ Fix existing shops with local file paths

#### **Step 2: Verify Buckets Exist**

Go to **Supabase Dashboard** → **Storage**

You should see:
```
✅ shop-images (public)
✅ shop-documents (public)
✅ product-images (public)
```

#### **Step 3: Test Vendor Registration**

1. Open **Vendor App**
2. Register a new test shop
3. Upload shop photos
4. **Check console logs:**

**✅ Success:**
```
[uploadShopPhotos] Starting upload...
[uploadImageToStorage] Upload successful: https://...supabase.co/...
✅ [createShopInSupabase] Successfully uploaded 2 photos
✅ [createShopInSupabase] Photo URLs: ["https://...", "https://..."]
```

**❌ Failure:**
```
❌ [createShopInSupabase] Photo upload FAILED: [...]
```

If upload fails:
- Check buckets exist in Supabase Dashboard
- Check buckets are set to **public**
- Check vendor is logged in (authenticated)

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ VENDOR APP                                                   │
│                                                              │
│  1. Vendor fills registration form                          │
│  2. Vendor selects shop photos (from gallery/camera)        │
│  3. Vendor uploads documents (PAN, GST, FSSAI, etc.)       │
│  4. Vendor submits registration                             │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ IMAGE UPLOAD SERVICE (vendor-app/services/imageUpload.ts)   │
│                                                              │
│  uploadShopPhotos(localUris, shopId):                       │
│    - Read local file using expo-file-system                 │
│    - Convert to base64 → ArrayBuffer                        │
│    - Upload to Supabase Storage: shop-images bucket         │
│    - Returns: ["https://.../photo-1.jpeg", ...]            │
│                                                              │
│  uploadDocument(localUri, shopId, type):                    │
│    - Read local file                                        │
│    - Upload to Supabase Storage: shop-documents bucket      │
│    - Returns: "https://.../pan.pdf"                         │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ SUPABASE STORAGE (Cloud Storage)                            │
│                                                              │
│  shop-images/shops/shop-123/                                │
│    ├── photo-1.jpeg                                         │
│    ├── photo-2.jpeg                                         │
│    └── photo-3.jpeg                                         │
│                                                              │
│  shop-documents/shops/shop-123/                             │
│    ├── pan.pdf                                              │
│    ├── gst.pdf                                              │
│    ├── fssai.pdf                                            │
│    ├── shop-license.pdf                                     │
│    └── aadhaar.pdf                                          │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ SUPABASE DATABASE (shops table)                             │
│                                                              │
│  INSERT INTO shops (                                         │
│    id: "shop-123",                                          │
│    name: "Fresh Chicken Shop",                              │
│    owner_name: "John Doe",                                  │
│    image_url: "https://.../photo-1.jpeg",      ← Public URL │
│    store_photos: ["https://...", "https://..."], ← URLs    │
│    pan_document: "https://.../pan.pdf",         ← URL       │
│    gst_document: "https://.../gst.pdf",         ← URL       │
│    is_approved: false,                          ← Pending   │
│    is_verified: false,                                      │
│    user_id: "uuid-vendor-123"                               │
│  )                                                           │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ SUPER ADMIN DASHBOARD (Website)                             │
│                                                              │
│  Partners Section:                                           │
│    - Fetch: SELECT * FROM shops ORDER BY created_at DESC    │
│    - Display: All shops (approved + pending)                │
│    - Show shop images from Supabase Storage URLs            │
│    - Show documents from Supabase Storage URLs              │
│                                                              │
│  Admin Actions:                                              │
│    - [Approve] → UPDATE shops SET is_approved=true WHERE... │
│    - [Reject]  → UPDATE shops SET is_approved=false WHERE...│
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ CUSTOMER APP (Mobile App)                                   │
│                                                              │
│  Fetch ONLY approved shops:                                  │
│    SELECT * FROM shops                                       │
│    WHERE is_approved = true AND is_active = true             │
│                                                              │
│  Display:                                                    │
│    - Shop name, address, distance                           │
│    - Shop image from: shop.image_url (Supabase Storage)     │
│    - Shop can accept orders ✅                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Approval Workflow

### Database Fields

```typescript
interface Shop {
  id: string;
  name: string;
  owner_name: string;
  // ... other fields ...
  
  // APPROVAL FIELDS:
  is_approved: boolean;  // Admin approves shop
  is_verified: boolean;  // Admin verifies documents
  is_active: boolean;    // Shop is active/open
  user_id: string;       // Links to vendor's user account
}
```

### States

| State | is_approved | is_verified | is_active | Visible in Customer App? |
|-------|-------------|-------------|-----------|-------------------------|
| **Pending** | false | false | true | ❌ No |
| **Approved** | true | true | true | ✅ Yes |
| **Rejected** | false | false | false | ❌ No |
| **Suspended** | true | true | false | ❌ No |

### Admin Actions

**In Super Admin Dashboard** → Partners → View Details:

```typescript
// Approve Shop
const approveShop = async (shopId: string) => {
  await supabase
    .from('shops')
    .update({ 
      is_approved: true, 
      is_verified: true 
    })
    .eq('id', shopId);
};

// Reject Shop
const rejectShop = async (shopId: string) => {
  await supabase
    .from('shops')
    .update({ 
      is_approved: false, 
      is_verified: false,
      is_active: false 
    })
    .eq('id', shopId);
};

// Suspend Shop
const suspendShop = async (shopId: string) => {
  await supabase
    .from('shops')
    .update({ is_active: false })
    .eq('id', shopId);
};
```

---

## 🧪 Testing Checklist

### ✅ After Running SQL Migration

- [ ] Supabase Storage buckets exist (shop-images, shop-documents, product-images)
- [ ] All buckets are set to **public**
- [ ] Storage policies allow authenticated users to upload
- [ ] Existing shops with local paths are fixed (placeholders)

### ✅ Vendor Registration Test

- [ ] Open vendor app
- [ ] Register new shop with photos
- [ ] Console shows: `✅ Successfully uploaded X photos`
- [ ] Console shows: `Photo URLs: ["https://...", ...]` (NOT `file:///...`)
- [ ] Documents upload successfully
- [ ] Shop appears in Super Admin Dashboard

### ✅ Super Admin Dashboard Test

- [ ] Open Partners section
- [ ] See newly registered shop
- [ ] Shop image displays correctly (from Supabase Storage)
- [ ] Click "View Details" → See all documents
- [ ] Documents load correctly
- [ ] Status shows "Pending Approval"

### ✅ Approval Test

- [ ] Admin clicks "Approve" (need to add this button)
- [ ] Shop status changes to "Active"
- [ ] Shop now appears in Customer App

### ✅ Customer App Test

- [ ] Open customer app
- [ ] See only approved shops
- [ ] Shop images display correctly
- [ ] Can browse products and place order

---

## 🚨 Common Issues & Solutions

### Issue 1: Images Still Saving as Local Paths

**Symptoms:**
```
image_url: file:///data/user/0/...
```

**Solution:**
1. Check Supabase Storage buckets exist
2. Check buckets are **public**
3. Check vendor is authenticated (logged in)
4. Check network connection
5. Check Supabase credentials in `.env` file

### Issue 2: Upload Returns Error

**Symptoms:**
```
❌ Photo upload FAILED: Bucket not found
```

**Solution:**
- Run the SQL migration to create buckets
- Verify buckets exist in Supabase Dashboard

### Issue 3: Images Don't Display in Super Admin

**Symptoms:**
- Red backgrounds with store icons
- Browser error: "Not allowed to load local resource"

**Solution:**
- This means local paths were saved (not Supabase URLs)
- Run SQL migration to fix existing shops
- Re-upload images via Super Admin Dashboard

### Issue 4: Approved Shop Doesn't Appear in Customer App

**Symptoms:**
- Shop is approved but not visible to customers

**Solution:**
Check these conditions:
```sql
SELECT * FROM shops WHERE id = 'shop-id';
-- Should have:
-- is_approved = true ✅
-- is_active = true ✅
-- image_url starts with https:// ✅
```

---

## 📝 Summary

### Before Fix:
```
Vendor uploads photo → Local path saved → ❌ Cannot display in web/other devices
```

### After Fix:
```
Vendor uploads photo → Uploads to Supabase Storage → Public URL saved → ✅ Displays everywhere
```

### Complete Flow:
```
1. Vendor registers + uploads images/docs
2. Images upload to Supabase Storage buckets
3. Public URLs saved to database
4. Shop appears in Super Admin (pending)
5. Admin approves shop
6. Shop appears in Customer App ✅
```

---

**Next Step:** Run the SQL migration to create the storage buckets! 🚀

