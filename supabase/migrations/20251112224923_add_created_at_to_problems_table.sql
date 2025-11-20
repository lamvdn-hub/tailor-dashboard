/*
  # Add created_at column to problems table

  ## Overview
  This migration adds the missing created_at column to the problems table,
  which is needed for proper display and sorting on the Queries page.

  ## Changes
  1. Add created_at column with timestamptz type
  2. Set default value to now()
  3. Backfill existing records with current timestamp

  ## Notes
  - Existing records will have their created_at set to the migration execution time
  - Future records will automatically get the timestamp when created
*/

-- Add created_at column to problems table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'problems' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE problems ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Backfill existing records
UPDATE problems SET created_at = now() WHERE created_at IS NULL;

-- Add helpful comment
COMMENT ON COLUMN problems.created_at IS 'Timestamp when the query was submitted';
