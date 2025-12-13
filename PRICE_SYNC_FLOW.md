# Price Sync Flow: Vendor App → Supabase → Customer App

## Complete Flow Diagram

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────────┐
│   Vendor App    │         │   Supabase   │         │  Customer App   │
│  (vendor -app)  │         │   Database   │         │    (taza-1)     │
└─────────────────┘         └──────────────┘         └─────────────────┘
        │                           │                           │
        │                           │                           │
        │  1. Vendor changes price  │                           │
        │──────────────────────────>│                           │
        │                           │                           │
        │  2. syncProductToShop()   │                           │
        │     updates:              │                           │
        │     - price_per_kg        │                           │
        │     - price               │                           │
        │     - shop_id             │                           │
        │     - is_available        │                           │
        │──────────────────────────>│                           │
        │                           │                           │
        │  3. Supabase saves        │                           │
        │     updated prices        │                           │
        │                           │                           │
        │                           │  4. Customer selects shop  │
        │                           │<───────────────────────────│
        │                           │                           │
        │                           │  5. getProductsByCategory()│
        │                           │     filters by:           │
        │                           │     - shop_id             │
        │                           │     - is_available = true │
        │                           │     - category            │
        │                           │<───────────────────────────│
        │                           │                           │
        │                           │  6. Returns products with  │
        │                           │     latest prices         │
        │                           │───────────────────────────>│
        │                           │                           │
        │                           │  7. Customer sees updated  │
        │                           │     prices                 │
        │                           │                           │
```

## Step-by-Step Process

### 1. Vendor Updates Price (Vendor App)

**File**: `vendor -app/app/(tabs)/store.tsx`

- Vendor enters new price in the price input field
- Vendor clicks "Save Changes" button
- `handleSave()` function is called

**Code Flow**:
```typescript
handleSave() → syncProductToShop(shopId, productId, isAvailable, pricePerKg)
```

### 2. Price Saved to Supabase

**File**: `vendor -app/services/products.ts`

**Function**: `syncProductToShop()`

**What it does**:
- Updates `price_per_kg` with the new price
- Calculates and updates `price` = `price_per_kg * weight_in_kg`
- Sets `shop_id` to vendor's shop ID
- Sets `is_available` based on toggle state
- Updates `updated_at` timestamp

**Supabase Update**:
```sql
UPDATE products 
SET 
  shop_id = 'vendor_shop_id',
  is_available = true,
  price_per_kg = 900.00,
  price = 450.00,  -- (900 * 0.5 kg)
  updated_at = '2025-01-XX...'
WHERE id = 'product_id'
```

### 3. Customer App Fetches Products

**File**: `app/(tabs)/index.tsx`

**Trigger**: When customer selects a shop or changes category

**Code Flow**:
```typescript
useEffect() → getProductsByCategory(category, shopId)
```

### 4. Products Retrieved from Supabase

**File**: `lib/services/products.ts`

**Function**: `getProductsByCategory()`

**Query**:
```typescript
supabase
  .from('products')
  .select('*')
  .eq('category', category)
  .eq('is_available', true)
  .eq('shop_id', shopId)  // Filter by vendor's shop
  .order('created_at', { ascending: false })
```

**Returns**: Products with latest `price_per_kg` and `price` values

### 5. Products Displayed to Customer

**File**: `lib/services/products.ts`

**Function**: `dbProductToAppProduct()`

**Conversion**:
- `price_per_kg` → `pricePerKg`
- `price` → `price`
- All other product fields

**Display**: Customer sees products with updated prices immediately

## Key Files

### Vendor App
1. **`vendor -app/app/(tabs)/store.tsx`**
   - UI for managing products and prices
   - Calls `syncProductToShop()` when saving

2. **`vendor -app/services/products.ts`**
   - `syncProductToShop()` - Updates prices in Supabase
   - `getAllProducts()` - Fetches all products

### Customer App
1. **`app/(tabs)/index.tsx`**
   - Home screen that displays products
   - Fetches products when shop/category changes

2. **`lib/services/products.ts`**
   - `getProductsByCategory()` - Fetches products from Supabase
   - `dbProductToAppProduct()` - Converts DB format to app format

### Supabase
- **`products` table** stores all product data including prices
- Real-time updates are automatically reflected when customer app queries

## Price Calculation

**Formula**:
```
price = price_per_kg × weight_in_kg
```

**Example**:
- `price_per_kg` = ₹900
- `weight_in_kg` = 0.5 kg
- `price` = ₹900 × 0.5 = ₹450

## Data Flow Verification

### Logging Points

1. **Vendor App** (`syncProductToShop`):
   ```
   [syncProductToShop] Updating product: { productId, pricePerKg, calculatedPrice }
   [syncProductToShop] Product updated successfully: { price_per_kg, price }
   ```

2. **Customer App** (`getProductsByCategory`):
   ```
   [Products] Found X products for category: Chicken, shopId: shop_123
   [Products] Sample product: { name, price_per_kg, price }
   ```

3. **Product Conversion** (`dbProductToAppProduct`):
   ```
   [dbProductToAppProduct] Converting product: { name, price_per_kg, price }
   ```

## Testing the Flow

1. **In Vendor App**:
   - Open "Manage Products & Prices"
   - Change price for a product (e.g., ₹900 → ₹1000)
   - Click "Save Changes"
   - Check console logs for update confirmation

2. **In Customer App**:
   - Select the same shop
   - Navigate to the same category
   - Verify the product shows the new price (₹1000/kg)
   - Check console logs for fetched prices

## Troubleshooting

### Prices Not Updating

1. **Check Supabase Connection**:
   - Verify `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set
   - Check network connectivity

2. **Check Shop ID**:
   - Ensure vendor's `shop_id` matches in both apps
   - Verify `shop_id` is set when saving products

3. **Check Product Availability**:
   - Product must have `is_available = true` to show in customer app
   - Verify `shop_id` is set on the product

4. **Check Console Logs**:
   - Look for error messages in vendor app when saving
   - Look for error messages in customer app when fetching
   - Verify prices in logs match what's displayed

## Real-Time Updates

Currently, the customer app fetches products when:
- Shop selection changes
- Category changes
- App is refreshed/reloaded

For real-time updates without refresh, consider implementing:
- Supabase Realtime subscriptions
- Pull-to-refresh functionality
- Background sync

