/*
  # Update Sessions Status Constraint

  1. Changes
    - Drop the old check constraint that only allowed: 'active', 'completed', 'ready'
    - Add new check constraint that allows all status values for different service types:
      - MTM: 'active', 'fitting', 'pickup', 'completed'
      - Bespoke: 'active', 'fitting_1', 'fitting_2', 'pickup', 'completed'
      - Alterations: 'active', 'fitting', 'pickup', 'completed'
      - Legacy support: 'ready' (backward compatibility)

  2. Security
    - No changes to RLS policies
    - Maintains data integrity with updated constraint

  3. Data Safety
    - Existing data remains valid (all current values are included in new constraint)
    - No data migration required
*/

-- Drop the old check constraint
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_status_check;

-- Add new check constraint with all valid status values
ALTER TABLE sessions ADD CONSTRAINT sessions_status_check 
  CHECK (status IN (
    'active', 
    'completed', 
    'ready',           -- Legacy support for backward compatibility
    'fitting',         -- MTM and Alterations fitting status
    'fitting_1',       -- Bespoke first fitting
    'fitting_2',       -- Bespoke second fitting
    'pickup'           -- Ready for pickup status
  ));
