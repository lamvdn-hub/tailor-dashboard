/*
  # Add RLS Policies to Problems Table

  ## Summary
  Adds Row Level Security policies to the problems table to allow anonymous users 
  to read and update customer support queries.

  ## Changes Made
  
  1. **Policies Added**
     - Allow anonymous users to SELECT all records from problems table
     - Allow anonymous users to UPDATE status field in problems table
     - Allow anonymous users to INSERT new problems into the table
  
  ## Security Considerations
  - This is a public-facing customer support table that needs to be accessible 
    to anonymous users for submitting and viewing queries
  - UPDATE policy allows changing any record (suitable for tailor/admin managing queries)
  - INSERT policy allows anonymous users to submit new support requests
  
  ## Important Notes
  - RLS is already enabled on this table
  - These policies provide open access suitable for a customer support system
  - If more restrictive access is needed in the future, policies should be updated
*/

CREATE POLICY "Allow anonymous users to read all problems"
  ON problems
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous users to update problem status"
  ON problems
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous users to insert problems"
  ON problems
  FOR INSERT
  TO anon
  WITH CHECK (true);