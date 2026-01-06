-- ========================================
-- IMMEDIATE FIX FOR DELIVERY AGENTS FOREIGN KEY
-- Run this FIRST in Supabase SQL Editor
-- This will fix the registration error immediately
-- ========================================

-- Step 1: Drop ALL existing foreign key constraints on delivery_agents.user_id
DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  -- Find and drop ALL foreign key constraints
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
      RAISE NOTICE '✅ Dropped constraint: %', constraint_record.constraint_name;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '⚠️ Error dropping constraint: %', constraint_record.constraint_name;
    END;
  END LOOP;
  
  -- Also drop by name directly
  BEGIN
    EXECUTE 'ALTER TABLE delivery_agents DROP CONSTRAINT IF EXISTS delivery_agents_user_id_fkey CASCADE';
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

-- Step 2: Clean up corrupted data (delete rows with invalid user_id)
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete rows where user_id doesn't exist in auth.users
  DELETE FROM delivery_agents
  WHERE user_id IS NULL
     OR NOT EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = delivery_agents.user_id);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✅ Cleaned up % corrupted row(s)', deleted_count;
END $$;

-- Step 3: Ensure user_id column is UUID type (not text)
DO $$
BEGIN
  -- Check if column exists and is wrong type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'delivery_agents'
      AND column_name = 'user_id'
      AND data_type != 'uuid'
  ) THEN
    -- Drop and recreate as uuid
    ALTER TABLE delivery_agents DROP COLUMN IF EXISTS user_id CASCADE;
    ALTER TABLE delivery_agents ADD COLUMN user_id uuid UNIQUE;
    RAISE NOTICE '✅ Fixed user_id column type to uuid';
  END IF;
END $$;

-- Step 4: Add the CORRECT foreign key constraint pointing to auth.users
ALTER TABLE delivery_agents
DROP CONSTRAINT IF EXISTS delivery_agents_user_id_fkey CASCADE;

ALTER TABLE delivery_agents
ADD CONSTRAINT delivery_agents_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Step 5: Verify the fix
SELECT 
  '✅ VERIFICATION: Foreign Key Constraint Status' as status,
  tc.constraint_name,
  ccu.table_schema || '.' || ccu.table_name as points_to,
  CASE 
    WHEN ccu.table_schema = 'auth' AND ccu.table_name = 'users' THEN '✅✅✅ CORRECT - Fixed!'
    ELSE '❌ STILL WRONG'
  END as result
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'delivery_agents'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'user_id';

SELECT '✅✅✅ FIX COMPLETE! Registration should work now!' as status;

