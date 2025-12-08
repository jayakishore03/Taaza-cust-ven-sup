/**
 * Cleanup Script - Remove newly added tables from Supabase
 * Tables to remove: users, login_sessions, shops_new, user_activity_logs
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Set this for local development SSL issues
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const isProduction = process.env.NODE_ENV === 'production';

// Create PostgreSQL pool
const pool = new pg.Pool({
  connectionString: isProduction ? process.env.DATABASE_URL : process.env.DIRECT_URL,
  ssl: isProduction ? {
    rejectUnauthorized: true,
  } : {
    rejectUnauthorized: false,
  },
});

async function cleanup() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  CLEANUP - REMOVE NEWLY ADDED TABLES                   ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  let client;
  
  try {
    console.log('🔌 Connecting to database...');
    client = await pool.connect();
    console.log('✅ Connected\n');

    console.log('🗑️  Removing tables in correct order...\n');

    // Drop tables in reverse order of dependencies
    const tables = [
      'user_activity_logs',
      'login_sessions',
      'shops_new',
      'users'
    ];

    for (const table of tables) {
      try {
        await client.query(`DROP TABLE IF EXISTS public.${table} CASCADE`);
        console.log(`  ✅ Dropped table: ${table}`);
      } catch (error) {
        console.log(`  ⚠️  Could not drop ${table}: ${error.message}`);
      }
    }

    console.log('\n🗑️  Removing triggers and functions...\n');

    // Drop triggers
    const triggers = [
      { name: 'trigger_update_users_updated_at', table: 'users' },
      { name: 'trigger_update_login_sessions_updated_at', table: 'login_sessions' },
      { name: 'trigger_update_shops_new_updated_at', table: 'shops_new' }
    ];

    for (const trigger of triggers) {
      try {
        await client.query(`DROP TRIGGER IF EXISTS ${trigger.name} ON public.${trigger.table}`);
        console.log(`  ✅ Dropped trigger: ${trigger.name}`);
      } catch (error) {
        // Ignore errors - table might not exist
      }
    }

    // Drop functions
    const functions = [
      'update_users_updated_at()',
      'update_login_sessions_updated_at()',
      'update_shops_new_updated_at()'
    ];

    for (const func of functions) {
      try {
        await client.query(`DROP FUNCTION IF EXISTS public.${func}`);
        console.log(`  ✅ Dropped function: ${func}`);
      } catch (error) {
        // Ignore errors
      }
    }

    console.log('\n📊 Verifying cleanup...\n');

    // Verify tables are gone
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'login_sessions', 'shops_new', 'user_activity_logs')
    `);

    if (result.rows.length === 0) {
      console.log('✅ All tables successfully removed!\n');
    } else {
      console.log('⚠️  Some tables still exist:');
      result.rows.forEach(row => console.log(`  - ${row.table_name}`));
      console.log();
    }

    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  ✅ CLEANUP COMPLETE!                                  ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    console.log('Next step: Run properly formatted migration');
    console.log('  npm run add:tables-formatted\n');

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

cleanup().catch(console.error);

