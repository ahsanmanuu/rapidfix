-- Create Technician Analytics Table
CREATE TABLE IF NOT EXISTS technician_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE UNIQUE,
  efficiency_score DECIMAL(5,2) DEFAULT 0,
  safety_rating DECIMAL(3,2) DEFAULT 0,
  speed_score DECIMAL(5,2) DEFAULT 0,
  fvr_performance DECIMAL(5,2) DEFAULT 0, -- First Visit Resolution
  pending_value DECIMAL(10,2) DEFAULT 0,
  ai_suggestions JSONB DEFAULT '[]',
  peak_hours JSONB DEFAULT '{}',
  region_status JSONB DEFAULT '{}',
  growth_potential DECIMAL(5,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tech_analytics_tech_id ON technician_analytics(technician_id);

-- Enable RLS
ALTER TABLE technician_analytics ENABLE ROW LEVEL SECURITY;

-- Service role bypass
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Service role has full access' AND polrelid = 'technician_analytics'::regclass) THEN
        CREATE POLICY "Service role has full access" ON technician_analytics FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;
