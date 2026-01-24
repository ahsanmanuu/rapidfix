-- Update Feedbacks Table to support individual rating metrics
-- Run this in your Supabase SQL Editor

ALTER TABLE feedbacks
ADD COLUMN IF NOT EXISTS recommendation_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS timeliness INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS expertise INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS professionalism INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS knowledge INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS behavior INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS honesty INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS respect INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS overall INTEGER DEFAULT 0;

-- Optional: Create index for analytics if needed
CREATE INDEX IF NOT EXISTS idx_feedbacks_overall ON feedbacks(overall);
