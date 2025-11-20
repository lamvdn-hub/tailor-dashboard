/*
  # Add Suit Customization Support

  ## Overview
  This migration extends the tailoring application to support comprehensive suit customization,
  including suit types, configuration options, and section-specific measurements.

  ## Schema Changes

  ### 1. Extend sessions table
  Add columns for suit-specific configuration:
  - `garment_type` - Update CHECK constraint to include 'suit'
  - `suit_type` (text, optional) - Type of suit: 'single_breasted', 'double_breasted', 'tuxedo'
  - `lapel_type` (text, optional) - Lapel style for the suit jacket
  - `button_type` (text, optional) - Button configuration (can be numeric or descriptive)
  - `vent_type` (text, optional) - Vent style for the suit jacket
  - `jacket_notes` (text, optional) - Separate notes for jacket component
  - `trousers_notes` (text, optional) - Separate notes for trousers component

  ### 2. Extend measurements table
  Add section identifier to distinguish jacket vs trousers measurements in suits:
  - `section` (text, optional) - Identifies which garment section: 'jacket', 'trousers', or NULL for single garments

  ## Data Integrity
  - All new columns are optional to maintain backward compatibility
  - Existing jacket and trousers sessions remain unaffected
  - CHECK constraints ensure valid values for suit configurations

  ## Notes
  1. Suit sessions will have garment_type = 'suit' and populate suit-specific fields
  2. Section field in measurements allows grouping measurements by jacket/trousers
  3. Separate notes fields enable detailed documentation per garment component
  4. Button type is text to support both numeric (1, 2, 3) and custom values
*/

-- Update garment_type CHECK constraint to include 'suit'
DO $$
BEGIN
  ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_garment_type_check;
  ALTER TABLE sessions ADD CONSTRAINT sessions_garment_type_check 
    CHECK (garment_type IN ('jacket', 'trousers', 'suit'));
END $$;

-- Add suit-specific columns to sessions table
DO $$
BEGIN
  -- Add suit type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'suit_type'
  ) THEN
    ALTER TABLE sessions ADD COLUMN suit_type text 
      CHECK (suit_type IN ('single_breasted', 'double_breasted', 'tuxedo'));
  END IF;

  -- Add lapel type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'lapel_type'
  ) THEN
    ALTER TABLE sessions ADD COLUMN lapel_type text;
  END IF;

  -- Add button type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'button_type'
  ) THEN
    ALTER TABLE sessions ADD COLUMN button_type text;
  END IF;

  -- Add vent type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'vent_type'
  ) THEN
    ALTER TABLE sessions ADD COLUMN vent_type text;
  END IF;

  -- Add jacket notes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'jacket_notes'
  ) THEN
    ALTER TABLE sessions ADD COLUMN jacket_notes text;
  END IF;

  -- Add trousers notes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'trousers_notes'
  ) THEN
    ALTER TABLE sessions ADD COLUMN trousers_notes text;
  END IF;
END $$;

-- Add section column to measurements table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'measurements' AND column_name = 'section'
  ) THEN
    ALTER TABLE measurements ADD COLUMN section text 
      CHECK (section IN ('jacket', 'trousers'));
  END IF;
END $$;

-- Create index on measurements section for efficient querying
CREATE INDEX IF NOT EXISTS idx_measurements_section ON measurements(section);

-- Add comment to document suit configuration relationship
COMMENT ON COLUMN sessions.suit_type IS 'Type of suit: single_breasted, double_breasted, or tuxedo. Only populated when garment_type is suit.';
COMMENT ON COLUMN sessions.lapel_type IS 'Lapel style for suit jacket. Populated based on suit_type selection.';
COMMENT ON COLUMN sessions.button_type IS 'Button configuration for suit jacket. Can be numeric or descriptive text.';
COMMENT ON COLUMN sessions.vent_type IS 'Vent style for suit jacket.';
COMMENT ON COLUMN sessions.jacket_notes IS 'Style notes and specifications specific to the jacket component of a suit.';
COMMENT ON COLUMN sessions.trousers_notes IS 'Style notes and specifications specific to the trousers component of a suit.';
COMMENT ON COLUMN measurements.section IS 'Identifies which garment section this measurement belongs to: jacket or trousers. Used for suit garments to separate measurements.';