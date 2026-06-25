-- Add recurrence_rule column to tasks table
ALTER TABLE tasks ADD COLUMN recurrence_rule JSONB DEFAULT NULL;
