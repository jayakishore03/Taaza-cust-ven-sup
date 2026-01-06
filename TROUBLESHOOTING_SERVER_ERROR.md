# 🔧 Troubleshooting "Server Error" When Saving Address

## Quick Diagnostic Steps

### Step 1: Check Supabase Configuration

Visit this URL in your browser:
```
https://taaza-customer.vercel.app/health/supabase
```

**Expected Response (Good):**
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

**If you see errors:**
- `"configured": false` → Environment variables are missing
- `"connectionTest": { "success": false }` → Supabase connection is failing

### Step 2: Check Vercel Logs

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select project: **taaza-customer**
3. Go to **Deployments** → Latest deployment → **Logs**
4. Look for:
   - ✅ **Good**: "Supabase client initialized" or "Supabase admin client initialized"
   - ❌ **Bad**: "Missing Supabase environment variables" or "Invalid API key"

### Step 3: Verify Environment Variables

1. Go to Vercel Dashboard → **Settings** → **Environment Variables**
2. Verify all 3 variables exist:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. **IMPORTANT**: Make sure they're enabled for **Production** environment
4. Check the "Last Updated" timestamp - should be recent (after your redeploy)

## Common Issues & Solutions

### Issue 1: Environment Variables Not Loaded

**Symptoms:**
- `/health/supabase` shows `"configured": false`
- Vercel logs show "Missing Supabase environment variables"

**Solution:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Verify all 3 variables are there
3. **Make sure they're enabled for Production** (check the Production checkbox)
4. **Redeploy** the project:
   - Go to Deployments tab
   - Click **...** (three dots) on latest deployment
   - Click **Redeploy**

### Issue 2: Invalid Supabase Credentials

**Symptoms:**
- `/health/supabase` shows `"connectionTest": { "success": false }`
- Error message includes "Invalid API key" or "JWT"

**Solution:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the correct values:
   - **Project URL** → `SUPABASE_URL`
   - **anon public key** → `SUPABASE_ANON_KEY`
   - **service_role key** (secret) → `SUPABASE_SERVICE_ROLE_KEY`
5. Update in Vercel (Settings → Environment Variables)
6. **Redeploy**

### Issue 3: Database Table Missing

**Symptoms:**
- `/health/supabase` shows connection success but address save fails
- Error: "relation 'addresses' does not exist"

**Solution:**
1. Go to Supabase Dashboard → **SQL Editor**
2. Run this to check if table exists:
   ```sql
   SELECT * FROM addresses LIMIT 1;
   ```
3. If table doesn't exist, run your migration SQL

### Issue 4: RLS (Row Level Security) Policy Blocking

**Symptoms:**
- Connection works but insert fails
- Error: "new row violates row-level security policy"

**Solution:**
1. Go to Supabase Dashboard → **Authentication** → **Policies**
2. Check `addresses` table policies
3. Make sure there's a policy allowing inserts for authenticated users
4. Or temporarily disable RLS for testing (not recommended for production)

## Testing After Fix

1. **Check health endpoint:**
   ```
   https://taaza-customer.vercel.app/health/supabase
   ```
   Should show all green ✅

2. **Try saving address in app:**
   - Open customer app
   - Sign in
   - Go to Profile → Delivery Addresses
   - Add new address
   - Should save successfully ✅

3. **Verify in Supabase:**
   - Go to Supabase Dashboard → **Table Editor** → **addresses**
   - Your new address should appear

## Still Not Working?

If you've tried all the above and it's still not working:

1. **Check Vercel Function Logs:**
   - Go to Vercel Dashboard → Deployments → Latest → **Functions** tab
   - Look for any errors during function execution

2. **Test API directly:**
   ```bash
   # Get your auth token from the app (check AsyncStorage or network tab)
   curl -X POST https://taaza-customer.vercel.app/api/users/addresses \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "contactName": "Test",
       "phone": "1234567890",
       "street": "123 Test St",
       "city": "Test City",
       "state": "Test State",
       "postalCode": "12345"
     }'
   ```

3. **Check backend code:**
   - Make sure `backend/src/config/database.js` is correctly importing Supabase
   - Verify `backend/src/controllers/usersController.js` is using `supabaseAdmin`

## Need More Help?

If none of the above works, check:
- Vercel deployment logs for specific error messages
- Supabase logs for database errors
- Network tab in browser/app for actual API response

