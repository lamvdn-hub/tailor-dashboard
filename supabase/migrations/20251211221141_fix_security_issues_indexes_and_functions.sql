/*
  # Fix Security Issues - Indexes and Function Search Paths

  1. Changes
    - Fix function search paths to prevent search_path injection attacks
    - Drop unused indexes to improve write performance
    - Keep critical indexes needed for application functionality

  2. Security
    - Set explicit search_path on functions to prevent privilege escalation
    - Remove unused indexes that add overhead without benefit

  3. Notes
    - Keeping idx_sessions_status_token (critical for customer status portal)
    - Keeping idx_sessions_display_id (used for order number lookups)
    - Keeping idx_measurements_session_id (used for session detail queries)
    - Leaked password protection must be enabled in Supabase Dashboard
*/

-- Fix function search paths to prevent injection attacks
CREATE OR REPLACE FUNCTION generate_status_token()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..24 LOOP
    result := result || substr(chars, floor(random() * 62 + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

CREATE OR REPLACE FUNCTION auto_generate_status_token()
RETURNS TRIGGER AS $$
DECLARE
  new_token text;
  attempts integer := 0;
BEGIN
  IF NEW.status_token IS NULL THEN
    LOOP
      new_token := generate_status_token();
      BEGIN
        NEW.status_token := new_token;
        RETURN NEW;
      EXCEPTION WHEN unique_violation THEN
        attempts := attempts + 1;
        IF attempts > 10 THEN
          RAISE EXCEPTION 'Could not generate unique token after 10 attempts';
        END IF;
      END;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Drop unused indexes on data retention and audit tables (rarely queried)
DROP INDEX IF EXISTS idx_data_retention_log_policy_id;
DROP INDEX IF EXISTS idx_retention_policies_table_name;
DROP INDEX IF EXISTS idx_retention_log_created_at;
DROP INDEX IF EXISTS idx_retention_log_table_name;
DROP INDEX IF EXISTS idx_audit_logs_table_name;

-- Drop unused indexes on tasks and problems tables
DROP INDEX IF EXISTS idx_tasks_status;
DROP INDEX IF EXISTS idx_tasks_priority;
DROP INDEX IF EXISTS idx_tasks_category;
DROP INDEX IF EXISTS idx_problems_status;
DROP INDEX IF EXISTS idx_problems_created_at;

-- Drop unused indexes on user consents
DROP INDEX IF EXISTS idx_user_consents_consent_type_id;

-- Drop unused session photo index
DROP INDEX IF EXISTS idx_session_photos_uploaded_by;

-- Drop unused measurement indexes (session_id is kept as it's used in queries)
DROP INDEX IF EXISTS idx_measurements_measurement_definition_id;
DROP INDEX IF EXISTS idx_measurements_section;

-- Drop unused session indexes (status_token and display_id are kept)
DROP INDEX IF EXISTS idx_sessions_fabric_id;
DROP INDEX IF EXISTS idx_sessions_status;
DROP INDEX IF EXISTS idx_sessions_display_id_normalized;
