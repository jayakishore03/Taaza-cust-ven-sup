-- ============================================================
-- URGENT FIX: Fix delivery_agents foreign key RIGHT NOW
-- ============================================================
-- Copy and paste this ENTIRE script into Supabase SQL Editor
-- This will IMMEDIATELY fix the foreign key issue
-- ============================================================

-- Step 1: Drop the WRONG foreign key constraint
ALTER TABLE delivery_agents 
  DROP CONSTRAINT IF EXISTS delivery_agents_user_id_fkey CASCADE;

-- Step 2: Create the CORRECT foreign key pointing to auth.users
ALTER TABLE delivery_agents 
  ADD CONSTRAINT delivery_agents_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 3: Verify it's correct
SELECT 
  '✅ VERIFICATION' as status,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      JOIN pg_class rt ON c.confrelid = rt.oid
      JOIN pg_namespace rn ON rt.relnamespace = rn.oid
      WHERE t.relname = 'delivery_agents'
      AND c.conname = 'delivery_agents_user_id_fkey'
      AND rn.nspname = 'auth'
      AND rt.relname = 'users'
    ) THEN '✅✅✅ FIXED! Foreign key now points to auth.users(id)'
    ELSE '❌ Still wrong - check manually'
  END as result;

SELECT '✅✅✅ DONE! Try registration again now.' as final_status;
