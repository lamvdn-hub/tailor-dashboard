/*
  # Fix Security and Performance Issues

  1. Performance Improvements
    - Add missing index on tasks.client_id foreign key
    - Add index on tasks.session_id foreign key
    - Optimize RLS policies to use subqueries for auth.uid()
    - Set proper search_path for functions
    
  2. Security Enhancements
    - Fix RLS policies to prevent per-row auth function calls
    - Update function security settings with proper search_path
    
  3. Notes
    - Existing indexes are kept as they improve query performance
    - All auth function calls in RLS policies now use subqueries
*/

-- Add missing index on tasks.client_id foreign key
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);

-- Add index on tasks.session_id for better join performance
CREATE INDEX IF NOT EXISTS idx_tasks_session_id ON tasks(session_id);

-- Optimize user_profiles RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Create optimized RLS policies with subqueries
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Fix function search path by dropping trigger first, then function, then recreating both
DROP TRIGGER IF EXISTS set_user_profiles_updated_at ON user_profiles;
DROP FUNCTION IF EXISTS update_user_profiles_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate trigger with the fixed function
CREATE TRIGGER set_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- Add helpful comments about indexes
COMMENT ON INDEX idx_tasks_client_id IS 'Index for foreign key lookups and joins with clients table';
COMMENT ON INDEX idx_tasks_session_id IS 'Index for foreign key lookups and joins with sessions table';
COMMENT ON INDEX idx_user_profiles_user_id IS 'Index for fast user profile lookups by user_id';
COMMENT ON INDEX idx_measurements_measurement_definition_id IS 'Index for joins with measurement_definitions table';
COMMENT ON INDEX idx_sessions_fabric_id IS 'Index for joins with fabrics table';
