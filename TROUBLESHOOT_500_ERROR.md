# 🔧 Troubleshoot 500 Error After Redeployment

## Step 1: Check Vercel Logs

1. Go to: https://vercel.com/kishore-projects/backend/deployments
2. Click on the **latest deployment** (the one that's failing)
3. Click **"Functions"** tab
4. Click on **`/api/index`** function
5. Click **"Logs"** tab
6. Look for error messages

## Step 2: Common Errors & Solutions

### Error: "Missing Supabase environment variables"
**Solution:** Make sure you added all 3 variables:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`  
- `SUPABASE_SERVICE_ROLE_KEY`

**Check:** Go to Settings → Environment Variables and verify they're all there.

### Error: "Cannot find module" or "Import error"
**Solution:** The code might have a syntax error. Check:
1. Did you commit the latest changes?
2. Are there any import errors in the logs?

### Error: "Server initialization failed"
**Solution:** Check the full error stack in logs to see what's failing.

## Step 3: Verify Environment Variables

1. Go to: https://vercel.com/kishore-projects/backend/settings/environment-variables
2. Verify these are set for **Production**:
   - ✅ `SUPABASE_URL`
   - ✅ `SUPABASE_ANON_KEY`
   - ✅ `SUPABASE_SERVICE_ROLE_KEY`
   - ✅ `NODE_ENV` = `production` (optional but recommended)

## Step 4: Test After Fix

Once you fix the issue and redeploy:

1. **Test Health Endpoint:**
   ```
   https://taaza-customer.vercel.app/health
   ```
   Should return: `{"success": true, "message": "Taza API is running"}`

2. **Test API Endpoint:**
   ```
   https://taaza-customer.vercel.app/api
   ```
   Should return API documentation.

3. **Test Products:**
   ```
   https://taaza-customer.vercel.app/api/products
   ```
   Should return a list of products.

## Step 5: If Still Failing

1. **Check the exact error message** in Vercel logs
2. **Copy the full error stack trace**
3. **Verify environment variables** are actually saved (refresh the page)
4. **Try redeploying** again after a few minutes

## Quick Debug Checklist

- [ ] Environment variables are set in Vercel
- [ ] Environment variables are set for **Production** environment
- [ ] Latest code is committed and pushed
- [ ] Deployment completed (not still building)
- [ ] Checked Vercel logs for specific error
- [ ] Tested `/health` endpoint

