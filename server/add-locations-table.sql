-- Add missing locations table to Supabase
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  city TEXT,
  area TEXT,
  pincode TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_locations_user ON locations(user_id);
CREATE INDEX IF NOT EXISTS idx_locations_tech ON locations(technician_id);
CREATE INDEX IF NOT EXISTS idx_locations_created ON locations(created_at DESC);

-- RLS Policy
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access" ON locations
  FOR ALL USING (auth.role() = 'service_role');

SELECT 'Locations table created successfully!' as status;
