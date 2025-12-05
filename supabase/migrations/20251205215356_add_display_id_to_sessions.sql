/*
  # Add Display ID System for Orders

  1. Changes
    - Add `display_id` column to sessions table for human-readable order numbers
    - Add `display_id_normalized` column for flexible searching
    - Add `shop_code` column to user_profiles for shop identification
    - Create indexes for fast searching

  2. Display ID Format
    - Format: [SHOP_CODE]-[YYMMDD]-[SEQ]
    - Example: "WBB-250115-001"
    - Shop code: 2-4 uppercase letters
    - Date: YYMMDD format
    - Sequence: 3-digit daily counter

  3. Security
    - Maintains existing RLS policies
    - No changes to data access patterns
*/

-- Add display_id column to sessions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions' AND column_name = 'display_id'
  ) THEN
    ALTER TABLE sessions ADD COLUMN display_id text;
  END IF;
END $$;

-- Add display_id_normalized column for searching (no dashes/spaces)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions' AND column_name = 'display_id_normalized'
  ) THEN
    ALTER TABLE sessions ADD COLUMN display_id_normalized text;
  END IF;
END $$;

-- Add shop_code column to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'shop_code'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN shop_code text DEFAULT 'SHP';
  END IF;
END $$;

-- Create index on display_id for fast exact lookups
CREATE INDEX IF NOT EXISTS idx_sessions_display_id ON sessions(display_id);

-- Create index on display_id_normalized for flexible searching
CREATE INDEX IF NOT EXISTS idx_sessions_display_id_normalized ON sessions(display_id_normalized);

-- Add helpful comments
COMMENT ON COLUMN sessions.display_id IS 'Human-readable order number in format: SHOP-YYMMDD-SEQ (e.g., WBB-250115-001)';
COMMENT ON COLUMN sessions.display_id_normalized IS 'Normalized version of display_id for searching (no dashes or spaces)';
COMMENT ON COLUMN user_profiles.shop_code IS 'Shop identifier code (2-4 uppercase letters) used in order display IDs';
