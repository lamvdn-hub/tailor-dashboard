/*
  # Add Comprehensive Consent Tracking System

  ## Overview
  This migration implements a consent tracking system for GDPR compliance (Article 7 - Conditions for Consent).
  It tracks user consent for various data processing activities with full audit trail.

  ## New Tables

  ### 1. consent_types
  Defines different types of consent that can be requested
  - `id` (uuid, primary key) - Unique consent type ID
  - `name` (text, unique, required) - Internal name (e.g., 'essential_cookies', 'analytics')
  - `display_name` (text, required) - User-facing name
  - `description` (text, required) - Clear explanation of what this consent enables
  - `required` (boolean, default false) - Whether consent is required to use the service
  - `category` (text, required) - Category (essential, functional, analytics, marketing)
  - `active` (boolean, default true) - Whether this consent type is currently active
  - `created_at` (timestamptz) - When consent type was created
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. user_consents
  Stores individual user consent decisions with full history
  - `id` (uuid, primary key) - Unique consent record ID
  - `user_id` (uuid, foreign key) - User who gave/withdrew consent
  - `consent_type_id` (uuid, foreign key) - Type of consent
  - `granted` (boolean, required) - Whether consent was granted (true) or withdrawn (false)
  - `consent_method` (text, required) - How consent was obtained (signup, cookie_banner, settings)
  - `ip_address` (text, nullable) - IP address when consent was given
  - `user_agent` (text, nullable) - User agent when consent was given
  - `version` (text, nullable) - Version of consent text when given
  - `metadata` (jsonb) - Additional context (e.g., which page, explicit action)
  - `created_at` (timestamptz) - When consent was given/withdrawn

  ## Security
  - Enable RLS on all consent tables
  - Users can view and manage their own consents
  - Full audit trail maintained in audit_logs table
  - Consent cannot be deleted, only new records added (immutable history)

  ## Default Consent Types
  - Essential Cookies: Required for authentication and security
  - Functional Preferences: Theme, language, user preferences
  - Data Processing: Processing of client measurement data
  - Data Retention: Retention of business data beyond active use

  ## Notes
  - Consent must be freely given, specific, informed, and unambiguous (GDPR Article 7)
  - Users can withdraw consent at any time
  - Full history of consent changes maintained
  - Essential cookies do not require consent (legitimate interest)
*/

-- Create consent_types table
CREATE TABLE IF NOT EXISTS consent_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text NOT NULL,
  required boolean DEFAULT false,
  category text NOT NULL CHECK (category IN ('essential', 'functional', 'analytics', 'marketing', 'data_processing')),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_consents table
CREATE TABLE IF NOT EXISTS user_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  consent_type_id uuid REFERENCES consent_types(id) ON DELETE CASCADE NOT NULL,
  granted boolean NOT NULL,
  consent_method text NOT NULL CHECK (consent_method IN ('signup', 'cookie_banner', 'settings', 'explicit_action')),
  ip_address text,
  user_agent text,
  version text DEFAULT '1.0',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_consent_types_name ON consent_types(name);
CREATE INDEX IF NOT EXISTS idx_consent_types_category ON consent_types(category);
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_consent_type_id ON user_consents(consent_type_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_created_at ON user_consents(created_at DESC);

-- Enable RLS
ALTER TABLE consent_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for consent_types (all authenticated users can read)
CREATE POLICY "All authenticated users can view consent types"
  ON consent_types FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "Authenticated users can view all consent types including inactive"
  ON consent_types FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for user_consents
CREATE POLICY "Users can view their own consents"
  ON user_consents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own consents"
  ON user_consents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Note: No UPDATE or DELETE policies - consents are immutable (audit trail)

-- Trigger to update consent_types updated_at
CREATE OR REPLACE FUNCTION update_consent_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_consent_types_updated_at ON consent_types;
CREATE TRIGGER set_consent_types_updated_at
  BEFORE UPDATE ON consent_types
  FOR EACH ROW
  EXECUTE FUNCTION update_consent_types_updated_at();

-- Function to get current consent status for a user
CREATE OR REPLACE FUNCTION get_user_consent_status(p_user_id uuid, p_consent_type_name text)
RETURNS boolean AS $$
DECLARE
  latest_consent boolean;
BEGIN
  SELECT uc.granted INTO latest_consent
  FROM user_consents uc
  JOIN consent_types ct ON uc.consent_type_id = ct.id
  WHERE uc.user_id = p_user_id
    AND ct.name = p_consent_type_name
  ORDER BY uc.created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(latest_consent, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record consent (with automatic audit logging)
CREATE OR REPLACE FUNCTION record_user_consent(
  p_user_id uuid,
  p_consent_type_name text,
  p_granted boolean,
  p_consent_method text,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid AS $$
DECLARE
  v_consent_type_id uuid;
  v_consent_id uuid;
BEGIN
  -- Get consent type ID
  SELECT id INTO v_consent_type_id
  FROM consent_types
  WHERE name = p_consent_type_name;

  IF v_consent_type_id IS NULL THEN
    RAISE EXCEPTION 'Consent type "%" does not exist', p_consent_type_name;
  END IF;

  -- Insert consent record
  INSERT INTO user_consents (
    user_id,
    consent_type_id,
    granted,
    consent_method,
    ip_address,
    user_agent,
    metadata
  ) VALUES (
    p_user_id,
    v_consent_type_id,
    p_granted,
    p_consent_method,
    p_ip_address,
    p_user_agent,
    p_metadata
  ) RETURNING id INTO v_consent_id;

  -- Log to audit trail
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    new_data,
    ip_address,
    user_agent,
    metadata
  ) VALUES (
    p_user_id,
    CASE WHEN p_granted THEN 'CONSENT_GIVEN' ELSE 'CONSENT_WITHDRAWN' END,
    'user_consents',
    v_consent_id,
    jsonb_build_object(
      'consent_type', p_consent_type_name,
      'granted', p_granted,
      'method', p_consent_method
    ),
    p_ip_address,
    p_user_agent,
    p_metadata
  );

  RETURN v_consent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default consent types
INSERT INTO consent_types (name, display_name, description, required, category) VALUES
  ('essential_cookies', 'Essential Cookies', 'Required for authentication, security, and basic functionality. These cannot be disabled as they are necessary for the service to function.', true, 'essential'),
  ('functional_preferences', 'Functional Preferences', 'Stores your preferences like theme (dark/light mode), language, and interface settings to enhance your experience.', false, 'functional'),
  ('data_processing', 'Client Data Processing', 'Permission to process and store client measurement data, session information, and related business data for tailoring services.', true, 'data_processing'),
  ('data_retention', 'Extended Data Retention', 'Permission to retain your business data (clients, sessions, measurements) beyond active use for historical reference and business continuity.', false, 'data_processing')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  updated_at = now();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_consent_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION record_user_consent(uuid, text, boolean, text, text, text, jsonb) TO authenticated;

-- Add helpful comments
COMMENT ON TABLE consent_types IS 'Defines types of consent required for GDPR Article 7 compliance';
COMMENT ON TABLE user_consents IS 'Immutable audit trail of all user consent decisions with full history';
COMMENT ON FUNCTION get_user_consent_status(uuid, text) IS 'Returns current consent status for a specific consent type';
COMMENT ON FUNCTION record_user_consent(uuid, text, boolean, text, text, text, jsonb) IS 'Records a consent decision with automatic audit logging';
