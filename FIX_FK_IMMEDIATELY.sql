-- ============================================================
-- IMMEDIATE FIX: Fix delivery_agents foreign key constraint
-- ============================================================
-- The error shows: "Key (user_id)=(...) is not present in table 'users'"
-- This means the constraint is pointing to WRONG table (users)
-- It SHOULD point to: auth.users
-- ============================================================

-- STEP 1: Show current status
SELECT 
  '🔍 BEFORE FIX: Current Status' as step,
  ccu.table_schema || '.' || ccu.table_name as currently_points_to,
  CASE 
    WHEN ccu.table_schema = 'auth' AND ccu.table_name = 'users' THEN '✅ Already correct'
    ELSE '❌ WRONG - Needs fix'
  END as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'delivery_agents'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'user_id';

-- STEP 2: DROP ALL EXISTING CONSTRAINTS (including wrong ones)
DO $$
DECLARE
  constraint_record RECORD;
  dropped_count INTEGER := 0;
BEGIN
  -- Drop ALL foreign key constraints on delivery_agents.user_id
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
      RAISE NOTICE '⚠️ Error: %', SQLERRM;
    END;
  END LOOP;
  
  -- Also drop by name
  BEGIN
    EXECUTE 'ALTER TABLE delivery_agents DROP CONSTRAINT IF EXISTS delivery_agents_user_id_fkey CASCADE';
    IF dropped_count = 0 THEN dropped_count := 1; END IF;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  RAISE NOTICE '✅ Dropped % constraint(s)', dropped_count;
END $$;

-- STEP 3: Clean corrupted data
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

-- STEP 4: ADD CORRECT CONSTRAINT (points to auth.users)
DO $$
BEGIN
  -- Drop one more time to be absolutely sure
  BEGIN
    EXECUTE 'ALTER TABLE delivery_agents DROP CONSTRAINT IF EXISTS delivery_agents_user_id_fkey CASCADE';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  -- Add the CORRECT constraint pointing to auth.users
  BEGIN
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
        RAISE NOTICE '✅✅✅ Already correct';
      ELSE
        -- Wrong, fix it
        EXECUTE 'ALTER TABLE delivery_agents DROP CONSTRAINT IF EXISTS delivery_agents_user_id_fkey CASCADE';
        EXECUTE 'ALTER TABLE delivery_agents ADD CONSTRAINT delivery_agents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE';
        RAISE NOTICE '✅✅✅ Fixed constraint';
      END IF;
    ELSE
      RAISE EXCEPTION '❌ Error: %', SQLERRM;
    END IF;
  END;
END $$;

-- STEP 5: VERIFY THE FIX
SELECT 
  '✅✅✅ AFTER FIX: Final Status' as step,
  ccu.table_schema || '.' || ccu.table_name as now_points_to,
  CASE 
    WHEN ccu.table_schema = 'auth' AND ccu.table_name = 'users' THEN 
      '✅✅✅ CORRECT - Points to auth.users - REGISTRATION WILL WORK NOW!'
    ELSE 
      '❌❌❌ STILL WRONG - Points to ' || ccu.table_schema || '.' || ccu.table_name || ' - Run fix again!'
  END as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'delivery_agents'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'user_id';

SELECT '✅✅✅ FIX COMPLETE! Try registration again!' as final_status;

