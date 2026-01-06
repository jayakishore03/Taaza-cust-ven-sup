# 🔍 Diagnose 500 Error - Step by Step

## Current Situation
- ✅ Environment variables are set in Vercel
- ❌ Even `/api/health` endpoint crashes (500 error)
- ❌ This means the Express app fails to initialize

## What This Means
Since even the health endpoint fails, the problem is happening **during module loading**, not during route execution. This suggests:
1. **Import error** - One of the imported modules has an error
2. **Initialization error** - Code runs at import time and crashes
3. **Missing dependency** - A required package is missing

---

## Step 1: Check Vercel Function Logs

**This is the most important step!**

1. Go to: https://vercel.com/dashboard
2. Click your project: **taaza-customer**
3. Click **Deployments** → Latest deployment
4. Click **Functions** → `/api/index`
5. Click **Logs** tab
6. Look for the **first error message**

**What to look for:**
- `Error: Cannot find module`
- `SyntaxError`
- `TypeError`
- `Error loading Express app`

**Share the exact error message!**

---

## Step 2: Test Minimal Server

I've created a minimal test server at `backend/api/test-server.js`.

### Option A: Temporarily Replace index.js
1. Backup `backend/api/index.js`
2. Copy `backend/api/test-server.js` to `backend/api/index.js`
3. Deploy to Vercel
4. Test: `https://taaza-customer.vercel.app/api/test`

**If this works:** The problem is in the main server.js or route imports
**If this fails:** The problem is with Vercel configuration or Express itself

### Option B: Create Separate Test Endpoint
Add this to `backend/api/test-minimal.js`:

```javascript
export default function handler(req, res) {
  res.json({
    success: true,
    message: 'Minimal function works',
    env: {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
    }
  });
}
```

Then test: `https://taaza-customer.vercel.app/api/test-minimal`

---

## Step 3: Check for Common Issues

### Issue 1: Missing Package
Check if `@supabase/supabase-js` is in `package.json`:
```bash
cd backend
cat package.json | grep supabase
```

### Issue 2: Import Error in Route
Try commenting out route imports one by one in `server.js`:

```javascript
// Comment out one at a time to find the problematic route
// import authRoutes from './routes/auth.js';
import productsRoutes from './routes/products.js';
// ...
```

### Issue 3: Database Initialization Error
The `database.js` file might be throwing an error. Check if:
- Supabase client creation fails
- RPC binding fails
- Mock client setup fails

---

## Step 4: Add Better Error Logging

I've already improved error handling in:
- `backend/api/index.js` - Better error messages
- `backend/src/config/database.js` - Safer RPC binding

**After deploying these changes, check logs again!**

---

## Most Likely Causes (Based on Code)

### 1. Database.js RPC Binding Error (FIXED)
**Status**: ✅ Fixed - Added safe RPC binding with try-catch

### 2. Missing Route File
**Check**: All route files exist in `backend/src/routes/`
**Status**: ✅ Verified - All files exist

### 3. Import Error in Route
**Check**: One route file might have a syntax error
**Action**: Check Vercel logs for specific file name

### 4. Missing Service File
**Check**: `emailService.js` exists
**Status**: ✅ Verified - File exists

---

## Quick Fix: Deploy Updated Code

I've made these improvements:
1. ✅ Safer database.js initialization
2. ✅ Better error handling in api/index.js
3. ✅ Optional static images directory

**Next Steps:**
1. Commit these changes
2. Push to your repository
3. Vercel will auto-deploy
4. Check logs again after deployment

---

## What to Share

When checking Vercel logs, share:
1. **First error message** (the one that caused the crash)
2. **Stack trace** (if available)
3. **Which endpoint** was called when it failed

This will help identify the exact issue!

---

## Alternative: Test Locally First

Before deploying to Vercel, test locally:

```bash
cd backend
npm install
npm run dev
```

Then test:
- http://localhost:3000/health
- http://localhost:3000/api/test
- http://localhost:3000/api/products

**If it works locally but fails on Vercel:**
- Environment variables issue
- Vercel build configuration issue
- Missing files in deployment

**If it fails locally too:**
- Code issue (easier to debug with local error messages)

