-- ========================================
-- FIX DELIVERY AGENTS FOREIGN KEY CONSTRAINT
-- ========================================
-- This script fixes the foreign key constraint on delivery_agents.user_id
-- to correctly reference auth.users instead of users table
-- 
-- IMPORTANT: Run this script in your Supabase SQL Editor to fix the registration issue
-- ========================================

-- Step 1: Drop ALL foreign key constraints on delivery_agents.user_id (to be safe)
ALTER TABLE delivery_agents 
DROP CONSTRAINT IF EXISTS delivery_agents_user_id_fkey;

-- Also try dropping with different possible constraint names
ALTER TABLE delivery_agents 
DROP CONSTRAINT IF EXISTS delivery_agents_user_id_users_fkey;

-- Step 1B: Verify all constraints are dropped
DO $$ 
BEGIN
  RAISE NOTICE '✅ Attempted to drop all foreign key constraints on user_id';
END $$;

-- Step 2: Verify the constraint was dropped
SELECT 
  '✅ Step 1: Foreign key constraint status' as status,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.table_constraints 
      WHERE table_name = 'delivery_agents' 
        AND constraint_name = 'delivery_agents_user_id_fkey'
    ) THEN '❌ Still exists - manual intervention needed'
    ELSE '✅ Successfully removed'
  END as constraint_status;

-- Step 3: Add the correct foreign key constraint referencing auth.users
DO $$ 
BEGIN
  -- Check if column exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'delivery_agents' 
      AND column_name = 'user_id'
  ) THEN
    -- Add the correct constraint
    ALTER TABLE delivery_agents
    ADD CONSTRAINT delivery_agents_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;
    
    RAISE NOTICE '✅ Added correct foreign key constraint to auth.users';
  ELSE
    RAISE NOTICE '⚠️ user_id column does not exist in delivery_agents table';
  END IF;
END $$;

-- Step 4: Verify the new constraint
SELECT 
  '✅ Step 2: New foreign key constraint verification' as status,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'delivery_agents'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.constraint_name = 'delivery_agents_user_id_fkey';

-- Step 5: Verify existing data integrity
SELECT 
  '✅ Step 3: Data integrity check' as status,
  COUNT(*) as total_delivery_agents,
  COUNT(*) FILTER (
    WHERE user_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM auth.users WHERE auth.users.id = delivery_agents.user_id
    )
  ) as agents_with_valid_user_id,
  COUNT(*) FILTER (
    WHERE user_id IS NOT NULL 
    AND NOT EXISTS (
      SELECT 1 FROM auth.users WHERE auth.users.id = delivery_agents.user_id
    )
  ) as agents_with_invalid_user_id
FROM delivery_agents;

-- Final success message
SELECT '✅ Foreign key constraint fixed successfully!' as status;

