/*
  # Remove Session Photos Functionality

  ## Overview
  This migration removes the session_photos table and all related functionality
  as photo storage is no longer needed for the application.

  ## Changes
  1. Drop RLS policies for session_photos table
  2. Drop session_photos table (CASCADE will handle foreign keys)

  ## Notes
  - This is a destructive operation - any existing photo records will be deleted
  - Photo files in Supabase Storage (if any) should be manually deleted from the dashboard
  - This change is part of GDPR compliance preparation
*/

-- Drop RLS policies for session_photos
DROP POLICY IF EXISTS "Authenticated users can view session photos" ON session_photos;
DROP POLICY IF EXISTS "Authenticated users can insert session photos" ON session_photos;
DROP POLICY IF EXISTS "Authenticated users can update session photos" ON session_photos;
DROP POLICY IF EXISTS "Authenticated users can delete session photos" ON session_photos;
DROP POLICY IF EXISTS "Users can view all session photos" ON session_photos;
DROP POLICY IF EXISTS "Users can insert session photos" ON session_photos;
DROP POLICY IF EXISTS "Users can update session photos" ON session_photos;
DROP POLICY IF EXISTS "Users can delete session photos" ON session_photos;

-- Drop the session_photos table
DROP TABLE IF EXISTS session_photos CASCADE;
