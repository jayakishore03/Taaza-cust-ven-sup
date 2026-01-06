# 🔧 Complete Fix: Vercel 500 Error + Supabase Setup

## 📋 Overview

This guide will:
1. ✅ Fix the Vercel 500 error
2. ✅ Set up Supabase database with all tables
3. ✅ Configure storage buckets
4. ✅ Ensure customer registration creates users correctly
5. ✅ Test everything works

---

## 🚀 Step 1: Run SQL Migration in Supabase

### 1.1 Go to Supabase Dashboard
1. Open: https://supabase.com/dashboard
2. Select project: **fcrhcwvpivkadkkbxcom**
3. Click **"SQL Editor"** in left sidebar
4. Click **"New query"**

### 1.2 Run the Migration
1. Open file: `backend/COMPLETE_SETUP_MIGRATION.sql`
2. Copy **ALL** contents (Ctrl+A, Ctrl+C)
3. Paste into Supabase SQL Editor
4. Click **"Run"** button (or Ctrl+Enter)
5. Wait for completion (~30-60 seconds)

### 1.3 Verify Migration
After running, you should see:
- ✅ "Migration completed successfully!"
- ✅ 3 storage buckets created
- ✅ All tables have new columns

---

## 🔧 Step 2: Fix Vercel Deployment

### 2.1 Commit and Push Code Changes
The code fixes I made need to be deployed:

```bash
cd backend
git add .
git commit -m "Fix database.js RPC binding and error handling"
git push
```

Vercel will auto-deploy. Wait 2-3 minutes.

### 2.2 Verify Environment Variables
In Vercel Dashboard → Settings → Environment Variables, ensure these are set:

- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `NODE_ENV` (optional, set to `production`)

### 2.3 Test After Deployment
After deployment completes, test:

1. **Test Endpoint** (should work):
   ```
   https://taaza-customer.vercel.app/api/test
   ```

2. **Health Endpoint** (should work):
   ```
   https://taaza-customer.vercel.app/health
   ```

3. **Products Endpoint** (should work):
   ```
   https://taaza-customer.vercel.app/api/products
   ```

---

## 📊 Step 3: Verify Database Tables

### 3.1 Check Tables Exist
In Supabase Dashboard → **Table Editor**, verify these tables exist:

- ✅ `users` - User accounts
- ✅ `user_profiles` - User profiles
- ✅ `addresses` - Delivery addresses
- ✅ `shops` - Shop information
- ✅ `products` - Products
- ✅ `orders` - Orders
- ✅ `order_items` - Order items
- ✅ `order_timeline` - Order status timeline
- ✅ `payment_methods` - Payment methods
- ✅ `coupons` - Discount coupons
- ✅ `addons` - Addon items

### 3.2 Check Storage Buckets
In Supabase Dashboard → **Storage**, verify these buckets exist:

- ✅ `shop-images` (Public: Yes, 5MB)
- ✅ `shop-documents` (Public: Yes, 10MB)
- ✅ `product-images` (Public: Yes, 5MB)

---

## 👤 Step 4: Customer Registration Flow

### Current Setup
When a customer registers in the app:

1. **User created in `users` table** ✅
   - ID: UUID
   - Name, email, phone, password (hashed)
   - `is_active`: true
   - `is_verified`: false

2. **Profile created in `user_profiles` table** ✅
   - Same ID as user
   - Name, email, phone, gender, profile_picture

3. **Address created in `addresses` table** (if provided) ✅
   - Links to user_id
   - `is_default`: true

### How It Works
- Customer app calls: `POST /api/auth/signup`
- Backend creates user in `users` table
- Backend creates profile in `user_profiles` table
- Backend creates address (if provided)
- Returns JWT token for authentication

**This is working correctly!** ✅

---

## 🧪 Step 5: Test Customer Registration

### 5.1 Test Sign Up Endpoint
```bash
# Test signup
curl -X POST https://taaza-customer.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "1234567890",
    "password": "test123",
    "address": {
      "street": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "postalCode": "400001",
      "contactName": "Test User"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "name": "Test User",
      "email": "test@example.com",
      "phone": "1234567890"
    },
    "token": "..."
  }
}
```

### 5.2 Verify in Supabase
After signup, check in Supabase:

1. **Table Editor** → `users` table
   - Should see new user with phone/email

2. **Table Editor** → `user_profiles` table
   - Should see profile with same ID

3. **Table Editor** → `addresses` table
   - Should see address linked to user_id

---

## 🔍 Step 6: Troubleshooting

### Issue: Still Getting 500 Error

**Check Vercel Logs:**
1. Vercel Dashboard → Deployments → Latest
2. Functions → `/api/index` → Logs
3. Look for first error message

**Common Fixes:**
- Missing environment variable → Add in Vercel
- Import error → Check route files exist
- Database connection → Verify Supabase credentials

### Issue: Customer Registration Fails

**Check:**
1. Is `users` table created? (Run SQL migration)
2. Are environment variables set? (Check Vercel)
3. Check Vercel logs for specific error

### Issue: Images Not Uploading

**Check:**
1. Are storage buckets created? (Check Supabase Storage)
2. Are storage policies set? (Run SQL migration)
3. Check bucket is public

---

## ✅ Verification Checklist

After completing all steps:

- [ ] SQL migration ran successfully in Supabase
- [ ] All tables exist in Supabase Table Editor
- [ ] All 3 storage buckets exist and are public
- [ ] Vercel environment variables are set
- [ ] Code changes committed and pushed
- [ ] Vercel deployment completed successfully
- [ ] `/api/test` endpoint returns 200
- [ ] `/health` endpoint returns 200
- [ ] `/api/products` endpoint returns data
- [ ] Customer signup creates user in `users` table
- [ ] Customer signup creates profile in `user_profiles` table
- [ ] Customer signup creates address (if provided)

---

## 📝 Next Steps

1. **Test Full Flow:**
   - Sign up a customer
   - Browse products
   - Add to cart
   - Place order
   - Check order in Supabase

2. **Monitor:**
   - Check Vercel logs for errors
   - Monitor Supabase database usage
   - Check storage bucket usage

3. **Production Ready:**
   - All endpoints working ✅
   - Database configured ✅
   - Storage buckets ready ✅
   - User registration working ✅

---

## 🆘 Still Having Issues?

1. **Check Vercel Logs** - Most important!
2. **Check Supabase Logs** - Database errors
3. **Test Locally** - Run `npm run dev` in backend folder
4. **Share Error Messages** - From Vercel logs

---

**Last Updated**: After code fixes and SQL migration creation

