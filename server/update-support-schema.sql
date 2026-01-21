-- Create support_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS support_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    agent_id UUID, -- Nullable, assigned later
    status TEXT DEFAULT 'active', -- active, closed
    messages JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_support_sessions_user ON support_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_support_sessions_status ON support_sessions(status);
