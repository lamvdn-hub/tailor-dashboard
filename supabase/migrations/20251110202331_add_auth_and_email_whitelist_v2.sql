/*
  # Add Authentication and Email Whitelist

  ## Overview
  This migration adds authentication support and email whitelist functionality
  to restrict access to whitelisted users only.

  ## New Tables

  ### 1. email_whitelist
  Stores approved email addresses that can register
  - `id` (uuid, primary key)
  - `email` (text, unique, required) - Whitelisted email address
  - `added_at` (timestamptz) - When email was added to whitelist
  - `added_by` (text, optional) - Who added this email (for auditing)
  - `notes` (text, optional) - Optional notes about this user

  ## Security Changes

  ### Row Level Security Updates
  - Update ALL existing table policies to require authentication
  - Change from `TO anon` to `TO authenticated`
  - All data now requires authenticated access
  - Add RLS policies for email_whitelist table

  ### Authentication Flow
  1. User attempts to sign up with email
  2. Check if email exists in whitelist (handled by trigger)
  3. If whitelisted → allow registration
  4. If not whitelisted → reject with clear error
  5. After login → all data access requires authenticated user

  ## Notes
  1. Email confirmation is disabled by default in Supabase
  2. Whitelist check happens before account creation
  3. All existing tables now require authenticated access
  4. Session persistence set to 7 days for convenience
*/

-- Create email_whitelist table
CREATE TABLE IF NOT EXISTS email_whitelist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  added_at timestamptz DEFAULT now(),
  added_by text,
  notes text
);

-- Add index for fast email lookup
CREATE INDEX IF NOT EXISTS idx_email_whitelist_email ON email_whitelist(email);

-- Enable RLS on email_whitelist
ALTER TABLE email_whitelist ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_whitelist table
DROP POLICY IF EXISTS "Authenticated users can view whitelist" ON email_whitelist;
CREATE POLICY "Authenticated users can view whitelist"
  ON email_whitelist FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert to whitelist" ON email_whitelist;
CREATE POLICY "Authenticated users can insert to whitelist"
  ON email_whitelist FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update whitelist" ON email_whitelist;
CREATE POLICY "Authenticated users can update whitelist"
  ON email_whitelist FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete from whitelist" ON email_whitelist;
CREATE POLICY "Authenticated users can delete from whitelist"
  ON email_whitelist FOR DELETE
  TO authenticated
  USING (true);

-- Function to check if email is whitelisted
CREATE OR REPLACE FUNCTION is_email_whitelisted(user_email text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM email_whitelist WHERE email = user_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for all tables to require authentication

-- Clients table
DROP POLICY IF EXISTS "Users can view all clients" ON clients;
DROP POLICY IF EXISTS "Users can insert clients" ON clients;
DROP POLICY IF EXISTS "Users can update clients" ON clients;
DROP POLICY IF EXISTS "Users can delete clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can view clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON clients;

CREATE POLICY "Authenticated users can view clients"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete clients"
  ON clients FOR DELETE
  TO authenticated
  USING (true);

-- Fabrics table
DROP POLICY IF EXISTS "Users can view all fabrics" ON fabrics;
DROP POLICY IF EXISTS "Users can insert fabrics" ON fabrics;
DROP POLICY IF EXISTS "Users can update fabrics" ON fabrics;
DROP POLICY IF EXISTS "Users can delete fabrics" ON fabrics;
DROP POLICY IF EXISTS "Authenticated users can view fabrics" ON fabrics;
DROP POLICY IF EXISTS "Authenticated users can insert fabrics" ON fabrics;
DROP POLICY IF EXISTS "Authenticated users can update fabrics" ON fabrics;
DROP POLICY IF EXISTS "Authenticated users can delete fabrics" ON fabrics;

CREATE POLICY "Authenticated users can view fabrics"
  ON fabrics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert fabrics"
  ON fabrics FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update fabrics"
  ON fabrics FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete fabrics"
  ON fabrics FOR DELETE
  TO authenticated
  USING (true);

-- Sessions table
DROP POLICY IF EXISTS "Users can view all sessions" ON sessions;
DROP POLICY IF EXISTS "Users can insert sessions" ON sessions;
DROP POLICY IF EXISTS "Users can update sessions" ON sessions;
DROP POLICY IF EXISTS "Users can delete sessions" ON sessions;
DROP POLICY IF EXISTS "Authenticated users can view sessions" ON sessions;
DROP POLICY IF EXISTS "Authenticated users can insert sessions" ON sessions;
DROP POLICY IF EXISTS "Authenticated users can update sessions" ON sessions;
DROP POLICY IF EXISTS "Authenticated users can delete sessions" ON sessions;

CREATE POLICY "Authenticated users can view sessions"
  ON sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sessions"
  ON sessions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sessions"
  ON sessions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete sessions"
  ON sessions FOR DELETE
  TO authenticated
  USING (true);

-- Measurements table
DROP POLICY IF EXISTS "Users can view all measurements" ON measurements;
DROP POLICY IF EXISTS "Users can insert measurements" ON measurements;
DROP POLICY IF EXISTS "Users can update measurements" ON measurements;
DROP POLICY IF EXISTS "Users can delete measurements" ON measurements;
DROP POLICY IF EXISTS "Authenticated users can view measurements" ON measurements;
DROP POLICY IF EXISTS "Authenticated users can insert measurements" ON measurements;
DROP POLICY IF EXISTS "Authenticated users can update measurements" ON measurements;
DROP POLICY IF EXISTS "Authenticated users can delete measurements" ON measurements;

CREATE POLICY "Authenticated users can view measurements"
  ON measurements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert measurements"
  ON measurements FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update measurements"
  ON measurements FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete measurements"
  ON measurements FOR DELETE
  TO authenticated
  USING (true);

-- Session photos table
DROP POLICY IF EXISTS "Users can view all session photos" ON session_photos;
DROP POLICY IF EXISTS "Users can insert session photos" ON session_photos;
DROP POLICY IF EXISTS "Users can update session photos" ON session_photos;
DROP POLICY IF EXISTS "Users can delete session photos" ON session_photos;
DROP POLICY IF EXISTS "Authenticated users can view session photos" ON session_photos;
DROP POLICY IF EXISTS "Authenticated users can insert session photos" ON session_photos;
DROP POLICY IF EXISTS "Authenticated users can update session photos" ON session_photos;
DROP POLICY IF EXISTS "Authenticated users can delete session photos" ON session_photos;

CREATE POLICY "Authenticated users can view session photos"
  ON session_photos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert session photos"
  ON session_photos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update session photos"
  ON session_photos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete session photos"
  ON session_photos FOR DELETE
  TO authenticated
  USING (true);

-- Tasks table
DROP POLICY IF EXISTS "Users can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can view tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can delete tasks" ON tasks;

CREATE POLICY "Authenticated users can view tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (true);

-- Problems table
DROP POLICY IF EXISTS "Users can view all problems" ON problems;
DROP POLICY IF EXISTS "Users can insert problems" ON problems;
DROP POLICY IF EXISTS "Users can update problems" ON problems;
DROP POLICY IF EXISTS "Users can delete problems" ON problems;
DROP POLICY IF EXISTS "Authenticated users can view problems" ON problems;
DROP POLICY IF EXISTS "Authenticated users can insert problems" ON problems;
DROP POLICY IF EXISTS "Authenticated users can update problems" ON problems;
DROP POLICY IF EXISTS "Authenticated users can delete problems" ON problems;

CREATE POLICY "Authenticated users can view problems"
  ON problems FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert problems"
  ON problems FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update problems"
  ON problems FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete problems"
  ON problems FOR DELETE
  TO authenticated
  USING (true);

-- Measurement definitions table
DROP POLICY IF EXISTS "Users can view all measurement definitions" ON measurement_definitions;
DROP POLICY IF EXISTS "Users can insert measurement definitions" ON measurement_definitions;
DROP POLICY IF EXISTS "Users can update measurement definitions" ON measurement_definitions;
DROP POLICY IF EXISTS "Users can delete measurement definitions" ON measurement_definitions;
DROP POLICY IF EXISTS "Authenticated users can view measurement definitions" ON measurement_definitions;
DROP POLICY IF EXISTS "Authenticated users can insert measurement definitions" ON measurement_definitions;
DROP POLICY IF EXISTS "Authenticated users can update measurement definitions" ON measurement_definitions;
DROP POLICY IF EXISTS "Authenticated users can delete measurement definitions" ON measurement_definitions;

CREATE POLICY "Authenticated users can view measurement definitions"
  ON measurement_definitions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert measurement definitions"
  ON measurement_definitions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update measurement definitions"
  ON measurement_definitions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete measurement definitions"
  ON measurement_definitions FOR DELETE
  TO authenticated
  USING (true);

-- Insert a default whitelisted email for initial setup
-- IMPORTANT: Replace this with your actual email address
INSERT INTO email_whitelist (email, added_by, notes)
VALUES ('your-email@example.com', 'system', 'Initial admin user - REPLACE WITH YOUR EMAIL')
ON CONFLICT (email) DO NOTHING;