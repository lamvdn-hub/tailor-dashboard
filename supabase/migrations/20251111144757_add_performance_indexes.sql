/*
  # Add Performance Indexes for Faster Queries

  ## Description
  This migration adds database indexes to optimize common query patterns and improve page load speeds.

  ## Changes Made

  1. **Sessions Table Indexes**
     - Index on `status` column - Speeds up filtering by session status (active, ready, completed)
     - Index on `created_at` column - Speeds up ordering and date range queries
     - Composite index on `(status, created_at)` - Optimizes combined status+date queries

  2. **Clients Table Indexes**
     - Index on `name` column - Speeds up client name ordering and searches

  3. **Measurements Table Indexes**
     - Index on `session_id` - Speeds up measurement lookups for sessions

  4. **Tasks Table Indexes**
     - Index on `status` column - Speeds up filtering tasks by status
     - Index on `due_date` column - Speeds up date-based task queries
     - Index on `client_id` - Speeds up client-related task lookups

  ## Performance Impact
  These indexes will significantly improve:
  - Dashboard load time (status counts and recent sessions)
  - Clients page load time (name sorting)
  - Session detail pages (measurement loading)
  - Tasks page performance (status and date filtering)
*/

-- Sessions table indexes
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_status_created_at ON sessions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_client_id ON sessions(client_id);

-- Clients table indexes
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);

-- Measurements table indexes
CREATE INDEX IF NOT EXISTS idx_measurements_session_id ON measurements(session_id);

-- Tasks table indexes
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);
