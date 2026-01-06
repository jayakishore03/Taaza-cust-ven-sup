# Testing Guide: Complete Order Flow

This guide will help you test the complete order flow from customer placing an order to vendor receiving it.

## Prerequisites

1. **Backend Running**
   - Make sure the backend server is running
   - Check if it's accessible at the configured URL

2. **Database Setup**
   - Ensure you have at least one shop in the database
   - Shop must have a `user_id` linked to a vendor user
   - Products should be available for the shop

3. **Apps Ready**
   - Customer app should be running
   - Vendor app should be running
   - Both apps should be connected to the same backend

## Step-by-Step Testing

### Part 1: Setup Test Data

#### 1.1 Verify Shop Exists
```sql
-- Check if shops exist
SELECT id, name, user_id FROM shops LIMIT 5;

-- Verify a shop has a user_id (vendor)
SELECT s.id, s.name, s.user_id, u.email, u.phone 
FROM shops s 
LEFT JOIN users u ON s.user_id = u.id 
LIMIT 5;
```

#### 1.2 Verify Products Exist
```sql
-- Check products are available
SELECT id, name, price, shop_id FROM products LIMIT 10;
```

### Part 2: Test Customer Order Placement

#### 2.1 Open Customer App
1. Launch the customer app on your device/emulator
2. Login or sign up as a customer
3. Grant location permissions (if prompted)

#### 2.2 Select a Shop
1. On the home screen, you should see "Nearby Shops"
2. **Tap on a shop** to select it
3. Verify:
   - ✅ Shop name appears at the top
   - ✅ "Change" button is visible
   - ✅ Products for that shop are displayed

#### 2.3 Add Products to Cart
1. Browse products from the selected shop
2. **Tap "ADD"** on a few products
3. Verify:
   - ✅ Alert shows "Added to Cart"
   - ✅ Cart icon shows item count
4. Go to Cart tab to verify items are there

#### 2.4 Proceed to Checkout
1. Go to Cart tab
2. Tap "Proceed to Checkout"
3. Verify:
   - ✅ Shop information is displayed ("Ordering from [Shop Name]")
   - ✅ Delivery address section is visible
   - ✅ Order items are listed
   - ✅ Bill summary shows correct totals

#### 2.5 Enter Delivery Address
1. If no address, tap "Add Address"
2. Fill in required fields:
   - Contact Name
   - Mobile Number
   - Street & House No.
   - City
   - State
   - Postal Code
   - Landmark (optional)
3. Tap "Save"
4. Verify address appears in checkout

#### 2.6 Place Order
1. Review order details
2. Tap "Place Order"
3. Select payment method (Cash on Delivery for testing)
4. Confirm order
5. Verify:
   - ✅ Order confirmation alert appears
   - ✅ Order number is displayed
   - ✅ You're redirected to Orders screen

### Part 3: Test Vendor App Receiving Orders

#### 3.1 Open Vendor App
1. Launch the vendor app
2. **Login as the vendor** whose shop was selected
   - Use the email/phone linked to the shop's `user_id`
3. Verify you're on the Dashboard

#### 3.2 Check for New Orders
1. Look at the "New Order Received" section
2. Wait 5-10 seconds (polling interval)
3. Verify:
   - ✅ New order appears in the list
   - ✅ Order number is displayed
   - ✅ Total amount is shown
   - ✅ Status shows "Preparing"
   - ✅ Time ago is displayed (e.g., "Just now", "2 minutes ago")

#### 3.3 Verify Order Details
1. Tap on the order card
2. Verify order details are displayed:
   - Order number
   - Customer information
   - Order items with quantities
   - Delivery address
   - Payment method
   - Special instructions (if any)

### Part 4: Backend Verification

#### 4.1 Check Backend Logs
Look for these log messages in the backend console:

**When order is created:**
```
========================================
🛒 CREATE ORDER REQUEST RECEIVED
========================================
User ID: [user-id]
Shop ID: [shop-id]
Items: [...]
✅ Order created successfully
```

**When vendor fetches orders:**
```
========================================
🛍️ GET VENDOR ORDERS REQUEST
========================================
Vendor User ID: [vendor-user-id]
✅ Found shop by user_id: [shop-id]
✅ Found X orders for shop [shop-id]
```

#### 4.2 Verify Database
```sql
-- Check if order was created with shop_id
SELECT 
  id, 
  order_number, 
  shop_id, 
  user_id, 
  status, 
  total, 
  created_at 
FROM orders 
ORDER BY created_at DESC 
LIMIT 5;

-- Verify order items
SELECT 
  oi.order_id,
  oi.name,
  oi.quantity,
  oi.price,
  o.order_number,
  o.shop_id
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
ORDER BY o.created_at DESC
LIMIT 10;
```

### Part 5: Test Multiple Orders

#### 5.1 Place Multiple Orders
1. Place 2-3 orders from different customers
2. Select the same shop for all orders
3. Verify all orders appear in vendor app

#### 5.2 Test Different Shops
1. Place orders selecting different shops
2. Login as different vendors
3. Verify each vendor only sees orders for their shop

## Troubleshooting

### Issue: Orders Not Appearing in Vendor App

**Check 1: Shop Link**
```sql
-- Verify vendor's user_id matches shop's user_id
SELECT 
  u.id as user_id,
  u.email,
  s.id as shop_id,
  s.name as shop_name,
  s.user_id as shop_user_id
FROM users u
LEFT JOIN shops s ON s.user_id = u.id
WHERE u.email = 'vendor@example.com';
```

**Check 2: Order Shop ID**
```sql
-- Check if orders have shop_id set
SELECT 
  id,
  order_number,
  shop_id,
  status
FROM orders
WHERE shop_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

**Check 3: API Endpoint**
- Open vendor app console/logs
- Look for API calls to `/api/vendor/orders`
- Check response status:
  - ✅ 200 = Success
  - ❌ 404 = Endpoint not found (check backend routes)
  - ❌ 401 = Authentication failed
  - ❌ 500 = Server error

**Check 4: Backend Route**
- Verify `GET /api/vendor/orders` is registered
- Check `meat super admin/backend/src/routes/vendor.js`
- Should have: `router.get('/orders', authenticate, getVendorOrders);`

### Issue: Order Not Created

**Check 1: Shop Selection**
- Verify `selectedShop` is set in customer app
- Check CartContext has shop selected
- Look for "Shop Required" alert

**Check 2: Backend Logs**
- Check for order creation errors
- Verify `shopId` is in request body
- Check database connection

**Check 3: Network**
- Verify customer app can reach backend
- Check API base URL in customer app config
- Test with: `curl http://your-backend-url/api/health`

### Issue: Wrong Orders Showing

**Check: Shop ID Mismatch**
```sql
-- Compare shop_id in orders vs vendor's shop
SELECT 
  o.id,
  o.order_number,
  o.shop_id as order_shop_id,
  s.id as vendor_shop_id,
  s.name as shop_name
FROM orders o
JOIN shops s ON s.id = o.shop_id
WHERE o.created_at > NOW() - INTERVAL '1 hour'
ORDER BY o.created_at DESC;
```

## Quick Test Script

### Test Order Creation (cURL)
```bash
# Replace with your actual values
TOKEN="your-auth-token"
BACKEND_URL="http://localhost:3000"
SHOP_ID="your-shop-id"
USER_ID="your-user-id"

curl -X POST "$BACKEND_URL/api/orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shopId": "'$SHOP_ID'",
    "addressId": "test-address-id",
    "items": [
      {
        "productId": "product-1",
        "name": "Test Product",
        "quantity": 2,
        "weight": "1 kg",
        "weightInKg": 1.0,
        "price": 500,
        "pricePerKg": 500,
        "imageUrl": ""
      }
    ],
    "subtotal": 1000,
    "deliveryCharge": 40,
    "discount": 0,
    "paymentMethodText": "Cash on Delivery"
  }'
```

### Test Vendor Orders (cURL)
```bash
# Replace with vendor's auth token
VENDOR_TOKEN="vendor-auth-token"
BACKEND_URL="http://localhost:3000"

curl -X GET "$BACKEND_URL/api/vendor/orders" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -H "Content-Type: application/json"
```

## Expected Results

### ✅ Success Indicators

1. **Customer App:**
   - Order placed successfully
   - Order appears in "My Orders"
   - Order number is displayed

2. **Vendor App:**
   - Order appears in "New Order Received" within 5-10 seconds
   - Order details are correct
   - Multiple orders are listed correctly

3. **Backend:**
   - Order created with `shop_id` field
   - Vendor orders endpoint returns correct orders
   - Logs show successful operations

4. **Database:**
   - `orders` table has new row with `shop_id`
   - `order_items` table has items linked to order
   - `order_timeline` has initial status entry

## Next Steps After Testing

1. **Test Order Status Updates**
   - Vendor updates order status
   - Customer sees status change

2. **Test Multiple Vendors**
   - Place orders for different shops
   - Verify each vendor sees only their orders

3. **Test Real-time Updates**
   - Place order while vendor app is open
   - Verify order appears without refresh

4. **Test Edge Cases**
   - Order without shop selection (should fail)
   - Order with invalid shop_id (should handle gracefully)
   - Vendor with no shop (should return empty array)

## Summary

The complete flow should work as follows:

1. ✅ Customer selects shop
2. ✅ Customer adds products
3. ✅ Customer places order with `shopId`
4. ✅ Backend stores order with `shop_id`
5. ✅ Vendor app polls `/api/vendor/orders`
6. ✅ Backend returns orders filtered by `shop_id`
7. ✅ Vendor sees orders in dashboard

If any step fails, check the troubleshooting section above!

