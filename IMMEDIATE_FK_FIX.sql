-- ============================================================
-- IMMEDIATE FOREIGN KEY FIX FOR delivery_agents TABLE
-- ============================================================
-- This script will IMMEDIATELY fix the foreign key constraint
-- without dropping the table (preserving existing data)
-- ============================================================

-- Step 1: Find and drop ALL foreign key constraints on delivery_agents.user_id
DO $$
DECLARE
  constraint_record RECORD;
  constraint_count INTEGER := 0;
BEGIN
  RAISE NOTICE '🔍 Searching for foreign key constraints on delivery_agents.user_id...';
  
  -- Find ALL foreign key constraints on delivery_agents.user_id
  FOR constraint_record IN
    SELECT 
      c.conname as constraint_name,
      rt.relname as referenced_table,
      rn.nspname as referenced_schema
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    LEFT JOIN pg_class rt ON c.confrelid = rt.oid
    LEFT JOIN pg_namespace rn ON rt.relnamespace = rn.oid
    WHERE t.relname = 'delivery_agents'
      AND n.nspname = 'public'
      AND c.contype = 'f'
      AND EXISTS (
        SELECT 1 
        FROM pg_attribute a
        WHERE a.attrelid = c.conrelid
        AND a.attnum = ANY(c.conkey)
        AND a.attname = 'user_id'
      )
  LOOP
    RAISE NOTICE '❌ Found constraint: % pointing to %.%', 
      constraint_record.constraint_name, 
      constraint_record.referenced_schema,
      constraint_record.referenced_table;
    
    -- Drop the constraint
    EXECUTE 'ALTER TABLE delivery_agents DROP CONSTRAINT IF EXISTS ' || constraint_record.constraint_name || ' CASCADE';
    RAISE NOTICE '✅ Dropped constraint: %', constraint_record.constraint_name;
    constraint_count := constraint_count + 1;
  END LOOP;
  
  IF constraint_count = 0 THEN
    RAISE NOTICE 'ℹ️ No foreign key constraints found on delivery_agents.user_id';
  ELSE
    RAISE NOTICE '✅ Dropped % constraint(s)', constraint_count;
  END IF;
END $$;

-- Step 2: Verify user exists in auth.users before creating constraint
DO $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Check if there are any delivery_agents with user_id that don't exist in auth.users
  SELECT COUNT(*) INTO user_count
  FROM delivery_agents da
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users au WHERE au.id = da.user_id
  );
  
  IF user_count > 0 THEN
    RAISE WARNING '⚠️ Found % delivery_agent(s) with user_id not in auth.users. These will cause errors.', user_count;
    RAISE NOTICE '💡 You may need to delete these records or update their user_id to valid auth.users.id values.';
  ELSE
    RAISE NOTICE '✅ All delivery_agents have valid user_id in auth.users';
  END IF;
END $$;

-- Step 3: Create the CORRECT foreign key constraint pointing to auth.users
DO $$
BEGIN
  -- Add the CORRECT constraint pointing to auth.users
  BEGIN
    ALTER TABLE delivery_agents 
    ADD CONSTRAINT delivery_agents_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
    RAISE NOTICE '✅✅✅ SUCCESS! Foreign key constraint correctly set to auth.users(id)';
  EXCEPTION WHEN OTHERS THEN
    IF SQLSTATE = '42710' THEN
      -- Constraint already exists - verify it's correct
      RAISE NOTICE 'ℹ️ Constraint already exists - verifying it points to auth.users...';
      
      IF EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_class rt ON c.confrelid = rt.oid
        JOIN pg_namespace rn ON rt.relnamespace = rn.oid
        WHERE t.relname = 'delivery_agents'
        AND c.conname = 'delivery_agents_user_id_fkey'
        AND rn.nspname = 'auth'
        AND rt.relname = 'users'
      ) THEN
        RAISE NOTICE '✅✅✅ Constraint is CORRECT - already points to auth.users';
      ELSE
        RAISE EXCEPTION '❌ Constraint exists but points to WRONG table! Run Step 1 again to drop it.';
      END IF;
    ELSIF SQLSTATE = '23503' THEN
      RAISE EXCEPTION '❌ Foreign key violation! Some delivery_agents have user_id not in auth.users. Fix the data first.';
    ELSE
      RAISE EXCEPTION '❌ Error creating constraint: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    END IF;
  END;
END $$;

-- Step 4: Final Verification
SELECT 
  '✅ VERIFICATION: Delivery Agents Foreign Key' as check_type,
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
      AND c.contype = 'f'
    ) THEN '✅✅✅ CORRECTLY POINTS TO auth.users(id)'
    ELSE '❌ FOREIGN KEY MISSING OR INCORRECT'
  END as status;

-- Show constraint details
SELECT 
  '📋 Constraint Details' as info,
  c.conname as constraint_name,
  t.relname as table_name,
  rt.relname as referenced_table,
  rn.nspname as referenced_schema
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_class rt ON c.confrelid = rt.oid
JOIN pg_namespace rn ON rt.relnamespace = rn.oid
WHERE t.relname = 'delivery_agents'
  AND c.conname = 'delivery_agents_user_id_fkey'
  AND c.contype = 'f';

SELECT '✅✅✅ IMMEDIATE FIX COMPLETE! Try registration again.' as final_status;

