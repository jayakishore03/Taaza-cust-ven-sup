# ⚡ Quick Start: Fix Vercel 500 Error

## 🎯 What You Need to Do (3 Steps)

### Step 1: Run SQL Migration (5 minutes)
1. Go to: https://supabase.com/dashboard/project/fcrhcwvpivkadkkbxcom
2. Click **SQL Editor** → **New query**
3. Open: `backend/COMPLETE_SETUP_MIGRATION.sql`
4. Copy ALL content → Paste → Click **Run**
5. Wait for "✅ Migration completed successfully!"

### Step 2: Deploy Code Fixes (2 minutes)
```bash
cd backend
git add .
git commit -m "Fix Vercel 500 error - database.js improvements"
git push
```
Wait 2-3 minutes for Vercel to auto-deploy.

### Step 3: Test (1 minute)
Test these URLs:
- ✅ https://taaza-customer.vercel.app/api/test
- ✅ https://taaza-customer.vercel.app/health
- ✅ https://taaza-customer.vercel.app/api/products

**If all return 200 OK → You're done! ✅**

---

## 📊 What the SQL Migration Does

1. ✅ Disables RLS on all tables (for easier access)
2. ✅ Adds vendor columns to `shops` table
3. ✅ Creates 3 storage buckets (shop-images, shop-documents, product-images)
4. ✅ Sets up storage policies (anon + authenticated roles)
5. ✅ Fixes shops with local file paths
6. ✅ Adds `special_instructions` to orders table

---

## 👤 Customer Registration Flow

When customer registers in app:

```
Customer App
    ↓
POST /api/auth/signup
    ↓
Backend creates:
    ✅ users table → User account
    ✅ user_profiles table → User profile  
    ✅ addresses table → Delivery address (if provided)
    ↓
Returns JWT token
```

**This is already working!** ✅

---

## 🔍 If Still Getting 500 Error

1. **Check Vercel Logs:**
   - Dashboard → Deployments → Latest → Functions → `/api/index` → Logs
   - Look for first error message

2. **Check Environment Variables:**
   - Dashboard → Settings → Environment Variables
   - Ensure `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are set

3. **Verify Tables Exist:**
   - Supabase Dashboard → Table Editor
   - Check `users`, `user_profiles`, `addresses` tables exist

---

## ✅ Success Checklist

- [ ] SQL migration ran successfully
- [ ] Code pushed to Git (Vercel auto-deployed)
- [ ] `/api/test` returns 200 OK
- [ ] `/health` returns 200 OK
- [ ] `/api/products` returns data
- [ ] All tables exist in Supabase
- [ ] All 3 storage buckets exist

**If all checked → Everything is working! 🎉**

