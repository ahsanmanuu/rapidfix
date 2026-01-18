-- Enable PostGIS for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- -----------------------------------------------------------------------------
-- 1. BASE TABLES (Enhancements)
-- -----------------------------------------------------------------------------
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS agreement_accepted INT DEFAULT 0;

-- -----------------------------------------------------------------------------
-- 2. TECHNICIANS TABLE (Enhancements)
-- -----------------------------------------------------------------------------
-- Ensure technicians has necessary tracking columns
ALTER TABLE technicians 
ADD COLUMN IF NOT EXISTS rejection_count_month INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available', -- available, engaged, finishing_work, offline
ADD COLUMN IF NOT EXISTS current_job_id UUID REFERENCES jobs(id),
ADD COLUMN IF NOT EXISTS membership_tier TEXT DEFAULT 'Free'; -- Free, Premium

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
AS '
WITH tech_status AS (
    SELECT membership_tier = ''Premium'' AS is_premium FROM technicians WHERE id = tech_id
),
tech_jobs AS (
    SELECT COUNT(*) AS count FROM jobs 
    WHERE technician_id = tech_id 
    AND created_at >= date_trunc(''month'', CURRENT_DATE)
),
region_jobs AS (
    SELECT COUNT(*) AS count 
    FROM jobs 
    WHERE location IS NOT NULL
    AND ST_DWithin(
        ST_SetSRID(ST_MakePoint(CAST(location->>''longitude'' AS FLOAT), CAST(location->>''latitude'' AS FLOAT)), 4326),
        ST_SetSRID(ST_MakePoint(region_lng, region_lat), 4326), 
        30000
    )
    AND created_at >= date_trunc(''month'', CURRENT_DATE)
)
SELECT 
    CASE 
        WHEN COALESCE((SELECT is_premium FROM tech_status), FALSE) THEN TRUE
        WHEN (SELECT count FROM region_jobs) < 10 THEN TRUE
        WHEN (SELECT count FROM tech_jobs) < CEIL((SELECT count FROM region_jobs) * 0.20) THEN TRUE
        ELSE FALSE
    END
';
