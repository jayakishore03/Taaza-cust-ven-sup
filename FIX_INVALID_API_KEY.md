# Fix Invalid API Key Error

## Problem
The health endpoint shows: `"error": "Invalid API key"`

This means the environment variables are set in Vercel, but the **API key values are incorrect**.

## Solution: Update API Keys in Vercel

### Step 1: Get Correct Keys from Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. You'll see:
   - **Project URL** → Copy this (for `SUPABASE_URL`)
   - **anon public** key → Copy this (for `SUPABASE_ANON_KEY`)
   - **service_role** key → Copy this (for `SUPABASE_SERVICE_ROLE_KEY`) - **This is secret!**

### Step 2: Update Keys in Vercel

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. For each variable, click the **"..."** menu → **Edit**
3. **Delete the old value** and paste the **correct value** from Supabase
4. Make sure there are **no extra spaces** before or after the values
5. Click **Save**

### Step 3: Verify Keys Match

**SUPABASE_URL should look like:**
```
https://fcrhcwvpivkadkkbxcom.supabase.co
```

**SUPABASE_ANON_KEY should start with:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**SUPABASE_SERVICE_ROLE_KEY should start with:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Important:** The `SUPABASE_SERVICE_ROLE_KEY` is different from `SUPABASE_ANON_KEY` - make sure you're using the **service_role** key, not the anon key twice!

### Step 4: Redeploy

After updating the keys:
1. Go to **Deployments**
2. Click **"..."** on the latest deployment
3. Select **"Redeploy"**

### Step 5: Test Again

After redeploying, test the health endpoint:
```
https://taaza-customer.vercel.app/health/supabase
```

You should see:
```json
{
  "connectionTest": {
    "success": true,
    "error": null
  }
}
```

## Common Mistakes

1. **Using anon key for service_role key** - Make sure you're using the correct key type
2. **Copying keys from wrong project** - Verify you're in the correct Supabase project
3. **Extra spaces** - Make sure there are no spaces when pasting
4. **Keys expired** - Supabase keys don't expire, but make sure you're copying the current keys

## Quick Check

After updating, the health endpoint should show:
- ✅ `"hasUrl": true`
- ✅ `"hasAnonKey": true`
- ✅ `"hasServiceKey": true`
- ✅ `"connectionTest": { "success": true }`

If `connectionTest.success` is still `false`, the keys are still incorrect.
