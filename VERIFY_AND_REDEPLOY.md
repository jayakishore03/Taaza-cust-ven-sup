# Verify Keys and Redeploy

## Current Status
The health endpoint still shows: `"error": "Invalid API key"`

This means either:
1. Keys weren't saved correctly in Vercel
2. Backend wasn't redeployed after updating keys

## Step-by-Step Fix

### Step 1: Verify Keys in Vercel

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

2. For each variable, click the **eye icon** to reveal the value:

   **SUPABASE_SERVICE_ROLE_KEY** should be:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcmhjd3ZwaXZrYWRra2J4Y29tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDgzNTMwNCwiZXhwIjoyMDgwNDExMzA0fQ.6rqVR8w-5dJE-wKHgB9ypbDVLgV1-VZP_4PqVKcGjyo
   ```

   **SUPABASE_ANON_KEY** should be:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcmhjd3ZwaXZrYWRra2J4Y29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MzUzMDQsImV4cCI6MjA4MDQxMTMwNH0.MjBw7_aVc2VlfND7Ec93sNOp352xcC0B8sZZvaH-Jkg
   ```

   **SUPABASE_URL** should be:
   ```
   https://fcrhcwvpivkadkkbxcom.supabase.co
   ```

3. If any value is different:
   - Click **"..."** → **Edit**
   - Delete the old value completely
   - Paste the correct value (no spaces)
   - Click **Save**

### Step 2: Redeploy (CRITICAL!)

**Environment variables only take effect after redeployment!**

1. Go to **Vercel Dashboard** → **Deployments**
2. Find the latest deployment
3. Click the **"..."** menu (three dots) on the right
4. Select **"Redeploy"**
5. Wait for deployment to complete (usually 20-30 seconds)

### Step 3: Verify After Redeploy

After redeploying, test the health endpoint:
```
https://taaza-customer.vercel.app/health/supabase
```

**Expected result:**
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

If `connectionTest.success` is `true`, the keys are working!

### Step 4: Test in App

After redeploying and verifying the health endpoint:
1. Try adding an address in the app
2. It should work without the "Server Error" dialog

## Troubleshooting

### If keys are correct but still getting errors:
1. Make sure you clicked **Save** after editing each variable
2. Make sure you **Redeployed** after updating
3. Wait 1-2 minutes after redeploy for changes to propagate
4. Check Vercel logs to see if there are any errors

### If connectionTest.success is still false:
- Double-check you copied the keys from the correct Supabase project
- Make sure there are no extra spaces or line breaks in the values
- Verify the keys haven't been rotated in Supabase



