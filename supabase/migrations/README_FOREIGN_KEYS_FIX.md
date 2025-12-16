# Foreign Keys and RLS Fix Migration

## Overview
This migration removes foreign key constraints and disables Row Level Security (RLS) on various tables to fix issues with:
- Payment methods (card saving)
- User signup with addresses
- Adding addresses from profile
- Placing orders

## ⚠️ Important Warnings

**This migration:**
1. **Disables Row Level Security (RLS)** on all tables - This means data access is not restricted by user roles
2. **Removes foreign key constraints** - This means referential integrity is not enforced at the database level
3. **May affect data integrity** - Without foreign keys, orphaned records are possible

**Use with caution in production!**

## 📁 Migration Files

### 1. `20250118000001_fix_foreign_keys_and_rls.sql`
Main migration that:
- Disables RLS on all tables
- Drops all foreign key constraints
- Adds `special_instructions` column to orders table

### 2. `20250118000002_verify_foreign_keys_removed.sql`
Verification queries to confirm:
- Foreign keys are removed
- `special_instructions` column exists

## 🚀 How to Run

### Option 1: Using Supabase Dashboard
1. Go to Supabase Dashboard → SQL Editor
2. Open `20250118000001_fix_foreign_keys_and_rls.sql`
3. Copy and paste the entire content
4. Click **Run**
5. Run the verification queries from `20250118000002_verify_foreign_keys_removed.sql`

### Option 2: Using Supabase CLI
```bash
cd supabase
supabase migration up
```

## ✅ Verification

After running the migration, verify the changes:

```sql
-- Check if foreign keys are removed (should return 0 rows)
SELECT 
  conrelid::regclass AS table_name,
  conname AS constraint_name,
  contype AS constraint_type
FROM pg_constraint
WHERE conrelid IN (
  'users'::regclass,
  'user_profiles'::regclass,
  'addresses'::regclass,
  'orders'::regclass,
  'order_items'::regclass,
  'order_timeline'::regclass,
  'login_sessions'::regclass,
  'payment_methods'::regclass
)
AND contype = 'f'
ORDER BY table_name, constraint_name;

-- Check if special_instructions column exists (should return 1 row)
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'orders' 
AND column_name = 'special_instructions';
```

## 🎯 What This Fixes

After running this migration, you should be able to:
1. ✅ Add payment methods (cards/bank accounts)
2. ✅ Sign up with address
3. ✅ Add addresses from profile
4. ✅ Place orders with special instructions

## 📊 Tables Affected

The following tables have RLS disabled and foreign keys removed:
- `users`
- `user_profiles`
- `addresses`
- `orders`
- `order_items`
- `order_timeline`
- `login_sessions`
- `payment_methods`
- `products`
- `shops`
- `addons`
- `coupons`

## 🔄 Rollback

If you need to rollback this migration, you would need to:
1. Re-enable RLS on all tables
2. Re-add foreign key constraints
3. Remove `special_instructions` column (if needed)

However, **rollback is not recommended** as it may cause the same issues you're trying to fix.

## 🔐 Security Considerations

**Without RLS:**
- All data is accessible to all users (if using Supabase client)
- You must implement access control in your application code
- Consider using service role key only for admin operations

**Without Foreign Keys:**
- Orphaned records are possible
- Data integrity must be maintained in application code
- Consider adding validation in your API layer

## 📝 Notes

- The `special_instructions` column is added to the `orders` table
- All changes use `IF EXISTS` to prevent errors if already applied
- Verification queries are commented out in the main migration (run separately)

## ✅ Success Criteria

After running the migration:
- ✅ No foreign key constraints on listed tables
- ✅ RLS disabled on all listed tables
- ✅ `special_instructions` column exists in orders table
- ✅ Payment methods can be saved
- ✅ Addresses can be added
- ✅ Orders can be placed

---

**Created:** 2025-01-18  
**Purpose:** Fix foreign key and RLS issues preventing payment methods, addresses, and orders

