-- Migration: Add special_instructions column to orders table
-- Created: 2025-02-09
-- Description: Adds support for customer special instructions on orders

-- Add special_instructions column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS special_instructions text;

-- Add a comment to explain the field
COMMENT ON COLUMN orders.special_instructions IS 'Customer special instructions or notes for the order (e.g., delivery time preference, cooking instructions, delivery notes)';

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'orders' AND column_name = 'special_instructions';

