# Foreign Key Constraint Issue - FINAL FIX

## 🎉 Success So Far
✅ All document uploads are working perfectly!
- Driving license ✅
- Aadhar card ✅
- PAN card ✅
- Selfie ✅

## ❌ Current Issue

**Error:**
```
insert or update on table "delivery_agents" violates foreign key constraint "delivery_agents_user_id_fkey"
Key (user_id)=(6e5b0420-0b4e-430f-9d84-bf93026bc2e8) is not present in table "users".
```

## 🔍 Root Cause

The foreign key constraint `delivery_agents_user_id_fkey` is **incorrectly configured** in your Supabase database. It's currently pointing to:
- ❌ `public.users(id)` - WRONG

But it should be pointing to:
- ✅ `auth.users(id)` - CORRECT

### Why This Happens

When you create a user with `supabase.auth.signUp()`:
1. A new user is created in the **`auth.users`** table (Supabase's authentication table)
2. The user ID (UUID) exists in `auth.users`
3. However, the `delivery_agents` table has a foreign key that checks `public.users` instead
4. Since there's no matching record in `public.users`, the constraint fails

## 🔧 Solution

You need to run the SQL script in your Supabase SQL Editor to fix the foreign key constraint.

### Steps to Fix:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Fix Script**
   - Copy and paste the contents of `FIX_FOREIGN_KEY.sql`
   - Click "Run" to execute the script

4. **Verify the Fix**
   - The script will show you the corrected constraint
   - Look for `foreign_table_schema: 'auth'` in the results

### What the Script Does:

```sql
-- 1. Drops the incorrect constraint
ALTER TABLE delivery_agents 
DROP CONSTRAINT IF EXISTS delivery_agents_user_id_fkey;

-- 2. Creates the correct constraint pointing to auth.users
ALTER TABLE delivery_agents
ADD CONSTRAINT delivery_agents_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- 3. Verifies the fix
SELECT ... (shows constraint details)
```

## ✅ After Fixing

Once you've run the SQL script:

1. **Clear any test users from auth.users** (optional, if you want to start fresh):
   ```sql
   DELETE FROM auth.users WHERE email LIKE '%test%';
   ```

2. **Restart your app** and try registration again

3. **The full flow should work:**
   - ✅ User signup creates record in `auth.users`
   - ✅ Documents upload to Supabase Storage
   - ✅ Profile saves to `delivery_agents` table
   - ✅ Registration completes successfully

## 📝 Technical Details

**Correct Foreign Key:**
- **Column:** `delivery_agents.user_id`
- **References:** `auth.users.id`
- **On Delete:** CASCADE (if auth user is deleted, delivery agent profile is also deleted)

**Why auth.users not public.users?**
- `auth.users` is Supabase's built-in authentication table
- `public.users` is a custom table (if it exists in your schema)
- Supabase auth creates users in `auth.users`, not `public.users`

## 🎯 Summary

**The Issue:** Database constraint misconfiguration
**The Fix:** Run `FIX_FOREIGN_KEY.sql` in Supabase SQL Editor
**Result:** Registration will work end-to-end ✅


