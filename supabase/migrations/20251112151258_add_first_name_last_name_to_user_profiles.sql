/*
  # Add First Name and Last Name to User Profiles

  1. Changes
    - Add first_name column (text, required)
    - Add last_name column (text, required)
    - Migrate existing 'name' data to first_name (if any exists)
    - Remove old 'name' column after migration
    
  2. Data Migration
    - Split existing 'name' values into first_name (first word) and last_name (rest)
    - For rows without a name, set default placeholder values
    
  3. Notes
    - Both fields are required for new user profiles
    - Existing RLS policies remain unchanged
    - Maintains backward compatibility by handling existing data
*/

-- Add new columns (nullable initially to allow data migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN first_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN last_name text;
  END IF;
END $$;

-- Migrate existing data from 'name' to 'first_name' and 'last_name'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'name'
  ) THEN
    -- Split name into first_name and last_name
    UPDATE user_profiles
    SET 
      first_name = COALESCE(
        NULLIF(split_part(name, ' ', 1), ''),
        'User'
      ),
      last_name = COALESCE(
        NULLIF(substring(name from position(' ' in name) + 1), ''),
        'Account'
      )
    WHERE name IS NOT NULL AND first_name IS NULL;
    
    -- Handle rows with no name
    UPDATE user_profiles
    SET 
      first_name = COALESCE(first_name, 'User'),
      last_name = COALESCE(last_name, 'Account')
    WHERE first_name IS NULL OR last_name IS NULL;
  END IF;
END $$;

-- Make columns NOT NULL after data migration
ALTER TABLE user_profiles 
  ALTER COLUMN first_name SET NOT NULL,
  ALTER COLUMN last_name SET NOT NULL;

-- Drop old 'name' column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'name'
  ) THEN
    ALTER TABLE user_profiles DROP COLUMN name;
  END IF;
END $$;

-- Update comments
COMMENT ON COLUMN user_profiles.first_name IS 'User first name';
COMMENT ON COLUMN user_profiles.last_name IS 'User last name';
