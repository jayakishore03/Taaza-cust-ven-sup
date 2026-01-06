# URGENT: Fix Vendor Orders Not Showing

## Problem
Orders placed in customer app are NOT appearing in vendor app.

## Root Cause
The vendor app is calling `https://taaza-customer.vercel.app/api/vendor/orders` but this endpoint returns **404 Not Found** because the vendor routes are not deployed to that Vercel project.

## Quick Fix (Choose ONE option)

### Option 1: Update Vendor App to Use New Backend URL (FASTEST - 2 minutes)

The backend with vendor routes is deployed at: `https://backend-three-neon-66.vercel.app`

**Steps:**

1. **Update vendor app API config:**

Edit `vendor -app/config/api.ts`:

```typescript
export const API_CONFIG = {
  // OLD - doesn't have vendor routes:
  // BASE_URL: 'https://taaza-customer.vercel.app/api',
  
  // NEW - has vendor routes:
  BASE_URL: 'https://backend-three-neon-66.vercel.app/api',
  
  HEALTH_CHECK_URL: 'https://backend-three-neon-66.vercel.app/health',
};
```

2. **Restart vendor app:**
```bash
cd "vendor -app"
npx expo start -c
```

3. **Test:** Orders should now appear in vendor app!

---

### Option 2: Redeploy Customer Backend with Vendor Routes (10 minutes)

Deploy the full backend (with vendor routes) to the `taaza-customer` Vercel project.

**Steps:**

1. **Link to correct Vercel project:**
```bash
cd backend
vercel link
# Select: kishore-projects
# Select: taaza-customer (or create new)
```

2. **Deploy to production:**
```bash
vercel --prod
```

3. **Verify endpoint exists:**
```bash
curl https://taaza-customer.vercel.app/api/vendor/orders
# Should return 401 (auth required) NOT 404 (not found)
```

---

### Option 3: Use Local Backend for Testing (TEMPORARY)

**Steps:**

1. **Start local backend:**
```bash
cd backend
npm start
```

2. **Update vendor app config:**

Edit `vendor -app/config/api.ts`:

```typescript
export const API_CONFIG = {
  // Use your computer's IP address (check with ipconfig)
  BASE_URL: 'http://192.168.0.5:3000/api',
  HEALTH_CHECK_URL: 'http://192.168.0.5:3000/health',
};
```

3. **Restart vendor app:**
```bash
cd "vendor -app"
npx expo start -c
```

---

## Verification Steps

After applying the fix:

1. **Test endpoint:**
```bash
# Should return authentication error, NOT 404
curl https://backend-three-neon-66.vercel.app/api/vendor/orders
```

2. **Place test order:**
   - Open customer app
   - Add items to cart
   - Complete checkout
   - Place order

3. **Check vendor app:**
   - Open vendor app dashboard
   - Within 5 seconds, new order should appear
   - Check "Orders" tab - order should be listed

## Why This Happened

1. **Two Vercel Projects:**
   - `taaza-customer` - Customer app backend (missing vendor routes)
   - `backend` - Full backend (has vendor routes)

2. **Vendor app was pointing to wrong URL:**
   - Using: `taaza-customer.vercel.app` (no vendor routes)
   - Should use: `backend-three-neon-66.vercel.app` (has vendor routes)

3. **Backend code exists but wasn't deployed to customer project:**
   - `backend/src/routes/vendor.js` - Vendor routes ✅
   - `backend/src/controllers/ordersController.js` - `getVendorOrders()` ✅
   - But not deployed to `taaza-customer.vercel.app` ❌

## Files to Change

### For Option 1 (Recommended - Fastest):

**File:** `vendor -app/config/api.ts`

```typescript
export const API_CONFIG = {
  BASE_URL: 'https://backend-three-neon-66.vercel.app/api',
  HEALTH_CHECK_URL: 'https://backend-three-neon-66.vercel.app/health',
};
```

## Testing Checklist

- [ ] Vendor app connects to backend (no 404 errors)
- [ ] Vendor can log in successfully  
- [ ] Dashboard loads without errors
- [ ] Place order in customer app
- [ ] Order appears in vendor app within 5 seconds
- [ ] Order details are complete (items, customer info, total)
- [ ] Vendor can view order details
- [ ] Vendor can update order status

## Common Issues

### Issue: Still getting 404
**Cause:** Using old URL  
**Fix:** Double-check `vendor -app/config/api.ts` is updated and app is restarted

### Issue: Getting 401 Unauthorized
**Cause:** Vendor not logged in or token expired  
**Fix:** Log out and log back in to vendor app

### Issue: Orders showing but empty
**Cause:** Orders don't have `shop_id` set  
**Fix:** Check customer app is setting `shop_id` when creating orders

### Issue: Server error (500)
**Cause:** Backend environment variables missing  
**Fix:** Check Vercel environment variables (SUPABASE_URL, SUPABASE_KEY, etc.)

## Next Steps

1. **Apply Option 1** (fastest - just update config file)
2. **Test thoroughly** (place order, check vendor app)
3. **Monitor for errors** (check console logs)
4. **Consider Option 2** later (consolidate to one Vercel project)

---

**Priority:** 🔴 CRITICAL  
**Impact:** Vendors cannot see any orders  
**Time to Fix:** 2-5 minutes (Option 1)  
**Status:** Ready to implement

