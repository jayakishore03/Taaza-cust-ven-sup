# Quick Start - Fix Shop Images

## 🎯 Quick Summary

**Problem:** Shop images not displaying in customer app  
**Cause:** Local file URIs stored instead of cloud storage URLs  
**Solution:** Upload images to Supabase Storage first, then store public URLs

---

## ⚡ Quick Setup (3 Steps)

### Step 1: Install Dependencies

```bash
cd "vendor -app"
npm install
cd ..
```

**What this does:** Installs `base64-arraybuffer` and `expo-file-system` packages needed for image uploads.

---

### Step 2: Create Supabase Storage Buckets

**Option A: Run SQL (Easiest)**

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to **SQL Editor**
3. Open file: `supabase/migrations/20250120000002_create_storage_buckets.sql`
4. Copy entire contents and paste into SQL Editor
5. Click **Run**

**Option B: Manual Setup**

Follow detailed guide in `SETUP_SUPABASE_STORAGE.md`

---

### Step 3: Test

1. **Vendor App:** Register new shop with photos → Check console for success logs
2. **Supabase:** Go to Storage → Check `shop-images` bucket has files
3. **Customer App:** Open home screen → Verify shop images display

---

## 📄 Documentation Files

| File | Purpose |
|------|---------|
| `FIX_SHOP_IMAGES_SUMMARY.md` | Complete overview of problem and solution |
| `SETUP_SUPABASE_STORAGE.md` | Detailed Supabase setup guide |
| `QUICK_START_FIX_SHOP_IMAGES.md` | This file - Quick start guide |

---

## 🛠️ Automated Setup

Run the setup script:

```powershell
.\setup-shop-images.ps1
```

This script will:
- Install dependencies
- Guide you through Supabase setup
- Verify configuration
- Display next steps

---

## ✅ Verification Checklist

- [ ] Ran `npm install` in `vendor -app` folder
- [ ] Created 3 storage buckets in Supabase (`shop-images`, `shop-documents`, `product-images`)
- [ ] Storage buckets are set to **public**
- [ ] Storage policies configured (upload, read, delete)
- [ ] Tested vendor registration with photos
- [ ] Verified images appear in Supabase Storage
- [ ] Tested customer app - images display correctly

---

## 🐛 Common Issues

### "Failed to upload image"
→ Storage buckets not created. Run Step 2.

### Images still not showing
→ Check if `image_url` in database starts with `https://`

### "Permission denied"
→ Storage policies not configured. Run SQL migration again.

---

## 📞 Need Help?

1. Check `FIX_SHOP_IMAGES_SUMMARY.md` for detailed troubleshooting
2. Review `SETUP_SUPABASE_STORAGE.md` for setup steps
3. Check console logs in both apps for error messages
4. Verify Supabase credentials in `.env` files

---

## 🎉 What's Fixed

✅ Shop images now upload to Supabase Storage  
✅ Customer app displays images correctly  
✅ Fallback to default icon if image fails  
✅ Documents also uploaded securely  
✅ Works across all devices

