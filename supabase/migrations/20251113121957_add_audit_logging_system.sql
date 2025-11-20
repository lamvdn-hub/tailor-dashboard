/*
  # Add Comprehensive Audit Logging System

  ## Overview
  This migration implements a comprehensive audit logging system to track all data access,
  modifications, and deletions for GDPR compliance (Article 30 - Records of Processing Activities).

  ## New Tables

  ### 1. audit_logs
  Stores all audit events across the application
  - `id` (uuid, primary key) - Unique audit log entry ID
  - `user_id` (uuid, nullable) - User who performed the action (NULL for system actions)
  - `action` (text, required) - Action performed (CREATE, READ, UPDATE, DELETE, EXPORT, LOGIN, LOGOUT)
  - `table_name` (text, required) - Table affected by the action
  - `record_id` (uuid, nullable) - ID of the affected record
  - `old_data` (jsonb, nullable) - Previous data state (for UPDATE/DELETE)
  - `new_data` (jsonb, nullable) - New data state (for CREATE/UPDATE)
  - `ip_address` (text, nullable) - IP address of the user
  - `user_agent` (text, nullable) - User agent string
  - `created_at` (timestamptz) - When the action occurred

  ## Security
  - Enable RLS on audit_logs table
  - Only authenticated users can view their own audit logs
  - System has full access for logging purposes
  - Audit logs are append-only (no UPDATE or DELETE policies)

  ## Automatic Triggers
  - Auto-log all INSERT, UPDATE, DELETE operations on sensitive tables
  - Triggered automatically on: clients, sessions, measurements, user_profiles
  - Captures before/after state for compliance

  ## Retention
  - Audit logs retained for 7 years (GDPR requirement)
  - Automatic cleanup of logs older than 7 years (2555 days)

  ## Notes
  - Audit logs are critical for GDPR Article 30 compliance
  - Logs prove accountability and enable data breach investigation
  - IP address and user agent help identify unauthorized access
*/

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'LOGIN', 'LOGOUT', 'CONSENT_GIVEN', 'CONSENT_WITHDRAWN', 'DATA_DELETION')),
  table_name text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_logs (read-only for users)
CREATE POLICY "Users can view their own audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow authenticated users to insert audit logs (for manual logging from frontend)
CREATE POLICY "Authenticated users can create audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to automatically log changes
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
  action_type text;
  old_data_json jsonb;
  new_data_json jsonb;
BEGIN
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    action_type := 'CREATE';
    old_data_json := NULL;
    new_data_json := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'UPDATE';
    old_data_json := to_jsonb(OLD);
    new_data_json := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'DELETE';
    old_data_json := to_jsonb(OLD);
    new_data_json := NULL;
  END IF;

  -- Insert audit log
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data
  ) VALUES (
    auth.uid(),
    action_type,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    old_data_json,
    new_data_json
  );

  -- Return appropriate value
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for sensitive tables

-- Clients table audit
DROP TRIGGER IF EXISTS audit_clients_changes ON clients;
CREATE TRIGGER audit_clients_changes
  AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_event();

-- Sessions table audit
DROP TRIGGER IF EXISTS audit_sessions_changes ON sessions;
CREATE TRIGGER audit_sessions_changes
  AFTER INSERT OR UPDATE OR DELETE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_event();

-- Measurements table audit
DROP TRIGGER IF EXISTS audit_measurements_changes ON measurements;
CREATE TRIGGER audit_measurements_changes
  AFTER INSERT OR UPDATE OR DELETE ON measurements
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_event();

-- User profiles table audit
DROP TRIGGER IF EXISTS audit_user_profiles_changes ON user_profiles;
CREATE TRIGGER audit_user_profiles_changes
  AFTER INSERT OR UPDATE OR DELETE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_event();

-- Fabrics table audit
DROP TRIGGER IF EXISTS audit_fabrics_changes ON fabrics;
CREATE TRIGGER audit_fabrics_changes
  AFTER INSERT OR UPDATE OR DELETE ON fabrics
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_event();

-- Tasks table audit
DROP TRIGGER IF EXISTS audit_tasks_changes ON tasks;
CREATE TRIGGER audit_tasks_changes
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_event();

-- Problems table audit
DROP TRIGGER IF EXISTS audit_problems_changes ON problems;
CREATE TRIGGER audit_problems_changes
  AFTER INSERT OR UPDATE OR DELETE ON problems
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_event();

-- Function to cleanup old audit logs (7 years retention)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '7 years';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helpful comments
COMMENT ON TABLE audit_logs IS 'GDPR Article 30 compliance: Records of all processing activities for accountability and data breach investigation';
COMMENT ON COLUMN audit_logs.user_id IS 'User who performed the action (NULL for system actions)';
COMMENT ON COLUMN audit_logs.action IS 'Type of action performed (CREATE, READ, UPDATE, DELETE, EXPORT, etc.)';
COMMENT ON COLUMN audit_logs.old_data IS 'Previous state of data (for UPDATE/DELETE operations)';
COMMENT ON COLUMN audit_logs.new_data IS 'New state of data (for CREATE/UPDATE operations)';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional metadata like reason for deletion, consent changes, etc.';
