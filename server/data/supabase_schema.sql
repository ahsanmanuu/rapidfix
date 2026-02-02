-- Enable PostGIS for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- -----------------------------------------------------------------------------
-- 1. BASE TABLES (Enhancements)
-- -----------------------------------------------------------------------------
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS agreement_accepted INT DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS visiting_charges INT DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS offer_price INT DEFAULT 0;

-- -----------------------------------------------------------------------------
-- 2. TECHNICIANS TABLE (Enhancements)
-- -----------------------------------------------------------------------------
-- Ensure technicians has necessary tracking columns
ALTER TABLE technicians 
ADD COLUMN IF NOT EXISTS rejection_count_month INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available', -- available, engaged, finishing_work, offline
ADD COLUMN IF NOT EXISTS current_job_id UUID REFERENCES jobs(id),
ADD COLUMN IF NOT EXISTS membership_tier TEXT DEFAULT 'Free'; -- Free, Premium

-- [NEW] Testimonials Table (Missing)
CREATE TABLE IF NOT EXISTS testimonials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    technician_id UUID REFERENCES technicians(id) ON DELETE SET NULL,
    rating INT,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    active BOOLEAN DEFAULT TRUE
);

-- [NEW] Feedbacks Table (for specific job ratings)
CREATE TABLE IF NOT EXISTS feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    technician_id UUID REFERENCES technicians(id),
    job_id UUID REFERENCES jobs(id),
    ratings JSONB DEFAULT '{}', -- stores detailed breakdown
    timeliness INT DEFAULT 0,
    expertise INT DEFAULT 0,
    professionalism INT DEFAULT 0,
    knowledge INT DEFAULT 0,
    behavior INT DEFAULT 0,
    honesty INT DEFAULT 0,
    respect INT DEFAULT 0,
    overall INT DEFAULT 0,
    comment TEXT,
    recommendation_score INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS Policies for Feedbacks
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for authenticated users only" ON "public"."feedbacks"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON "public"."feedbacks"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

-- [NEW] Locations Table (Missing - for Live Tracking History)
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    city TEXT,
    area TEXT,
    pincode TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure at least one ID is present
    CONSTRAINT locations_owner_check CHECK (user_id IS NOT NULL OR technician_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_locations_user_id ON locations(user_id);
CREATE INDEX IF NOT EXISTS idx_locations_technician_id ON locations(technician_id);

-- [FIX] Use a separate column for geospatial index to avoid conflict with existing 'location' (JSONB)
ALTER TABLE technicians 
ADD COLUMN IF NOT EXISTS geo_location GEOGRAPHY(POINT, 4326);

-- [MIGRATION] Backfill geo_location from existing JSONB 'location' if available
-- Casts json strings to float. Handles potential nulls safely.
UPDATE technicians 
SET geo_location = ST_SetSRID(ST_MakePoint(
    CAST(location->>'longitude' AS FLOAT), 
    CAST(location->>'latitude' AS FLOAT)
), 4326)
WHERE geo_location IS NULL 
  AND location IS NOT NULL 
  AND location->>'longitude' IS NOT NULL 
  AND location->>'latitude' IS NOT NULL;

-- Index for geospatial search (CRITICAL for 30km radius speed)
-- Now indexing the GEOGRAPHY column, which supports GIST.
CREATE INDEX IF NOT EXISTS idx_technicians_geo_location ON technicians USING GIST (geo_location);

-- -----------------------------------------------------------------------------
-- 2. JOB QUEUES TABLE (New - Flow 4)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS job_queues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending', -- pending, accepted, expired
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(job_id, technician_id)
);

CREATE INDEX IF NOT EXISTS idx_queue_tech_status ON job_queues(technician_id, status);
CREATE INDEX IF NOT EXISTS idx_queue_created_at ON job_queues(created_at ASC);

-- -----------------------------------------------------------------------------
-- 3. EDGE FUNCTION: check_market_cap_eligibility (Flow 1 - Condition C)
-- -----------------------------------------------------------------------------
-- Returns true if technician is allowed to take a job based on the 20% cap rule
CREATE OR REPLACE FUNCTION check_market_cap_eligibility(
    tech_id UUID, 
    region_lat FLOAT, 
    region_lng FLOAT
) 
RETURNS BOOLEAN 
LANGUAGE sql 
AS $$
WITH tech_status AS (
    SELECT membership_tier = 'Premium' AS is_premium FROM technicians WHERE id = tech_id
),
tech_jobs AS (
    SELECT COUNT(*) AS count FROM jobs 
    WHERE technician_id = tech_id 
    AND created_at >= date_trunc('month', CURRENT_DATE)
),
region_jobs AS (
    SELECT COUNT(*) AS count 
    FROM jobs 
    WHERE location IS NOT NULL
    AND ST_DWithin(
        ST_SetSRID(ST_MakePoint(CAST(location->>'longitude' AS FLOAT), CAST(location->>'latitude' AS FLOAT)), 4326),
        ST_SetSRID(ST_MakePoint(region_lng, region_lat), 4326), 
        30000
    )
    AND created_at >= date_trunc('month', CURRENT_DATE)
)
SELECT 
    CASE 
        WHEN COALESCE((SELECT is_premium FROM tech_status), FALSE) THEN TRUE
        WHEN (SELECT count FROM region_jobs) < 10 THEN TRUE
        WHEN (SELECT count FROM tech_jobs) < CEIL((SELECT count FROM region_jobs) * 0.20) THEN TRUE
        ELSE FALSE
    END;
$$;

-- -----------------------------------------------------------------------------
-- 4. FINANCE & WALLET TABLES (Missing - Fixes Wallet Issues)
-- -----------------------------------------------------------------------------

-- Finance / Transactions Table
CREATE TABLE IF NOT EXISTS finance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    technician_id UUID REFERENCES technicians(id),
    associated_id TEXT, -- e.g. Job ID or 'SYSTEM'
    type TEXT CHECK (type IN ('credit', 'debit')),
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    description TEXT,
    category TEXT, -- 'Job Fees', 'Tips', 'Bonuses', 'Supplies', 'Withdrawal', 'Refunds'
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_user ON finance(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_tech ON finance(technician_id);

-- Bank Accounts
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    ifsc_code TEXT NOT NULL,
    account_holder_name TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Withdrawals
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
    bank_account_id UUID REFERENCES bank_accounts(id),
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, processing, completed, rejected
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Wallet Pots (Savings/Tax)
CREATE TABLE IF NOT EXISTS wallet_pots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount DECIMAL(10, 2) DEFAULT 0,
    current_amount DECIMAL(10, 2) DEFAULT 0,
    color TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Technician Finance Analytics
CREATE TABLE IF NOT EXISTS technician_finance_analytics (
    technician_id UUID PRIMARY KEY REFERENCES technicians(id) ON DELETE CASCADE,
    tax_estimation DECIMAL(10, 2) DEFAULT 0,
    tax_message TEXT,
    savings_goal DECIMAL(10, 2) DEFAULT 0,
    savings_message TEXT,
    peak_insight TEXT,
    health_score INT DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);
