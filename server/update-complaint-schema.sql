-- Update Complaints Table to support extended fields
-- Run this in your Supabase SQL Editor

ALTER TABLE complaints
ADD COLUMN IF NOT EXISTS subject TEXT,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General',
ADD COLUMN IF NOT EXISTS evidence JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS timeline JSONB DEFAULT '[]';

-- Optional: Create index for category
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
