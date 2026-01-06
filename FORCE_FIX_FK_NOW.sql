-- ============================================================
-- FORCE FIX: Delivery Agents Foreign Key Constraint
-- ============================================================
-- This script will FORCEFULLY fix the foreign key constraint
-- It uses multiple methods to ensure the wrong constraint is dropped
-- ============================================================

-- STEP 1: Show current status
SELECT 
  '🔍 CURRENT STATUS (BEFORE FIX)' as step,
  COALESCE(ccu.table_schema || '.' || ccu.table_name, 'NO CONSTRAINT FOUND') as currently_points_to,
  CASE 
    WHEN ccu.table_schema = 'auth' AND ccu.table_name = 'users' THEN '✅ Already correct'
    WHEN ccu.table_schema IS NULL THEN '⚠️ No constraint found'
    ELSE '❌ WRONG - Points to ' || ccu.table_schema || '.' || ccu.table_name
  END as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'delivery_agents'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'user_id';

-- STEP 2: FORCE DROP - Method 1: Drop by constraint name
ALTER TABLE delivery_agents DROP CONSTRAINT IF EXISTS delivery_agents_user_id_fkey CASCADE;

-- STEP 3: FORCE DROP - Method 2: Find and drop ALL constraints
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
      RAISE NOTICE '✅ Dropped: %', constraint_record.constraint_name;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '⚠️ Error dropping %: %', constraint_record.constraint_name, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '✅ Dropped % constraint(s)', dropped_count;
END $$;

-- STEP 4: FORCE DROP - Method 3: Drop using pg_constraint directly
DO $$
DECLARE
  constraint_name_var TEXT;
BEGIN
  SELECT conname INTO constraint_name_var
  FROM pg_constraint
  WHERE conrelid = 'delivery_agents'::regclass
    AND contype = 'f'
    AND conkey::text LIKE '%user_id%';
  
  IF constraint_name_var IS NOT NULL THEN
    EXECUTE format('ALTER TABLE delivery_agents DROP CONSTRAINT IF EXISTS %I CASCADE', constraint_name_var);
    RAISE NOTICE '✅ Dropped via pg_constraint: %', constraint_name_var;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️ No constraint found via pg_constraint';
END $$;

-- STEP 5: Clean corrupted data
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM delivery_agents
  WHERE user_id IS NULL
     OR NOT EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = delivery_agents.user_id);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE '✅ Cleaned % invalid row(s)', deleted_count;
  END IF;
END $$;

-- STEP 6: Verify no constraint exists
SELECT 
  '🔍 VERIFICATION: No constraint should exist now' as step,
  COUNT(*) as remaining_constraints
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'delivery_agents'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'user_id';

-- STEP 7: ADD CORRECT CONSTRAINT (points to auth.users)
DO $$
BEGIN
  -- Add the CORRECT constraint pointing to auth.users
  EXECUTE 'ALTER TABLE delivery_agents ADD CONSTRAINT delivery_agents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE';
  RAISE NOTICE '✅✅✅ Added CORRECT constraint pointing to auth.users';
EXCEPTION WHEN OTHERS THEN
  IF SQLSTATE = '42710' THEN
    -- Already exists, check if correct
    IF EXISTS (
      SELECT 1 
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'delivery_agents'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'user_id'
        AND ccu.table_schema = 'auth'
        AND ccu.table_name = 'users'
    ) THEN
      RAISE NOTICE '✅✅✅ Constraint already exists and is CORRECT';
    ELSE
      -- Wrong, force fix it
      EXECUTE 'ALTER TABLE delivery_agents DROP CONSTRAINT IF EXISTS delivery_agents_user_id_fkey CASCADE';
      EXECUTE 'ALTER TABLE delivery_agents ADD CONSTRAINT delivery_agents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE';
      RAISE NOTICE '✅✅✅ Force fixed constraint';
    END IF;
  ELSE
    RAISE EXCEPTION '❌ Error: %', SQLERRM;
  END IF;
END $$;

-- STEP 8: FINAL VERIFICATION
SELECT 
  '✅✅✅ FINAL VERIFICATION' as step,
  ccu.table_schema || '.' || ccu.table_name as now_points_to,
  CASE 
    WHEN ccu.table_schema = 'auth' AND ccu.table_name = 'users' THEN 
      '✅✅✅ CORRECT - Points to auth.users - REGISTRATION WILL WORK NOW!'
    ELSE 
      '❌❌❌ STILL WRONG - Points to ' || ccu.table_schema || '.' || ccu.table_name || ' - Contact support!'
  END as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'delivery_agents'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'user_id';

SELECT '✅✅✅ FORCE FIX COMPLETE! Try registration again!' as final_status;

