-- Create Finance Table if not exists
CREATE TABLE IF NOT EXISTS finance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- Link to users table
  associated_id TEXT, -- e.g., Job ID
  type TEXT CHECK (type IN ('credit', 'debit')),
  amount NUMERIC NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure columns exist (Safely add if missing)
-- This fixes the "Could not find associated_id" error if the table existed previously
ALTER TABLE finance ADD COLUMN IF NOT EXISTS associated_id TEXT;
ALTER TABLE finance ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE finance ADD COLUMN IF NOT EXISTS amount NUMERIC;
ALTER TABLE finance ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE finance ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';

-- Fix constraints if needed
-- ALTER TABLE finance DROP CONSTRAINT IF EXISTS finance_type_check;
-- ALTER TABLE finance ADD CONSTRAINT finance_type_check CHECK (type IN ('credit', 'debit'));
