-- Add Stats Columns to Technicians Table
ALTER TABLE technicians 
ADD COLUMN IF NOT EXISTS total_jobs INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS accepted_jobs INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pending_jobs INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rejected_jobs INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS completed_jobs INTEGER DEFAULT 0;

-- Create Activity Logs Table for Live Feed
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Can be null for system wide? Or link to specific tech?
  technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE, -- Link to tech
  type TEXT NOT NULL, -- 'job_assigned', 'payment', 'system', etc.
  title TEXT NOT NULL,
  message TEXT,
  meta JSONB DEFAULT '{}', -- Store job_id, amount, etc.
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast feed retrieval
CREATE INDEX IF NOT EXISTS idx_activity_logs_tech ON activity_logs(technician_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Technicians can see their own logs
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Technicians can view own logs' AND polrelid = 'activity_logs'::regclass) THEN
        CREATE POLICY "Technicians can view own logs" ON activity_logs FOR SELECT USING (auth.uid() = technician_id);
    END IF;
    
    -- Service Role Access
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Service role has full access' AND polrelid = 'activity_logs'::regclass) THEN
        CREATE POLICY "Service role has full access" ON activity_logs FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;
