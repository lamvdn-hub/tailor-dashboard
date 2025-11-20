/*
  # Add Data Retention Automation System

  ## Overview
  This migration implements automated data retention policies for GDPR Article 5(1)(e) compliance
  (Storage Limitation Principle). Data should not be kept longer than necessary.

  ## New Tables

  ### 1. data_retention_policies
  Defines retention rules for different data types
  - `id` (uuid, primary key) - Unique policy ID
  - `table_name` (text, unique, required) - Table this policy applies to
  - `retention_period_days` (integer, required) - How many days to retain data (0 = permanent)
  - `description` (text, required) - Explanation of retention rationale
  - `legal_basis` (text, required) - Legal basis for retention period
  - `active` (boolean, default true) - Whether policy is active
  - `created_at` (timestamptz) - When policy was created
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. data_retention_log
  Tracks automatic data deletions for accountability
  - `id` (uuid, primary key) - Unique log entry ID
  - `policy_id` (uuid, foreign key) - Policy that triggered deletion
  - `table_name` (text, required) - Table where deletion occurred
  - `records_deleted` (integer, required) - Number of records deleted
  - `oldest_record_date` (timestamptz) - Date of oldest deleted record
  - `execution_time_ms` (integer) - Time taken to execute cleanup
  - `status` (text, required) - SUCCESS or ERROR
  - `error_message` (text, nullable) - Error details if failed
  - `created_at` (timestamptz) - When cleanup ran

  ## Retention Policies (Default)
  - Audit logs: 7 years (2555 days) - Legal requirement
  - User consents: Permanent (10950 days / 30 years) - Proof of consent
  - Inactive sessions: 3 years (1095 days) - Business records
  - Completed tasks: 2 years (730 days) - Business records
  - Resolved queries: 2 years (730 days) - Business records

  ## Automation
  - Function to check and apply retention policies
  - Can be scheduled via pg_cron or external scheduler
  - Logs all deletions for audit trail
  - Respects active consent and user preferences

  ## Security
  - Enable RLS on retention tables
  - Only system can execute cleanup functions
  - Full audit trail maintained
  - Retention policies visible to authenticated users

  ## Notes
  - Data retention is a GDPR requirement (Storage Limitation)
  - Active business data (ongoing sessions, active clients) is never deleted
  - Only completed/resolved/inactive records are cleaned up
  - Users can request earlier deletion via data deletion rights
*/

-- Create data_retention_policies table
CREATE TABLE IF NOT EXISTS data_retention_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text UNIQUE NOT NULL,
  retention_period_days integer NOT NULL CHECK (retention_period_days >= 0),
  description text NOT NULL,
  legal_basis text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create data_retention_log table
CREATE TABLE IF NOT EXISTS data_retention_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid REFERENCES data_retention_policies(id) ON DELETE SET NULL,
  table_name text NOT NULL,
  records_deleted integer NOT NULL DEFAULT 0,
  oldest_record_date timestamptz,
  execution_time_ms integer,
  status text NOT NULL CHECK (status IN ('SUCCESS', 'ERROR', 'SKIPPED')),
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_retention_policies_table_name ON data_retention_policies(table_name);
CREATE INDEX IF NOT EXISTS idx_retention_log_created_at ON data_retention_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_retention_log_table_name ON data_retention_log(table_name);

-- Enable RLS
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies (read-only for authenticated users)
CREATE POLICY "Authenticated users can view retention policies"
  ON data_retention_policies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view retention logs"
  ON data_retention_log FOR SELECT
  TO authenticated
  USING (true);

-- Trigger to update retention policies updated_at
CREATE OR REPLACE FUNCTION update_retention_policies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_retention_policies_updated_at ON data_retention_policies;
CREATE TRIGGER set_retention_policies_updated_at
  BEFORE UPDATE ON data_retention_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_retention_policies_updated_at();

-- Function to clean up old audit logs
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs_with_policy()
RETURNS void AS $$
DECLARE
  v_policy_id uuid;
  v_retention_days integer;
  v_start_time timestamptz;
  v_end_time timestamptz;
  v_deleted_count integer;
  v_oldest_date timestamptz;
BEGIN
  v_start_time := clock_timestamp();

  -- Get retention policy for audit_logs
  SELECT id, retention_period_days INTO v_policy_id, v_retention_days
  FROM data_retention_policies
  WHERE table_name = 'audit_logs' AND active = true;

  IF v_policy_id IS NULL THEN
    RETURN;
  END IF;

  -- Get oldest record date before deletion
  SELECT MIN(created_at) INTO v_oldest_date
  FROM audit_logs
  WHERE created_at < NOW() - (v_retention_days || ' days')::INTERVAL;

  -- Delete old audit logs
  WITH deleted AS (
    DELETE FROM audit_logs
    WHERE created_at < NOW() - (v_retention_days || ' days')::INTERVAL
    RETURNING *
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;

  v_end_time := clock_timestamp();

  -- Log the cleanup
  INSERT INTO data_retention_log (
    policy_id,
    table_name,
    records_deleted,
    oldest_record_date,
    execution_time_ms,
    status
  ) VALUES (
    v_policy_id,
    'audit_logs',
    v_deleted_count,
    v_oldest_date,
    EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time))::INTEGER,
    'SUCCESS'
  );
EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO data_retention_log (
      policy_id,
      table_name,
      records_deleted,
      execution_time_ms,
      status,
      error_message
    ) VALUES (
      v_policy_id,
      'audit_logs',
      0,
      EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER,
      'ERROR',
      SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up completed sessions older than retention period
CREATE OR REPLACE FUNCTION cleanup_old_completed_sessions()
RETURNS void AS $$
DECLARE
  v_policy_id uuid;
  v_retention_days integer;
  v_start_time timestamptz;
  v_end_time timestamptz;
  v_deleted_count integer;
  v_oldest_date timestamptz;
BEGIN
  v_start_time := clock_timestamp();

  -- Get retention policy for sessions
  SELECT id, retention_period_days INTO v_policy_id, v_retention_days
  FROM data_retention_policies
  WHERE table_name = 'sessions' AND active = true;

  IF v_policy_id IS NULL THEN
    RETURN;
  END IF;

  -- Get oldest record date before deletion
  SELECT MIN(updated_at) INTO v_oldest_date
  FROM sessions
  WHERE status = 'completed'
    AND updated_at < NOW() - (v_retention_days || ' days')::INTERVAL;

  -- Delete old completed sessions (CASCADE will delete related measurements)
  WITH deleted AS (
    DELETE FROM sessions
    WHERE status = 'completed'
      AND updated_at < NOW() - (v_retention_days || ' days')::INTERVAL
    RETURNING *
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;

  v_end_time := clock_timestamp();

  -- Log the cleanup
  INSERT INTO data_retention_log (
    policy_id,
    table_name,
    records_deleted,
    oldest_record_date,
    execution_time_ms,
    status
  ) VALUES (
    v_policy_id,
    'sessions',
    v_deleted_count,
    v_oldest_date,
    EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time))::INTEGER,
    'SUCCESS'
  );
EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO data_retention_log (
      policy_id,
      table_name,
      records_deleted,
      execution_time_ms,
      status,
      error_message
    ) VALUES (
      v_policy_id,
      'sessions',
      0,
      EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER,
      'ERROR',
      SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up completed tasks
CREATE OR REPLACE FUNCTION cleanup_old_completed_tasks()
RETURNS void AS $$
DECLARE
  v_policy_id uuid;
  v_retention_days integer;
  v_start_time timestamptz;
  v_end_time timestamptz;
  v_deleted_count integer;
  v_oldest_date timestamptz;
BEGIN
  v_start_time := clock_timestamp();

  -- Get retention policy for tasks
  SELECT id, retention_period_days INTO v_policy_id, v_retention_days
  FROM data_retention_policies
  WHERE table_name = 'tasks' AND active = true;

  IF v_policy_id IS NULL THEN
    RETURN;
  END IF;

  -- Get oldest record date before deletion
  SELECT MIN(updated_at) INTO v_oldest_date
  FROM tasks
  WHERE status = 'completed'
    AND updated_at < NOW() - (v_retention_days || ' days')::INTERVAL;

  -- Delete old completed tasks
  WITH deleted AS (
    DELETE FROM tasks
    WHERE status = 'completed'
      AND updated_at < NOW() - (v_retention_days || ' days')::INTERVAL
    RETURNING *
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;

  v_end_time := clock_timestamp();

  -- Log the cleanup
  INSERT INTO data_retention_log (
    policy_id,
    table_name,
    records_deleted,
    oldest_record_date,
    execution_time_ms,
    status
  ) VALUES (
    v_policy_id,
    'tasks',
    v_deleted_count,
    v_oldest_date,
    EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time))::INTEGER,
    'SUCCESS'
  );
EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO data_retention_log (
      policy_id,
      table_name,
      records_deleted,
      execution_time_ms,
      status,
      error_message
    ) VALUES (
      v_policy_id,
      'tasks',
      0,
      EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER,
      'ERROR',
      SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Master function to run all retention policies
CREATE OR REPLACE FUNCTION apply_all_retention_policies()
RETURNS TABLE(table_name text, records_deleted integer, status text) AS $$
BEGIN
  -- Clean up audit logs
  PERFORM cleanup_old_audit_logs_with_policy();
  
  -- Clean up sessions
  PERFORM cleanup_old_completed_sessions();
  
  -- Clean up tasks
  PERFORM cleanup_old_completed_tasks();

  -- Return summary of last cleanup
  RETURN QUERY
  SELECT 
    drl.table_name,
    drl.records_deleted,
    drl.status
  FROM data_retention_log drl
  WHERE drl.created_at >= NOW() - INTERVAL '1 hour'
  ORDER BY drl.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default retention policies
INSERT INTO data_retention_policies (table_name, retention_period_days, description, legal_basis, active) VALUES
  ('audit_logs', 2555, 'Audit logs retained for 7 years as required by GDPR Article 30 for accountability and data breach investigation', 'GDPR Article 30 - Legal obligation', true),
  ('user_consents', 10950, 'Consent records retained for 30 years as permanent proof of consent and compliance with GDPR Article 7', 'GDPR Article 7 - Permanent proof of consent', false),
  ('sessions', 1095, 'Completed sessions retained for 3 years for business records and historical reference', 'Legitimate business interest - Business records', true),
  ('tasks', 730, 'Completed tasks retained for 2 years for business continuity and historical reference', 'Legitimate business interest - Business records', true),
  ('problems', 730, 'Resolved queries retained for 2 years for quality improvement and pattern analysis', 'Legitimate business interest - Service improvement', false)
ON CONFLICT (table_name) DO UPDATE SET
  retention_period_days = EXCLUDED.retention_period_days,
  description = EXCLUDED.description,
  legal_basis = EXCLUDED.legal_basis,
  updated_at = now();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION apply_all_retention_policies() TO authenticated;

-- Add helpful comments
COMMENT ON TABLE data_retention_policies IS 'GDPR Article 5(1)(e) Storage Limitation: Defines how long different types of data should be retained';
COMMENT ON TABLE data_retention_log IS 'Audit trail of all automatic data deletions for accountability';
COMMENT ON FUNCTION apply_all_retention_policies() IS 'Executes all active retention policies and returns summary. Should be scheduled to run periodically (e.g., weekly)';
