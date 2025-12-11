/*
  # Add Status Token for Customer Order Tracking

  1. New Columns
    - `status_token` (text, unique, not null) - Secure random token for public order status lookups

  2. Changes
    - Add status_token column with unique constraint
    - Create index for fast token lookups
    - Add trigger to auto-generate tokens for new sessions
    - Generate tokens for existing sessions that don't have one

  3. Security
    - Tokens are 24 characters long, URL-safe alphanumeric
    - Each token is unique across all sessions
    - No RLS changes needed - public endpoint will use service role for lookup
*/

-- Add status_token column (nullable first to add to existing records)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS status_token text;

-- Create function to generate secure random tokens
CREATE OR REPLACE FUNCTION generate_status_token()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..24 LOOP
    result := result || substr(chars, floor(random() * 62 + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Generate tokens for existing sessions without one
DO $$
DECLARE
  rec RECORD;
  new_token text;
  attempts integer;
BEGIN
  FOR rec IN SELECT id FROM sessions WHERE status_token IS NULL LOOP
    attempts := 0;
    LOOP
      new_token := generate_status_token();
      BEGIN
        UPDATE sessions SET status_token = new_token WHERE id = rec.id;
        EXIT;
      EXCEPTION WHEN unique_violation THEN
        attempts := attempts + 1;
        IF attempts > 10 THEN
          RAISE EXCEPTION 'Could not generate unique token after 10 attempts';
        END IF;
      END;
    END LOOP;
  END LOOP;
END $$;

-- Now make the column NOT NULL and add unique constraint
ALTER TABLE sessions ALTER COLUMN status_token SET NOT NULL;
ALTER TABLE sessions ADD CONSTRAINT sessions_status_token_unique UNIQUE (status_token);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_sessions_status_token ON sessions(status_token);

-- Create trigger to auto-generate tokens for new sessions
CREATE OR REPLACE FUNCTION auto_generate_status_token()
RETURNS TRIGGER AS $$
DECLARE
  new_token text;
  attempts integer := 0;
BEGIN
  IF NEW.status_token IS NULL THEN
    LOOP
      new_token := generate_status_token();
      BEGIN
        NEW.status_token := new_token;
        RETURN NEW;
      EXCEPTION WHEN unique_violation THEN
        attempts := attempts + 1;
        IF attempts > 10 THEN
          RAISE EXCEPTION 'Could not generate unique token after 10 attempts';
        END IF;
      END;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_generate_status_token ON sessions;
CREATE TRIGGER trigger_auto_generate_status_token
  BEFORE INSERT ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_status_token();
