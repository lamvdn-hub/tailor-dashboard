/*
  # Add Session Photos Support

  1. New Tables
    - `session_photos`
      - `id` (uuid, primary key)
      - `session_id` (uuid, references sessions table)
      - `file_path` (text, path in storage bucket)
      - `thumbnail_path` (text, path to thumbnail in storage)
      - `file_size` (integer, file size in bytes)
      - `uploaded_by` (uuid, references user_profiles)
      - `uploaded_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Storage
    - Create `session_photos` bucket for storing images
    - Configure bucket policies for authenticated access

  3. Security
    - Enable RLS on `session_photos` table
    - Add policies for authenticated users to manage photos
    - Add storage policies for secure file access

  4. Indexes
    - Index on session_id for fast photo lookups
    - Index on uploaded_by for permission checks
*/

-- Create session_photos table
CREATE TABLE IF NOT EXISTS session_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  thumbnail_path text NOT NULL,
  file_size integer NOT NULL,
  uploaded_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  uploaded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_photos_session_id ON session_photos(session_id);
CREATE INDEX IF NOT EXISTS idx_session_photos_uploaded_by ON session_photos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_session_photos_uploaded_at ON session_photos(uploaded_at);

-- Enable RLS
ALTER TABLE session_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for session_photos table

-- Authenticated users can view all photos
CREATE POLICY "Authenticated users can view session photos"
  ON session_photos
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert photos
CREATE POLICY "Authenticated users can upload session photos"
  ON session_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = uploaded_by
  );

-- Users can delete their own photos within 24 hours
CREATE POLICY "Users can delete own photos within 24h"
  ON session_photos
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = uploaded_by AND uploaded_at > now() - interval '24 hours'
  );

-- Create storage bucket for session photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'session_photos',
  'session_photos',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for session_photos bucket

-- Authenticated users can upload photos
CREATE POLICY "Authenticated users can upload session photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'session_photos'
  );

-- Authenticated users can view photos
CREATE POLICY "Authenticated users can view session photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'session_photos'
  );

-- Users can delete photos within 24 hours of upload
CREATE POLICY "Users can delete photos within 24h"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'session_photos'
    AND created_at > now() - interval '24 hours'
  );

-- Add helper function to get photo count for a session
CREATE OR REPLACE FUNCTION get_session_photo_count(session_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM session_photos
    WHERE session_id = session_uuid
  );
END;
$$;
