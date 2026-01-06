# 🔴 URGENT: Add Environment Variables to Fix "Missing Supabase" Error

## The Error You're Seeing

```
Error: Missing Supabase environment variables. Please check...
```

Both `taaza-customer.vercel.app` and `backend` are returning 500 errors because they don't have Supabase credentials.

---

## ✅ SOLUTION: Add Environment Variables via Vercel Dashboard

### Step 1: Go to Vercel Dashboard

**Click here:** https://vercel.com/kishore-projects/backend/settings/environment-variables

### Step 2: Add These 4 Variables

Click **"Add New"** for each variable:

#### 1. SUPABASE_URL
```
https://fcrhcwvpivkadkkbxcom.supabase.co
```
- Environment: **Production**  
- Click **Save**

#### 2. SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcmhjd3ZwaXZrYWRra2J4Y29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MzUzMDQsImV4cCI6MjA4MDQxMTMwNH0.MjBw7_aVc2VlfND7Ec93sNOp352xcC0B8sZZvaH-Jkg
```
- Environment: **Production**
- Mark as sensitive: **Yes**
- Click **Save**

#### 3. SUPABASE_SERVICE_ROLE_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcmhjd3ZwaXZrYWRra2J4Y29tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDgzNTMwNCwiZXhwIjoyMDgwNDExMzA0fQ.6rqVR8w-5dJE-wKHgB9ypbDVLgV1-VZP_4PqVKcGjyo
```
- Environment: **Production**
- Mark as sensitive: **Yes**
- Click **Save**

#### 4. NODE_ENV
```
production
```
- Environment: **Production**
- Click **Save**

### Step 3: Redeploy

After adding all 4 variables, redeploy:

```bash
cd backend
vercel --prod
```

Or click **"Redeploy"** button in Vercel dashboard.

---

## Alternative: Use CLI (Copy & Paste Each Command)

```powershell
cd backend

# SUPABASE_URL
$env:SUPABASE_URL="https://fcrhcwvpivkadkkbxcom.supabase.co"; echo $env:SUPABASE_URL | vercel env add SUPABASE_URL production

# SUPABASE_ANON_KEY  
$env:SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcmhjd3ZwaXZrYWRra2J4Y29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MzUzMDQsImV4cCI6MjA4MDQxMTMwNH0.MjBw7_aVc2VlfND7Ec93sNOp352xcC0B8sZZvaH-Jkg"; echo $env:SUPABASE_ANON_KEY | vercel env add SUPABASE_ANON_KEY production

# SUPABASE_SERVICE_ROLE_KEY
$env:SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcmhjd3ZwaXZrYWRra2J4Y29tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDgzNTMwNCwiZXhwIjoyMDgwNDExMzA0fQ.6rqVR8w-5dJE-wKHgB9ypbDVLgV1-VZP_4PqVKcGjyo"; echo $env:SUPABASE_SERVICE_ROLE_KEY | vercel env add SUPABASE_SERVICE_ROLE_KEY production

# NODE_ENV
echo "production" | vercel env add NODE_ENV production

# Redeploy
vercel --prod
```

---

## Verification

After redeploying, test the endpoint:

```bash
curl https://taaza-customer.vercel.app/api/vendor/orders
```

**Expected response (401, not 500):**
```json
{"success":false,"error":{"message":"Authentication required"}}
```

**NOT:**
```
Error: Missing Supabase environment variables
```

---

## Summary

| Variable | Value | Status |
|----------|-------|--------|
| SUPABASE_URL | https://fcrhcwvpivkadkkbxcom.supabase.co | ⏳ Need to add |
| SUPABASE_ANON_KEY | eyJhbGciOi... | ⏳ Need to add |
| SUPABASE_SERVICE_ROLE_KEY | eyJhbGciOi... | ⏳ Need to add |
| NODE_ENV | production | ⏳ Need to add |

---

**After adding these 4 variables and redeploying, the vendor orders will work!** 🚀

