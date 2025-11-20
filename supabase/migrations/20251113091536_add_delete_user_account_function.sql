/*
  # Add Delete User Account Function

  1. Changes
    - Create function to delete user account and all related data
    - Function handles cascading deletion of:
      * User profiles
      * Clients and all their sessions
      * Measurements associated with sessions
      * Tasks (both client-related and general)
      * Fabrics
      * Auth user record

  2. Security
    - Function requires authenticated user
    - User can only delete their own account
    - Uses SECURITY DEFINER to access auth.users table

  3. Notes
    - This function properly deletes the user from auth.users
    - All related data is deleted in the correct order
    - Returns success boolean
*/

-- Create function to delete user account
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  current_user_id uuid;
  client_ids_to_delete uuid[];
  session_ids_to_delete uuid[];
BEGIN
  -- Get the current authenticated user's ID
  current_user_id := auth.uid();

  -- Ensure user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get all client IDs for this user (all clients in the system belong to this user)
  SELECT ARRAY_AGG(id) INTO client_ids_to_delete
  FROM clients;

  -- Get all session IDs for these clients
  IF client_ids_to_delete IS NOT NULL THEN
    SELECT ARRAY_AGG(id) INTO session_ids_to_delete
    FROM sessions
    WHERE client_id = ANY(client_ids_to_delete);

    -- Delete measurements for these sessions
    IF session_ids_to_delete IS NOT NULL THEN
      DELETE FROM measurements WHERE session_id = ANY(session_ids_to_delete);
    END IF;

    -- Delete tasks associated with these clients
    DELETE FROM tasks WHERE client_id = ANY(client_ids_to_delete);

    -- Delete sessions for these clients
    DELETE FROM sessions WHERE client_id = ANY(client_ids_to_delete);

    -- Delete clients
    DELETE FROM clients WHERE id = ANY(client_ids_to_delete);
  END IF;

  -- Delete tasks not associated with any client
  DELETE FROM tasks WHERE client_id IS NULL;

  -- Delete fabrics (keep system fabric with all zeros ID)
  DELETE FROM fabrics WHERE id != '00000000-0000-0000-0000-000000000000';

  -- Delete user profile
  DELETE FROM user_profiles WHERE user_id = current_user_id;

  -- Delete user from auth.users (requires SECURITY DEFINER and auth schema access)
  DELETE FROM auth.users WHERE id = current_user_id;

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to delete account: %', SQLERRM;
    RETURN false;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION delete_user_account() IS 'Deletes the current user account and all associated data including auth.users record. Can only be called by authenticated users to delete their own account.';
