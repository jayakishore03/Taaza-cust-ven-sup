/**
 * Notifications Controller
 * Handles notification-related operations for vendors
 */

import { supabaseAdmin } from '../config/database.js';

/**
 * Get all notifications for a vendor
 * GET /api/vendor/notifications
 */
export async function getVendorNotifications(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
    }

    // Get vendor's shop_id from shops table
    const { data: shop, error: shopError } = await supabaseAdmin
      .from('shops')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (shopError || !shop) {
      console.warn('[getVendorNotifications] Shop not found for user:', userId);
      // Return empty array if shop not found
      return res.json({
        success: true,
        data: [],
      });
    }

    // Fetch notifications for this shop or user
    const { data: notifications, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .or(`shop_id.eq.${shop.id},user_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getVendorNotifications] Error fetching notifications:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to fetch notifications' },
      });
    }

    return res.json({
      success: true,
      data: notifications || [],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark a notification as read
 * PATCH /api/vendor/notifications/:id/read
 */
export async function markNotificationAsRead(req, res, next) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        error: { message: 'Notification ID is required' },
      });
    }

    // Verify the notification belongs to this user's shop
    const { data: shop } = await supabaseAdmin
      .from('shops')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!shop) {
      return res.status(404).json({
        success: false,
        error: { message: 'Shop not found' },
      });
    }

    // Update notification
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', id)
      .or(`shop_id.eq.${shop.id},user_id.eq.${userId}`)
      .select()
      .single();

    if (error) {
      console.error('[markNotificationAsRead] Error updating notification:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to mark notification as read' },
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: { message: 'Notification not found' },
      });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}



