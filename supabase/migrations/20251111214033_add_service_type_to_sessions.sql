/*
  # Add service_type column to sessions table

  1. Changes
    - Add `service_type` column to `sessions` table
      - Type: text
      - Allowed values: 'MTM' or 'Bespoke'
      - Not nullable (required field)
      - Add check constraint to enforce valid values
  
  2. Notes
    - This field tracks whether a session is for Made-to-Measure (MTM) or Bespoke service
    - The field is required for all new sessions
*/

-- Add service_type column with check constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions' AND column_name = 'service_type'
  ) THEN
    ALTER TABLE sessions 
    ADD COLUMN service_type text NOT NULL DEFAULT 'MTM'
    CHECK (service_type IN ('MTM', 'Bespoke'));
  END IF;
END $$;
