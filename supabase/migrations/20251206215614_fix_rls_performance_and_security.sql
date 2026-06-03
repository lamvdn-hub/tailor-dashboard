/*
  # Fix RLS Performance and Security Issues

  1. RLS Performance Optimization
    - Fix `session_photos` RLS policies to use subquery pattern for auth functions
    - This prevents re-evaluation of auth.uid() for each row, improving query performance at scale

  2. Function Security
    - Set stable search_path on `get_session_photo_count` function
    - Prevents potential SQL injection via search_path manipulation

  3. Notes
    - Unused indexes are documented but not dropped (requires manual review)
    - Leaked Password Protection must be enabled in Supabase Dashboard
*/

-- =========================================
-- 1. Fix RLS Performance Issues
-- =========================================

-- Drop existing policies that have performance issues
DROP POLICY IF EXISTS "Authenticated users can upload session photos" ON session_photos;
DROP POLICY IF EXISTS "Users can delete own photos within 24h" ON session_photos;

-- Recreate with optimized subquery pattern
-- This caches auth.uid() result instead of re-evaluating per row
CREATE POLICY "Authenticated users can upload session photos"
  ON session_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = uploaded_by
      AND user_profiles.user_id = (select auth.uid())
    )
    OR uploaded_by IS NULL
  );

CREATE POLICY "Users can delete own photos within 24h"
  ON session_photos
  FOR DELETE
  TO authenticated
  USING (
    uploaded_at > now() - interval '24 hours'
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = uploaded_by
      AND user_profiles.user_id = (select auth.uid())
    )
  );

-- =========================================
-- 2. Fix Function Search Path Security
-- =========================================

-- Recreate function with stable search_path
-- This prevents search_path manipulation attacks
CREATE OR REPLACE FUNCTION get_session_photo_count(session_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM session_photos
    WHERE session_id = session_uuid
  );
END;
$$;

-- =========================================
-- 3. Unused Indexes Documentation
-- =========================================

/*
  The following indexes are currently unused but may be needed as the application scales.
  Review each index before dropping:

  POTENTIALLY SAFE TO DROP (audit/logging tables):
  - idx_data_retention_log_policy_id
  - idx_retention_policies_table_name
  - idx_retention_log_created_at
  - idx_retention_log_table_name
  - idx_audit_logs_table_name

  REVIEW BEFORE DROPPING (may be used in future features):
  - idx_sessions_fabric_id (used when filtering by fabric)
  - idx_sessions_status (used when filtering by status)
  - idx_measurements_session_id (used when loading measurements for a session)
  - idx_measurements_measurement_definition_id (used in measurement lookups)
  - idx_measurements_section (used when filtering jacket vs trousers)
  - idx_tasks_status (used when filtering tasks by status)
  - idx_tasks_priority (used when sorting by priority)
  - idx_tasks_category (used when filtering by category)
  - idx_problems_status (used when filtering problems)
  - idx_problems_created_at (used for chronological sorting)
  - idx_sessions_display_id (used for order number lookups)
  - idx_sessions_display_id_normalized (used for case-insensitive searches)
  - idx_session_photos_uploaded_by (used when filtering by uploader)
  - idx_user_consents_consent_type_id (used in GDPR consent lookups)

  To drop an unused index (example):
  -- DROP INDEX IF EXISTS idx_audit_logs_table_name;

  Note: Indexes may show as "unused" in new databases with little data.
  They become valuable as data volume grows and queries become more complex.
*/

-- =========================================
-- 4. Password Protection (Manual Setup)
-- =========================================

/*
  IMPORTANT: Enable Leaked Password Protection in Supabase Dashboard

  Steps:
  1. Go to Supabase Dashboard > Authentication > Policies
  2. Find "Password Requirements" section
  3. Enable "Check for compromised passwords"
  4. This integrates with HaveIBeenPwned.org to prevent use of leaked passwords

  This CANNOT be enabled via migration - it must be done through the dashboard.
*/
