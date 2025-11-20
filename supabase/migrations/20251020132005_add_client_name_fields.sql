/*
  # Add First Name and Last Name Fields to Clients Table

  ## Overview
  This migration adds separate first_name and last_name columns to the clients table
  to support the Tasks management system requirements.

  ## Schema Changes

  ### 1. New Columns
  Adds to the clients table:
  - `first_name` (text, optional) - Client's first name
  - `last_name` (text, optional) - Client's last name

  ### 2. Data Migration Strategy
  - Keeps existing `name` field for backward compatibility
  - New columns are nullable to allow gradual migration
  - Frontend can split name into first/last as needed
  - Existing records will have name field populated, new fields will be null initially

  ## Notes
  1. The original `name` column is preserved to avoid data loss
  2. Applications can gradually migrate to using first_name/last_name
  3. Both name fields can coexist during transition period
  4. No breaking changes to existing data or queries
*/

-- Add first_name and last_name columns to clients table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE clients ADD COLUMN first_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE clients ADD COLUMN last_name text;
  END IF;
END $$;

-- Add helpful comments
COMMENT ON COLUMN clients.first_name IS 'Client''s first name';
COMMENT ON COLUMN clients.last_name IS 'Client''s last name';
COMMENT ON COLUMN clients.name IS 'Full name (legacy field, kept for backward compatibility)';
