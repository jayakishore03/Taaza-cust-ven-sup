-- ============================================================
-- CREATE NOTIFICATIONS TABLE FOR VENDOR APP
-- ============================================================
-- This script creates a notifications table to store notifications
-- sent from the Super Admin dashboard to vendors
-- ============================================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- 'info', 'warning', 'success', 'error'
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  read_at TIMESTAMPTZ,
  created_by TEXT DEFAULT 'super_admin' -- Track who created the notification
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_shop_id ON notifications(shop_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Create index for unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(shop_id, is_read) WHERE is_read = false;

-- Disable RLS (Row Level Security) for notifications table
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Add comments
COMMENT ON TABLE notifications IS 'Stores notifications sent from Super Admin to vendors';
COMMENT ON COLUMN notifications.shop_id IS 'Shop ID that the notification is for';
COMMENT ON COLUMN notifications.user_id IS 'User ID (vendor) that the notification is for';
COMMENT ON COLUMN notifications.type IS 'Notification type: info, warning, success, error';
COMMENT ON COLUMN notifications.is_read IS 'Whether the notification has been read by the vendor';
COMMENT ON COLUMN notifications.created_by IS 'Who created the notification (usually super_admin)';

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT 
  '✅ Notifications table created successfully' as status,
  COUNT(*) as total_notifications
FROM notifications;