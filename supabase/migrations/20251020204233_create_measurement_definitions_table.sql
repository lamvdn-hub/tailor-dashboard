/*
  # Create measurement_definitions table

  1. New Tables
    - `measurement_definitions`
      - `id` (uuid, primary key)
      - `name` (text, not null) - Display name of the measurement (e.g., "Sleeve Length")
      - `section` (text, not null) - Garment section: 'jacket' or 'trousers'
      - `mode` (text, not null) - Measurement mode: 'paired' or 'single'
      - `order_index` (integer, not null) - Display order for measurements
      - `min_value` (numeric, nullable) - Minimum allowed value in cm
      - `max_value` (numeric, nullable) - Maximum allowed value in cm
      - `created_at` (timestamptz)

  2. Changes
    - Defines the standard measurements for jacket and trousers
    - Paired measurements include: Sleeve Length, Bicep Circumference (jacket), Inseam, Outseam, Thigh, Knee (trousers)
    - Single measurements include: Chest, Waist, Seat/Hip, Back Length, Front Length, Shoulder Width, Cuff Circumference, Half-Back, Posture Note (jacket), Waist, Seat/Hip, Rise, Hem Opening, Crotch Depth, Waist-to-Knee (trousers)

  3. Security
    - Enable RLS on `measurement_definitions` table
    - Add policy for authenticated and anonymous users to read measurement definitions
*/

CREATE TABLE IF NOT EXISTS measurement_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  section text NOT NULL CHECK (section IN ('jacket', 'trousers')),
  mode text NOT NULL CHECK (mode IN ('paired', 'single')),
  order_index integer NOT NULL,
  min_value numeric,
  max_value numeric,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE measurement_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all users to read measurement definitions"
  ON measurement_definitions
  FOR SELECT
  USING (true);

-- Populate Jacket Measurements
INSERT INTO measurement_definitions (name, section, mode, order_index, min_value, max_value) VALUES
  ('Sleeve Length', 'jacket', 'paired', 1, 50, 100),
  ('Bicep Circumference', 'jacket', 'paired', 2, 20, 60),
  ('Chest', 'jacket', 'single', 3, 70, 150),
  ('Waist', 'jacket', 'single', 4, 60, 140),
  ('Seat/Hip', 'jacket', 'single', 5, 70, 150),
  ('Back Length', 'jacket', 'single', 6, 60, 100),
  ('Front Length', 'jacket', 'single', 7, 60, 100),
  ('Shoulder Width', 'jacket', 'single', 8, 35, 60),
  ('Cuff Circumference', 'jacket', 'single', 9, 15, 35),
  ('Half-Back', 'jacket', 'single', 10, 15, 35),
  ('Posture Note', 'jacket', 'single', 11, 0, 50);

-- Populate Trousers Measurements
INSERT INTO measurement_definitions (name, section, mode, order_index, min_value, max_value) VALUES
  ('Inseam', 'trousers', 'paired', 1, 60, 100),
  ('Outseam', 'trousers', 'paired', 2, 80, 130),
  ('Thigh', 'trousers', 'paired', 3, 40, 80),
  ('Knee', 'trousers', 'paired', 4, 30, 60),
  ('Waist', 'trousers', 'single', 5, 60, 140),
  ('Seat/Hip', 'trousers', 'single', 6, 70, 150),
  ('Rise', 'trousers', 'single', 7, 20, 50),
  ('Hem Opening', 'trousers', 'single', 8, 15, 30),
  ('Crotch Depth', 'trousers', 'single', 9, 20, 50),
  ('Waist-to-Knee', 'trousers', 'single', 10, 40, 80);
