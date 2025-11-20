/*
  # Add unique constraint to prevent duplicate measurements

  1. Changes
    - Remove duplicate measurements from the database
    - Add a unique constraint on (session_id, measurement_name) to prevent duplicates
    - Add a unique constraint on (session_id, measurement_definition_id) where measurement_definition_id is not null

  2. Security
    - No changes to RLS policies

  3. Notes
    - This prevents the bug where updating a measurement creates a new row instead of updating the existing one
    - Existing duplicates are resolved by keeping the most recent measurement with data
    - The deduplication logic keeps measurements with data over empty ones
    - If both have data, it keeps the one with measurement_definition_id or the most recent
*/

-- Remove duplicate measurements, keeping only the most recent one with data for each (session_id, measurement_name) pair
-- This CTE identifies duplicates and marks which ones to keep
WITH ranked_measurements AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY session_id, measurement_name
      ORDER BY
        CASE WHEN left_cm IS NOT NULL OR right_cm IS NOT NULL OR total_cm IS NOT NULL THEN 0 ELSE 1 END,
        CASE WHEN measurement_definition_id IS NOT NULL THEN 0 ELSE 1 END,
        created_at DESC
    ) as rn
  FROM measurements
)
DELETE FROM measurements
WHERE id IN (
  SELECT id FROM ranked_measurements WHERE rn > 1
);

-- Add unique constraint to prevent future duplicates by measurement name
CREATE UNIQUE INDEX IF NOT EXISTS idx_measurements_session_name_unique
ON measurements(session_id, measurement_name);

-- Add unique constraint for measurement_definition_id when it exists
CREATE UNIQUE INDEX IF NOT EXISTS idx_measurements_session_definition_unique
ON measurements(session_id, measurement_definition_id)
WHERE measurement_definition_id IS NOT NULL;

-- Add helpful comments
COMMENT ON INDEX idx_measurements_session_name_unique IS 'Ensures only one measurement per name per session to prevent duplicates';
COMMENT ON INDEX idx_measurements_session_definition_unique IS 'Ensures only one measurement per definition per session when using measurement definitions';
