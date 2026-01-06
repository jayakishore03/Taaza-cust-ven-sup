/**
 * Check Orders Table in Supabase
 * Run this script to see what orders are in the database
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://fcrhcwvpivkadkkbxcom.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcmhjd3ZwaXZrYWRra2J4Y29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MzUzMDQsImV4cCI6MjA4MDQxMTMwNH0.MjBw7_aVc2VlfND7Ec93sNOp352xcC0B8sZZvaH-Jkg';

console.log(`Using Supabase URL: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrders() {
  console.log('========================================');
  console.log('📦 CHECKING ORDERS TABLE IN SUPABASE');
  console.log('========================================\n');

  try {
    // Get all orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      return;
    }

    console.log(`✅ Found ${orders?.length || 0} orders\n`);

    if (!orders || orders.length === 0) {
      console.log('⚠️ No orders found in the database');
      return;
    }

    // Display orders summary
    console.log('📋 ORDERS SUMMARY:');
    console.log('========================================');
    orders.forEach((order, index) => {
      console.log(`\n${index + 1}. Order #${order.order_number || order.id}`);
      console.log(`   ID: ${order.id}`);
      console.log(`   Shop ID: ${order.shop_id || 'NULL'}`);
      console.log(`   User ID: ${order.user_id || 'N/A'}`);
      console.log(`   Status: ${order.status || 'N/A'}`);
      console.log(`   Total: ₹${order.total || 0}`);
      console.log(`   Created: ${order.created_at || 'N/A'}`);
      console.log(`   Updated: ${order.updated_at || 'N/A'}`);
    });

    // Check shop_id distribution
    console.log('\n\n📊 SHOP_ID ANALYSIS:');
    console.log('========================================');
    const shopIdCounts = {};
    orders.forEach(order => {
      const shopId = order.shop_id || 'NULL';
      shopIdCounts[shopId] = (shopIdCounts[shopId] || 0) + 1;
    });

    console.log('\nOrders by Shop ID:');
    Object.entries(shopIdCounts).forEach(([shopId, count]) => {
      console.log(`  ${shopId}: ${count} order(s)`);
    });

    // Get recent orders with shop_id
    console.log('\n\n🔍 RECENT ORDERS WITH SHOP_ID:');
    console.log('========================================');
    const ordersWithShopId = orders.filter(o => o.shop_id);
    console.log(`Found ${ordersWithShopId.length} orders with shop_id\n`);
    
    ordersWithShopId.slice(0, 10).forEach((order, index) => {
      console.log(`${index + 1}. ${order.order_number} - Shop: ${order.shop_id} - Status: ${order.status} - Created: ${order.created_at}`);
    });

    // Check for orders without shop_id
    const ordersWithoutShopId = orders.filter(o => !o.shop_id);
    if (ordersWithoutShopId.length > 0) {
      console.log('\n\n⚠️ ORDERS WITHOUT SHOP_ID:');
      console.log('========================================');
      console.log(`Found ${ordersWithoutShopId.length} orders without shop_id:\n`);
      ordersWithoutShopId.slice(0, 10).forEach((order, index) => {
        console.log(`${index + 1}. ${order.order_number} - User: ${order.user_id} - Status: ${order.status} - Created: ${order.created_at}`);
      });
    }

    // Get shops to compare
    console.log('\n\n🏪 SHOPS IN DATABASE:');
    console.log('========================================');
    const { data: shops, error: shopsError } = await supabase
      .from('shops')
      .select('id, name, user_id, email, mobile_number')
      .limit(20);

    if (shopsError) {
      console.error('❌ Error fetching shops:', shopsError);
    } else {
      console.log(`Found ${shops?.length || 0} shops:\n`);
      shops?.forEach((shop, index) => {
        console.log(`${index + 1}. Shop ID: ${shop.id}`);
        console.log(`   Name: ${shop.name || 'N/A'}`);
        console.log(`   User ID: ${shop.user_id || 'NULL'}`);
        console.log(`   Email: ${shop.email || 'N/A'}`);
        console.log(`   Mobile: ${shop.mobile_number || 'N/A'}`);
        console.log('');
      });
    }

    console.log('\n========================================');
    console.log('✅ CHECK COMPLETE');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkOrders();

