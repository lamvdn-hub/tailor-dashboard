/*
  # Create Tasks/To-Do Management System

  ## Overview
  This migration creates a comprehensive task management system for tracking client-related
  tasks, appointments, and to-dos with proper categorization and priority management.

  ## Schema Changes

  ### 1. New Table: tasks
  Creates the main tasks table with these columns:
  - `id` (uuid, primary key) - Unique task identifier
  - `description` (text, required) - Task description/title
  - `client_id` (uuid, optional) - Reference to clients table
  - `session_id` (uuid, optional) - Reference to sessions table
  - `category` (text, required) - Task category: Alteration, Fitting, Pickup, Order, Admin
  - `due_date` (date, required) - When the task is due
  - `priority` (text, required) - Priority level: Low, Medium, High (default: Medium)
  - `status` (text, required) - Task status: Pending, Completed (default: Pending)
  - `notes` (text, optional) - Additional task notes
  - `completed_at` (timestamptz, optional) - When the task was completed
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. Indexes
  - Index on client_id for efficient client filtering
  - Index on session_id for efficient session filtering
  - Index on due_date for sorting and filtering
  - Index on status for filtering completed/pending tasks
  - Index on category for category-based filtering

  ### 3. Security (RLS)
  - Enable Row Level Security on tasks table
  - Policy: Authenticated users can view all tasks
  - Policy: Authenticated users can insert new tasks
  - Policy: Authenticated users can update existing tasks
  - Policy: Authenticated users can delete tasks

  ## Data Integrity
  - Foreign key constraints ensure tasks link to valid clients and sessions
  - CHECK constraints ensure valid values for category, priority, and status
  - Triggers automatically update the updated_at timestamp
  - ON DELETE CASCADE removes tasks when client/session is deleted

  ## Notes
  1. Tasks can exist without client or session associations (general tasks)
  2. Due date defaults to current date when creating tasks
  3. Completed tasks automatically set completed_at timestamp
  4. Priority defaults to Medium for balanced task management
*/

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('Alteration', 'Fitting', 'Pickup', 'Order', 'Admin')),
  due_date date NOT NULL DEFAULT CURRENT_DATE,
  priority text NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed')),
  notes text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_session_id ON tasks(session_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_tasks_updated_at();

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Authenticated users can view all tasks
CREATE POLICY "Authenticated users can view all tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policy: Anonymous users can view all tasks (for demo purposes)
CREATE POLICY "Anonymous users can view all tasks"
  ON tasks
  FOR SELECT
  TO anon
  USING (true);

-- RLS Policy: Authenticated users can insert tasks
CREATE POLICY "Authenticated users can insert tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policy: Anonymous users can insert tasks (for demo purposes)
CREATE POLICY "Anonymous users can insert tasks"
  ON tasks
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- RLS Policy: Authenticated users can update tasks
CREATE POLICY "Authenticated users can update tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policy: Anonymous users can update tasks (for demo purposes)
CREATE POLICY "Anonymous users can update tasks"
  ON tasks
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- RLS Policy: Authenticated users can delete tasks
CREATE POLICY "Authenticated users can delete tasks"
  ON tasks
  FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policy: Anonymous users can delete tasks (for demo purposes)
CREATE POLICY "Anonymous users can delete tasks"
  ON tasks
  FOR DELETE
  TO anon
  USING (true);

-- Add helpful comments
COMMENT ON TABLE tasks IS 'Task management for tracking client appointments, alterations, pickups, and administrative tasks';
COMMENT ON COLUMN tasks.description IS 'Brief description of the task';
COMMENT ON COLUMN tasks.client_id IS 'Optional reference to associated client';
COMMENT ON COLUMN tasks.session_id IS 'Optional reference to associated fitting session';
COMMENT ON COLUMN tasks.category IS 'Task category: Alteration, Fitting, Pickup, Order, or Admin';
COMMENT ON COLUMN tasks.due_date IS 'Date when the task is due';
COMMENT ON COLUMN tasks.priority IS 'Priority level: Low, Medium, or High';
COMMENT ON COLUMN tasks.status IS 'Current status: Pending or Completed';
COMMENT ON COLUMN tasks.notes IS 'Additional notes or details about the task';
COMMENT ON COLUMN tasks.completed_at IS 'Timestamp when the task was completed (auto-set when status changes to Completed)';
