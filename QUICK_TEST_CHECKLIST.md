# Quick Test Checklist

Use this checklist to quickly verify the order flow is working.

## ✅ Pre-Test Setup

- [ ] Backend is running (`cd "meat super admin/backend" && npm start`)
- [ ] Customer app is running
- [ ] Vendor app is running
- [ ] At least one shop exists in database with `user_id` linked to a vendor
- [ ] Products exist for the shop

## ✅ Test Customer Order Placement

- [ ] Open customer app
- [ ] Select a shop from "Nearby Shops"
- [ ] Add products to cart
- [ ] Go to checkout
- [ ] Enter/confirm delivery address
- [ ] Place order with COD
- [ ] See order confirmation with order number

## ✅ Test Vendor Receiving Orders

- [ ] Open vendor app
- [ ] Login as vendor (user linked to the shop)
- [ ] Go to Dashboard
- [ ] Wait 5-10 seconds
- [ ] See new order in "New Order Received" section
- [ ] Verify order shows:
  - [ ] Order number
  - [ ] Total amount
  - [ ] Status (Preparing)
  - [ ] Time ago

## ✅ Verify Backend

- [ ] Check backend logs show order creation
- [ ] Check backend logs show vendor orders request
- [ ] Verify order in database has `shop_id` set
- [ ] Verify vendor orders endpoint returns correct orders

## ✅ Test Multiple Scenarios

- [ ] Place multiple orders for same shop
- [ ] Place orders for different shops
- [ ] Login as different vendors
- [ ] Verify each vendor sees only their orders

## 🐛 Common Issues

If orders don't appear:

1. **Check shop link:**
   ```sql
   SELECT s.id, s.name, s.user_id, u.email 
   FROM shops s 
   JOIN users u ON s.user_id = u.id;
   ```

2. **Check order shop_id:**
   ```sql
   SELECT id, order_number, shop_id, status 
   FROM orders 
   ORDER BY created_at DESC LIMIT 5;
   ```

3. **Check vendor app console:**
   - Look for API calls to `/api/vendor/orders`
   - Check response status (should be 200)

4. **Check backend route:**
   - Verify `GET /api/vendor/orders` exists
   - Check authentication is working

## 📝 Notes

- Orders appear in vendor app within 5-10 seconds (polling interval)
- Vendor must be logged in with user account linked to shop
- Shop must have `user_id` matching vendor's user ID
- Order must have `shop_id` matching vendor's shop ID

