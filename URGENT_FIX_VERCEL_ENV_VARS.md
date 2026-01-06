# 🔴 URGENT: Fix Vendor Orders - Add Environment Variables

## Current Status

❌ Backend is deployed but **CRASHING** due to missing/inaccessible environment variables  
❌ Vendor app can't fetch orders  
❌ Both `taaza-customer.vercel.app` and `backend-three-neon-66.vercel.app` are returning 500 errors  

---

## ✅ SOLUTION: Manually Add Environment Variables via Vercel Dashboard

### Step 1: Open Vercel Dashboard

**Click this link:** [https://vercel.com/kishore-projects/backend/settings/environment-variables](https://vercel.com/kishore-projects/backend/settings/environment-variables)

(Or go to: Vercel → Your Projects → backend → Settings → Environment Variables)

###Step 2: Add Environment Variables

Click "**Add New**" button for each variable below:

---

#### 1️⃣ SUPABASE_URL

**Value:**
```
https://fcrhcwvpivkadkkbxcom.supabase.co
```

**Settings:**
- Environment: ✅ **Production**, ✅ **Preview**, ✅ **Development** (check ALL)
- Click **Save**

---

#### 2️⃣ SUPABASE_ANON_KEY

**Value:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcmhjd3ZwaXZrYWRra2J4Y29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MzUzMDQsImV4cCI6MjA4MDQxMTMwNH0.MjBw7_aVc2VlfND7Ec93sNOp352xcC0B8sZZvaH-Jkg
```

**Settings:**
- Mark as sensitive: ✅ **Yes**
- Environment: ✅ **Production**, ✅ **Preview**, ✅ **Development** (check ALL)
- Click **Save**

---

#### 3️⃣ SUPABASE_SERVICE_ROLE_KEY

**Value:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcmhjd3ZwaXZrYWRra2J4Y29tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDgzNTMwNCwiZXhwIjoyMDgwNDExMzA0fQ.6rqVR8w-5dJE-wKHgB9ypbDVLgV1-VZP_4PqVKcGjyo
```

**Settings:**
- Mark as sensitive: ✅ **Yes**
- Environment: ✅ **Production**, ✅ **Preview**, ✅ **Development** (check ALL)
- Click **Save**

---

### Step 3: Redeploy

After adding all 3 variables:

**Option A: Via Vercel Dashboard**
1. Go to "**Deployments**" tab
2. Find the latest deployment
3. Click "**...**" (three dots menu)
4. Click "**Redeploy**"
5. Wait 1-2 minutes

**Option B: Via Terminal**
```bash
cd backend
vercel --prod
```

---

### Step 4: Test

After redeployment, test the backend:

```bash
# Test health endpoint
curl https://backend-three-neon-66.vercel.app/health

# Test vendor orders endpoint (should return 401, not 500)
curl https://backend-three-neon-66.vercel.app/api/vendor/orders
```

**Expected:**
- Health: ✅ `{"success":true,"message":"Taza API is running"}`
- Vendor orders (without auth): ⚠️ `{"success":false,"error":"Authentication required"}` (401)

**NOT:**
- ❌ `FUNCTION_INVOCATION_FAILED` (500)
- ❌ `Missing Supabase environment variables` (500)

---

### Step 5: Restart Vendor App

Once backend is working:

```bash
# Stop vendor app (Ctrl+C)
# Restart:
cd "vendor -app"
npx expo start -c --port 8082
```

Or reload in Expo Go:
- Shake device → Tap "Reload"

---

## 📸 Visual Guide

###Adding an Environment Variable:

```
┌─────────────────────────────────────────────┐
│  Add Environment Variable                   │
├─────────────────────────────────────────────┤
│  Name: SUPABASE_URL                         │
│  Value: https://fcrhcwvpivkadkkbxcom...     │
│                                             │
│  Environment:                               │
│  ✅ Production                              │
│  ✅ Preview                                 │
│  ✅ Development                             │
│                                             │
│  [ Save ]                                   │
└─────────────────────────────────────────────┘
```

---

## ⚠️ Important Notes

1. **Check ALL 3 environments** (Production, Preview, Development) for each variable
2. **Mark sensitive** for ANON_KEY and SERVICE_ROLE_KEY
3. **Redeploy after adding** all variables
4. **Wait 1-2 minutes** for propagation

---

## 🎯 Summary

| Variable | Status | Action |
|----------|--------|--------|
| SUPABASE_URL | ⏳ Add manually | Via Vercel dashboard |
| SUPABASE_ANON_KEY | ⏳ Add manually | Via Vercel dashboard |
| SUPABASE_SERVICE_ROLE_KEY | ⏳ Add manually | Via Vercel dashboard |

**After adding these 3 variables and redeploying, vendor orders WILL work!** 🚀

---

## Need Help?

If you get stuck:
1. Take a screenshot of the Vercel environment variables page
2. Take a screenshot of any error messages
3. Send them to me

**The backend code is ready - it just needs these 3 environment variables!**

