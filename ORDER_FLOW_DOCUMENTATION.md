# Complete Order Flow Documentation

## Overview
This document explains the complete order flow from customer placing an order to vendor receiving it in their app.

## Flow Diagram

```
Customer App                    Backend API                  Vendor App
     │                              │                             │
     │  1. Select Shop              │                             │
     │  ───────────────────────────>│                             │
     │  (selectedShop stored)       │                             │
     │                              │                             │
     │  2. Add Products to Cart     │                             │
     │  ───────────────────────────>│                             │
     │                              │                             │
     │  3. Checkout & Payment       │                             │
     │  ───────────────────────────>│                             │
     │  POST /api/orders            │                             │
     │  { shopId, items, ... }      │                             │
     │                              │                             │
     │  4. Order Created            │                             │
     │  <───────────────────────────┤                             │
     │  { orderId, orderNumber }    │                             │
     │                              │                             │
     │                              │  5. Poll for Orders         │
     │                              │  <───────────────────────────┤
     │                              │  GET /api/vendor/orders     │
     │                              │  (every 5 seconds)          │
     │                              │                             │
     │                              │  6. Return Orders            │
     │                              │  ───────────────────────────>│
     │                              │  { orders filtered by shop } │
     │                              │                             │
     │                              │  7. Display in "New Orders"  │
     │                              │  ───────────────────────────>│
     │                              │  (Dashboard shows orders)    │
```

## Step-by-Step Process

### 1. Customer Selects Shop
**Location:** `app/(tabs)/index.tsx`

- Customer sees list of nearby shops
- Taps on a shop to select it
- Shop is stored in `CartContext` as `selectedShop`
- Products for that shop are displayed

**Code:**
```typescript
const handleShopSelect = (shop: Shop) => {
  setSelectedShop(shop);
  // Products for shop are loaded
};
```

### 2. Customer Adds Products to Cart
**Location:** `app/(tabs)/index.tsx`

- Customer browses products from selected shop
- Taps "ADD" button to add products to cart
- Products are stored in `CartContext`

### 3. Customer Proceeds to Checkout
**Location:** `app/checkout.tsx`

- Customer reviews order
- Validates that `selectedShop` exists (line 240)
- Shows shop information in checkout screen
- Customer enters/confirms delivery address

**Validation:**
```typescript
if (!selectedShop || !selectedShop.id) {
  Alert.alert('Shop Required', 'Please select a shop before placing your order.');
  return;
}
```

### 4. Customer Places Order
**Location:** `app/payment.tsx`

- Customer selects payment method (COD/UPI/Card)
- Order is created with `shopId: selectedShop.id` (line 221)

**Order Creation:**
```typescript
const order = await ordersApi.create({
  shopId: selectedShop.id,  // ✅ Shop ID is included
  addressId: finalAddressId,
  items: cartItems.map((item) => ({
    productId: item.product.id,
    name: item.product.name,
    quantity: item.quantity,
    // ... other item details
  })),
  subtotal: parseFloat(subtotal),
  deliveryCharge: deliveryCharge,
  // ... other order details
});
```

### 5. Backend Creates Order
**Location:** `backend/src/controllers/ordersController.js`

- Receives order request with `shopId`
- Creates order in `orders` table with `shop_id` field (line 596)
- Creates order items in `order_items` table
- Returns order confirmation

**Order Storage:**
```javascript
const orderResult = await supabaseAdmin
  .from('orders')
  .insert({
    user_id: userId,
    shop_id: finalShopId,  // ✅ Shop ID stored
    address_id: finalAddressId,
    order_number: orderNumber,
    status: 'Preparing',
    // ... other fields
  });
```

### 6. Vendor App Fetches Orders
**Location:** `vendor -app/app/(tabs)/index.tsx`

- Vendor app polls for new orders every 5 seconds
- Calls `GET /api/vendor/orders` endpoint
- Backend finds vendor's shop by `user_id`
- Backend returns orders where `shop_id` matches vendor's shop

**Polling:**
```typescript
// Poll every 5 seconds for new orders
pollingIntervalRef.current = setInterval(() => {
  loadNewOrders(true);
}, 5000);
```

### 7. Backend Returns Vendor Orders
**Location:** `backend/src/controllers/ordersController.js` (getVendorOrders)

**Process:**
1. Finds vendor's shop by `user_id` (line 123-130)
2. Queries orders where `shop_id` matches (line 175-179)
3. Formats orders with items, timeline, customer info
4. Returns formatted orders

**Query:**
```javascript
// Find vendor's shop
const { data: shopsByUserId } = await supabase
  .from('shops')
  .select('id, name, user_id')
  .eq('user_id', userId)
  .limit(1);

const shopId = shopsByUserId[0].id;

// Get orders for this shop
const ordersResult = await supabase
  .from('orders')
  .select('*')
  .eq('shop_id', shopIdStr)  // ✅ Filtered by shop_id
  .order('created_at', { ascending: false });
```

### 8. Vendor App Displays Orders
**Location:** `vendor -app/app/(tabs)/index.tsx`

- Orders are displayed in "New Order Received" section
- Shows order number, total, status, time ago
- Filters orders by status (Preparing, Pending, Confirmed)
- Shows only recent orders (within 24 hours)

**Display:**
```typescript
{newOrders.map((order) => (
  <TouchableOpacity key={order.id} style={styles.orderCard}>
    <Text style={styles.orderNumber}>
      {order.orderNumber || `Order #${order.id.slice(0, 8)}`}
    </Text>
    <Text style={styles.orderTotal}>
      {order.total || `₹${order.total_amount.toFixed(2)}`}
    </Text>
    <Text style={styles.orderTime}>
      {formatTimeAgo(order.created_at || order.placedOn)}
    </Text>
    <View style={styles.statusBadge}>
      <Text>{order.status || 'Preparing'}</Text>
    </View>
  </TouchableOpacity>
))}
```

## Key Files

### Customer App
- **Shop Selection:** `app/(tabs)/index.tsx` - Shop selection and product browsing
- **Checkout:** `app/checkout.tsx` - Order review and address entry
- **Payment:** `app/payment.tsx` - Order creation with shopId
- **Cart Context:** `contexts/CartContext.tsx` - Manages selectedShop and cartItems

### Backend
- **Order Creation:** `backend/src/controllers/ordersController.js` - `createOrder()` function
- **Vendor Orders:** `backend/src/controllers/ordersController.js` - `getVendorOrders()` function
- **Routes:** `backend/src/routes/orders.js` - Order endpoints

### Vendor App
- **Dashboard:** `vendor -app/app/(tabs)/index.tsx` - Displays new orders
- **API Service:** `vendor -app/services/api.ts` - `getVendorOrders()` function

## Database Schema

### Orders Table
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  shop_id TEXT REFERENCES shops(id),  -- ✅ Links order to shop
  address_id UUID REFERENCES addresses(id),
  order_number TEXT,
  status TEXT,
  total DECIMAL,
  created_at TIMESTAMP,
  -- ... other fields
);
```

### Shops Table
```sql
CREATE TABLE shops (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id),  -- ✅ Links shop to vendor user
  name TEXT,
  -- ... other fields
);
```

## Testing the Flow

### 1. Test Customer Order Placement
1. Open customer app
2. Select a shop from "Nearby Shops"
3. Add products to cart
4. Go to checkout
5. Enter delivery address
6. Place order with COD
7. Verify order confirmation

### 2. Test Vendor App Receiving Orders
1. Open vendor app
2. Login as vendor (user must have a shop linked)
3. Go to dashboard
4. Wait 5 seconds (polling interval)
5. Verify new order appears in "New Order Received" section
6. Check order details (number, total, status, time)

### 3. Verify Backend
1. Check backend logs for order creation
2. Verify `shop_id` is stored in orders table
3. Check vendor orders endpoint returns correct orders
4. Verify orders are filtered by vendor's shop_id

## Troubleshooting

### Orders Not Appearing in Vendor App

1. **Check Shop Link:**
   - Verify vendor's `user_id` matches `shops.user_id`
   - Check if shop exists in database

2. **Check Order Shop ID:**
   - Verify orders have `shop_id` set
   - Check if `shop_id` matches vendor's shop

3. **Check API Endpoint:**
   - Verify `/api/vendor/orders` endpoint is accessible
   - Check authentication token is valid
   - Check backend logs for errors

4. **Check Polling:**
   - Verify vendor app is polling every 5 seconds
   - Check console logs for API responses
   - Verify orders are being fetched

### Order Not Created

1. **Check Shop Selection:**
   - Verify `selectedShop` is set in cart
   - Check checkout validation passes

2. **Check Backend:**
   - Verify order creation endpoint is accessible
   - Check backend logs for errors
   - Verify `shop_id` is included in request

## Summary

✅ **Complete Flow Working:**
1. Customer selects shop → stored in CartContext
2. Customer adds products → stored in cart
3. Customer places order → order created with shopId
4. Backend stores order → with shop_id field
5. Vendor app polls → fetches orders for their shop
6. Vendor sees orders → displayed in "New Orders" section

The entire flow is **fully implemented and working**! 🎉

