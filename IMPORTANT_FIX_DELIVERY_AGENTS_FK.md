# ⚠️ CRITICAL: Fix Delivery Agents Foreign Key Constraint

## The Problem
Registration is failing with error:
```
Error: insert or update on table "delivery_agents" violates foreign key constraint "delivery_agents_user_id_fkey"
Key (user_id)=... is not present in table "users"
```

This happens because the foreign key constraint on `delivery_agents.user_id` is pointing to the wrong table (`users` instead of `auth.users`).

## The Solution - RUN THIS FIRST!

**You MUST run the SQL fix before registration will work.**

### Step 1: Run the SQL Fix

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy the ENTIRE contents of `FIX_DELIVERY_AGENTS_FK_IMMEDIATE.sql`
3. Paste into the SQL Editor
4. Click **RUN** or press `Ctrl+Enter`
5. Verify you see: `✅ CORRECT` in the results

### Step 2: Verify the Fix

After running the SQL, you should see a verification result showing:
- `references_table`: `auth.users`
- `result`: `✅ CORRECT`

If you see `❌ WRONG`, run the SQL script again.

### Step 3: Test Registration

After running the SQL fix, try registering a delivery agent again. It should work now.

## Why This Happened

The `delivery_agents` table was created with a foreign key constraint pointing to `users` table instead of `auth.users` table. In Supabase, user authentication uses `auth.users`, not a custom `users` table.

## Complete SQL Setup

For a complete database setup (including this fix), you can also run:
- `complete_sql_fixed_version.sql` - This includes everything including the foreign key fix

## Code Improvements

The registration code has been improved to:
1. ✅ Verify user exists in `auth.users` before inserting
2. ✅ Add retry logic with exponential backoff
3. ✅ Better error messages for foreign key constraint errors
4. ✅ Automatic cleanup (sign out) on failure

However, **you still MUST run the SQL fix** - the code improvements help with error handling, but the database constraint must be fixed first.



