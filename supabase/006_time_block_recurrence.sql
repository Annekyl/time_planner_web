-- Add recurrence_rule column to time_blocks table
ALTER TABLE time_blocks ADD COLUMN recurrence_rule JSONB DEFAULT NULL;
