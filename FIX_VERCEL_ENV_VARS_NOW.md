# 🔴 URGENT: Fix Vercel 500 Error - Add Environment Variables

## The Problem
Your Vercel deployment is crashing with:
```
Error: Missing Supabase environment variables. Please check...
500: INTERNAL_SERVER_ERROR
```

## ✅ Quick Fix (5 minutes)

### Step 1: Open Vercel Dashboard
**Direct Link:** https://vercel.com/kishore-projects/backend/settings/environment-variables

### Step 2: Add These 3 Variables

Click **"Add New"** for each:

#### 1. SUPABASE_URL
```
https://fcrhcwvpivkadkkbxcom.supabase.co
```
- ✅ Production, ✅ Preview, ✅ Development

#### 2. SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcmhjd3ZwaXZrYWRra2J4Y29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MzUzMDQsImV4cCI6MjA4MDQxMTMwNH0.MjBw7_aVc2VlfND7Ec93sNOp352xcC0B8sZZvaH-Jkg
```
- ✅ Mark as sensitive
- ✅ Production, ✅ Preview, ✅ Development

#### 3. SUPABASE_SERVICE_ROLE_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcmhjd3ZwaXZrYWRra2J4Y29tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDgzNTMwNCwiZXhwIjoyMDgwNDExMzA0fQ.6rqVR8w-5dJE-wKHgB9ypbDVLgV1-VZP_4PqVKcGjyo
```
- ✅ Mark as sensitive
- ✅ Production, ✅ Preview, ✅ Development

### Step 3: Redeploy
1. Go to **Deployments** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**
4. Wait 2-3 minutes

### Step 4: Test
Visit: https://taaza-customer.vercel.app/health

Should return:
```json
{
  "success": true,
  "message": "Taza API is running"
}
```

## ✅ Done!
Your backend should now work correctly.

