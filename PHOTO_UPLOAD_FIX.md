# Photo Upload Bug Fix

## Issue Summary

Photos were uploading to Supabase Storage successfully, but metadata was NOT being saved to the database. This caused photos to disappear after order creation because there were no database records linking them to sessions.

---

## Root Cause

**RLS Policy Mismatch**: The `session_photos` table had an incorrect Row Level Security (RLS) policy for INSERT operations.

### The Problem

1. **Column Definition**: The `uploaded_by` column references `user_profiles(id)`:
   ```sql
   uploaded_by uuid REFERENCES user_profiles(id)
   ```

2. **Original RLS Policy**: The INSERT policy checked:
   ```sql
   WITH CHECK (auth.uid() = uploaded_by)
   ```

3. **ID Mismatch**:
   - `auth.uid()` returns the auth user ID (e.g., `ee1a3d74-1011-497f-a91a-757769753815`)
   - `user_profiles.id` is a different UUID (e.g., `97415ce8-8d77-4ebc-8f18-e7bd41f4096c`)
   - These don't match, causing all inserts to fail silently

4. **Result**: Photos uploaded to storage but database inserts were blocked by RLS policy

---

## What Was Fixed

### 1. Updated RLS Policy (Database Migration)

**File**: `supabase/migrations/fix_session_photos_rls_policy.sql`

Changed the INSERT policy to properly check the user_profiles relationship:

```sql
-- Before (INCORRECT)
WITH CHECK (auth.uid() = uploaded_by)

-- After (CORRECT)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = uploaded_by
    AND user_profiles.user_id = auth.uid()
  )
  OR uploaded_by IS NULL
)
```

### 2. Updated Application Code

**File**: `src/pages/NewSession.tsx`

Changed the code to:
1. Fetch the user_profile ID before saving the session
2. Use `userProfile.id` instead of `user.id` when inserting photo metadata

```javascript
// Get user profile ID
const { data: userProfile } = await supabase
  .from('user_profiles')
  .select('id')
  .eq('user_id', user.id)
  .maybeSingle();

// Use userProfile.id when inserting
uploaded_by: userProfile?.id || null
```

### 3. Added Comprehensive Logging

Added detailed console logs throughout the upload process to help diagnose issues:
- Upload progress for each photo
- File sizes and paths
- Success/error messages at each step
- Photo loading status in SessionDetail page

---

## Testing the Fix

### Create a New Order with Photos

1. Navigate to "New Session" page
2. Fill in order details
3. Add 1-3 test photos in the "Garment Photos" section
4. Click "Save Session"
5. **Check browser console** for upload logs:
   - "Starting photo upload for X photo(s)..."
   - "Uploading photo 1/X..."
   - "Full-size image uploaded successfully"
   - "Thumbnail uploaded successfully"
   - "Metadata saved successfully"
   - "Successfully uploaded X photo(s)"

### Verify Photos Display

1. After saving, you'll be redirected to Session Detail page
2. **Check browser console** for loading logs:
   - "Loading session data for: [session-id]"
   - "Found X photo(s) for this session"
   - "Thumbnail loaded successfully"
3. Photos should appear in "Garment Photos" section
4. Click any photo to open lightbox viewer
5. Navigate between photos using arrows or keyboard

### Verify Database

Check that metadata was saved:

```sql
SELECT * FROM session_photos ORDER BY uploaded_at DESC LIMIT 5;
```

Should return records with session_id, file paths, and uploaded_by.

### Verify Storage

Check Supabase Storage:
1. Go to Supabase Dashboard → Storage
2. Open `session_photos` bucket
3. Should see folders named with session UUIDs
4. Each folder contains full-size and thumbnail images

---

## What's Working Now

✅ Photos upload to Supabase Storage
✅ Photo metadata saves to database
✅ Photos display on Session Detail page
✅ Thumbnails load correctly
✅ Lightbox viewer works with navigation
✅ Camera icon shows on dashboard for sessions with photos
✅ Error messages display if upload fails
✅ Comprehensive logging for debugging

---

## Troubleshooting

If photos still don't appear:

1. **Check browser console** for error messages
2. **Verify storage bucket exists**: Query `SELECT * FROM storage.buckets WHERE id = 'session_photos'`
3. **Check RLS policies**: Query `SELECT * FROM pg_policies WHERE tablename = 'session_photos'`
4. **Verify user has profile**: Query `SELECT * FROM user_profiles WHERE user_id = 'your-auth-user-id'`
5. **Test storage manually**: Use the diagnostic function in `src/lib/storageUtils.ts`

---

## Files Modified

1. `supabase/migrations/fix_session_photos_rls_policy.sql` - Fixed RLS policies
2. `src/pages/NewSession.tsx` - Updated to use user_profile.id and added logging
3. `src/pages/SessionDetail.tsx` - Added logging and error handling
4. `src/lib/storageUtils.ts` - Created diagnostic utilities (NEW)

---

## Summary

The photo upload feature is now fully functional. The issue was a mismatch between the auth user ID and user profile ID in the RLS policy. Both the database policy and application code have been updated to correctly handle the relationship between these IDs.
