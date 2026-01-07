-- Add order items and total to delivery_notifications table
-- This allows delivery agents to see what they're picking up

-- Add columns if they don't exist
ALTER TABLE delivery_notifications
ADD COLUMN IF NOT EXISTS order_items JSONB,
ADD COLUMN IF NOT EXISTS order_total DECIMAL(10, 2);

-- Add comment for documentation
COMMENT ON COLUMN delivery_notifications.order_items IS 'JSON array of order items with name, quantity, weight, and price';
COMMENT ON COLUMN delivery_notifications.order_total IS 'Total amount of the order in rupees';

-- Create index for faster JSON queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_delivery_notifications_order_items 
ON delivery_notifications USING GIN (order_items);

