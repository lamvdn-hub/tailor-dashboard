/*
  # Fix Database Security Issues

  This migration addresses multiple security and performance issues identified in the database:

  ## 1. Missing Foreign Key Indexes
    - Add index on `measurements.measurement_definition_id` to cover the foreign key constraint
    - Add index on `sessions.fabric_id` to cover the foreign key constraint
    - These indexes improve query performance when joining tables or checking referential integrity

  ## 2. Remove Unused Indexes
    - Drop `idx_measurements_session_id` - unused index on measurements table
    - Drop `idx_measurements_section` - unused index on measurements table
    - Drop `idx_tasks_client_id` - unused index on tasks table
    - Drop `idx_tasks_status` - unused index on tasks table
    - Drop `idx_tasks_category` - unused index on tasks table
    - Drop `idx_tasks_priority` - unused index on tasks table
    - Removing unused indexes reduces storage overhead and improves write performance

  ## 3. Remove Duplicate RLS Policies
    - Drop duplicate SELECT policy on `measurement_definitions` table
    - Drop duplicate SELECT policy on `tasks` table
    - Multiple permissive policies for the same action can cause confusion and potential security issues

  ## 4. Fix Function Search Path Security
    - Update `update_tasks_updated_at` function to set explicit search_path
    - Update `is_email_whitelisted` function to set explicit search_path
    - This prevents potential security vulnerabilities from search_path manipulation

  ## Important Notes
    - All changes are designed to be non-breaking and safe to apply
    - Data integrity is maintained throughout all operations
    - Performance should improve after applying these changes
*/

-- 1. Add missing foreign key indexes
CREATE INDEX IF NOT EXISTS idx_measurements_measurement_definition_id 
  ON measurements(measurement_definition_id);

CREATE INDEX IF NOT EXISTS idx_sessions_fabric_id 
  ON sessions(fabric_id);

-- 2. Remove unused indexes (safe to drop - they are not being used)
DROP INDEX IF EXISTS idx_measurements_session_id;
DROP INDEX IF EXISTS idx_measurements_section;
DROP INDEX IF EXISTS idx_tasks_client_id;
DROP INDEX IF EXISTS idx_tasks_status;
DROP INDEX IF EXISTS idx_tasks_category;
DROP INDEX IF EXISTS idx_tasks_priority;

-- 3. Remove duplicate RLS policies
-- For measurement_definitions: Keep "Allow all users to read measurement definitions" (public role)
-- Remove "Authenticated users can view measurement definitions" (redundant - authenticated is subset of public)
DROP POLICY IF EXISTS "Authenticated users can view measurement definitions" ON measurement_definitions;

-- For tasks: Keep "Authenticated users can view all tasks"
-- Remove "Authenticated users can view tasks" (duplicate)
DROP POLICY IF EXISTS "Authenticated users can view tasks" ON tasks;

-- 4. Fix function search_path security issues
-- Recreate update_tasks_updated_at with explicit search_path
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  
  -- Automatically set completed_at when status changes to Completed
  IF NEW.status = 'Completed' AND OLD.status != 'Completed' THEN
    NEW.completed_at = now();
  END IF;
  
  -- Clear completed_at when status changes back to Pending
  IF NEW.status = 'Pending' AND OLD.status = 'Completed' THEN
    NEW.completed_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate is_email_whitelisted with explicit search_path
CREATE OR REPLACE FUNCTION is_email_whitelisted(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM email_whitelist WHERE email = user_email
  );
END;
$$;