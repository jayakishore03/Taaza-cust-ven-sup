-- Run this to check if the foreign key was actually fixed

SELECT 
  'CHECK 1: Foreign Key Verification' as check_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_schema AS points_to_schema,
  ccu.table_name AS points_to_table,
  CASE 
    WHEN ccu.table_schema = 'auth' AND ccu.table_name = 'users' 
    THEN '✅ CORRECT - Fixed!'
    ELSE '❌ STILL WRONG - Not fixed'
  END as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'delivery_agents' 
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'user_id';

-- Also check if the table exists
SELECT 
  'CHECK 2: Table Exists' as check_name,
  COUNT(*) as result,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Table exists'
    ELSE '❌ Table does not exist'
  END as status
FROM information_schema.tables
WHERE table_name = 'delivery_agents';

-- Check your Supabase project URL
SELECT 
  'CHECK 3: Your Database' as check_name,
  current_database() as database_name,
  'Make sure your app uses THIS database!' as note;

