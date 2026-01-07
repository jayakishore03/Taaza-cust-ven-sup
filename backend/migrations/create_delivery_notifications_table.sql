-- Create delivery_notifications table
CREATE TABLE IF NOT EXISTS delivery_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  agent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_name TEXT NOT NULL,
  shop_address TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  shop_latitude DECIMAL(10, 8),
  shop_longitude DECIMAL(11, 8),
  customer_latitude DECIMAL(10, 8),
  customer_longitude DECIMAL(11, 8),
  distance_km DECIMAL(6, 2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_delivery_notifications_agent ON delivery_notifications(agent_user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_notifications_order ON delivery_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_notifications_status ON delivery_notifications(status);
CREATE INDEX IF NOT EXISTS idx_delivery_notifications_expires ON delivery_notifications(expires_at);

-- Enable Row Level Security
ALTER TABLE delivery_notifications ENABLE ROW LEVEL SECURITY;

-- Allow delivery agents to see their own notifications
CREATE POLICY "Delivery agents can view their own notifications"
  ON delivery_notifications
  FOR SELECT
  USING (agent_user_id = auth.uid());

-- Allow delivery agents to update their own notifications
CREATE POLICY "Delivery agents can update their own notifications"
  ON delivery_notifications
  FOR UPDATE
  USING (agent_user_id = auth.uid());

-- Allow backend (service role) to insert notifications
CREATE POLICY "Service role can insert notifications"
  ON delivery_notifications
  FOR INSERT
  WITH CHECK (true);

