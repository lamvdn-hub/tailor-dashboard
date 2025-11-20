/*
  # Fix Delete User Account - Preserve Business Data
  
  ## Critical Fix
  This migration fixes the delete_user_account() function to ONLY delete user authentication
  and profile data, while preserving ALL business data (clients, sessions, fabrics, etc.)
  
  ## Changes
  - Replace the delete_user_account() function with a safe version
  - New function only deletes:
    * User's row from user_profiles table
    * User's row from auth.users table
  - Business data is completely preserved:
    * All clients remain accessible to other users
    * All sessions remain accessible to other users
    * All fabrics remain accessible to other users
    * All measurements remain accessible to other users
    * All tasks remain accessible to other users
    * All problems/queries remain accessible to other users
  
  ## Security
  - Function requires authenticated user
  - User can only delete their own account
  - Uses SECURITY DEFINER to access auth.users table
  - No CASCADE deletion of business data
  
  ## Multi-User Support
  This system is designed for multiple users to share and manage the same pool of
  business data (clients, sessions, fabrics, etc.). When one user deletes their account,
  other users should still be able to access and manage all business data.
  
  ## Notes
  - This is a CRITICAL fix to prevent data loss
  - Old function deleted ALL business data (WRONG)
  - New function only deletes user authentication and profile (CORRECT)
*/

-- Drop the old dangerous function
DROP FUNCTION IF EXISTS delete_user_account();

-- Create the new safe function
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the current authenticated user's ID
  current_user_id := auth.uid();

  -- Ensure user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete user profile only
  DELETE FROM user_profiles WHERE user_id = current_user_id;

  -- Delete user from auth.users only (this removes authentication and password)
  DELETE FROM auth.users WHERE id = current_user_id;

  -- Business data (clients, sessions, fabrics, measurements, tasks, problems) is NOT deleted
  -- and remains accessible to other users

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to delete account: %', SQLERRM;
    RETURN false;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;

-- Update comment to reflect correct behavior
COMMENT ON FUNCTION delete_user_account() IS 'Safely deletes only the user authentication and profile. Business data (clients, sessions, fabrics, etc.) is preserved and remains accessible to other users. Can only be called by authenticated users to delete their own account.';
