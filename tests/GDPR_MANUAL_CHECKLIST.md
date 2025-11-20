# GDPR Compliance Manual Testing Checklist
## Account Deletion Verification for luis940302@gmail.com

---

## 📋 Overview

This checklist ensures that account deletion properly removes all Personally Identifiable Information (PII) while preserving business data for other users. This is required for GDPR Article 17 (Right to Erasure) compliance.

**Test Subject:** luis940302@gmail.com
**Date:** _______________
**Tester:** _______________

---

## ✅ PRE-DELETION SETUP

### 1. Login and Document Current State
- [ ] Log into application with email: `luis940302@gmail.com`
- [ ] Navigate to Profile & Security page
- [ ] Document current information:
  - Email: `luis940302@gmail.com`
  - First Name: `________________`
  - Last Name: `________________`
  - Member Since: `________________`

### 2. Data Export (GDPR Article 15 - Right to Access)
- [ ] Click "Download My Data" button on Profile & Security page
- [ ] Verify JSON file downloads successfully
- [ ] Open JSON file and verify it contains:
  - [ ] User profile information
  - [ ] Clients data
  - [ ] Sessions data
  - [ ] Measurements data
  - [ ] Fabrics data
- [ ] Save this file for post-deletion verification
- [ ] File name: `________________`

### 3. Business Data Snapshot
- [ ] Navigate to Dashboard
- [ ] Document counts:
  - Total Clients: `_____`
  - Active Sessions: `_____`
  - Ready Sessions: `_____`
- [ ] Navigate to Fabrics page
  - Total Fabrics: `_____`
- [ ] Navigate to Tasks page
  - Total Tasks: `_____`
- [ ] Navigate to Queries page
  - Total Queries: `_____`

### 4. Database Verification (Optional - Requires SQL Access)
- [ ] Open Supabase Dashboard SQL Editor
- [ ] Run queries 1-3 from `deletion-verification.sql`
- [ ] Document results:
  - Query 1 (User exists): `________________`
  - Query 2 (Profile exists): `________________`
  - Query 3 (Business data counts): `________________`

### 5. Screenshots
- [ ] Take screenshot of Profile & Security page showing current data
- [ ] Take screenshot of Dashboard showing statistics
- [ ] Save screenshots with timestamp
- [ ] Screenshot files: `________________`

---

## 🗑️ ACCOUNT DELETION PROCESS

### 1. Initiate Deletion
- [ ] Navigate to Profile & Security page
- [ ] Scroll to "Delete Account" section (red border)
- [ ] Read the warning message carefully
- [ ] Verify warning lists:
  - [ ] "Your account and login credentials will be permanently deleted"
  - [ ] "Your profile information (name, email) will be removed"
  - [ ] "You will be immediately logged out"
  - [ ] "Business data will be preserved for other users"

### 2. Confirmation Process
- [ ] Click "Delete My Account" button
- [ ] Confirm deletion confirmation dialog appears
- [ ] Note the confirmation text required: `DELETE`
- [ ] Type `DELETE` in the confirmation field (exactly as shown)
- [ ] Verify "Permanently Delete Account" button is enabled
- [ ] Note the time before clicking: `________________`

### 3. Execute Deletion
- [ ] Click "Permanently Delete Account" button
- [ ] Observe loading state (button shows "Deleting...")
- [ ] Wait for process to complete
- [ ] Deletion completed at: `________________`

### 4. Immediate Verification
- [ ] Verify automatic logout occurs
- [ ] Verify redirect to login page
- [ ] Verify no error messages appear
- [ ] Check browser console (F12) for errors: [ ] None [ ] Errors found
- [ ] If errors found, note them: `________________`

---

## 🔍 POST-DELETION VERIFICATION

### Phase 1: Authentication Tests

#### Test 1.1: Login Attempt
- [ ] On login page, enter email: `luis940302@gmail.com`
- [ ] Enter the old password
- [ ] Click "Sign In"
- [ ] **Expected Result:** Login fails with error message
- [ ] **Actual Result:** `________________`
- [ ] Error message shown: `________________`
- [ ] **Status:** [ ] ✅ PASS [ ] ❌ FAIL

#### Test 1.2: Password Reset Attempt
- [ ] Click "Forgot Password?" link
- [ ] Enter email: `luis940302@gmail.com`
- [ ] Click "Send Reset Link"
- [ ] **Expected Result:** Error or no email sent (user doesn't exist)
- [ ] **Actual Result:** `________________`
- [ ] **Status:** [ ] ✅ PASS [ ] ❌ FAIL

#### Test 1.3: localStorage Check
- [ ] Open browser DevTools (F12)
- [ ] Go to Application > Local Storage
- [ ] Check for `tailor-notebook-auth` key
- [ ] **Expected Result:** Key doesn't exist or is empty
- [ ] **Actual Result:** `________________`
- [ ] **Status:** [ ] ✅ PASS [ ] ❌ FAIL

---

### Phase 2: Database Verification (Requires SQL Access)

#### Test 2.1: User in auth.users
- [ ] Open Supabase Dashboard > SQL Editor
- [ ] Run Query 4 from `deletion-verification.sql`
- [ ] **Expected Result:** COUNT = 0, status = "✅ PASS: User deleted"
- [ ] **Actual Result:** `________________`
- [ ] **Status:** [ ] ✅ PASS [ ] ❌ FAIL

#### Test 2.2: User Profile
- [ ] Run Query 5 from `deletion-verification.sql`
- [ ] **Expected Result:** COUNT = 0, status = "✅ PASS: Profile deleted"
- [ ] **Actual Result:** `________________`
- [ ] **Status:** [ ] ✅ PASS [ ] ❌ FAIL

#### Test 2.3: PII (First/Last Name)
- [ ] Run Query 6 from `deletion-verification.sql`
- [ ] **Expected Result:** 0 rows returned (no PII found)
- [ ] **Actual Result:** `________________`
- [ ] **Status:** [ ] ✅ PASS [ ] ❌ FAIL

#### Test 2.4: Password Hash
- [ ] Run Query 7 from `deletion-verification.sql`
- [ ] **Expected Result:** COUNT = 0, status = "✅ PASS: Password removed"
- [ ] **Actual Result:** `________________`
- [ ] **Status:** [ ] ✅ PASS [ ] ❌ FAIL

#### Test 2.5: Business Data Preservation
- [ ] Run Query 8 from `deletion-verification.sql`
- [ ] **Expected Result:** Counts match pre-deletion snapshot
- [ ] **Pre-deletion counts:** `________________`
- [ ] **Post-deletion counts:** `________________`
- [ ] **Status:** [ ] ✅ PASS [ ] ❌ FAIL

#### Test 2.6: GDPR Compliance Summary
- [ ] Run Query 10 from `deletion-verification.sql`
- [ ] **Expected Result:** "✅ GDPR COMPLIANT: All PII removed"
- [ ] **Actual Result:** `________________`
- [ ] **Status:** [ ] ✅ PASS [ ] ❌ FAIL

---

### Phase 3: Browser Console Test (Quick Verification)

- [ ] Log in with a different user account (or stay logged out)
- [ ] Open browser DevTools Console (F12)
- [ ] Copy entire contents of `browser-console-gdpr-check.js`
- [ ] Paste into console and press Enter
- [ ] Wait for all checks to complete

**Results:**
- [ ] ✅ Passed: `_____` checks
- [ ] ❌ Failed: `_____` checks
- [ ] ⚠️ Warnings: `_____` checks
- [ ] Overall Status: [ ] COMPLIANT [ ] NOT COMPLIANT [ ] INCONCLUSIVE

**Notes:** `________________`

---

### Phase 4: Node.js Script (Comprehensive Test)

**Prerequisites:**
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` to `.env` file
- [ ] Install dependencies: `npm install`

**Execution:**
- [ ] Run command: `npm run test:gdpr`
- [ ] Script completes without errors
- [ ] Review console output
- [ ] Locate generated JSON report file

**Results:**
- [ ] Report file: `________________`
- [ ] Overall Compliance: [ ] ✅ COMPLIANT [ ] ❌ NOT COMPLIANT
- [ ] Email removed: [ ] ✅ [ ] ❌
- [ ] First name deleted: [ ] ✅ [ ] ❌
- [ ] Last name deleted: [ ] ✅ [ ] ❌
- [ ] Password removed: [ ] ✅ [ ] ❌
- [ ] Business data preserved: [ ] ✅ [ ] ❌
- [ ] Email available for re-registration: [ ] ✅ [ ] ❌

---

### Phase 5: Application-Level Verification

#### Test 5.1: Business Data Accessibility
- [ ] Log in with a different user account
- [ ] Navigate to Clients page
- [ ] Verify all clients still visible
- [ ] Client count matches pre-deletion: [ ] ✅ [ ] ❌
- [ ] Can view client details: [ ] ✅ [ ] ❌
- [ ] Can edit clients: [ ] ✅ [ ] ❌

#### Test 5.2: Sessions Accessibility
- [ ] Navigate to Dashboard
- [ ] Verify sessions are visible
- [ ] Session count matches pre-deletion: [ ] ✅ [ ] ❌
- [ ] Can view session details: [ ] ✅ [ ] ❌
- [ ] Can update session status: [ ] ✅ [ ] ❌

#### Test 5.3: Other Data
- [ ] Fabrics page accessible: [ ] ✅ [ ] ❌
- [ ] Tasks page accessible: [ ] ✅ [ ] ❌
- [ ] Queries page accessible: [ ] ✅ [ ] ❌
- [ ] All data counts match pre-deletion: [ ] ✅ [ ] ❌

---

## 🔄 RE-REGISTRATION TEST (Optional)

### Test 6.1: Email Availability
- [ ] Log out of application
- [ ] Navigate to Sign Up page
- [ ] Enter email: `luis940302@gmail.com`
- [ ] Enter new password: `________________`
- [ ] Enter first name: `Test`
- [ ] Enter last name: `User`
- [ ] Click "Sign Up"

**Expected Results:**
- [ ] Account creation succeeds
- [ ] Email is accepted (was properly deleted)
- [ ] New user_id is generated (different from old one)
- [ ] Old user_id (if documented): `________________`
- [ ] New user_id: `________________`

### Test 6.2: Clean Slate Verification
- [ ] After signing up, go to Profile & Security
- [ ] Verify profile shows new data only
- [ ] First name: `Test` (not old first name)
- [ ] Last name: `User` (not old last name)
- [ ] Member since: `[Today's date]`
- [ ] No old data carried over: [ ] ✅ [ ] ❌

### Test 6.3: Business Data Access
- [ ] Navigate to Dashboard
- [ ] Verify can access existing business data
- [ ] Can view all clients: [ ] ✅ [ ] ❌
- [ ] Can view all sessions: [ ] ✅ [ ] ❌
- [ ] Can create new records: [ ] ✅ [ ] ❌

---

## 📊 GDPR COMPLIANCE FINAL CHECKLIST

### Article 17: Right to Erasure
- [ ] ✅ Email address removed from auth.users
- [ ] ✅ First name completely deleted
- [ ] ✅ Last name completely deleted
- [ ] ✅ Password hash removed
- [ ] ✅ All authentication tokens invalidated
- [ ] ✅ User cannot log in with old credentials
- [ ] ✅ No PII remains in any database table
- [ ] ✅ Email can be reused for new registration

### Article 6: Lawfulness of Processing
- [ ] ✅ Business data preserved (legitimate interest)
- [ ] ✅ Other users can access shared data
- [ ] ✅ Business continuity maintained

### Documentation Requirements
- [ ] ✅ Pre-deletion export completed
- [ ] ✅ Deletion process documented
- [ ] ✅ Post-deletion verification completed
- [ ] ✅ Test results recorded
- [ ] ✅ This checklist completed

---

## ✍️ SIGN-OFF

### Test Summary

**Total Tests Executed:** `_____`
**Tests Passed:** `_____`
**Tests Failed:** `_____`
**Warnings:** `_____`

### GDPR Compliance Status

**Overall Result:** [ ] ✅ COMPLIANT [ ] ❌ NOT COMPLIANT

**Critical Failures (if any):**
```
_________________________________________
_________________________________________
_________________________________________
```

**Notes:**
```
_________________________________________
_________________________________________
_________________________________________
_________________________________________
```

### Approval

**Tester Name:** `________________`
**Tester Signature:** `________________`
**Date:** `________________`
**Time:** `________________`

**Reviewer Name:** `________________`
**Reviewer Signature:** `________________`
**Date:** `________________`

---

## 📎 Attachments

- [ ] Pre-deletion screenshots
- [ ] Data export JSON file
- [ ] GDPR compliance report JSON
- [ ] SQL query results
- [ ] Console logs (if errors occurred)

**Files stored in:** `________________`

---

## 🆘 Troubleshooting

### If Tests Fail

**User still in auth.users:**
- Check if deletion function executed properly
- Verify RLS policies allow user to delete themselves
- Check database logs for errors

**Profile data still exists:**
- Verify CASCADE delete is working
- Check user_profiles.user_id foreign key constraint
- Manually delete if needed (use Query 2 as guide)

**Business data missing:**
- CRITICAL: This should never happen
- Restore from backup immediately
- Review delete_user_account() function
- This is a bug - do not proceed with production use

**Cannot re-register with email:**
- User might still exist in auth.users
- Check for soft-delete vs hard-delete
- Verify auth.users.email is truly removed

### Support Contacts

**Technical Support:** `________________`
**DPO (Data Protection Officer):** `________________`
**Emergency Contact:** `________________`

---

**End of Checklist**
