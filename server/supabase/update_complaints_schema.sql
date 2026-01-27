-- Migration to enhance complaints table for technician reporting
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES jobs(id) ON DELETE SET NULL;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS evidence JSONB DEFAULT '[]';
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS timeline JSONB DEFAULT '[]';
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS reported_by_role TEXT DEFAULT 'user';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_complaints_job_id ON complaints(job_id);
CREATE INDEX IF NOT EXISTS idx_complaints_reported_by_role ON complaints(reported_by_role);
