-- ============================================================
-- SIMPLE FIX - RUN THIS NOW IN SUPABASE SQL EDITOR
-- ============================================================
-- This will fix the foreign key constraint error immediately
-- Copy and paste this ENTIRE script into Supabase SQL Editor
-- ============================================================

-- Step 1: Drop the wrong constraint
ALTER TABLE delivery_agents
DROP CONSTRAINT IF EXISTS delivery_agents_user_id_fkey CASCADE;

-- Step 2: Add the correct constraint pointing to auth.users
ALTER TABLE delivery_agents
ADD CONSTRAINT delivery_agents_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Step 3: Verify it worked
SELECT 
  '✅ FIX VERIFICATION' as status,
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

SELECT '✅✅✅ FIX COMPLETE! Try registering again now.' as final_status;


