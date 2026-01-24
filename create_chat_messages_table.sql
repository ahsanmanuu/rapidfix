-- Create a new table for individual chat messages to support the ChatManager logic
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  sender_id UUID NOT NULL, -- Generic UUID to support User or Technician
  receiver_id UUID NOT NULL,
  sender_name TEXT,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver ON chat_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_job ON chat_messages(job_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);

-- Add RLS Policies
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Service role has full access' AND polrelid = 'chat_messages'::regclass) THEN
        CREATE POLICY "Service role has full access" ON chat_messages FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;
