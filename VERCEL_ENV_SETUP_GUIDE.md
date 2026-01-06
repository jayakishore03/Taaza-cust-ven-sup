# Vercel Environment Variables Setup Guide

## 🔴 CRITICAL: Fix "Invalid API key" Error

The error "Invalid API key" occurs because the Vercel backend doesn't have Supabase environment variables configured.

## ✅ Solution: Add Environment Variables to Vercel

### Step 1: Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy these values:
   - **Project URL** → `SUPABASE_URL`
   - **anon public key** → `SUPABASE_ANON_KEY`
   - **service_role key** (secret) → `SUPABASE_SERVICE_ROLE_KEY`

### Step 2: Add to Vercel

#### Option A: Via Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **taaza-customer**
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

```
SUPABASE_URL = https://your-project.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV = production
```

5. **IMPORTANT**: Select **Production**, **Preview**, and **Development** for all variables
6. Click **Save**
7. **Redeploy** your project (go to Deployments → ... → Redeploy)

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Login to Vercel
vercel login

# Navigate to backend folder
cd backend

# Add environment variables
vercel env add SUPABASE_URL production
# Paste your Supabase URL when prompted

vercel env add SUPABASE_ANON_KEY production
# Paste your anon key when prompted

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Paste your service role key when prompted

vercel env add NODE_ENV production
# Type: production

# Redeploy
vercel --prod
```

### Step 3: Verify Environment Variables

After redeploying, test the API:

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

### Step 4: Test Address Saving

1. Open the customer app
2. Sign in
3. Go to Profile → Delivery Addresses
4. Try to add an address
5. Should work without "Invalid API key" error

## 🔍 Verify Backend Configuration

The backend checks for environment variables on startup. If missing, it logs:

```
❌ Missing Supabase environment variables!
SUPABASE_URL: MISSING
SUPABASE_ANON_KEY: MISSING
SUPABASE_SERVICE_ROLE_KEY: MISSING
```

Check Vercel logs:
1. Go to Vercel Dashboard
2. Select your project
3. Go to **Deployments** → Click on latest deployment
4. Check **Logs** tab
5. Look for Supabase configuration messages

## 🐛 Troubleshooting

### Error: "Invalid API key"
- **Cause**: Supabase environment variables not set in Vercel
- **Fix**: Add environment variables (see Step 2 above)
- **Verify**: Check Vercel logs for "Missing Supabase environment variables"

### Error: "Session expired"
- **Cause**: Token expired or not being passed correctly
- **Fix**: 
  1. Sign out and sign in again
  2. Check that token is being sent in Authorization header
  3. Verify backend authentication middleware is working

### Error: "Cannot connect to backend"
- **Cause**: API URL incorrect or backend not deployed
- **Fix**: 
  1. Verify API URL in `lib/api/client.ts` is `https://taaza-customer.vercel.app/api`
  2. Check Vercel deployment is successful
  3. Test health endpoint: `https://taaza-customer.vercel.app/health`

## 📝 Current Configuration

- **Backend URL**: `https://taaza-customer.vercel.app`
- **API Base URL**: `https://taaza-customer.vercel.app/api`
- **Health Check**: `https://taaza-customer.vercel.app/health`

## ✅ After Setup

Once environment variables are set:
1. ✅ Backend can connect to Supabase
2. ✅ Addresses will save to Supabase `addresses` table
3. ✅ Authentication will work correctly
4. ✅ No more "Invalid API key" errors


