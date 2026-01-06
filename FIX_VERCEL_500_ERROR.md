# 🔧 Fix Vercel 500 Internal Server Error

## 🐛 Error Details
- **Status**: `500: INTERNAL_SERVER_ERROR`
- **Code**: `FUNCTION_INVOCATION_FAILED`
- **Meaning**: The serverless function crashed during execution

---

## ✅ Solution 1: Check Environment Variables (MOST COMMON)

### Step 1: Go to Vercel Dashboard
1. Open: https://vercel.com/dashboard
2. Find your project: **taaza-customer**
3. Click on the project

### Step 2: Check Environment Variables
1. Go to **Settings** → **Environment Variables**
2. Verify these variables are set for **Production**:

```env
SUPABASE_URL=https://fcrhcwvpivkadkkbxcom.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
DATABASE_URL=postgresql://postgres.fcrhcwvpivkadkkbxcom:password@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.fcrhcwvpivkadkkbxcom:password@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
```

### Step 3: Add Missing Variables
If any are missing:
1. Click **"Add New"**
2. Enter the variable name (e.g., `SUPABASE_URL`)
3. Enter the value
4. Select **Production** (and Preview/Development if needed)
5. Click **"Save"**

### Step 4: Redeploy
After adding variables:
1. Go to **Deployments** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete

---

## ✅ Solution 2: Check Vercel Logs

### Step 1: View Function Logs
1. Go to Vercel Dashboard → Your Project
2. Click **"Deployments"** tab
3. Click on the latest deployment
4. Click **"Functions"** tab
5. Click on `/api/index` function
6. Check **"Logs"** tab for error messages

### Common Error Messages:
- `❌ Missing Supabase environment variables!` → Add env vars (Solution 1)
- `Cannot find module` → Missing dependency
- `ECONNREFUSED` → Database connection issue
- `SyntaxError` → Code syntax error

---

## ✅ Solution 3: Test with Simple Endpoint

The `/api/test` endpoint should work even if database is not configured.

### Test It:
```powershell
Invoke-WebRequest -Uri "https://taaza-customer.vercel.app/api/test" -UseBasicParsing
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Test endpoint working!",
  "env_check": {
    "SUPABASE_URL": "SET",
    "SUPABASE_ANON_KEY": "SET",
    "SUPABASE_SERVICE_ROLE_KEY": "SET"
  }
}
```

**If it shows "MISSING"** → Add those environment variables (Solution 1)

---

## ✅ Solution 4: Check Import Errors

The error might be in route imports. Check if all route files exist:

### Required Route Files:
- ✅ `backend/src/routes/auth.js`
- ✅ `backend/src/routes/products.js`
- ✅ `backend/src/routes/orders.js`
- ✅ `backend/src/routes/users.js`
- ✅ `backend/src/routes/shops.js`
- ✅ `backend/src/routes/coupons.js`
- ✅ `backend/src/routes/addons.js`
- ✅ `backend/src/routes/payments.js`
- ✅ `backend/src/routes/paymentMethods.js`
- ✅ `backend/src/routes/vendor.js`
- ✅ `backend/src/routes/email.js`
- ✅ `backend/src/routes/bank.js`

If any file is missing, the import will fail and cause a 500 error.

---

## ✅ Solution 5: Fix Static Files Directory

The server tries to serve static images from `backend/images` folder.

### Option A: Create Empty Images Directory
1. In your project, create: `backend/images/.gitkeep`
2. Commit and push
3. Redeploy

### Option B: Make Images Route Optional
Edit `backend/src/server.js` and wrap the static route in try-catch:

```javascript
// Serve static images from backend/images folder (if exists)
try {
  app.use('/images', express.static(join(__dirname, '../images')));
} catch (error) {
  console.warn('Images directory not found, skipping static file serving');
}
```

---

## ✅ Solution 6: Improve Error Handling

The current error handler might not be catching all errors. Let's add better logging:

### Update `backend/api/index.js`:

```javascript
// Vercel Serverless Function Entry Point
let app;

try {
  const serverModule = await import('../src/server.js');
  app = serverModule.default;
} catch (error) {
  console.error('❌ Error loading Express app:', error);
  console.error('Error stack:', error.stack);
  
  // Return a detailed error handler
  app = (req, res) => {
    console.error('Request failed:', req.url);
    res.status(500).json({
      success: false,
      error: 'Server initialization failed',
      message: error.message,
      // Only show stack in development
      ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
    });
  };
}

export default app;
```

---

## 🔍 Diagnostic Steps

### Step 1: Check Test Endpoint
```powershell
# This should work even without database
Invoke-WebRequest -Uri "https://taaza-customer.vercel.app/api/test"
```

### Step 2: Check Health Endpoint
```powershell
# This should work if server loads
Invoke-WebRequest -Uri "https://taaza-customer.vercel.app/health"
```

### Step 3: Check API Root
```powershell
# This should work if routes load
Invoke-WebRequest -Uri "https://taaza-customer.vercel.app/api"
```

### Step 4: Check Products Endpoint
```powershell
# This requires database connection
Invoke-WebRequest -Uri "https://taaza-customer.vercel.app/api/products"
```

**Which endpoint fails?** This tells us where the problem is:
- `/api/test` fails → Environment variables issue
- `/health` fails → Server initialization issue
- `/api` fails → Route import issue
- `/api/products` fails → Database connection issue

---

## 📝 Quick Fix Checklist

- [ ] Check Vercel environment variables are set
- [ ] Verify all route files exist
- [ ] Check Vercel function logs for specific error
- [ ] Test `/api/test` endpoint
- [ ] Redeploy after fixing issues
- [ ] Wait 2-3 minutes after deployment

---

## 🚨 Most Likely Cause

**90% of the time**, this error is caused by **missing environment variables** in Vercel.

**Quick Fix:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
3. Redeploy

---

## 📞 Need More Help?

1. **Check Vercel Logs**: Dashboard → Deployments → Latest → Functions → Logs
2. **Check Build Logs**: Dashboard → Deployments → Latest → Build Logs
3. **Test Locally**: Run `npm run dev` in `backend` folder to see errors

---

**Last Updated**: Based on current error analysis

