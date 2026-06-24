-- Add completed column to time_blocks table
ALTER TABLE time_blocks ADD COLUMN completed BOOLEAN DEFAULT false;
