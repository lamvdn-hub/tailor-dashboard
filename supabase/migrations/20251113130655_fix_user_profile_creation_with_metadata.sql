/*
  # Fix User Profile Creation to Use Signup Metadata
  
  ## Problem
  During signup, the profile is created with placeholder values, but the update
  to set actual first_name and last_name fails because the user session isn't
  fully established yet when the update runs.
  
  ## Solution
  Modify the trigger function to extract first_name and last_name from the
  user's raw_user_meta_data field that Supabase automatically populates during
  signUp() when we pass metadata.
  
  ## Changes
  - Update trigger function to read from NEW.raw_user_meta_data
  - Use coalesce to fall back to placeholder values if metadata is missing
  - This makes the profile creation atomic with the auth user creation
*/

-- Update the function to use metadata from signup
CREATE OR REPLACE FUNCTION create_user_profile_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta_first_name text;
  meta_last_name text;
BEGIN
  -- Try to extract first_name and last_name from user metadata
  meta_first_name := COALESCE(
    NEW.raw_user_meta_data->>'first_name',
    'User'
  );
  
  meta_last_name := COALESCE(
    NEW.raw_user_meta_data->>'last_name',
    'Account'
  );

  -- Insert a new user profile with values from metadata or defaults
  INSERT INTO public.user_profiles (user_id, first_name, last_name)
  VALUES (NEW.id, meta_first_name, meta_last_name)
  ON CONFLICT (user_id) DO UPDATE
  SET 
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    updated_at = now();

  RETURN NEW;
END;
$$;

-- The trigger already exists, no need to recreate it
-- It will automatically use the updated function

COMMENT ON FUNCTION create_user_profile_on_signup() IS 'Automatically creates a user_profile record when a new user signs up, using metadata from signup form';
