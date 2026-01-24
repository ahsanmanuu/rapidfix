-- Add device_id column to sessions table
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS device_id TEXT;
