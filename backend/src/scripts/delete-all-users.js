/**
 * Delete All Users from Supabase Database
 * ⚠️ WARNING: This will permanently delete all user data!
 */

import { supabaseAdmin } from '../config/database.js';

/**
 * Delete all users and related data
 * This will cascade delete:
 * - Users
 * - User profiles
 * - Addresses
 * - Orders
 * - Order items
 * - Login sessions
 * - Any other user-related data
 */
async function deleteAllUsers() {
  console.log('========================================');
  console.log('⚠️  DELETE ALL USERS - WARNING');
  console.log('========================================');
  console.log('');
  console.log('This will PERMANENTLY delete:');
  console.log('  ❌ All users');
  console.log('  ❌ All user profiles');
  console.log('  ❌ All user addresses');
  console.log('  ❌ All orders');
  console.log('  ❌ All login sessions');
  console.log('  ❌ All user-related activity logs');
  console.log('');
  console.log('This action CANNOT be undone!');
  console.log('========================================');
  console.log('');

  try {
    // Step 1: Get count of users before deletion
    const { data: usersBefore, error: countError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, phone');

    if (countError) {
      console.error('❌ Error counting users:', countError);
      return;
    }

    const userCount = usersBefore?.length || 0;

    if (userCount === 0) {
      console.log('✅ No users found in database.');
      console.log('Database is already clean!');
      return;
    }

    console.log(`📊 Found ${userCount} users in database:`);
    console.log('');
    usersBefore?.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.phone || user.email})`);
    });
    console.log('');
    console.log('========================================');
    console.log('🔄 Starting deletion process...');
    console.log('========================================');
    console.log('');

    // Step 2: Delete related data first (if foreign keys don't cascade)
    
    // Delete login sessions
    console.log('🗑️  Deleting login sessions...');
    const { error: sessionsError } = await supabaseAdmin
      .from('login_sessions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (sessionsError) {
      console.warn('⚠️  Warning: Error deleting sessions:', sessionsError.message);
    } else {
      console.log('✅ Login sessions deleted');
    }

    // Delete activity logs
    console.log('🗑️  Deleting activity logs...');
    const { error: logsError } = await supabaseAdmin
      .from('activity_logs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (logsError) {
      console.warn('⚠️  Warning: Error deleting logs:', logsError.message);
    } else {
      console.log('✅ Activity logs deleted');
    }

    // Delete order timeline
    console.log('🗑️  Deleting order timeline...');
    const { error: timelineError } = await supabaseAdmin
      .from('order_timeline')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (timelineError) {
      console.warn('⚠️  Warning: Error deleting timeline:', timelineError.message);
    } else {
      console.log('✅ Order timeline deleted');
    }

    // Delete order items
    console.log('🗑️  Deleting order items...');
    const { error: orderItemsError } = await supabaseAdmin
      .from('order_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (orderItemsError) {
      console.warn('⚠️  Warning: Error deleting order items:', orderItemsError.message);
    } else {
      console.log('✅ Order items deleted');
    }

    // Delete orders
    console.log('🗑️  Deleting orders...');
    const { error: ordersError } = await supabaseAdmin
      .from('orders')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (ordersError) {
      console.warn('⚠️  Warning: Error deleting orders:', ordersError.message);
    } else {
      console.log('✅ Orders deleted');
    }

    // Delete addresses
    console.log('🗑️  Deleting addresses...');
    const { error: addressesError } = await supabaseAdmin
      .from('addresses')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (addressesError) {
      console.warn('⚠️  Warning: Error deleting addresses:', addressesError.message);
    } else {
      console.log('✅ Addresses deleted');
    }

    // Delete user profiles
    console.log('🗑️  Deleting user profiles...');
    const { error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (profilesError) {
      console.warn('⚠️  Warning: Error deleting profiles:', profilesError.message);
    } else {
      console.log('✅ User profiles deleted');
    }

    // Step 3: Delete users (main table)
    console.log('🗑️  Deleting users...');
    const { error: usersError } = await supabaseAdmin
      .from('users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (usersError) {
      console.error('❌ Error deleting users:', usersError);
      throw usersError;
    }

    console.log('✅ Users deleted');
    console.log('');
    console.log('========================================');
    console.log('✅ DELETION COMPLETE');
    console.log('========================================');
    console.log('');
    console.log(`📊 Deleted ${userCount} users and all related data`);
    console.log('');
    console.log('Database is now clean!');
    console.log('Users can now register fresh accounts.');
    console.log('');
    console.log('========================================');

  } catch (error) {
    console.error('');
    console.error('========================================');
    console.error('❌ ERROR DURING DELETION');
    console.error('========================================');
    console.error('');
    console.error('Error details:', error);
    console.error('');
    console.error('Some data may have been deleted.');
    console.error('Please check the database manually.');
    console.error('');
    console.error('========================================');
    process.exit(1);
  }
}

/**
 * Backup users before deletion (optional)
 */
async function backupUsers() {
  console.log('💾 Creating backup of users...');
  
  try {
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('*');

    const { data: profiles } = await supabaseAdmin
      .from('user_profiles')
      .select('*');

    const { data: addresses } = await supabaseAdmin
      .from('addresses')
      .select('*');

    const backup = {
      timestamp: new Date().toISOString(),
      users: users || [],
      profiles: profiles || [],
      addresses: addresses || [],
    };

    const fs = await import('fs');
    const backupPath = `./user-backup-${Date.now()}.json`;
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));

    console.log(`✅ Backup saved to: ${backupPath}`);
    console.log('');
    
    return true;
  } catch (error) {
    console.error('❌ Error creating backup:', error);
    return false;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const shouldBackup = args.includes('--backup');
  const skipConfirm = args.includes('--yes');

  if (!skipConfirm) {
    console.log('');
    console.log('⚠️⚠️⚠️  DANGER ZONE  ⚠️⚠️⚠️');
    console.log('');
    console.log('This script will DELETE ALL USERS from Supabase!');
    console.log('');
    console.log('To proceed, run:');
    console.log('  node delete-all-users.js --yes');
    console.log('');
    console.log('To backup before deleting:');
    console.log('  node delete-all-users.js --backup --yes');
    console.log('');
    process.exit(0);
  }

  if (shouldBackup) {
    const backed = await backupUsers();
    if (!backed) {
      console.log('❌ Backup failed. Aborting deletion for safety.');
      process.exit(1);
    }
  }

  await deleteAllUsers();
  process.exit(0);
}

main();

