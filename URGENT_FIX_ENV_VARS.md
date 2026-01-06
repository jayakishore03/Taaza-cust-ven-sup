# 🚨 URGENT: Fix "Invalid API key" Error

## Problem

The backend is returning "Invalid API key" errors because **environment variables are NOT being loaded** in Vercel serverless functions.

**Evidence:**
- POST `/api/users/addresses` → 500 "Invalid API key"
- GET `/api/users/profile` → 500 "Invalid API key"

## Root Cause

Environment variables are set in Vercel Dashboard, but they're **not being injected** into the serverless function at runtime.

## Solution: Verify Environment Variables

### Step 1: Check Vercel Logs for Environment Check

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select project: **taaza-customer**
3. Go to **Deployments** → Latest deployment → **Logs**
4. Look for these lines at the **START** of the function (when it first loads):

```
🔍 Environment Check on Function Start:
  SUPABASE_URL: ✅ SET (https://fcrhcwvpivkadkkbxcom...)
  SUPABASE_ANON_KEY: ✅ SET (eyJhbGciOiJIUzI1NiIsInR5cCI6...)
  SUPABASE_SERVICE_ROLE_KEY: ✅ SET (eyJhbGciOiJIUzI1NiIsInR5cCI6...)
```

**If you see "❌ MISSING"**, the variables are not loading.

### Step 2: Verify Environment Variables in Vercel

1. Go to **Settings** → **Environment Variables**
2. For each variable, verify:
   - ✅ Variable name is **exactly** correct (case-sensitive):
     - `SUPABASE_URL` (not `supabase_url` or `SUPABASEURL`)
     - `SUPABASE_ANON_KEY` (not `SUPABASE_ANON` or `ANON_KEY`)
     - `SUPABASE_SERVICE_ROLE_KEY` (not `SERVICE_ROLE_KEY`)
   - ✅ **Production** checkbox is checked ✅
   - ✅ **Preview** checkbox is checked ✅
   - ✅ **Development** checkbox is checked ✅
   - ✅ Value is complete (not truncated)

### Step 3: Delete and Re-Add Environment Variables

**IMPORTANT**: Sometimes Vercel doesn't pick up environment variables correctly. Try this:

1. **Delete** each environment variable:
   - Click **...** (three dots) → **Delete**
   - Confirm deletion

2. **Re-add** them one by one:

   **Variable 1:**
   - Click **"Add New"**
   - **Key**: `SUPABASE_URL`
   - **Value**: `https://fcrhcwvpivkadkkbxcom.supabase.co`
   - **Environments**: Check ✅ Production, ✅ Preview, ✅ Development
   - Click **"Save"**

   **Variable 2:**
   - Click **"Add New"**
   - **Key**: `SUPABASE_ANON_KEY`
   - **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcmhjd3ZwaXZrYWRra2J4Y29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MzUzMDQsImV4cCI6MjA4MDQxMTMwNH0.MjBw7_aVc2VlfND7Ec93sNOp352xcC0B8sZZvaH-Jkg`
   - **Environments**: Check ✅ Production, ✅ Preview, ✅ Development
   - Click **"Save"**

   **Variable 3:**
   - Click **"Add New"**
   - **Key**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcmhjd3ZwaXZrYWRra2J4Y29tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDgzNTMwNCwiZXhwIjoyMDgwNDExMzA0fQ.6rqVR8w-5dJE-wKHgB9ypbDVLgV1-VZP_4PqVKcGjyo`
   - **Environments**: Check ✅ Production, ✅ Preview, ✅ Development
   - Click **"Save"**

### Step 4: Force Redeploy (CRITICAL)

After re-adding variables:

1. Go to **Deployments** tab
2. Click on the **latest deployment**
3. Click **...** (three dots) → **Redeploy**
4. **IMPORTANT**: 
   - **Uncheck** "Use existing Build Cache" (or set it to OFF)
   - This forces Vercel to rebuild with new environment variables
5. Click **"Redeploy"**
6. Wait 2-3 minutes for deployment to complete

### Step 5: Verify Environment Variables Are Loaded

After redeploying, check the logs again:

1. Go to **Deployments** → Latest deployment → **Logs**
2. Look for the environment check at function start
3. Should show:
   ```
   🔍 Environment Check on Function Start:
     SUPABASE_URL: ✅ SET (https://fcrhcwvpivkadkkbxcom...)
     SUPABASE_ANON_KEY: ✅ SET (eyJhbGciOiJIUzI1NiIsInR5cCI6...)
     SUPABASE_SERVICE_ROLE_KEY: ✅ SET (eyJhbGciOiJIUzI1NiIsInR5cCI6...)
   ```

### Step 6: Test the Diagnostic Endpoint

Visit:
```
https://taaza-customer.vercel.app/health/supabase
```

**Expected Response:**
```json
{
  "success": true,
  "supabase": {
    "configured": true,
    "hasUrl": true,
    "hasAnonKey": true,
    "hasServiceKey": true,
    "connectionTest": {
      "success": true,
      "error": null
    }
  }
}
```

**If `"configured": false`**, environment variables are still not loading.

## Alternative: Use Vercel CLI

If the dashboard method doesn't work, use Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Navigate to backend folder
cd backend

# Remove existing variables (optional, to start fresh)
vercel env rm SUPABASE_URL production
vercel env rm SUPABASE_ANON_KEY production
vercel env rm SUPABASE_SERVICE_ROLE_KEY production

# Add variables
echo "https://fcrhcwvpivkadkkbxcom.supabase.co" | vercel env add SUPABASE_URL production
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcmhjd3ZwaXZrYWRra2J4Y29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MzUzMDQsImV4cCI6MjA4MDQxMTMwNH0.MjBw7_aVc2VlfND7Ec93sNOp352xcC0B8sZZvaH-Jkg" | vercel env add SUPABASE_ANON_KEY production
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcmhjd3ZwaXZrYWRra2J4Y29tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDgzNTMwNCwiZXhwIjoyMDgwNDExMzA0fQ.6rqVR8w-5dJE-wKHgB9ypbDVLgV1-VZP_4PqVKcGjyo" | vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Also add for preview and development
echo "https://fcrhcwvpivkadkkbxcom.supabase.co" | vercel env add SUPABASE_URL preview
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcmhjd3ZwaXZrYWRra2J4Y29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MzUzMDQsImV4cCI6MjA4MDQxMTMwNH0.MjBw7_aVc2VlfND7Ec93sNOp352xcC0B8sZZvaH-Jkg" | vercel env add SUPABASE_ANON_KEY preview
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcmhjd3ZwaXZrYWRra2J4Y29tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDgzNTMwNCwiZXhwIjoyMDgwNDExMzA0fQ.6rqVR8w-5dJE-wKHgB9ypbDVLgV1-VZP_4PqVKcGjyo" | vercel env add SUPABASE_SERVICE_ROLE_KEY preview

# Redeploy
vercel --prod
```

## Common Issues

### Issue 1: Variables Not Enabled for Production

**Symptom**: Variables exist but only for Preview/Development

**Fix**: Make sure **Production** checkbox is checked ✅

### Issue 2: Variable Names Have Typos

**Symptom**: Variables exist but with wrong names

**Fix**: Check exact spelling (case-sensitive):
- `SUPABASE_URL` (not `supabase_url`)
- `SUPABASE_ANON_KEY` (not `SUPABASE_ANON`)
- `SUPABASE_SERVICE_ROLE_KEY` (not `SERVICE_ROLE_KEY`)

### Issue 3: Old Deployment Still Active

**Symptom**: Variables are set but old deployment is still running

**Fix**: Force redeploy with build cache disabled

### Issue 4: Wrong Vercel Project

**Symptom**: Variables are set but in wrong project

**Fix**: Make sure you're editing **taaza-customer** project

## Verification Checklist

After fixing, verify:

- [ ] Vercel logs show environment variables are loaded (✅ SET)
- [ ] `/health/supabase` endpoint shows `"configured": true`
- [ ] `/health/supabase` endpoint shows `"connectionTest": { "success": true }`
- [ ] Address saving works in the app
- [ ] Profile fetching works in the app
- [ ] No more "Invalid API key" errors in Vercel logs

## Still Not Working?

If after all these steps it's still not working:

1. **Check Vercel project settings:**
   - Make sure you're in the correct project
   - Check if there are multiple projects with similar names

2. **Check Vercel team/organization:**
   - Environment variables are team-specific
   - Make sure you're in the correct team

3. **Contact Vercel support:**
   - Sometimes there are platform issues
   - Vercel support can check if environment variables are being injected correctly

4. **Check Vercel function logs:**
   - Look for the environment check at function start
   - If it shows "❌ MISSING", the variables are definitely not loading

