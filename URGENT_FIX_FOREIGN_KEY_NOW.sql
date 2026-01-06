-- ============================================================
-- URGENT FIX: Foreign Key Constraint for delivery_agents.user_id
-- ============================================================
-- This script fixes the foreign key constraint error that prevents
-- delivery agent registration from working.
--
-- ERROR: "Key (user_id)=(...) is not present in table 'users'"
-- CAUSE: Constraint points to wrong table (users instead of auth.users)
-- FIX: Drop wrong constraint and add correct one pointing to auth.users
-- ============================================================

-- Step 1: Show current constraint status (diagnostics)
SELECT 
  '🔍 Current constraint status' as step,
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
-- This finds and drops ALL constraints regardless of their name
DO $$
DECLARE
  constraint_record RECORD;
  dropped_count INTEGER := 0;
BEGIN
  -- Check if table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'delivery_agents'
  ) THEN
    -- Find and drop ALL foreign key constraints on delivery_agents.user_id
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
      RAISE NOTICE '✅ Dropped % constraint(s) on delivery_agents.user_id', dropped_count;
    END IF;
  ELSE
    RAISE NOTICE 'ℹ️ Table delivery_agents does not exist yet';
  END IF;
END $$;

-- Step 3: Verify all constraints are dropped
SELECT 
  '✅ Verification - All constraints dropped' as step,
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
-- This is the critical fix - points to auth.users instead of users
ALTER TABLE delivery_agents
DROP CONSTRAINT IF EXISTS delivery_agents_user_id_fkey CASCADE;

ALTER TABLE delivery_agents
ADD CONSTRAINT delivery_agents_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Step 5: Final verification - show the new constraint status
SELECT 
  '✅ Final verification - New constraint status' as step,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_schema || '.' || ccu.table_name as now_points_to,
  CASE 
    WHEN ccu.table_schema = 'auth' AND ccu.table_name = 'users' THEN '✅ CORRECT - Fixed!'
    ELSE '❌ STILL WRONG - Contact support'
  END as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'delivery_agents'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'user_id';

-- If no constraint found, show warning
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'delivery_agents'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'user_id'
  ) THEN
    RAISE NOTICE '⚠️ WARNING: No foreign key constraint found on delivery_agents.user_id';
  END IF;
END $$;

SELECT '✅ Foreign key constraint fix completed!' as status;


