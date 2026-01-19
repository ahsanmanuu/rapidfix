-- Add feedback_given column to jobs table to track if a user has already rated a job
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS feedback_given BOOLEAN DEFAULT FALSE;

-- Create index for faster lookup on feedback status
CREATE INDEX IF NOT EXISTS idx_jobs_feedback_given ON jobs(feedback_given);
