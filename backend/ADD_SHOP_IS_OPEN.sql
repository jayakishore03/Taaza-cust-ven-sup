-- ============================================================
-- ADD is_open COLUMN TO SHOPS TABLE
-- ============================================================
-- This script adds an is_open column to the shops table
-- to allow vendors to control whether their shop appears
-- in the customer app's nearby shops section.
-- ============================================================

-- Step 1: Add is_open column to shops table
ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true;

-- Step 2: Create index for is_open column (for faster queries)
CREATE INDEX IF NOT EXISTS idx_shops_is_open ON shops(is_open) WHERE is_open = true;

-- Step 3: Set default value for existing shops (all open by default)
UPDATE shops
SET is_open = true
WHERE is_open IS NULL;

-- Step 4: Verify the column was added
SELECT 
  '✅ is_open column added to shops table' as status,
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'shops' 
  AND column_name = 'is_open';

-- Step 5: Show current shop statuses
SELECT 
  '📊 Current Shop Statuses' as info,
  COUNT(*) as total_shops,
  COUNT(*) FILTER (WHERE is_open = true) as open_shops,
  COUNT(*) FILTER (WHERE is_open = false) as closed_shops,
  COUNT(*) FILTER (WHERE is_open IS NULL) as null_status_shops
FROM shops;

SELECT '✅ Shop is_open column setup complete!' as status;


