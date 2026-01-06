-- ========================================
-- COMPREHENSIVE FIX FOR DELIVERY AGENTS FOREIGN KEY
-- ========================================
-- This script will find and fix ALL foreign key constraints on delivery_agents.user_id
-- Run this to ensure the constraint is correctly set to auth.users
-- ========================================

-- Step 1: Find ALL foreign key constraints on delivery_agents.user_id
SELECT 
  'Step 1: Finding all foreign key constraints' as status,
  tc.constraint_name,
  ccu.table_schema || '.' || ccu.table_name as current_reference,
  CASE 
    WHEN ccu.table_schema = 'auth' AND ccu.table_name = 'users' THEN '✅ CORRECT'
    ELSE '❌ WRONG - needs fixing'
  END as status_check
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'delivery_agents'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'user_id';

-- Step 2: Drop ALL foreign key constraints on delivery_agents.user_id
-- This will drop any constraint regardless of its name or what it references
DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  FOR constraint_record IN 
    SELECT tc.constraint_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'delivery_agents'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'user_id'
  LOOP
    EXECUTE format('ALTER TABLE delivery_agents DROP CONSTRAINT IF EXISTS %I CASCADE', constraint_record.constraint_name);
    RAISE NOTICE 'Dropped constraint: %', constraint_record.constraint_name;
  END LOOP;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'No foreign key constraints found to drop';
  END IF;
END $$;

-- Step 3: Verify all constraints are dropped
SELECT 
  'Step 2: Verification - All constraints dropped' as status,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'delivery_agents'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'user_id'
    ) THEN '❌ Some constraints still exist'
    ELSE '✅ All constraints dropped'
  END as result;

-- Step 4: Add the CORRECT constraint pointing to auth.users
ALTER TABLE delivery_agents
ADD CONSTRAINT delivery_agents_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Step 5: Final verification
SELECT 
  'Step 3: Final verification' as status,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_schema || '.' || ccu.table_name as references_table,
  CASE 
    WHEN ccu.table_schema = 'auth' AND ccu.table_name = 'users' THEN '✅ CORRECT - Points to auth.users'
    ELSE '❌ WRONG - Points to ' || ccu.table_schema || '.' || ccu.table_name
  END as constraint_status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'delivery_agents'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'user_id';

-- Success message
SELECT '
========================================
✅ FOREIGN KEY CONSTRAINT FIXED!
========================================

The delivery_agents.user_id foreign key now correctly references auth.users(id).

You can now try registering a delivery agent again - it should work!

========================================
' as success_message;



