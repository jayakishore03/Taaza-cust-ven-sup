# 🚀 Deploy Backend to Vercel - Quick Guide

## Option 1: Using Vercel CLI (Recommended)

### Step 1: Install Vercel CLI (if not installed)
```powershell
npm install -g vercel
```

### Step 2: Deploy
```powershell
cd backend
vercel --prod
```

This will:
- ✅ Deploy to production
- ✅ Include the new `/api/vendor/orders` endpoint
- ✅ Make all routes available at `https://taaza-customer.vercel.app/api`

---

## Option 2: Using Vercel Dashboard (If CLI doesn't work)

### Step 1: Go to Vercel Dashboard
1. Open: https://vercel.com/dashboard
2. Sign in to your account
3. Find your project (should be `taaza-customer` or similar)

### Step 2: Trigger Redeploy
1. Go to **"Deployments"** tab
2. Find the latest deployment
3. Click the **"..."** (three dots) menu
4. Click **"Redeploy"**
5. Select **"Use existing Build Cache"** (optional, faster)
6. Click **"Redeploy"**
7. Wait 1-2 minutes for deployment to complete

### Step 3: Verify Deployment
After deployment completes, test the endpoint:
```powershell
# Test health endpoint
Invoke-RestMethod -Uri "https://taaza-customer.vercel.app/health"

# Test vendor orders endpoint (will require auth token)
Invoke-WebRequest -Uri "https://taaza-customer.vercel.app/api/vendor/orders" -Method GET
```

---

## What Gets Deployed

✅ All routes in `src/routes/` including:
- `/api/vendor/orders` ← **NEW ENDPOINT**
- `/api/vendor/profile`
- `/api/vendor/register`
- `/api/orders`
- `/api/products`
- `/api/shops`
- And all other existing routes

✅ Configuration:
- `vercel.json` - Routing configuration
- All environment variables from Vercel dashboard

---

## After Deployment

Once deployed, the vendor app will be able to:
1. ✅ Call `/api/vendor/orders` endpoint
2. ✅ Fetch orders for the vendor's shop
3. ✅ Display orders in "New Order Received" section

---

## Troubleshooting

### If deployment fails:
1. Check `vercel.json` syntax is correct
2. Ensure all environment variables are set in Vercel dashboard
3. Check build logs in Vercel dashboard for errors

### If endpoint still returns 404:
1. Wait 2-3 minutes after deployment (propagation time)
2. Check Vercel deployment logs for any errors
3. Verify the route is registered in `src/server.js`

