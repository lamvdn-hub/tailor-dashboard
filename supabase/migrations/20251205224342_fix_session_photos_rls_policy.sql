/*
  # Fix Session Photos RLS Policy

  The uploaded_by column references user_profiles(id), but the RLS policy
  was checking auth.uid() directly against uploaded_by. This causes all
  inserts to fail because auth.uid() returns the auth user ID, not the
  user_profiles.id.

  This migration fixes the INSERT policy to properly check the relationship
  between auth.users and user_profiles.
*/

-- Drop the incorrect policy
DROP POLICY IF EXISTS "Authenticated users can upload session photos" ON session_photos;

-- Create corrected policy that checks the user_profiles relationship
CREATE POLICY "Authenticated users can upload session photos"
  ON session_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = uploaded_by
      AND user_profiles.user_id = auth.uid()
    )
    OR uploaded_by IS NULL
  );

-- Also update the DELETE policy to use the same logic
DROP POLICY IF EXISTS "Users can delete own photos within 24h" ON session_photos;

CREATE POLICY "Users can delete own photos within 24h"
  ON session_photos
  FOR DELETE
  TO authenticated
  USING (
    uploaded_at > now() - interval '24 hours'
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = uploaded_by
      AND user_profiles.user_id = auth.uid()
    )
  );
