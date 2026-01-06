-- ========================================
-- IMMEDIATE FIX FOR DELIVERY AGENTS FOREIGN KEY
-- ========================================
-- RUN THIS FIRST - Copy and paste into Supabase SQL Editor
-- This will fix the foreign key constraint permanently
-- ========================================

-- Step 1: Drop ALL existing foreign key constraints on delivery_agents.user_id
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
END $$;

-- Step 2: Add the CORRECT constraint pointing to auth.users
ALTER TABLE delivery_agents
ADD CONSTRAINT delivery_agents_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Step 3: Verify the constraint
SELECT 
  '✅ VERIFICATION: Foreign key constraint status' as status,
  tc.constraint_name,
  ccu.table_schema || '.' || ccu.table_name as references_table,
  CASE 
    WHEN ccu.table_schema = 'auth' AND ccu.table_name = 'users' THEN '✅ CORRECT'
    ELSE '❌ WRONG'
  END as result
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'delivery_agents'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'user_id';

SELECT '✅ Foreign key constraint fixed! Registration should work now.' as result;
