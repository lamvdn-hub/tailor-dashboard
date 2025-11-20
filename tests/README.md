# GDPR Compliance Testing Suite
## Account Deletion Verification

This directory contains comprehensive testing scripts to verify that account deletion properly removes all Personally Identifiable Information (PII) while preserving business data, ensuring compliance with GDPR Article 17 (Right to Erasure).

---

## 📁 Files Overview

| File | Purpose | Type |
|------|---------|------|
| `deletion-verification.sql` | Database-level verification queries | SQL |
| `gdpr-compliance-check.js` | Automated compliance testing script | Node.js |
| `browser-console-gdpr-check.js` | Quick browser console verification | JavaScript |
| `GDPR_MANUAL_CHECKLIST.md` | Step-by-step manual testing guide | Markdown |
| `README.md` | This file - usage instructions | Markdown |

---

## 🎯 What Gets Deleted vs. Preserved

### ✅ Deleted (PII - Must be removed)
- Email address from `auth.users`
- Password hash from `auth.users`
- First name from `user_profiles`
- Last name from `user_profiles`
- All authentication tokens and sessions
- User profile record

### 🔒 Preserved (Business Data - Must remain)
- All clients
- All sessions
- All measurements
- All fabrics
- All tasks
- All queries/problems

This ensures GDPR compliance while maintaining business continuity for other users.

---

## 🚀 Quick Start Guide

### Test Email
All tests are configured for: **luis940302@gmail.com**

To test a different email, set the `TEST_EMAIL` environment variable:
```bash
export TEST_EMAIL=different-email@example.com
```

### Prerequisites
1. Supabase project with migrations applied
2. Test user account created (luis940302@gmail.com)
3. Node.js installed (for automated tests)
4. Access to Supabase Dashboard (for SQL tests)

---

## 📊 Testing Methods

### Method 1: Automated Node.js Script (Recommended)

**Most comprehensive automated testing**

#### Setup
1. Add your Supabase service role key to `.env`:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

2. Find your service role key:
   - Go to Supabase Dashboard
   - Project Settings > API
   - Copy "service_role" key (under "Project API keys")

#### Run Test
```bash
npm run test:gdpr
```

#### What It Does
- Checks if email exists in auth.users
- Verifies first_name is deleted
- Verifies last_name is deleted
- Tests login failure (password removed)
- Verifies business data preservation
- Checks email re-registration availability
- Generates JSON report with detailed results

#### Output
- Console output with colored status indicators
- JSON report saved to `tests/gdpr-compliance-report-[timestamp].json`
- Exit code 0 = PASS, Exit code 1 = FAIL

#### Example Output
```
╔════════════════════════════════════════════════════════════╗
║         GDPR COMPLIANCE CHECK - ACCOUNT DELETION          ║
╚════════════════════════════════════════════════════════════╝

🔍 Testing email: luis940302@gmail.com
📅 Timestamp: 2025-11-13T10:30:00.000Z

═══════════════════════════════════════════════════════════
📧 CHECK 1: Email Removed from auth.users
═══════════════════════════════════════════════════════════
✅ PASS: Email not found in auth.users

[... more checks ...]

╔════════════════════════════════════════════════════════════╗
║                   COMPLIANCE SUMMARY                       ║
╚════════════════════════════════════════════════════════════╝

Overall GDPR Compliance: ✅ COMPLIANT

💾 Report saved to: ./tests/gdpr-compliance-report-1699876200000.json
🎉 SUCCESS: All PII has been removed. Account deletion is GDPR compliant.
```

---

### Method 2: SQL Queries (Database Verification)

**Direct database inspection**

#### Setup
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Open `tests/deletion-verification.sql` in a text editor

#### Before Deletion
Run queries 1-3 to document current state:
- Query 1: User exists in auth.users
- Query 2: Profile exists with first_name and last_name
- Query 3: Business data counts (baseline)

#### After Deletion
Run queries 4-12 to verify deletion:
- Query 4: User removed from auth.users
- Query 5: Profile deleted
- Query 6: No PII remains
- Query 7: Password hash removed
- Query 8: Business data preserved
- Query 9: Email whitelist status
- Query 10: **GDPR compliance summary** ⭐
- Query 11: No orphaned profiles
- Query 12: Email available for re-registration

#### Expected Results
All verification queries should show:
```
✅ PASS: [description]
```

If any show `❌ FAIL`, deletion is NOT GDPR compliant.

---

### Method 3: Browser Console (Quick Test)

**Fast verification without setup**

#### Usage
1. Open your application in a browser
2. After deleting the account, stay on the site or log in with different account
3. Open DevTools (F12 or Cmd+Option+I on Mac)
4. Go to Console tab
5. Copy entire contents of `tests/browser-console-gdpr-check.js`
6. Paste into console
7. Press Enter

#### What It Does
- Tests login failure
- Checks user profile deletion
- Verifies business data preservation
- Tests email re-registration

#### Output
```
╔════════════════════════════════════════════════════════════╗
║       QUICK GDPR COMPLIANCE CHECK (Browser Console)       ║
╚════════════════════════════════════════════════════════════╝

🔍 Testing email: luis940302@gmail.com

[... test results ...]

╔════════════════════════════════════════════════════════════╗
║                      TEST SUMMARY                          ║
╚════════════════════════════════════════════════════════════╝

Results:
   ✅ Passed: 3
   ❌ Failed: 0
   ⚠️  Warnings: 1

🎉 GDPR COMPLIANT: Account deletion appears successful!
```

#### Advantages
- No setup required
- Works in any browser
- No service role key needed
- Quick verification

#### Limitations
- Cannot access auth.users directly
- Some checks may show warnings if not logged in
- Less comprehensive than Node.js script

---

### Method 4: Manual Checklist (Audit Trail)

**Complete testing with documentation**

#### Usage
1. Open `tests/GDPR_MANUAL_CHECKLIST.md`
2. Follow step-by-step instructions
3. Check off each item as completed
4. Document all results
5. Sign and date at the end

#### When to Use
- Official GDPR compliance audits
- Legal documentation required
- Training new team members
- Formal QA process
- Pre-production verification

#### What's Included
- Pre-deletion setup (data export, screenshots)
- Deletion process documentation
- Post-deletion verification (auth, database, app-level)
- Re-registration testing
- GDPR compliance final checklist
- Sign-off section for audits

#### Time Required
Approximately 30-45 minutes for complete checklist.

---

## 🔧 Troubleshooting

### "SUPABASE_SERVICE_ROLE_KEY not found"
**Solution:** Add the service role key to your `.env` file:
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Find it in: Supabase Dashboard > Project Settings > API > service_role key

### "Cannot access auth.users table"
**Solution:** This table requires service role key. Use:
1. Node.js script with service role key, OR
2. SQL queries in Supabase Dashboard (you're already authenticated as admin)

### "Login test shows warning instead of pass"
**Reason:** The test might not be able to distinguish between "user deleted" vs "invalid password". This is expected with some Supabase error messages.

**Verify with:** Run SQL queries to confirm user is actually deleted from auth.users.

### "Business data count is 0"
**If after deletion:**
- ❌ CRITICAL BUG: Business data was deleted (should never happen)
- Restore from backup immediately
- Review `delete_user_account()` function

**If in empty database:**
- ⚠️ Expected: Create test data before running tests

### "Email still in use after deletion"
**Possible causes:**
1. Deletion failed (check error messages)
2. Another user has same email (impossible if unique constraint works)
3. Cache issue (try clearing browser cache)

**Solution:** Re-run SQL Query 4 to verify user truly doesn't exist.

---

## 📝 Test Reports

### Node.js Script Reports
Saved as: `tests/gdpr-compliance-report-[timestamp].json`

**Report Structure:**
```json
{
  "timestamp": "2025-11-13T10:30:00.000Z",
  "email": "luis940302@gmail.com",
  "checks": [
    {
      "name": "Email removed from auth.users",
      "passed": true,
      "details": "Email not found in auth.users ✅"
    }
  ],
  "overallCompliance": true,
  "summary": {
    "businessData": {
      "clients": 15,
      "sessions": 42,
      "fabrics": 8
    }
  }
}
```

### Retaining Reports
Keep reports for:
- Compliance audits
- Legal requirements
- Issue investigation
- Historical tracking

Recommended retention: 3 years (standard for GDPR documentation)

---

## 🎓 Understanding the Tests

### Why Test Account Deletion?

**Legal Requirement:**
- GDPR Article 17: Right to Erasure
- Users can request deletion of their personal data
- Must be completed "without undue delay"

**What Must Be Deleted:**
- Personal data that identifies the user
- Email, name, password
- Authentication credentials

**What Can Be Kept:**
- Data needed for "legitimate interests" (Article 6)
- Business records shared with other users
- Historical records needed for legal/compliance purposes

### The Delete Function

Located in: `supabase/migrations/20251113100332_fix_delete_user_account_preserve_business_data.sql`

```sql
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  current_user_id := auth.uid();

  -- Delete user profile only
  DELETE FROM user_profiles WHERE user_id = current_user_id;

  -- Delete user from auth.users only
  DELETE FROM auth.users WHERE id = current_user_id;

  -- Business data is NOT deleted

  RETURN true;
END;
$$;
```

**Key Points:**
1. Uses `SECURITY DEFINER` to access auth.users
2. Only deletes user_profiles and auth.users
3. No CASCADE to business tables
4. Returns boolean for success/failure

---

## ✅ Compliance Criteria

### Test Must Verify

| Requirement | Test Method | Pass Criteria |
|-------------|-------------|---------------|
| Email removed | SQL Query 4 | COUNT = 0 |
| Password removed | SQL Query 7 / Login test | Cannot login |
| First name deleted | SQL Query 6 | No rows returned |
| Last name deleted | SQL Query 6 | No rows returned |
| Profile deleted | SQL Query 5 | COUNT = 0 |
| Business data preserved | SQL Query 8 | Counts match pre-deletion |
| Re-registration possible | SQL Query 12 | COUNT = 0 |

**Overall:** All 7 criteria must pass for GDPR compliance.

---

## 🔒 Security Notes

### Service Role Key
- **DO NOT** commit service role key to git
- **DO NOT** expose in client-side code
- Store only in `.env` file (gitignored)
- Only use for testing and admin operations

### Test Environment
- Run tests in staging/test environment first
- Never test with real user data in production
- Use test accounts with mock data

### Data Privacy
- Test reports may contain user emails
- Store reports securely
- Delete test reports after verification
- Follow data retention policies

---

## 📞 Support

### Issues with Tests
1. Check troubleshooting section above
2. Verify prerequisites are met
3. Review console error messages
4. Check Supabase logs in dashboard

### GDPR Questions
- Consult with Data Protection Officer (DPO)
- Review GDPR documentation
- Seek legal counsel if needed

### Technical Support
- Check Supabase documentation
- Review migration files
- Inspect `delete_user_account()` function

---

## 📚 Additional Resources

### GDPR References
- [GDPR Article 17: Right to Erasure](https://gdpr-info.eu/art-17-gdpr/)
- [GDPR Article 6: Lawfulness of Processing](https://gdpr-info.eu/art-6-gdpr/)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)

### Related Files
- `/src/pages/ProfileSecurity.tsx` - Account deletion UI
- `/src/lib/gdprUtils.ts` - Data export utilities
- `/supabase/migrations/*delete_user_account*` - Database functions

---

## 🔄 Test Workflow Summary

### Complete Test Procedure

```
1. PRE-DELETION
   ├── Login with test account
   ├── Export data (GDPR Article 15)
   ├── Document current state
   └── Take screenshots

2. DELETION
   ├── Navigate to Profile & Security
   ├── Click "Delete My Account"
   ├── Confirm with "DELETE"
   └── Observe logout

3. VERIFICATION
   ├── Run Node.js script: npm run test:gdpr
   ├── Run SQL queries (4-12)
   ├── Browser console test
   └── Manual checklist

4. DOCUMENTATION
   ├── Review test reports
   ├── Complete manual checklist
   ├── Sign off on compliance
   └── Archive results

5. RE-REGISTRATION (Optional)
   ├── Sign up with same email
   ├── Verify clean slate
   └── Confirm business data access
```

### Quick Test (5 minutes)
```bash
# After deleting account
npm run test:gdpr
```

### Comprehensive Test (30-45 minutes)
Follow `GDPR_MANUAL_CHECKLIST.md` completely.

---

## 📅 Maintenance

### When to Run Tests
- Before each production deployment
- After modifying delete_user_account() function
- After changing user_profiles schema
- During GDPR compliance audits
- When investigating deletion issues

### Updating Tests
If database schema changes:
1. Update SQL queries in `deletion-verification.sql`
2. Update Node.js script checks
3. Update manual checklist
4. Re-run all tests to verify

---

## ✨ Quick Command Reference

```bash
# View help
npm run test:gdpr:help

# Run automated GDPR test
npm run test:gdpr

# Run with custom email
TEST_EMAIL=other@example.com npm run test:gdpr

# List test files
ls -la tests/

# View SQL queries
cat tests/deletion-verification.sql

# View browser console script
cat tests/browser-console-gdpr-check.js
```

---

**Last Updated:** 2025-11-13
**Version:** 1.0.0
**Maintainer:** Development Team
