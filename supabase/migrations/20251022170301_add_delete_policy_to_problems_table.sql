/*
  # Add DELETE Policy to Problems Table

  ## Summary
  Adds missing DELETE policy to the problems table to allow anonymous users to delete customer queries.
  This fixes a bug where deletions appeared to work in the UI but didn't persist to the database.

  ## Problem Fixed
  The problems table had RLS policies for SELECT, INSERT, and UPDATE operations, but was missing
  a DELETE policy. This caused delete operations to silently fail despite the UI updating optimistically.

  ## Changes Made
  
  1. **New Policy Added**
     - `Allow anonymous users to delete problems` - Permits anonymous users to delete any query record
  
  ## Security Considerations
  - This maintains consistency with existing policies (SELECT, INSERT, UPDATE) which all allow anonymous access
  - Suitable for a customer support/tailor management system where staff need full CRUD access
  - The `anon` role is used since this is a public-facing tailor business application
  
  ## Testing Steps
  1. Verify the policy was created successfully
  2. Test deletion from the Queries page UI
  3. Refresh the page to confirm the deleted query doesn't reappear
*/

-- Add DELETE policy for anonymous users
CREATE POLICY "Allow anonymous users to delete problems"
  ON problems
  FOR DELETE
  TO anon
  USING (true);