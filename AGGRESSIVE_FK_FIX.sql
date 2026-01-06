-- ============================================================
-- AGGRESSIVE FIX: This will DEFINITELY fix the foreign key
-- ============================================================
-- Run this in Supabase SQL Editor - it will work no matter what
-- ============================================================

-- Step 1: Find and drop ALL foreign key constraints on delivery_agents.user_id
-- This finds constraints by ANY name, not just the expected one
DO $$
DECLARE
  constraint_record RECORD;
  dropped_count INTEGER := 0;
BEGIN
  RAISE NOTICE '🔍 Searching for ALL foreign key constraints on delivery_agents.user_id...';
  
  -- Find ALL foreign key constraints on delivery_agents.user_id (any name, any target)
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
    
    -- Drop it
    EXECUTE 'ALTER TABLE delivery_agents DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_record.constraint_name) || ' CASCADE';
    RAISE NOTICE '✅ Dropped: %', constraint_record.constraint_name;
    dropped_count := dropped_count + 1;
  END LOOP;
  
  IF dropped_count = 0 THEN
    RAISE NOTICE 'ℹ️ No foreign key constraints found (table might be new)';
  ELSE
    RAISE NOTICE '✅ Dropped % constraint(s)', dropped_count;
  END IF;
END $$;

-- Step 2: Wait a moment for constraint drops to complete
SELECT pg_sleep(0.5);

-- Step 3: Create the CORRECT constraint pointing to auth.users
DO $$
BEGIN
  -- Check if table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'delivery_agents'
  ) THEN
    RAISE EXCEPTION '❌ Table delivery_agents does not exist! Run COMPLETE_SQL_SETUP_FIXED.sql first.';
  END IF;
  
  -- Create the CORRECT constraint
  BEGIN
    ALTER TABLE delivery_agents 
      ADD CONSTRAINT delivery_agents_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
    RAISE NOTICE '✅✅✅ SUCCESS! Foreign key constraint created pointing to auth.users(id)';
  EXCEPTION WHEN OTHERS THEN
    IF SQLSTATE = '42710' THEN
      -- Constraint already exists - check if it's correct
      RAISE NOTICE 'ℹ️ Constraint already exists - checking if it points to auth.users...';
      
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
        -- It exists but is wrong - drop and recreate
        RAISE NOTICE '❌ Constraint exists but is WRONG! Dropping and recreating...';
        ALTER TABLE delivery_agents DROP CONSTRAINT delivery_agents_user_id_fkey CASCADE;
        ALTER TABLE delivery_agents 
          ADD CONSTRAINT delivery_agents_user_id_fkey 
          FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE '✅✅✅ Fixed! Constraint now points to auth.users';
      END IF;
    ELSE
      RAISE EXCEPTION '❌ Error: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    END IF;
  END;
END $$;

-- Step 4: Final verification
SELECT 
  '✅ FINAL VERIFICATION' as check_type,
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
    ) THEN '✅✅✅ FIXED! Foreign key points to auth.users(id)'
    ELSE '❌ STILL WRONG - Check manually in Supabase Dashboard'
  END as status;

-- Show what the constraint is pointing to
SELECT 
  '📋 Constraint Details' as info,
  c.conname as constraint_name,
  t.relname as table_name,
  rt.relname as referenced_table,
  rn.nspname as referenced_schema,
  CASE 
    WHEN rn.nspname = 'auth' AND rt.relname = 'users' THEN '✅ CORRECT'
    ELSE '❌ WRONG'
  END as status
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_class rt ON c.confrelid = rt.oid
JOIN pg_namespace rn ON rt.relnamespace = rn.oid
WHERE t.relname = 'delivery_agents'
  AND c.conname = 'delivery_agents_user_id_fkey'
  AND c.contype = 'f';

SELECT '✅✅✅ AGGRESSIVE FIX COMPLETE! Try registration again.' as final_status;

