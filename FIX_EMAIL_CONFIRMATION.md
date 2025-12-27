# Fix Email Confirmation Issue

## Problem
Vendor sign-in fails with "Email not confirmed" error, and the auto-confirmation endpoint returns 404.

## Solutions

### Solution 1: Disable Email Confirmation in Supabase (Recommended for Development)

1. Go to **Supabase Dashboard** → Your Project
2. Navigate to **Authentication** → **Settings** → **Email Auth**
3. Find **"Enable email confirmations"** toggle
4. **Turn it OFF** (disable email confirmations)
5. Save changes

**Result:** Vendors can sign in immediately after registration without email confirmation.

---

### Solution 2: Manually Confirm Email in Supabase Dashboard

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Find the vendor user by email (e.g., `akila@gmail.com`)
3. Click on the user
4. Click **"Confirm Email"** button or set `email_confirmed_at` to current timestamp
5. User can now sign in

---

### Solution 3: Deploy Backend with Confirmation Endpoint

The endpoint `/api/auth/confirm-vendor-email` exists in code but returns 404 on Vercel.

**To fix:**
1. Make sure backend code is committed and pushed to your repository
2. Vercel should auto-deploy, or manually trigger deployment
3. Verify endpoint exists: `https://taaza-customer.vercel.app/api/auth/confirm-vendor-email`

**Test endpoint:**
```bash
curl -X POST https://taaza-customer.vercel.app/api/auth/confirm-vendor-email \
  -H "Content-Type: application/json" \
  -d '{"email": "akila@gmail.com"}'
```

---

### Solution 4: Use Supabase Admin API Directly (Not Recommended)

**Warning:** This requires exposing service role key, which is a security risk.

If you must do this, you can call Supabase Admin API directly from the frontend, but **this is NOT recommended** for production.

---

## Quick Fix (Immediate)

**For development/testing, use Solution 1:**
1. Disable email confirmations in Supabase
2. Vendors can sign in immediately
3. Re-enable for production when ready

---

## Current Code Behavior

The code now:
- ✅ Tries to call confirmation endpoint
- ✅ If 404, tries sign-in anyway (email might be confirmed)
- ✅ Provides helpful error messages
- ✅ Handles all error cases gracefully

**But the root issue is:** Email confirmation is required in Supabase, and the endpoint to auto-confirm doesn't exist on the deployed backend.

---

## Recommended Action

**For now:** Disable email confirmations in Supabase (Solution 1)

**For production:** 
1. Deploy backend with confirmation endpoint (Solution 3)
2. Or keep confirmations disabled if not needed
3. Or implement proper email confirmation flow
