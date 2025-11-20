/*
  # Update RLS Policies for Anonymous Access

  ## Overview
  This migration updates the Row Level Security policies to allow anonymous (anon) users
  to access the tailor notebook application. This is appropriate for a single-user 
  tailor application where authentication is not required.

  ## Changes
  - Drop existing policies that require authentication
  - Create new policies that allow anonymous access
  - Applies to all tables: clients, fabrics, sessions, measurements, session_photos

  ## Security
  - Row Level Security remains enabled for database protection
  - Anonymous users (using the anon key) can perform all CRUD operations
  - This is suitable for single-user applications
*/

-- Drop existing policies for clients table
DROP POLICY IF EXISTS "Users can view all clients" ON clients;
DROP POLICY IF EXISTS "Users can insert clients" ON clients;
DROP POLICY IF EXISTS "Users can update clients" ON clients;
DROP POLICY IF EXISTS "Users can delete clients" ON clients;

-- Drop existing policies for fabrics table
DROP POLICY IF EXISTS "Users can view all fabrics" ON fabrics;
DROP POLICY IF EXISTS "Users can insert fabrics" ON fabrics;
DROP POLICY IF EXISTS "Users can update fabrics" ON fabrics;
DROP POLICY IF EXISTS "Users can delete fabrics" ON fabrics;

-- Drop existing policies for sessions table
DROP POLICY IF EXISTS "Users can view all sessions" ON sessions;
DROP POLICY IF EXISTS "Users can insert sessions" ON sessions;
DROP POLICY IF EXISTS "Users can update sessions" ON sessions;
DROP POLICY IF EXISTS "Users can delete sessions" ON sessions;

-- Drop existing policies for measurements table
DROP POLICY IF EXISTS "Users can view all measurements" ON measurements;
DROP POLICY IF EXISTS "Users can insert measurements" ON measurements;
DROP POLICY IF EXISTS "Users can update measurements" ON measurements;
DROP POLICY IF EXISTS "Users can delete measurements" ON measurements;

-- Drop existing policies for session_photos table
DROP POLICY IF EXISTS "Users can view all session photos" ON session_photos;
DROP POLICY IF EXISTS "Users can insert session photos" ON session_photos;
DROP POLICY IF EXISTS "Users can update session photos" ON session_photos;
DROP POLICY IF EXISTS "Users can delete session photos" ON session_photos;

-- Create new policies for clients table (anonymous access)
CREATE POLICY "Anon users can view all clients"
  ON clients FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon users can insert clients"
  ON clients FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon users can update clients"
  ON clients FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon users can delete clients"
  ON clients FOR DELETE
  TO anon
  USING (true);

-- Create new policies for fabrics table (anonymous access)
CREATE POLICY "Anon users can view all fabrics"
  ON fabrics FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon users can insert fabrics"
  ON fabrics FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon users can update fabrics"
  ON fabrics FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon users can delete fabrics"
  ON fabrics FOR DELETE
  TO anon
  USING (true);

-- Create new policies for sessions table (anonymous access)
CREATE POLICY "Anon users can view all sessions"
  ON sessions FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon users can insert sessions"
  ON sessions FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon users can update sessions"
  ON sessions FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon users can delete sessions"
  ON sessions FOR DELETE
  TO anon
  USING (true);

-- Create new policies for measurements table (anonymous access)
CREATE POLICY "Anon users can view all measurements"
  ON measurements FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon users can insert measurements"
  ON measurements FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon users can update measurements"
  ON measurements FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon users can delete measurements"
  ON measurements FOR DELETE
  TO anon
  USING (true);

-- Create new policies for session_photos table (anonymous access)
CREATE POLICY "Anon users can view all session photos"
  ON session_photos FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon users can insert session photos"
  ON session_photos FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon users can update session photos"
  ON session_photos FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon users can delete session photos"
  ON session_photos FOR DELETE
  TO anon
  USING (true);
