# 🚀 Quick Start: Testing Account Deletion for luis940302@gmail.com

## ⚡ Fastest Way to Test (2 minutes)

### After Deleting the Account

**Option 1: Automated Script** (Recommended)
```bash
# 1. Add service role key to .env file
echo "SUPABASE_SERVICE_ROLE_KEY=your-key-here" >> .env

# 2. Run the test
npm run test:gdpr
```

**Option 2: Browser Console** (No setup)
```
1. Open app in browser
2. Press F12 (DevTools)
3. Go to Console tab
4. Copy/paste: tests/browser-console-gdpr-check.js
5. Press Enter
```

**Option 3: SQL Queries** (Most reliable)
```
1. Go to Supabase Dashboard
2. Open SQL Editor
3. Copy queries 4-10 from: tests/deletion-verification.sql
4. Run each query
```

---

## ✅ What You're Testing

When you delete luis940302@gmail.com, these should be **DELETED**:
- ✓ Email from auth.users
- ✓ Password hash
- ✓ First name
- ✓ Last name
- ✓ User profile

These should be **PRESERVED**:
- ✓ All clients
- ✓ All sessions
- ✓ All fabrics
- ✓ All measurements
- ✓ All tasks

---

## 📋 Simple Testing Steps

### Before Deletion
1. Log in as luis940302@gmail.com
2. Note your first name: `____________`
3. Note your last name: `____________`
4. Go to Profile & Security → Click "Download My Data"
5. Save the JSON file

### Delete Account
1. Go to Profile & Security
2. Scroll to "Delete Account" (red section)
3. Click "Delete My Account"
4. Type `DELETE` in the box
5. Click "Permanently Delete Account"
6. You'll be logged out automatically

### After Deletion - Verify
1. Try to log in with luis940302@gmail.com → Should FAIL ✓
2. Run one of the test methods above
3. Look for: **"✅ GDPR COMPLIANT"**

---

## 🎯 Expected Results

### ✅ PASS Criteria
```
✅ User deleted from auth.users (Query 4)
✅ Profile deleted (Query 5)
✅ No PII remains (Query 6)
✅ Password removed (Query 7)
✅ Business data preserved (Query 8)
✅ GDPR COMPLIANT (Query 10)
```

### ❌ FAIL - If You See This
```
❌ User still exists in auth.users
❌ PII still exists
❌ NOT COMPLIANT
```

**Action:** Check the error message and review the delete_user_account() function.

---

## 🆘 Troubleshooting

**"SUPABASE_SERVICE_ROLE_KEY not found"**
→ Get it from: Supabase Dashboard > Settings > API > service_role key

**"Cannot login" test fails**
→ Good! This means account is deleted.

**Business data count is 0**
→ If this happens AFTER deletion, it's a CRITICAL BUG (data loss)
→ If database was empty before, it's expected

---

## 📞 Need Help?

See full documentation: `tests/README.md`
Complete checklist: `tests/GDPR_MANUAL_CHECKLIST.md`

---

## 💡 Pro Tips

1. **Always export data before deletion** (GDPR Article 15)
2. **Test in staging first**, not production
3. **Keep test reports** for 3 years (GDPR compliance)
4. **Can re-register** with same email after deletion

---

**Remember:** Deleting luis940302@gmail.com removes LOGIN ACCESS and PERSONAL INFO, but keeps all BUSINESS DATA for other users to access.
