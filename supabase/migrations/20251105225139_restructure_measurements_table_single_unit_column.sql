/*
  # Restructure measurements table to use single unit column

  1. Changes
    - Drop unique constraints that reference left_cm and right_cm columns
    - Add new `unit_cm` column for all measurements
    - Migrate existing data:
      * For measurements with different left/right values: create two rows with (L) and (R) suffix
      * For measurements with same left/right values: create single row with the value
      * For measurements with only total_cm: keep as single row
    - Drop left_cm and right_cm columns
    - Recreate unique constraint for the new structure

  2. Data Migration Logic
    - Measurements with left_cm != right_cm → Split into two rows: "Name (L)" and "Name (R)"
    - Measurements with left_cm = right_cm → Single row with original name
    - Measurements with only total_cm → Keep as single row with original name

  3. Notes
    - The measurement_name column serves as the "Name" column (no rename needed at DB level)
    - All existing measurement data is preserved during migration
    - New structure simplifies queries and data entry
*/

-- Step 1: Drop existing unique constraints that reference columns we're about to change
DROP INDEX IF EXISTS idx_measurements_session_name_unique;
DROP INDEX IF EXISTS idx_measurements_session_definition_unique;

-- Step 2: Add the new unit_cm column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'measurements' AND column_name = 'unit_cm'
  ) THEN
    ALTER TABLE measurements ADD COLUMN unit_cm numeric;
  END IF;
END $$;

-- Step 3: Migrate existing data
-- First, handle measurements where left_cm and right_cm are different (need to split into two rows)
INSERT INTO measurements (session_id, measurement_name, unit_cm, section, measurement_definition_id, created_at)
SELECT 
  session_id,
  measurement_name || ' (L)' as measurement_name,
  left_cm as unit_cm,
  section,
  measurement_definition_id,
  created_at
FROM measurements
WHERE left_cm IS NOT NULL 
  AND right_cm IS NOT NULL 
  AND left_cm != right_cm
  AND unit_cm IS NULL;

INSERT INTO measurements (session_id, measurement_name, unit_cm, section, measurement_definition_id, created_at)
SELECT 
  session_id,
  measurement_name || ' (R)' as measurement_name,
  right_cm as unit_cm,
  section,
  measurement_definition_id,
  created_at
FROM measurements
WHERE left_cm IS NOT NULL 
  AND right_cm IS NOT NULL 
  AND left_cm != right_cm
  AND unit_cm IS NULL;

-- Handle measurements where left_cm and right_cm are the same (single row with value)
UPDATE measurements
SET unit_cm = left_cm
WHERE left_cm IS NOT NULL 
  AND right_cm IS NOT NULL 
  AND left_cm = right_cm
  AND unit_cm IS NULL;

-- Handle measurements that only have left_cm (use left_cm value)
UPDATE measurements
SET unit_cm = left_cm
WHERE left_cm IS NOT NULL 
  AND right_cm IS NULL
  AND total_cm IS NULL
  AND unit_cm IS NULL;

-- Handle measurements that only have right_cm (use right_cm value)
UPDATE measurements
SET unit_cm = right_cm
WHERE right_cm IS NOT NULL 
  AND left_cm IS NULL
  AND total_cm IS NULL
  AND unit_cm IS NULL;

-- Handle measurements with total_cm (migrate to unit_cm)
UPDATE measurements
SET unit_cm = total_cm
WHERE total_cm IS NOT NULL
  AND unit_cm IS NULL;

-- Step 4: Delete original rows that were split into left/right pairs
DELETE FROM measurements
WHERE left_cm IS NOT NULL 
  AND right_cm IS NOT NULL 
  AND left_cm != right_cm
  AND unit_cm IS NULL;

-- Step 5: Drop the old columns
ALTER TABLE measurements DROP COLUMN IF EXISTS left_value;
ALTER TABLE measurements DROP COLUMN IF EXISTS right_value;
ALTER TABLE measurements DROP COLUMN IF EXISTS left_cm;
ALTER TABLE measurements DROP COLUMN IF EXISTS right_cm;
ALTER TABLE measurements DROP COLUMN IF EXISTS total_cm;

-- Step 6: Recreate unique constraint for new structure
CREATE UNIQUE INDEX IF NOT EXISTS idx_measurements_session_name_unique
ON measurements(session_id, measurement_name);

-- Step 7: Add helpful comments
COMMENT ON COLUMN measurements.unit_cm IS 'Measurement value in centimeters. For paired measurements, separate rows are created with (L) or (R) suffix in the name.';
COMMENT ON COLUMN measurements.measurement_name IS 'Name of the measurement. For paired measurements (left/right), the name includes (L) or (R) suffix.';
