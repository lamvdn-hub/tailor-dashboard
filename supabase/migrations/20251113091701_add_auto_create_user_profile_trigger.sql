/*
  # Add Auto-Create User Profile Trigger

  1. Changes
    - Create trigger function to automatically create user_profile when user signs up
    - Create trigger on auth.users table
    - Ensures every new user gets a profile record

  2. Security
    - Function uses SECURITY DEFINER to access auth schema
    - Only runs on INSERT to auth.users

  3. Notes
    - This prevents the issue where users exist in auth.users but not in user_profiles
    - Profile is created with placeholder names that user can update later
*/

-- Create function to auto-create user profile
CREATE OR REPLACE FUNCTION create_user_profile_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Insert a new user profile with default values
  INSERT INTO public.user_profiles (user_id, first_name, last_name)
  VALUES (NEW.id, 'User', 'Account')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile_on_signup();

-- Add helpful comment
COMMENT ON FUNCTION create_user_profile_on_signup() IS 'Automatically creates a user_profile record when a new user signs up in auth.users';
