# 🔴 URGENT: Restart Vendor App to See Orders!

## Problem
Orders are saving in Supabase ✅  
But vendor app is NOT showing them ❌

## Why?
The vendor app is **still using the OLD backend URL** that doesn't have vendor routes. We fixed the config file, but the app needs to be **restarted** to apply changes!

## ✅ Solution (2 Steps - Takes 30 Seconds)

### Step 1: Stop Vendor App

In the terminal running vendor app, press:
```
Ctrl+C
```

### Step 2: Restart Vendor App

```bash
cd "vendor -app"
npx expo start -c
```

That's it! Now reload the app on your device.

---

## What to Expect After Restart

### Console Logs Will Show:

**BEFORE (404 errors):**
```
[getVendorOrders] Fetching from: https://taaza-customer.vercel.app/api/vendor/orders
[getVendorOrders] Response status: 404
Error: Not Found - /api/vendor/orders
```

**AFTER (Success!):**
```
[getVendorOrders] Fetching from: https://backend-three-neon-66.vercel.app/api/vendor/orders
[getVendorOrders] Response status: 200
[loadNewOrders] Fetched X orders from API
✅ Orders displayed!
```

### In Vendor App:

1. **Dashboard** - Will show order count
2. **New Orders Section** - Will show all pending/preparing orders
3. **Orders Tab** - Will list all orders
4. **Real-time updates** - New orders appear within 5 seconds

---

## Quick Test After Restart

1. **Open vendor app** - Log in if needed
2. **Check dashboard** - Should show orders
3. **Place test order in customer app**
4. **Watch vendor app** - Order appears in 5 seconds!

---

## The Fix We Applied

We updated `vendor -app/config/api.ts`:

**OLD (broken):**
```typescript
BASE_URL: 'https://taaza-customer.vercel.app/api'  // ❌ No vendor routes
```

**NEW (fixed):**
```typescript
BASE_URL: 'https://backend-three-neon-66.vercel.app/api'  // ✅ Has vendor routes
```

But this only takes effect after **restarting the app!**

---

## Still Not Working After Restart?

### Check Console Logs

Look for:
```
[getVendorOrders] Fetching from: https://backend-three-neon-66.vercel.app/api/vendor/orders
```

If you see the **OLD URL** (`taaza-customer.vercel.app`), the app didn't reload properly.

**Solution:**
1. Close app completely
2. Stop Metro bundler (`Ctrl+C`)
3. Restart: `npx expo start -c`
4. Reload app on device

### Check Vendor is Logged In

- Vendor must be logged in to see orders
- Log out and log back in if needed

### Check Orders Have shop_id

Orders must have a `shop_id` that matches the vendor's shop.

---

## Summary

| Problem | Solution | Time |
|---------|----------|------|
| Orders not in vendor app | Restart vendor app | 30 seconds |
| Old backend URL | Already fixed in config | Done ✅ |
| Need to apply changes | Restart app (Ctrl+C, then start again) | Now! |

---

**🎯 Bottom Line: Just restart the vendor app and orders will appear!**

