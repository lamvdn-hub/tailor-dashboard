/*
  # Remove min_value and max_value columns from measurement_definitions

  1. Changes
    - Drop `min_value` column from `measurement_definitions` table
    - Drop `max_value` column from `measurement_definitions` table

  2. Notes
    - These columns were used for client-side input validation
    - Removing them to simplify the schema and allow unrestricted measurement values
    - No data loss concerns as these were just validation constraints
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'measurement_definitions' AND column_name = 'min_value'
  ) THEN
    ALTER TABLE measurement_definitions DROP COLUMN min_value;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'measurement_definitions' AND column_name = 'max_value'
  ) THEN
    ALTER TABLE measurement_definitions DROP COLUMN max_value;
  END IF;
END $$;