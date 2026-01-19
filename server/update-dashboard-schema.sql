-- Update Schema for Dashboard Real-time Features

-- 1. Update Offers Table
ALTER TABLE offers
ADD COLUMN IF NOT EXISTS code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'percentage',
ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10,2);

-- 2. Update Complaints Table
ALTER TABLE complaints
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS timeline JSONB DEFAULT '[]'::jsonb;

-- 3. Create Support Sessions Table (for User <-> Agent Support)
CREATE TABLE IF NOT EXISTS support_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  legacy_id TEXT UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES admins(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active',
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_user ON support_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_support_status ON support_sessions(status);

-- 4. Trigger for Support Sessions updated_at
DROP TRIGGER IF EXISTS update_support_sessions_updated_at ON support_sessions;
CREATE TRIGGER update_support_sessions_updated_at BEFORE UPDATE ON support_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE support_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access" ON support_sessions
  FOR ALL USING (auth.role() = 'service_role');
