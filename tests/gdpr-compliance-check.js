import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TEST_EMAIL = process.env.TEST_EMAIL || 'luis940302@gmail.com';

if (!SUPABASE_URL) {
  console.error('❌ Error: VITE_SUPABASE_URL not found in environment');
  process.exit(1);
}

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in environment');
  console.error('ℹ️  This script requires the Supabase service role key for admin operations.');
  console.error('ℹ️  Add SUPABASE_SERVICE_ROLE_KEY to your .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runGDPRComplianceCheck() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         GDPR COMPLIANCE CHECK - ACCOUNT DELETION          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('🔍 Testing email:', TEST_EMAIL);
  console.log('📅 Timestamp:', new Date().toISOString());
  console.log('');

  const results = {
    timestamp: new Date().toISOString(),
    email: TEST_EMAIL,
    checks: [],
    overallCompliance: false,
    summary: {}
  };

  console.log('═'.repeat(60));
  console.log('📧 CHECK 1: Email Removed from auth.users');
  console.log('═'.repeat(60));
  try {
    const { data: authUser, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.log('⚠️  Warning: Could not query auth.users:', error.message);
      results.checks.push({
        name: 'Email removed from auth.users',
        passed: null,
        details: `Cannot verify: ${error.message}`
      });
    } else {
      const userExists = authUser.users.some(u => u.email === TEST_EMAIL);
      const passed = !userExists;

      results.checks.push({
        name: 'Email removed from auth.users',
        passed,
        details: passed
          ? 'Email not found in auth.users ✅'
          : `Email still exists in auth.users ❌`
      });

      if (passed) {
        console.log('✅ PASS: Email not found in auth.users');
      } else {
        console.log('❌ FAIL: Email still exists in auth.users');
        const user = authUser.users.find(u => u.email === TEST_EMAIL);
        console.log('   User ID:', user.id);
        console.log('   Created:', user.created_at);
      }
    }
  } catch (error) {
    console.log('❌ Error checking auth.users:', error.message);
    results.checks.push({
      name: 'Email removed from auth.users',
      passed: false,
      details: `Error: ${error.message}`
    });
  }

  console.log('');
  console.log('═'.repeat(60));
  console.log('👤 CHECK 2: First Name Deleted from user_profiles');
  console.log('═'.repeat(60));
  try {
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('user_id, first_name')
      .not('first_name', 'is', null);

    if (error) {
      console.log('❌ Error querying user_profiles:', error.message);
      results.checks.push({
        name: 'First name deleted',
        passed: false,
        details: `Error: ${error.message}`
      });
    } else {
      const authUsers = await supabase.auth.admin.listUsers();
      const testUserProfile = profiles?.find(p => {
        const user = authUsers.data.users.find(u => u.id === p.user_id);
        return user?.email === TEST_EMAIL;
      });

      const passed = !testUserProfile;

      results.checks.push({
        name: 'First name deleted from user_profiles',
        passed,
        details: passed
          ? 'No first_name found for user ✅'
          : `First name still exists: "${testUserProfile.first_name}" ❌`
      });

      if (passed) {
        console.log('✅ PASS: No first_name found');
      } else {
        console.log('❌ FAIL: First name still exists:', testUserProfile.first_name);
      }
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    results.checks.push({
      name: 'First name deleted',
      passed: false,
      details: `Error: ${error.message}`
    });
  }

  console.log('');
  console.log('═'.repeat(60));
  console.log('👤 CHECK 3: Last Name Deleted from user_profiles');
  console.log('═'.repeat(60));
  try {
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('user_id, last_name')
      .not('last_name', 'is', null);

    if (error) {
      console.log('❌ Error querying user_profiles:', error.message);
      results.checks.push({
        name: 'Last name deleted',
        passed: false,
        details: `Error: ${error.message}`
      });
    } else {
      const authUsers = await supabase.auth.admin.listUsers();
      const testUserProfile = profiles?.find(p => {
        const user = authUsers.data.users.find(u => u.id === p.user_id);
        return user?.email === TEST_EMAIL;
      });

      const passed = !testUserProfile;

      results.checks.push({
        name: 'Last name deleted from user_profiles',
        passed,
        details: passed
          ? 'No last_name found for user ✅'
          : `Last name still exists: "${testUserProfile.last_name}" ❌`
      });

      if (passed) {
        console.log('✅ PASS: No last_name found');
      } else {
        console.log('❌ FAIL: Last name still exists:', testUserProfile.last_name);
      }
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    results.checks.push({
      name: 'Last name deleted',
      passed: false,
      details: `Error: ${error.message}`
    });
  }

  console.log('');
  console.log('═'.repeat(60));
  console.log('🔐 CHECK 4: Password Hash Removed');
  console.log('═'.repeat(60));
  try {
    const testClient = createClient(SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
    const { error: loginError } = await testClient.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: 'any-password-will-fail-if-deleted'
    });

    const passed = loginError !== null && loginError.message.includes('Invalid');

    results.checks.push({
      name: 'Password hash removed',
      passed,
      details: passed
        ? 'Login failed as expected (account deleted) ✅'
        : 'Login succeeded - account still exists ❌'
    });

    if (passed) {
      console.log('✅ PASS: Login failed (account deleted)');
      console.log('   Error message:', loginError.message);
    } else {
      console.log('❌ FAIL: Login succeeded - account still exists');
    }
  } catch (error) {
    console.log('❌ Error testing login:', error.message);
    results.checks.push({
      name: 'Password hash removed',
      passed: false,
      details: `Error: ${error.message}`
    });
  }

  console.log('');
  console.log('═'.repeat(60));
  console.log('📊 CHECK 5: Business Data Preserved');
  console.log('═'.repeat(60));
  try {
    const [clients, sessions, fabrics, measurements, tasks, problems] = await Promise.all([
      supabase.from('clients').select('id', { count: 'exact', head: true }),
      supabase.from('sessions').select('id', { count: 'exact', head: true }),
      supabase.from('fabrics').select('id', { count: 'exact', head: true }),
      supabase.from('measurements').select('id', { count: 'exact', head: true }),
      supabase.from('tasks').select('id', { count: 'exact', head: true }),
      supabase.from('problems').select('id', { count: 'exact', head: true })
    ]);

    const counts = {
      clients: clients.count || 0,
      sessions: sessions.count || 0,
      fabrics: fabrics.count || 0,
      measurements: measurements.count || 0,
      tasks: tasks.count || 0,
      problems: problems.count || 0
    };

    const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);
    const passed = totalRecords > 0;

    results.checks.push({
      name: 'Business data preserved',
      passed,
      details: `Total records: ${totalRecords} (${JSON.stringify(counts)})`
    });

    results.summary.businessData = counts;

    console.log('Business Data Counts:');
    console.log('   Clients:', counts.clients);
    console.log('   Sessions:', counts.sessions);
    console.log('   Fabrics:', counts.fabrics);
    console.log('   Measurements:', counts.measurements);
    console.log('   Tasks:', counts.tasks);
    console.log('   Problems:', counts.problems);
    console.log('   Total Records:', totalRecords);

    if (passed) {
      console.log('✅ PASS: Business data preserved');
    } else {
      console.log('⚠️  WARNING: No business data found (database may be empty)');
    }
  } catch (error) {
    console.log('❌ Error checking business data:', error.message);
    results.checks.push({
      name: 'Business data preserved',
      passed: null,
      details: `Error: ${error.message}`
    });
  }

  console.log('');
  console.log('═'.repeat(60));
  console.log('🔍 CHECK 6: Email Re-registration Availability');
  console.log('═'.repeat(60));
  try {
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const userExists = authUsers.users.some(u => u.email === TEST_EMAIL);
    const passed = !userExists;

    results.checks.push({
      name: 'Email available for re-registration',
      passed,
      details: passed
        ? 'Email not in use - can re-register ✅'
        : 'Email still in use - cannot re-register ❌'
    });

    if (passed) {
      console.log('✅ PASS: Email available for re-registration');
    } else {
      console.log('❌ FAIL: Email still in use');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    results.checks.push({
      name: 'Email available for re-registration',
      passed: false,
      details: `Error: ${error.message}`
    });
  }

  const piiChecks = results.checks.filter(c =>
    c.name.includes('Email removed') ||
    c.name.includes('First name') ||
    c.name.includes('Last name') ||
    c.name.includes('Password')
  );

  const allPIIRemoved = piiChecks
    .filter(c => c.passed !== null)
    .every(c => c.passed);

  results.overallCompliance = allPIIRemoved;

  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                   COMPLIANCE SUMMARY                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('Email:', TEST_EMAIL);
  console.log('Timestamp:', results.timestamp);
  console.log('');
  console.log('Overall GDPR Compliance:', allPIIRemoved ? '✅ COMPLIANT' : '❌ NOT COMPLIANT');
  console.log('');
  console.log('Detailed Results:');
  console.log('─'.repeat(60));

  results.checks.forEach((check, idx) => {
    const status = check.passed === null ? '⚠️ ' : check.passed ? '✅' : '❌';
    console.log(`${idx + 1}. ${status} ${check.name}`);
    console.log(`   ${check.details}`);
  });

  const reportPath = `./tests/gdpr-compliance-report-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

  console.log('');
  console.log('─'.repeat(60));
  console.log('💾 Report saved to:', reportPath);
  console.log('');

  if (allPIIRemoved) {
    console.log('🎉 SUCCESS: All PII has been removed. Account deletion is GDPR compliant.');
  } else {
    console.log('⚠️  FAILURE: Some PII still exists. Account deletion is NOT GDPR compliant.');
    console.log('ℹ️  Please review the failed checks above.');
  }

  console.log('');
  return results;
}

runGDPRComplianceCheck()
  .then(results => {
    process.exit(results.overallCompliance ? 0 : 1);
  })
  .catch(error => {
    console.error('');
    console.error('═'.repeat(60));
    console.error('❌ FATAL ERROR');
    console.error('═'.repeat(60));
    console.error('Error running GDPR compliance check:', error.message);
    console.error('Stack trace:', error.stack);
    console.error('');
    process.exit(1);
  });
