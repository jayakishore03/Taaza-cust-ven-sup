-- ========================================
-- FIX: Remove Foreign Key Constraint on user_profiles
-- This allows profile creation to work
-- ========================================

-- Step 1: Drop the foreign key constraint
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

-- Step 2: Verify constraint is removed
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'user_profiles' 
    AND tc.constraint_type = 'FOREIGN KEY';

-- Should return no rows (empty) after running

