# Verify Vercel Environment Variables

## Step 1: Verify Environment Variables in Vercel

1. Go to your Vercel Dashboard
2. Select your project: `taaza-customer`
3. Go to **Settings** → **Environment Variables**
4. Verify these three variables are set:
   - `SUPABASE_URL` ✅
   - `SUPABASE_ANON_KEY` ✅
   - `SUPABASE_SERVICE_ROLE_KEY` ✅

## Step 2: Redeploy Backend (IMPORTANT!)

**After adding or updating environment variables, you MUST redeploy:**

1. In Vercel Dashboard, go to **Deployments**
2. Click the **"..."** menu on the latest deployment
3. Select **"Redeploy"**
4. Or push a new commit to trigger a new deployment

## Step 3: Test Supabase Configuration

After redeploying, test the configuration:

```bash
# Test the health endpoint
curl https://taaza-customer.vercel.app/health/supabase
```

Expected response:
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

## Step 4: Check Vercel Logs

1. Go to Vercel Dashboard → **Deployments**
2. Click on the latest deployment
3. Go to **Functions** tab
4. Check the logs for:
   - `✅ Supabase client initialized with anon key`
   - `✅ Supabase admin client initialized with service role key`
   - `✅ SET` for all environment variables

## Common Issues

### Issue 1: Variables Set But Still Getting Errors
**Solution:** Redeploy the backend. Environment variables only take effect after redeployment.

### Issue 2: "Invalid API key" Error
**Possible causes:**
- Wrong key copied (make sure you're using the correct keys from Supabase)
- Trailing spaces in the values
- Keys from wrong Supabase project

**Solution:**
1. Double-check the keys in Supabase Dashboard → Settings → API
2. Copy the keys again and update in Vercel
3. Make sure there are no extra spaces
4. Redeploy

### Issue 3: Variables Show as "SET" But Connection Fails
**Possible causes:**
- Supabase project is paused
- Network/firewall issues
- Wrong Supabase URL

**Solution:**
1. Check Supabase Dashboard to ensure project is active
2. Verify the `SUPABASE_URL` matches your project URL exactly
3. Test the connection using the `/health/supabase` endpoint

## Quick Test

After redeploying, try adding an address in the app. If it works, the configuration is correct!

