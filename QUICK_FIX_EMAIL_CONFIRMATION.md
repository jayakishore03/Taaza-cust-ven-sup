# Quick Fix: Email Confirmation Error

## Problem
Vendor sign-in fails with "Email not confirmed" because:
1. Email confirmation endpoint returns 404 (not deployed)
2. Email is not confirmed in Supabase

## ✅ Quick Fix (Choose One)

### Option 1: Disable Email Confirmation (Recommended for Development)

**Steps:**
1. Go to **Supabase Dashboard** → Your Project
2. Click **Authentication** → **Settings** (gear icon)
3. Scroll to **"Email Auth"** section
4. Find **"Enable email confirmations"** toggle
5. **Turn it OFF** (disable)
6. Click **Save**

**Result:** Vendors can sign in immediately without email confirmation.

---

### Option 2: Manually Confirm Email

**Steps:**
1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Search for the vendor email (e.g., `akila@gmail.com`)
3. Click on the user
4. Find **"Email Confirmed"** section
5. Click **"Confirm Email"** button
6. User can now sign in

---

### Option 3: Deploy Backend with Confirmation Endpoint

The endpoint exists in code but needs to be deployed:

1. **Check if code is committed:**
   ```bash
   git status
   git add .
   git commit -m "Add email confirmation endpoint"
   git push
   ```

2. **Vercel should auto-deploy**, or manually trigger deployment

3. **Verify endpoint exists:**
   ```bash
   curl -X POST https://taaza-customer.vercel.app/api/auth/confirm-vendor-email \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com"}'
   ```

---

## Recommended Action

**For immediate fix:** Use **Option 1** (Disable email confirmation)

**For production:** 
- Keep confirmations enabled
- Deploy backend with confirmation endpoint (Option 3)
- Or implement proper email confirmation flow

---

## Current Error Message

The app now shows a helpful error message with instructions when email is not confirmed.
