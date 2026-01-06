-- Fix Foreign Key Constraint for delivery_agents table
-- The constraint should reference auth.users(id), not public.users(id)

-- Step 1: Drop the incorrect foreign key constraint
ALTER TABLE delivery_agents 
DROP CONSTRAINT IF EXISTS delivery_agents_user_id_fkey;

-- Step 2: Add the correct foreign key constraint to auth.users
ALTER TABLE delivery_agents
ADD CONSTRAINT delivery_agents_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Step 3: Verify the constraint was created correctly
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'delivery_agents'
  AND kcu.column_name = 'user_id';


