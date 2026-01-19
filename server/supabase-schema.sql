-- Fixofy Database Schema for Supabase
-- Run this in your Supabase SQL Editor after creating a new project

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE TABLES
-- ============================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  legacy_id TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  photo TEXT,
  status TEXT DEFAULT 'Active',
  membership TEXT DEFAULT 'Free',
  membership_expiry TIMESTAMPTZ,
  location JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_membership ON users(membership);

-- 2. Technicians Table
CREATE TABLE IF NOT EXISTS technicians (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  legacy_id TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password TEXT NOT NULL,
  service_type TEXT NOT NULL,
  experience INTEGER,
  location JSONB,
  address_details JSONB,
  documents JSONB,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'available',
  membership TEXT DEFAULT 'free',
  membership_since TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_technicians_email ON technicians(email);
CREATE INDEX IF NOT EXISTS idx_technicians_service_type ON technicians(service_type);
CREATE INDEX IF NOT EXISTS idx_technicians_status ON technicians(status);
CREATE INDEX IF NOT EXISTS idx_technicians_location ON technicians USING GIN(location);

-- 3. Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  legacy_id TEXT UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES technicians(id) ON DELETE SET NULL,
  service_type TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  address TEXT NOT NULL,
  location JSONB,
  description TEXT,
  offer_price DECIMAL(10,2),
  visiting_charges DECIMAL(10,2),
  agreement_accepted BOOLEAN DEFAULT FALSE,
  professional_note TEXT,
  timeline JSONB DEFAULT '[]',
  total_cost DECIMAL(10,2),
  feedback_given BOOLEAN DEFAULT FALSE,
  otp TEXT,
  scheduled_date DATE,
  scheduled_time TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_technician_id ON jobs(technician_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_service_type ON jobs(service_type);

-- 4. Feedbacks Table
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  legacy_id TEXT UNIQUE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ratings JSONB NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_technician ON feedbacks(technician_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_job ON feedbacks(job_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_user ON feedbacks(user_id);

-- 5. Finance Table
CREATE TABLE IF NOT EXISTS finance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  legacy_id TEXT UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES technicians(id) ON DELETE SET NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  wallet_balance DECIMAL(10,2),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_user_id ON finance(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_technician_id ON finance(technician_id);
CREATE INDEX IF NOT EXISTS idx_finance_type ON finance(type);

-- 6. Rides Table
CREATE TABLE IF NOT EXISTS rides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  legacy_id TEXT UNIQUE,
  technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  start_location JSONB,
  end_location JSONB,
  distance DECIMAL(10,2),
  status TEXT DEFAULT 'in_progress',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_rides_technician ON rides(technician_id);
CREATE INDEX IF NOT EXISTS idx_rides_job ON rides(job_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);

-- 7. Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  legacy_id TEXT UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- 8. Complaints Table
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  legacy_id TEXT UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES technicians(id) ON DELETE SET NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_user ON complaints(user_id);

-- 9. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  legacy_id TEXT UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- 10. Offers Table
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  legacy_id TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  discount_percentage INTEGER,
  valid_until TIMESTAMPTZ,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offers_active ON offers(active);
CREATE INDEX IF NOT EXISTS idx_offers_valid ON offers(valid_until);

-- 11. Admins Table
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  legacy_id TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);

-- 12. Chats Table
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  legacy_id TEXT UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
  messages JSONB[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chats_user ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_tech ON chats(technician_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_technicians_updated_at') THEN
        CREATE TRIGGER update_technicians_updated_at BEFORE UPDATE ON technicians
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_jobs_updated_at') THEN
        CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_chats_updated_at') THEN
        CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- Service role bypass (for backend operations)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Service role has full access' AND polrelid = 'users'::regclass) THEN
        CREATE POLICY "Service role has full access" ON users FOR ALL USING (auth.role() = 'service_role');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Service role has full access' AND polrelid = 'technicians'::regclass) THEN
        CREATE POLICY "Service role has full access" ON technicians FOR ALL USING (auth.role() = 'service_role');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Service role has full access' AND polrelid = 'jobs'::regclass) THEN
        CREATE POLICY "Service role has full access" ON jobs FOR ALL USING (auth.role() = 'service_role');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Service role has full access' AND polrelid = 'feedbacks'::regclass) THEN
        CREATE POLICY "Service role has full access" ON feedbacks FOR ALL USING (auth.role() = 'service_role');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Service role has full access' AND polrelid = 'finance'::regclass) THEN
        CREATE POLICY "Service role has full access" ON finance FOR ALL USING (auth.role() = 'service_role');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Service role has full access' AND polrelid = 'rides'::regclass) THEN
        CREATE POLICY "Service role has full access" ON rides FOR ALL USING (auth.role() = 'service_role');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Service role has full access' AND polrelid = 'sessions'::regclass) THEN
        CREATE POLICY "Service role has full access" ON sessions FOR ALL USING (auth.role() = 'service_role');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Service role has full access' AND polrelid = 'complaints'::regclass) THEN
        CREATE POLICY "Service role has full access" ON complaints FOR ALL USING (auth.role() = 'service_role');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Service role has full access' AND polrelid = 'notifications'::regclass) THEN
        CREATE POLICY "Service role has full access" ON notifications FOR ALL USING (auth.role() = 'service_role');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Service role has full access' AND polrelid = 'offers'::regclass) THEN
        CREATE POLICY "Service role has full access" ON offers FOR ALL USING (auth.role() = 'service_role');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Service role has full access' AND polrelid = 'admins'::regclass) THEN
        CREATE POLICY "Service role has full access" ON admins FOR ALL USING (auth.role() = 'service_role');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Service role has full access' AND polrelid = 'chats'::regclass) THEN
        CREATE POLICY "Service role has full access" ON chats FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;
