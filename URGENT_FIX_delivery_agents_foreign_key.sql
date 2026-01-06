-- ========================================
-- URGENT FIX: DELIVERY AGENTS FOREIGN KEY
-- ========================================
-- Run this IMMEDIATELY to fix the registration error
-- This will fix the constraint so registration works
-- ========================================

-- Step 1: Find and show current constraint status
SELECT 
  '🔍 CURRENT CONSTRAINT STATUS' as step,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_schema || '.' || ccu.table_name as currently_points_to,
  CASE 
    WHEN ccu.table_schema = 'auth' AND ccu.table_name = 'users' THEN '✅ CORRECT'
    ELSE '❌ WRONG - needs fixing'
  END as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'delivery_agents'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'user_id';

-- Step 2: Drop ALL foreign key constraints on delivery_agents.user_id
DO $$
DECLARE
  constraint_record RECORD;
  dropped_count INTEGER := 0;
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
    BEGIN
      EXECUTE format('ALTER TABLE delivery_agents DROP CONSTRAINT IF EXISTS %I CASCADE', constraint_record.constraint_name);
      dropped_count := dropped_count + 1;
      RAISE NOTICE '✅ Dropped constraint: %', constraint_record.constraint_name;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '⚠️ Could not drop constraint: % - Error: %', constraint_record.constraint_name, SQLERRM;
    END;
  END LOOP;
  
  IF dropped_count = 0 THEN
    RAISE NOTICE 'ℹ️ No constraints found to drop';
  ELSE
    RAISE NOTICE '✅ Dropped % constraint(s)', dropped_count;
  END IF;
END $$;

-- Step 3: Verify all constraints are dropped
SELECT 
  '✅ VERIFICATION: All constraints dropped' as step,
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
    ELSE '✅ All constraints dropped successfully'
  END as result;

-- Step 4: Add the CORRECT constraint pointing to auth.users
ALTER TABLE delivery_agents
ADD CONSTRAINT delivery_agents_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Step 5: Final verification - show the new constraint
SELECT 
  '✅ FINAL VERIFICATION: New constraint status' as step,
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
✅✅✅ FOREIGN KEY CONSTRAINT FIXED! ✅✅✅
========================================

The delivery_agents.user_id foreign key now correctly references auth.users(id).

You can now try registering a delivery agent again - it should work!

========================================
' as success_message;



