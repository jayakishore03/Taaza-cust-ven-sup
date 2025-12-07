/**
 * Diagnose and Fix Signup/Signin Conflicts
 * Run this when user says "already registered" but can't sign in
 */

import { supabase, supabaseAdmin } from '../config/database.js';

async function diagnosePhoneNumber(phone) {
  console.log('========================================');
  console.log('🔍 DIAGNOSING PHONE NUMBER');
  console.log('========================================');
  console.log('Phone:', phone);
  console.log('');

  // Check in users table
  const { data: usersByPhone } = await supabase
    .from('users')
    .select('*')
    .eq('phone', phone);

  console.log('--- USERS TABLE ---');
  if (usersByPhone && usersByPhone.length > 0) {
    console.log('✅ Found in users table:', usersByPhone.length, 'entries');
    usersByPhone.forEach((user, i) => {
      console.log(`  ${i + 1}. Name: ${user.name}`);
      console.log(`     ID: ${user.id}`);
      console.log(`     Email: ${user.email || 'None'}`);
      console.log(`     Created: ${user.created_at}`);
    });
  } else {
    console.log('❌ NOT found in users table');
  }
  console.log('');

  // Check in user_profiles table
  const { data: profilesByPhone } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('phone', phone);

  console.log('--- USER_PROFILES TABLE ---');
  if (profilesByPhone && profilesByPhone.length > 0) {
    console.log('✅ Found in user_profiles table:', profilesByPhone.length, 'entries');
    profilesByPhone.forEach((profile, i) => {
      console.log(`  ${i + 1}. Name: ${profile.name}`);
      console.log(`     ID: ${profile.id}`);
      console.log(`     Email: ${profile.email || 'None'}`);
      console.log(`     Created: ${profile.created_at}`);
    });
  } else {
    console.log('❌ NOT found in user_profiles table');
  }
  console.log('');

  // Diagnosis
  console.log('========================================');
  console.log('📋 DIAGNOSIS');
  console.log('========================================');

  const inUsers = usersByPhone && usersByPhone.length > 0;
  const inProfiles = profilesByPhone && profilesByPhone.length > 0;

  if (inUsers && inProfiles) {
    console.log('✅ STATUS: NORMAL');
    console.log('User exists in both tables.');
    console.log('User should be able to sign in.');
    console.log('');
    console.log('ACTION: None needed. User can sign in normally.');
  } else if (!inUsers && !inProfiles) {
    console.log('✅ STATUS: AVAILABLE');
    console.log('Phone number is not registered.');
    console.log('User can sign up normally.');
    console.log('');
    console.log('ACTION: None needed. User can sign up.');
  } else if (!inUsers && inProfiles) {
    console.log('⚠️  STATUS: ORPHANED PROFILE');
    console.log('Profile exists but user does NOT exist!');
    console.log('This causes the conflict:');
    console.log('  - Sign Up says: "Already registered" ❌');
    console.log('  - Sign In says: "Account not found" ❌');
    console.log('');
    console.log('ACTION: Cleanup orphaned profile to allow signup.');
    return { status: 'orphaned_profile', profile: profilesByPhone[0] };
  } else if (inUsers && !inProfiles) {
    console.log('⚠️  STATUS: ORPHANED USER');
    console.log('User exists but profile does NOT exist!');
    console.log('This is unusual and may cause issues.');
    console.log('');
    console.log('ACTION: Create missing profile.');
    return { status: 'orphaned_user', user: usersByPhone[0] };
  }

  return { status: 'ok' };
}

async function fixOrphanedProfile(profile) {
  console.log('========================================');
  console.log('🧹 FIXING ORPHANED PROFILE');
  console.log('========================================');
  console.log('Profile ID:', profile.id);
  console.log('Name:', profile.name);
  console.log('Phone:', profile.phone);
  console.log('');

  try {
    // Delete related data
    console.log('Deleting related data...');
    await supabaseAdmin.from('addresses').delete().eq('user_id', profile.id);
    await supabaseAdmin.from('orders').delete().eq('user_id', profile.id);
    await supabaseAdmin.from('order_items').delete().eq('order_id', profile.id);
    await supabaseAdmin.from('login_sessions').delete().eq('user_id', profile.id);
    await supabaseAdmin.from('activity_logs').delete().eq('user_id', profile.id);

    // Delete the profile
    console.log('Deleting orphaned profile...');
    const { error } = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('id', profile.id);

    if (error) throw error;

    console.log('✅ Orphaned profile deleted successfully!');
    console.log('');
    console.log('User can now sign up with phone:', profile.phone);

    return true;
  } catch (error) {
    console.error('❌ Error fixing orphaned profile:', error);
    return false;
  }
}

async function fixOrphanedUser(user) {
  console.log('========================================');
  console.log('🔧 FIXING ORPHANED USER');
  console.log('========================================');
  console.log('User ID:', user.id);
  console.log('Name:', user.name);
  console.log('Phone:', user.phone);
  console.log('');

  try {
    // Create missing profile
    console.log('Creating missing profile...');
    const profileData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      created_at: user.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin
      .from('user_profiles')
      .insert(profileData);

    if (error) throw error;

    console.log('✅ Profile created successfully!');
    console.log('');
    console.log('User can now sign in normally.');

    return true;
  } catch (error) {
    console.error('❌ Error fixing orphaned user:', error);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const phone = args.find(arg => !arg.startsWith('--'));
  const autoFix = args.includes('--fix');

  if (!phone) {
    console.log('');
    console.log('Usage:');
    console.log('  node diagnose-phone.js <phone_number>');
    console.log('  node diagnose-phone.js <phone_number> --fix');
    console.log('');
    console.log('Examples:');
    console.log('  node diagnose-phone.js 9876543210');
    console.log('  node diagnose-phone.js 9876543210 --fix');
    console.log('');
    process.exit(0);
  }

  const result = await diagnosePhoneNumber(phone);

  if (result.status === 'orphaned_profile' && autoFix) {
    console.log('========================================');
    console.log('');
    const fixed = await fixOrphanedProfile(result.profile);
    if (fixed) {
      console.log('========================================');
      console.log('✅ FIX COMPLETE!');
      console.log('========================================');
      console.log('');
      console.log('User can now sign up with:', phone);
      console.log('');
    }
  } else if (result.status === 'orphaned_user' && autoFix) {
    console.log('========================================');
    console.log('');
    const fixed = await fixOrphanedUser(result.user);
    if (fixed) {
      console.log('========================================');
      console.log('✅ FIX COMPLETE!');
      console.log('========================================');
      console.log('');
      console.log('User can now sign in normally.');
      console.log('');
    }
  } else if (result.status !== 'ok' && !autoFix) {
    console.log('========================================');
    console.log('💡 NEXT STEP');
    console.log('========================================');
    console.log('');
    console.log('To fix this issue, run:');
    console.log(`  node src/scripts/diagnose-phone.js ${phone} --fix`);
    console.log('');
  }

  console.log('========================================');
  process.exit(0);
}

main();

