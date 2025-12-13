# Product Management Setup Guide

## Overview
This setup allows vendors to manage products and prices from the vendor app, which automatically syncs to the customer app (taza-1) via Supabase.

## How It Works

### 1. Vendor App (vendor -app)
- **Store Screen** (`app/(tabs)/store.tsx`):
  - Fetches ALL products from Supabase
  - Shows each product with an ON/OFF toggle for availability
  - Allows vendors to set prices per kg for each product
  - When a product is toggled ON and saved:
    - Sets `is_available = true` in Supabase
    - Sets `shop_id` to the vendor's shop ID
    - Updates `price_per_kg` with the vendor's price
  - When a product is toggled OFF:
    - Sets `is_available = false` (but keeps shop_id for reference)

### 2. Customer App (taza-1)
- **Home Screen** (`app/(tabs)/index.tsx`):
  - When a customer selects a shop, it filters products by:
    - `shop_id` = selected shop's ID
    - `is_available = true`
    - `category` = selected category
  - Only products that are ON in the vendor app will appear in the customer app

## Files Created/Modified

### New Files:
1. `vendor -app/lib/supabase.ts` - Supabase client setup
2. `vendor -app/services/products.ts` - Product management service

### Modified Files:
1. `vendor -app/app/(tabs)/store.tsx` - Complete rewrite to use Supabase
2. `app/(tabs)/index.tsx` - Updated to filter by shop_id
3. `lib/services/products.ts` - Added shop_id filtering support

## Database Schema

The `products` table in Supabase has these key fields:
- `id` - Product ID
- `name` - Product name
- `category` - Product category (Chicken, Mutton, etc.)
- `shop_id` - Vendor's shop ID (set when product is made available)
- `is_available` - Boolean flag (true = visible in customer app)
- `price_per_kg` - Price per kilogram
- `price` - Calculated price based on weight

## Usage Flow

1. **Vendor logs in** → Gets their shop_id from stored vendor data
2. **Vendor opens Store screen** → Sees all products from Supabase
3. **Vendor toggles product ON** → Sets availability and shop_id
4. **Vendor sets price** → Updates price_per_kg
5. **Vendor clicks Save** → All changes sync to Supabase
6. **Customer selects shop** → Customer app filters products by shop_id and is_available
7. **Customer sees products** → Only products marked ON by that vendor appear

## Important Notes

- Products are shared across all vendors (same product catalog)
- Each vendor can independently set availability and prices
- When a vendor turns a product ON, it links that product to their shop
- Multiple vendors can have the same product available with different prices
- The customer app shows products specific to the selected shop

## Troubleshooting

### Products not showing in vendor app:
- Check Supabase connection in `vendor -app/lib/supabase.ts`
- Verify vendor has shop_id stored in AsyncStorage ('vendor_data')
- Check Supabase console for products table

### Products not showing in customer app:
- Verify product has `is_available = true` in Supabase
- Verify product has `shop_id` matching the selected shop
- Check that customer app is filtering correctly in `app/(tabs)/index.tsx`

### Price updates not saving:
- Check Supabase permissions (RLS policies)
- Verify vendor is authenticated
- Check network connection

## Supabase Configuration

Make sure these environment variables are set (or use defaults in code):
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

The default values are already set in the code, but you can override them with environment variables.

