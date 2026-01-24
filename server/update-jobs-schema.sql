-- Add new columns to jobs table for Active Booking Panel
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS otp VARCHAR(10),
ADD COLUMN IF NOT EXISTS visiting_charges NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS spare_parts_cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_cost NUMERIC DEFAULT 0;

-- Ensure logic for total_cost calculation can be done in app, but column stores final snapshot
COMMENT ON COLUMN jobs.otp IS '4-digit OTP for job verification';
