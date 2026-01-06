/**
 * Orders Service - Connected to Supabase
 */

import { supabase } from '../lib/supabase';

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  shop_id: string;
  total: number;
  subtotal: number;
  delivery_charge: number;
  status: string;
  payment_method_text: string;
  otp: string | null;
  delivery_eta: string | null;
  created_at: string;
  updated_at: string;
  address?: {
    contact_name: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    postal_code: string;
    landmark: string;
  };
  shop?: {
    name: string;
    address: string;
    contact_phone: string;
  };
  items?: Array<{
    name: string;
    quantity: number;
    weight: string;
    price: number;
    image_url: string;
  }>;
}

/**
 * Get available orders for delivery (status: 'Order Ready' or 'Picked Up')
 */
export async function getAvailableOrders(): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        shops:shop_id (
          name,
          address,
          contact_phone
        ),
        addresses:address_id (
          contact_name,
          phone,
          street,
          city,
          state,
          postal_code,
          landmark
        )
      `)
      .in('status', ['Order Ready', 'Picked Up'])
      .is('delivery_agent_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []) as Order[];
  } catch (error: any) {
    console.error('[Orders] Error loading available orders:', error);
    return [];
  }
}

/**
 * Get orders assigned to a delivery partner
 */
export async function getMyOrders(deliveryAgentName: string): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        shops:shop_id (
          name,
          address,
          contact_phone
        ),
        addresses:address_id (
          contact_name,
          phone,
          street,
          city,
          state,
          postal_code,
          landmark
        )
      `)
      .eq('delivery_agent_name', deliveryAgentName)
      .in('status', ['Out for Delivery', 'Picked Up'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []) as Order[];
  } catch (error: any) {
    console.error('[Orders] Error loading my orders:', error);
    return [];
  }
}

/**
 * Accept an order (assign to delivery partner)
 */
export async function acceptOrder(
  orderId: string,
  deliveryAgentName: string,
  deliveryAgentMobile: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('orders')
      .update({
        delivery_agent_name: deliveryAgentName,
        delivery_agent_phone: deliveryAgentMobile,
        status: 'Out for Delivery',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) throw error;

    console.log('[Orders] Order accepted:', orderId);
    return { success: true };
  } catch (error: any) {
    console.error('[Orders] Error accepting order:', error);
    return { success: false, error: error.message || 'Failed to accept order' };
  }
}

/**
 * Reject an order (mark as rejected or leave unassigned)
 */
export async function rejectOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // For now, we just don't assign it - the order remains available for other delivery partners
    console.log('[Orders] Order rejected:', orderId);
    return { success: true };
  } catch (error: any) {
    console.error('[Orders] Exception in rejectOrder:', error);
    return { success: false, error: error.message || 'Failed to reject order' };
  }
}

/**
 * Mark order as delivered
 */
export async function markOrderDelivered(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'Delivered',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) throw error;

    console.log('[Orders] Order marked as delivered:', orderId);
    return { success: true };
  } catch (error: any) {
    console.error('[Orders] Error marking order as delivered:', error);
    return { success: false, error: error.message || 'Failed to mark order as delivered' };
  }
}
