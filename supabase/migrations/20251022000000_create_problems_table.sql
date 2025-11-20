/*
  # Create Problems/Queries Table

  ## Overview
  This migration creates the problems (customer queries) table for managing customer
  support requests and inquiries.

  ## Schema Changes

  ### 1. New Table: problems
  Creates the problems table with these columns:
  - `id` (serial, primary key) - Auto-incrementing unique identifier
  - `name` (text, nullable) - Customer name
  - `email` (text, nullable) - Customer email address
  - `problem` (text, nullable) - Problem description or query
  - `Status` (boolean, default false) - Query status (false = pending, true = resolved)
  - `created_at` (timestamptz) - When the query was submitted

  ## Security (RLS)
  - Enable Row Level Security on problems table
  - RLS policies are added in subsequent migrations (20251022155409 and 20251022170301)

  ## Notes
  1. This table stores customer support queries
  2. Status defaults to false (pending) for new queries
  3. All fields except id and created_at are nullable to allow flexible data entry
  4. Uses serial ID for simple sequential numbering
*/

-- Create problems table
CREATE TABLE IF NOT EXISTS problems (
  id serial PRIMARY KEY,
  name text,
  email text,
  problem text,
  "Status" boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create index for efficient status filtering
CREATE INDEX IF NOT EXISTS idx_problems_status ON problems("Status");
CREATE INDEX IF NOT EXISTS idx_problems_created_at ON problems(created_at DESC);

-- Enable Row Level Security
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;

-- Add helpful comments
COMMENT ON TABLE problems IS 'Customer support queries and problem reports';
COMMENT ON COLUMN problems.name IS 'Customer name (optional)';
COMMENT ON COLUMN problems.email IS 'Customer email address (optional)';
COMMENT ON COLUMN problems.problem IS 'Description of the problem or query';
COMMENT ON COLUMN problems."Status" IS 'Query resolution status: false = pending, true = resolved';
