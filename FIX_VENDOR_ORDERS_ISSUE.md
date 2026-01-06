# Fix: Vendor Orders Not Showing

## Problem
Orders placed in the customer app are not appearing in the vendor app.

## Root Cause
The vendor app is trying to fetch orders from `/api/vendor/orders` endpoint, but this endpoint is **NOT deployed to Vercel**. 

**Evidence:**
- Vendor app logs show: `404 - Not Found - /api/vendor/orders`
- Backend code exists locally in `backend/src/routes/vendor.js`
- Vercel deployment doesn't include the vendor routes

## Solution

### Option 1: Redeploy Backend to Vercel (RECOMMENDED)

The backend code already has the vendor routes implemented. We just need to redeploy to Vercel.

**Steps:**

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Deploy to Vercel:**
```bash
vercel --prod
```

3. **Verify deployment:**
```bash
# Should return 401 (unauthorized) instead of 404 (not found)
curl https://taaza-customer.vercel.app/api/vendor/orders
```

### Option 2: Use Local Backend (TEMPORARY)

While deploying, you can test with local backend:

1. **Start local backend:**
```bash
cd backend
npm start
```

2. **Update vendor app API URL:**
Edit `vendor -app/services/api.ts`:
```typescript
// Change from:
const API_BASE_URL = 'https://taaza-customer.vercel.app/api';

// To (use your computer's IP):
const API_BASE_URL = 'http://192.168.0.5:3000/api';
```

3. **Restart vendor app:**
```bash
cd "vendor -app"
npx expo start -c
```

## What the Backend Code Does

The vendor orders endpoint (`/api/vendor/orders`) in `backend/src/controllers/ordersController.js`:

1. **Authenticates the vendor** using JWT token
2. **Finds the vendor's shop** by:
   - Looking up shop by `user_id`
   - Or by matching email/phone from users table
3. **Fetches all orders** for that shop using `shop_id`
4. **Returns formatted orders** with items, timeline, and customer info

## Verification Steps

After deployment, verify:

1. **Endpoint exists:**
```bash
curl https://taaza-customer.vercel.app/api/vendor/orders
# Should return: {"success":false,"error":{"message":"Authentication required"}}
# NOT: {"success":false,"error":{"message":"Not Found - /api/vendor/orders"}}
```

2. **Orders appear in vendor app:**
   - Open vendor app
   - Check dashboard - should show orders
   - Check orders tab - should list all orders

3. **Test order flow:**
   - Place order in customer app
   - Within 5 seconds, order should appear in vendor app dashboard
   - Order details should be complete (items, customer info, etc.)

## Files Involved

### Backend (Already Implemented):
- `backend/src/routes/vendor.js` - Vendor routes definition
- `backend/src/controllers/ordersController.js` - `getVendorOrders` function
- `backend/src/controllers/vendorController.js` - Vendor profile functions
- `backend/src/server.js` - Registers vendor routes at `/api/vendor`

### Vendor App:
- `vendor -app/services/api.ts` - `getVendorOrders` function
- `vendor -app/app/(tabs)/index.tsx` - Dashboard that displays orders
- `vendor -app/app/(tabs)/orders.tsx` - Orders list screen

## Common Issues

### Issue: Still getting 404 after deployment
**Solution:** 
- Check Vercel deployment logs
- Ensure `vercel.json` routes include `/api/(.*)`
- Redeploy with `vercel --prod --force`

### Issue: Orders showing but empty
**Solution:**
- Check if orders have `shop_id` set
- Verify vendor's shop ID matches orders' `shop_id`
- Check backend logs for shop lookup

### Issue: Authentication errors
**Solution:**
- Vendor needs to be logged in
- Check if auth token is being sent
- Verify token is valid in backend

## Database Schema

Orders are linked to shops via `shop_id`:

```sql
-- orders table
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  shop_id TEXT REFERENCES shops(id),  -- Links order to vendor's shop
  order_number TEXT,
  status TEXT,
  total NUMERIC,
  created_at TIMESTAMP,
  ...
);
```

When customer places order:
1. Customer selects a shop
2. Order is created with that `shop_id`
3. Vendor can fetch orders WHERE `shop_id` = their shop

## Next Steps

1. **Deploy backend to Vercel** (Option 1 above)
2. **Test vendor app** - orders should appear
3. **Monitor logs** - check for any errors
4. **Test end-to-end** - place order, verify it appears

---

**Status:** Ready to deploy
**Priority:** HIGH - Vendors can't see orders!
**ETA:** 5-10 minutes to deploy and verify

