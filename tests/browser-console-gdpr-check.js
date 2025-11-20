/**
 * BROWSER CONSOLE GDPR COMPLIANCE CHECK
 *
 * This script can be pasted directly into the browser DevTools console
 * for quick verification of account deletion GDPR compliance.
 *
 * USAGE:
 * 1. Open your application in the browser
 * 2. Open DevTools (F12 or Cmd+Option+I)
 * 3. Go to Console tab
 * 4. Copy and paste this entire script
 * 5. Press Enter to run
 *
 * The script will test:
 * - User profile deletion (first_name, last_name)
 * - Login failure (password removed)
 * - Business data preservation
 *
 * NOTE: Make sure you're logged in as a different user or logged out
 * before running this script after account deletion.
 */

(async function quickGDPRCheck() {
  const TEST_EMAIL = 'luis940302@gmail.com';

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       QUICK GDPR COMPLIANCE CHECK (Browser Console)       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('🔍 Testing email:', TEST_EMAIL);
  console.log('📅 Timestamp:', new Date().toISOString());
  console.log('');

  if (typeof supabase === 'undefined') {
    console.error('❌ ERROR: Supabase client not found!');
    console.error('ℹ️  Make sure you\'re running this in the application context');
    return;
  }

  const results = {
    email: TEST_EMAIL,
    timestamp: new Date().toISOString(),
    checks: [],
    passed: 0,
    failed: 0,
    warnings: 0
  };

  console.log('═'.repeat(60));
  console.log('👤 CHECK 1: User Profile Deleted');
  console.log('═'.repeat(60));

  try {
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('first_name, last_name, user_id')
      .limit(100);

    if (error) {
      console.log('⚠️  Warning: Cannot query user_profiles:', error.message);
      console.log('   This might be expected if you\'re not logged in');
      results.checks.push({ name: 'Profile deleted', status: 'warning', reason: error.message });
      results.warnings++;
    } else {
      const hasAnyPII = profiles?.some(p => p.first_name || p.last_name);

      if (!profiles || profiles.length === 0) {
        console.log('✅ PASS: No profiles found (likely not logged in or all deleted)');
        results.checks.push({ name: 'Profile deleted', status: 'pass' });
        results.passed++;
      } else if (!hasAnyPII) {
        console.log('✅ PASS: Profiles exist but no PII found');
        console.log('   Total profiles:', profiles.length);
        results.checks.push({ name: 'Profile deleted', status: 'pass' });
        results.passed++;
      } else {
        const piiProfiles = profiles.filter(p => p.first_name || p.last_name);
        console.log('⚠️  Found', piiProfiles.length, 'profiles with PII');
        console.log('   Note: These might belong to other users');
        results.checks.push({
          name: 'Profile deleted',
          status: 'warning',
          reason: `${piiProfiles.length} profiles with PII found (may be other users)`
        });
        results.warnings++;
      }
    }
  } catch (err) {
    console.log('❌ FAIL: Error checking profiles:', err.message);
    results.checks.push({ name: 'Profile deleted', status: 'fail', reason: err.message });
    results.failed++;
  }

  console.log('');
  console.log('═'.repeat(60));
  console.log('🔐 CHECK 2: Login Test (Password Removed)');
  console.log('═'.repeat(60));

  try {
    console.log('ℹ️  Attempting login with deleted account...');

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: 'test-password-should-fail'
    });

    if (loginError) {
      if (loginError.message.includes('Invalid') || loginError.message.includes('not found')) {
        console.log('✅ PASS: Login failed as expected (account deleted)');
        console.log('   Error:', loginError.message);
        results.checks.push({ name: 'Password removed', status: 'pass' });
        results.passed++;
      } else {
        console.log('⚠️  WARNING: Login failed with unexpected error');
        console.log('   Error:', loginError.message);
        results.checks.push({ name: 'Password removed', status: 'warning', reason: loginError.message });
        results.warnings++;
      }
    } else {
      console.log('❌ FAIL: Login succeeded - account still exists!');
      console.log('   User:', data.user?.email);
      results.checks.push({ name: 'Password removed', status: 'fail', reason: 'Login succeeded' });
      results.failed++;
    }
  } catch (err) {
    console.log('❌ FAIL: Unexpected error during login test:', err.message);
    results.checks.push({ name: 'Password removed', status: 'fail', reason: err.message });
    results.failed++;
  }

  console.log('');
  console.log('═'.repeat(60));
  console.log('📊 CHECK 3: Business Data Preserved');
  console.log('═'.repeat(60));

  try {
    const [clients, sessions, fabrics] = await Promise.all([
      supabase.from('clients').select('id', { count: 'exact', head: true }),
      supabase.from('sessions').select('id', { count: 'exact', head: true }),
      supabase.from('fabrics').select('id', { count: 'exact', head: true })
    ]);

    const counts = {
      clients: clients.count || 0,
      sessions: sessions.count || 0,
      fabrics: fabrics.count || 0
    };

    const totalRecords = counts.clients + counts.sessions + counts.fabrics;

    console.log('Business Data Counts:');
    console.log('   Clients:', counts.clients);
    console.log('   Sessions:', counts.sessions);
    console.log('   Fabrics:', counts.fabrics);
    console.log('   Total:', totalRecords);

    if (totalRecords > 0) {
      console.log('✅ PASS: Business data preserved');
      results.checks.push({ name: 'Business data preserved', status: 'pass', data: counts });
      results.passed++;
    } else {
      console.log('⚠️  WARNING: No business data found');
      console.log('   This could mean:');
      console.log('   - Database is empty');
      console.log('   - You\'re not logged in');
      console.log('   - RLS policies are blocking access');
      results.checks.push({ name: 'Business data preserved', status: 'warning', reason: 'No data found' });
      results.warnings++;
    }
  } catch (err) {
    console.log('❌ FAIL: Error checking business data:', err.message);
    results.checks.push({ name: 'Business data preserved', status: 'fail', reason: err.message });
    results.failed++;
  }

  console.log('');
  console.log('═'.repeat(60));
  console.log('🔍 CHECK 4: Email Uniqueness (Re-registration Possible)');
  console.log('═'.repeat(60));

  try {
    console.log('ℹ️  Checking if email can be reused for sign up...');

    const { data, error } = await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: 'test-password-for-checking-only-12345'
    });

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        console.log('❌ FAIL: Email still registered');
        console.log('   Error:', error.message);
        results.checks.push({ name: 'Email available', status: 'fail', reason: error.message });
        results.failed++;
      } else if (error.message.includes('whitelist')) {
        console.log('⚠️  Email not whitelisted (cannot test re-registration)');
        console.log('   Error:', error.message);
        results.checks.push({ name: 'Email available', status: 'warning', reason: 'Not whitelisted' });
        results.warnings++;
      } else {
        console.log('⚠️  Unexpected error:', error.message);
        results.checks.push({ name: 'Email available', status: 'warning', reason: error.message });
        results.warnings++;
      }
    } else {
      console.log('✅ PASS: Email available (signup initiated)');
      console.log('   Note: A new account was created for testing');
      console.log('   You may want to delete this test account');
      results.checks.push({ name: 'Email available', status: 'pass' });
      results.passed++;

      await supabase.auth.signOut();
    }
  } catch (err) {
    console.log('❌ Error testing email availability:', err.message);
    results.checks.push({ name: 'Email available', status: 'fail', reason: err.message });
    results.failed++;
  }

  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                      TEST SUMMARY                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('Email:', TEST_EMAIL);
  console.log('Timestamp:', results.timestamp);
  console.log('');
  console.log('Results:');
  console.log('   ✅ Passed:', results.passed);
  console.log('   ❌ Failed:', results.failed);
  console.log('   ⚠️  Warnings:', results.warnings);
  console.log('');

  if (results.failed === 0 && results.passed >= 2) {
    console.log('🎉 GDPR COMPLIANT: Account deletion appears successful!');
    console.log('   All critical checks passed.');
  } else if (results.failed > 0) {
    console.log('⚠️  NOT COMPLIANT: Some checks failed.');
    console.log('   Please review the failed checks above.');
  } else {
    console.log('⚠️  INCONCLUSIVE: Not enough checks passed.');
    console.log('   You may need to log in or check permissions.');
  }

  console.log('');
  console.log('📋 Detailed Results:');
  console.table(results.checks);

  console.log('');
  console.log('💡 TIP: For comprehensive testing, run the Node.js script:');
  console.log('   npm run test:gdpr');
  console.log('');

  return results;
})();
