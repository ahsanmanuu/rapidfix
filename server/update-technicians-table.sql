-- Add registered_latitude and registered_longitude columns to technicians table
-- Run this in Supabase SQL Editor

ALTER TABLE technicians 
ADD COLUMN IF NOT EXISTS registered_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS registered_longitude DECIMAL(11, 8);

-- Optionally backfill registered columns with existing latitude/longitude if they exist
-- (Only if latitude/longitude were already columns, otherwise from location JSON but that's harder in SQL)
-- Assuming latitude/longitude columns might already exist or we need to create them too if we are moving away from JSON only.

ALTER TABLE technicians
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

SELECT 'Technicians table updated successfully!' as status;
