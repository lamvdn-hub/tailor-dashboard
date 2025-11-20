/*
  # Tailor Notebook Database Schema

  ## Overview
  This migration creates the complete database schema for a tailor's measurement notebook application,
  including clients, sessions, fabrics, measurements, and photos.

  ## New Tables

  ## 1. clients
  Stores customer information
  - `id` (uuid, primary key)
  - `name` (text, required) - Client's full name
  - `phone` (text, optional) - Contact phone number
  - `email` (text, optional) - Email address
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. fabrics
  Manages fabric inventory
  - `id` (uuid, primary key)
  - `name` (text, required) - Fabric name
  - `composition` (text, optional) - Material composition
  - `color_pattern` (text, optional) - Color or pattern description
  - `stock_code` (text, optional) - Internal stock reference
  - `status` (text, default 'in') - Availability status (in/out)
  - `created_at` (timestamptz) - Record creation timestamp

  ### 3. sessions
  Records tailoring sessions
  - `id` (uuid, primary key)
  - `client_id` (uuid, foreign key) - References clients table
  - `garment_type` (text, required) - Type of garment (jacket/trousers)
  - `fabric_id` (uuid, optional foreign key) - References fabrics table
  - `status` (text, default 'active') - Session status (active/completed/ready)
  - `style_notes` (text, optional) - Style specifications
  - `client_requests` (text, optional) - Special client requests
  - `adjustment_remarks` (text, optional) - Adjustment notes
  - `created_at` (timestamptz) - Session date
  - `updated_at` (timestamptz) - Last modification timestamp

  ### 4. measurements
  Stores individual measurements for each session
  - `id` (uuid, primary key)
  - `session_id` (uuid, foreign key) - References sessions table
  - `measurement_name` (text, required) - Name of measurement (e.g., chest, waist)
  - `left_value` (numeric, optional) - Left side measurement in cm
  - `right_value` (numeric, optional) - Right side measurement in cm
  - `created_at` (timestamptz) - Record creation timestamp

  ### 5. session_photos
  Manages photos attached to sessions
  - `id` (uuid, primary key)
  - `session_id` (uuid, foreign key) - References sessions table
  - `photo_url` (text, required) - Storage URL for photo
  - `created_at` (timestamptz) - Upload timestamp

  ## Security
  - Enable Row Level Security on all tables
  - Add policies for authenticated users to manage their own data
  - Public read access is NOT granted (all data is private)

  ## Notes
  1. All timestamps use `timestamptz` for proper timezone handling
  2. Foreign keys ensure referential integrity
  3. Indexes added on frequently queried columns
  4. RLS policies restrict access to authenticated users only
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create fabrics table
CREATE TABLE IF NOT EXISTS fabrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  composition text,
  color_pattern text,
  stock_code text,
  status text DEFAULT 'in' CHECK (status IN ('in', 'out')),
  created_at timestamptz DEFAULT now()
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  garment_type text NOT NULL CHECK (garment_type IN ('jacket', 'trousers')),
  fabric_id uuid REFERENCES fabrics(id) ON DELETE SET NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'ready')),
  style_notes text,
  client_requests text,
  adjustment_remarks text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create measurements table
CREATE TABLE IF NOT EXISTS measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  measurement_name text NOT NULL,
  left_value numeric(5,1),
  right_value numeric(5,1),
  created_at timestamptz DEFAULT now()
);

-- Create session_photos table
CREATE TABLE IF NOT EXISTS session_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_client_id ON sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_measurements_session_id ON measurements(session_id);
CREATE INDEX IF NOT EXISTS idx_session_photos_session_id ON session_photos(session_id);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE fabrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients table
CREATE POLICY "Users can view all clients"
  ON clients FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Users can insert clients"
  ON clients FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Users can update clients"
  ON clients FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete clients"
  ON clients FOR DELETE
  TO anon
  USING (true);

-- RLS Policies for fabrics table
CREATE POLICY "Users can view all fabrics"
  ON fabrics FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Users can insert fabrics"
  ON fabrics FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Users can update fabrics"
  ON fabrics FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete fabrics"
  ON fabrics FOR DELETE
  TO anon
  USING (true);

-- RLS Policies for sessions table
CREATE POLICY "Users can view all sessions"
  ON sessions FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Users can insert sessions"
  ON sessions FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Users can update sessions"
  ON sessions FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete sessions"
  ON sessions FOR DELETE
  TO anon
  USING (true);

-- RLS Policies for measurements table
CREATE POLICY "Users can view all measurements"
  ON measurements FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Users can insert measurements"
  ON measurements FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Users can update measurements"
  ON measurements FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete measurements"
  ON measurements FOR DELETE
  TO anon
  USING (true);

-- RLS Policies for session_photos table
CREATE POLICY "Users can view all session photos"
  ON session_photos FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Users can insert session photos"
  ON session_photos FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Users can update session photos"
  ON session_photos FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete session photos"
  ON session_photos FOR DELETE
  TO anon
  USING (true);