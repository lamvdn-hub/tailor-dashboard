-- ============================================
-- ACCOUNT DELETION VERIFICATION SCRIPT
-- Email: luis940302@gmail.com
-- ============================================
-- This script verifies that account deletion properly removes all PII
-- while preserving business data for other users.
--
-- USAGE:
-- 1. Run queries 1-3 BEFORE deleting the account
-- 2. Delete the account via the application UI
-- 3. Run queries 4-10 AFTER deletion to verify compliance
-- ============================================

-- ============================================
-- BEFORE DELETION: Data Collection Queries
-- ============================================

-- 1. Check if user exists in auth.users
-- Expected: Should return 1 row with user details
SELECT
  id as user_id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at,
  '✓ User exists' as status
FROM auth.users
WHERE email = 'luis940302@gmail.com';

-- 2. Check user profile data
-- Expected: Should return 1 row with first_name and last_name
SELECT
  id,
  user_id,
  first_name,
  last_name,
  created_at,
  updated_at,
  '✓ Profile exists' as status
FROM user_profiles
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'luis940302@gmail.com');

-- 3. Count business data (for preservation verification)
-- Expected: Returns counts of all business data
SELECT
  (SELECT COUNT(*) FROM clients) as total_clients,
  (SELECT COUNT(*) FROM sessions) as total_sessions,
  (SELECT COUNT(*) FROM fabrics) as total_fabrics,
  (SELECT COUNT(*) FROM measurements) as total_measurements,
  (SELECT COUNT(*) FROM tasks) as total_tasks,
  (SELECT COUNT(*) FROM problems) as total_problems,
  '✓ Business data snapshot taken' as status;

-- ============================================
-- AFTER DELETION: Verification Queries
-- ============================================

-- 4. Verify user NO LONGER exists in auth.users
-- Expected: COUNT should be 0
SELECT
  COUNT(*) as user_count,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ PASS: User deleted from auth.users'
    ELSE '❌ FAIL: User still exists in auth.users'
  END as verification_status
FROM auth.users
WHERE email = 'luis940302@gmail.com';

-- 5. Verify user profile NO LONGER exists
-- Expected: COUNT should be 0
SELECT
  COUNT(*) as profile_count,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ PASS: Profile deleted'
    ELSE '❌ FAIL: Profile still exists'
  END as verification_status
FROM user_profiles
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'luis940302@gmail.com');

-- 6. Search for any remaining first_name or last_name associated with deleted user
-- Expected: Should return 0 rows (no PII found)
SELECT
  first_name,
  last_name,
  user_id,
  '❌ FAIL: PII still exists' as status
FROM user_profiles
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'luis940302@gmail.com');

-- 7. Verify password hash is removed
-- Expected: COUNT should be 0
SELECT
  COUNT(*) as users_with_password,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ PASS: Password completely removed'
    ELSE '❌ FAIL: Password data still exists'
  END as verification_status
FROM auth.users
WHERE email = 'luis940302@gmail.com'
  AND encrypted_password IS NOT NULL;

-- 8. Verify business data is PRESERVED
-- Expected: Counts should match or exceed pre-deletion counts from query 3
SELECT
  (SELECT COUNT(*) FROM clients) as total_clients,
  (SELECT COUNT(*) FROM sessions) as total_sessions,
  (SELECT COUNT(*) FROM fabrics) as total_fabrics,
  (SELECT COUNT(*) FROM measurements) as total_measurements,
  (SELECT COUNT(*) FROM tasks) as total_tasks,
  (SELECT COUNT(*) FROM problems) as total_problems,
  '✅ Business data should match pre-deletion counts' as note;

-- 9. Check if email is still whitelisted
-- Expected: May return 1 row (email can remain whitelisted for re-registration)
SELECT
  email,
  added_at,
  notes,
  CASE
    WHEN email IS NOT NULL THEN '✓ Email still whitelisted (can re-register)'
    ELSE 'Email not in whitelist'
  END as whitelist_status
FROM email_whitelist
WHERE email = 'luis940302@gmail.com';

-- ============================================
-- GDPR COMPLIANCE SUMMARY
-- ============================================

-- 10. Comprehensive GDPR compliance check
-- Expected: Should show "✅ GDPR COMPLIANT: All PII removed"
SELECT
  'PII Deletion Status' as check_category,
  CASE
    WHEN (SELECT COUNT(*) FROM auth.users WHERE email = 'luis940302@gmail.com') = 0
     AND (SELECT COUNT(*) FROM user_profiles WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'luis940302@gmail.com')) = 0
    THEN '✅ GDPR COMPLIANT: All PII removed'
    ELSE '❌ NOT COMPLIANT: PII still exists'
  END as compliance_status;

-- ============================================
-- ADVANCED VERIFICATION QUERIES
-- ============================================

-- 11. Check for any orphaned user_profiles (should be 0 after CASCADE delete)
-- Expected: COUNT should be 0
SELECT
  COUNT(*) as orphaned_profiles,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ PASS: No orphaned profiles'
    ELSE '⚠️  WARNING: Orphaned profiles found'
  END as status
FROM user_profiles
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- 12. Verify email is truly unique and can be re-registered
-- Expected: COUNT should be 0 (email not in use)
SELECT
  COUNT(*) as email_in_use_count,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ PASS: Email available for re-registration'
    ELSE '❌ FAIL: Email still in use'
  END as reregistration_status
FROM auth.users
WHERE email = 'luis940302@gmail.com';

-- ============================================
-- TEST EXECUTION LOG
-- ============================================
--
-- PRE-DELETION EXECUTION:
-- Date: _________________
-- Query 1 Result: _________________
-- Query 2 Result: _________________
-- Query 3 Result: _________________
--
-- ACCOUNT DELETION:
-- Deletion performed at: _________________
-- Deletion method: [ ] Via UI [ ] Via SQL
--
-- POST-DELETION EXECUTION:
-- Date: _________________
-- Query 4 Result: _________________
-- Query 5 Result: _________________
-- Query 6 Result: _________________
-- Query 7 Result: _________________
-- Query 8 Result: _________________
-- Query 9 Result: _________________
-- Query 10 Result: _________________
-- Query 11 Result: _________________
-- Query 12 Result: _________________
--
-- OVERALL RESULT: [ ] PASS [ ] FAIL
-- Notes: _________________________________
-- ============================================
