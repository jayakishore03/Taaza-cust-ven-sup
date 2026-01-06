# Error Fix Summary - Address Saving Issues

## 🔴 Root Cause of Errors

### Error 1: "Session expired. Please sign in again."
**Why it happens:**
- The authentication token is not being loaded before making API calls
- Token might be expired or invalid
- Token is not being passed in the Authorization header

**Fixed:**
- ✅ Added `getAuthToken()` call before all address operations
- ✅ Added token validation and refresh logic
- ✅ Clear error messages with redirect to sign in

### Error 2: "Invalid API key"
**Why it happens:**
- **BACKEND CONFIGURATION ISSUE**: Vercel backend is missing Supabase environment variables
- The backend cannot connect to Supabase without these variables:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

**This is the MAIN issue causing address saving to fail!**

## ✅ Solution

### Step 1: Add Environment Variables to Vercel

The backend at `https://taaza-customer.vercel.app` needs Supabase credentials.

**Via Vercel Dashboard:**
1. Go to https://vercel.com/dashboard
2. Select project: **taaza-customer**
3. Go to **Settings** → **Environment Variables**
4. Add these 3 variables:

```
SUPABASE_URL = https://your-project.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

5. **IMPORTANT**: Select **Production**, **Preview**, and **Development**
6. Click **Save**
7. **Redeploy** (Deployments → ... → Redeploy)

**Get Supabase Credentials:**
1. Go to https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - Project URL → `SUPABASE_URL`
   - anon public key → `SUPABASE_ANON_KEY`
   - service_role key (secret) → `SUPABASE_SERVICE_ROLE_KEY`

### Step 2: Verify Backend is Working

After adding environment variables and redeploying:

```bash
# Test health endpoint
curl https://taaza-customer.vercel.app/health

# Should return:
# {"success":true,"message":"Taza API is running",...}
```

### Step 3: Check Vercel Logs

1. Go to Vercel Dashboard → Your Project
2. Go to **Deployments** → Latest deployment
3. Click **Logs** tab
4. Look for:
   - ✅ `SUPABASE_URL: ✅ SET`
   - ✅ `SUPABASE_ANON_KEY: ✅ SET`
   - ✅ `SUPABASE_SERVICE_ROLE_KEY: ✅ SET`

If you see `❌ MISSING`, the environment variables are not set correctly.

## 🔧 Code Changes Made

### 1. Frontend (`lib/api/client.ts`)
- ✅ Added detection for "Invalid API key" errors
- ✅ Better error messages explaining backend configuration issue
- ✅ Logs helpful debugging information

### 2. Frontend (`contexts/AuthContext.tsx`)
- ✅ Added `getAuthToken()` before all address operations
- ✅ Better session expiry handling
- ✅ Auto-clear token and user on session expiry
- ✅ Improved error messages

### 3. Frontend (`app/delivery-addresses.tsx`)
- ✅ Added authentication check before saving
- ✅ Better error handling with user-friendly messages
- ✅ Auto-redirect to sign in on session expiry
- ✅ Loading state to prevent duplicate saves

### 4. Backend (`backend/src/config/database.js`)
- ✅ Better error logging when Supabase is not configured
- ✅ Clear instructions in logs on how to fix

### 5. Backend (`backend/src/middleware/auth.js`)
- ✅ Better error detection for Supabase configuration issues
- ✅ Helpful error messages in logs

## 📋 Current Configuration

- **Backend URL**: `https://taaza-customer.vercel.app`
- **API Base URL**: `https://taaza-customer.vercel.app/api`
- **Health Check**: `https://taaza-customer.vercel.app/health`

## ✅ Expected Behavior After Fix

1. **User signs in** → Token is stored
2. **User goes to Profile → Delivery Addresses**
3. **User adds/edits address** → Token is loaded before API call
4. **Backend receives request** → Validates token with Supabase
5. **Backend saves to Supabase** → Address saved to `addresses` table
6. **Success message shown** → Address appears in list

## 🐛 If Errors Persist

### Check 1: Vercel Environment Variables
- Go to Vercel Dashboard → Settings → Environment Variables
- Verify all 3 Supabase variables are set
- Make sure they're enabled for Production

### Check 2: Vercel Logs
- Check latest deployment logs
- Look for "Missing Supabase environment variables"
- If you see this, environment variables are not set

### Check 3: Supabase Database
- Verify the SQL migration has been run
- Check that `addresses` table exists
- Verify RLS is disabled (as per migration)

### Check 4: Token in App
- Sign out and sign in again
- Check that token is being stored in AsyncStorage
- Verify token is being sent in Authorization header

## 📝 SQL Migration Status

The SQL migration you provided:
- ✅ Disables RLS on all tables
- ✅ Creates `addresses` table structure
- ✅ Sets up storage buckets
- ✅ Creates storage policies

**Make sure this migration has been run in Supabase SQL Editor!**

## 🎯 Next Steps

1. **Add environment variables to Vercel** (CRITICAL!)
2. **Redeploy backend** on Vercel
3. **Test address saving** in the app
4. **Check Vercel logs** to verify Supabase connection
5. **Verify addresses** are saved in Supabase dashboard

Once environment variables are set, all errors should be resolved! 🎉


