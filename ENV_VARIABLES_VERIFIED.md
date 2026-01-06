# ✅ Environment Variables Verified

## Supabase Credentials

The following environment variables have been verified and are ready to use:

### Values:
```
SUPABASE_URL=https://fcrhcwvpivkadkkbxcom.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcmhjd3ZwaXZrYWRra2J4Y29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MzUzMDQsImV4cCI6MjA4MDQxMTMwNH0.MjBw7_aVc2VlfND7Ec93sNOp352xcC0B8sZZvaH-Jkg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcmhjd3ZwaXZrYWRra2J4Y29tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDgzNTMwNCwiZXhwIjoyMDgwNDExMzA0fQ.6rqVR8w-5dJE-wKHgB9ypbDVLgV1-VZP_4PqVKcGjyo
```

## ✅ Verification Status

- ✅ **SUPABASE_URL**: Valid format (https://fcrhcwvpivkadkkbxcom.supabase.co)
- ✅ **SUPABASE_ANON_KEY**: Valid JWT token format
- ✅ **SUPABASE_SERVICE_ROLE_KEY**: Valid JWT token format
- ✅ **Values match** the PowerShell script (`backend/add-vercel-env.ps1`)

## 🚀 Next Steps: Add to Vercel

### Option 1: Using PowerShell Script (Easiest)

1. Open PowerShell
2. Navigate to backend folder:
   ```powershell
   cd backend
   ```
3. Run the script:
   ```powershell
   .\add-vercel-env.ps1
   ```

This script will:
- ✅ Add all environment variables to Vercel
- ✅ Set them for production environment
- ✅ Automatically redeploy your backend

### Option 2: Manual Setup via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **taaza-customer**
3. Go to **Settings** → **Environment Variables**
4. Add each variable:

   **Variable 1:**
   - Name: `SUPABASE_URL`
   - Value: `https://fcrhcwvpivkadkkbxcom.supabase.co`
   - Environment: Select **Production**, **Preview**, and **Development**
   - Click **Save**

   **Variable 2:**
   - Name: `SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcmhjd3ZwaXZrYWRra2J4Y29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MzUzMDQsImV4cCI6MjA4MDQxMTMwNH0.MjBw7_aVc2VlfND7Ec93sNOp352xcC0B8sZZvaH-Jkg`
   - Environment: Select **Production**, **Preview**, and **Development**
   - Click **Save**

   **Variable 3:**
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcmhjd3ZwaXZrYWRra2J4Y29tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDgzNTMwNCwiZXhwIjoyMDgwNDExMzA0fQ.6rqVR8w-5dJE-wKHgB9ypbDVLgV1-VZP_4PqVKcGjyo`
   - Environment: Select **Production**, **Preview**, and **Development**
   - Click **Save**

5. **IMPORTANT**: After adding all variables, **redeploy** your project:
   - Go to **Deployments** tab
   - Click **...** (three dots) on the latest deployment
   - Click **Redeploy**

### Option 3: Using Vercel CLI

```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Login to Vercel
vercel login

# Navigate to backend folder
cd backend

# Add environment variables (paste values when prompted)
vercel env add SUPABASE_URL production
# Paste: https://fcrhcwvpivkadkkbxcom.supabase.co

vercel env add SUPABASE_ANON_KEY production
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcmhjd3ZwaXZrYWRra2J4Y29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MzUzMDQsImV4cCI6MjA4MDQxMTMwNH0.MjBw7_aVc2VlfND7Ec93sNOp352xcC0B8sZZvaH-Jkg

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcmhjd3ZwaXZrYWRra2J4Y29tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDgzNTMwNCwiZXhwIjoyMDgwNDExMzA0fQ.6rqVR8w-5dJE-wKHgB9ypbDVLgV1-VZP_4PqVKcGjyo

# Redeploy
vercel --prod
```

## ✅ Verification After Setup

After adding environment variables and redeploying:

1. **Test Health Endpoint:**
   ```bash
   curl https://taaza-customer.vercel.app/health
   ```
   Should return:
   ```json
   {
     "success": true,
     "message": "Taza API is running",
     "timestamp": "..."
   }
   ```

2. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Your Project → Deployments
   - Click on latest deployment → **Logs** tab
   - Should NOT see "Missing Supabase environment variables"
   - Should see successful Supabase connection

3. **Test in App:**
   - Open customer app
   - Sign in
   - Go to Profile → Delivery Addresses
   - Try to add an address
   - Should work without "Invalid API key" error

## 🔍 Troubleshooting

### Still seeing "Invalid API key" error?

1. **Verify variables are set:**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Make sure all 3 variables are listed
   - Make sure they're enabled for **Production** environment

2. **Check deployment:**
   - Make sure you **redeployed** after adding variables
   - Old deployments don't have the new variables

3. **Check Vercel logs:**
   - Go to Deployments → Latest → Logs
   - Look for "Missing Supabase environment variables" message
   - If you see it, variables weren't added correctly

4. **Verify values:**
   - Double-check you copied the full keys (they're long!)
   - Make sure there are no extra spaces or line breaks

## 📝 Notes

- These environment variables are **sensitive** - never commit them to Git
- The `.env` file is gitignored for local development
- Vercel automatically injects environment variables at runtime
- After adding variables, **always redeploy** for changes to take effect

