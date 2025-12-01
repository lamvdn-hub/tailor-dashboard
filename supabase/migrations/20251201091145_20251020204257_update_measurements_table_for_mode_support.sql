/*
  # Update measurements table to support paired and single measurements

  1. Changes
    - Add `measurement_definition_id` column to reference measurement_definitions
    - Add `total_cm` column for single measurements
    - Rename `left_value` to `left_cm` for clarity
    - Rename `right_value` to `right_cm` for clarity
    - Update existing data to use new column names

  2. Notes
    - The `left_cm` and `right_cm` columns are used for paired measurements
    - The `total_cm` column is used for single measurements
    - We keep `measurement_name` for backward compatibility but will primarily use the definition reference
*/

-- Add new columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'measurements' AND column_name = 'measurement_definition_id'
  ) THEN
    ALTER TABLE measurements ADD COLUMN measurement_definition_id uuid REFERENCES measurement_definitions(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'measurements' AND column_name = 'total_cm'
  ) THEN
    ALTER TABLE measurements ADD COLUMN total_cm numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'measurements' AND column_name = 'left_cm'
  ) THEN
    ALTER TABLE measurements ADD COLUMN left_cm numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'measurements' AND column_name = 'right_cm'
  ) THEN
    ALTER TABLE measurements ADD COLUMN right_cm numeric;
  END IF;
END $$;

-- Migrate existing data from left_value/right_value to left_cm/right_cm
UPDATE measurements
SET left_cm = left_value, right_cm = right_value
WHERE left_cm IS NULL AND right_cm IS NULL;

-- Add helpful comment to columns
COMMENT ON COLUMN measurements.left_cm IS 'Left measurement value in centimeters (used for paired measurements)';
COMMENT ON COLUMN measurements.right_cm IS 'Right measurement value in centimeters (used for paired measurements)';
COMMENT ON COLUMN measurements.total_cm IS 'Total measurement value in centimeters (used for single measurements)';
COMMENT ON COLUMN measurements.measurement_definition_id IS 'Reference to the measurement definition that defines the type and properties of this measurement';
