-- Add Location Columns to Users Table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS fixed_address TEXT;

-- Add Location Columns to Technicians Table
ALTER TABLE public.technicians
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS base_address TEXT,
ADD COLUMN IF NOT EXISTS service_radius INTEGER DEFAULT 10; -- Radius in km

-- Add Location Columns to Admins Table (if it exists, or handling admins in users table)
-- If admins are just users with role='admin', the above users change covers it.
-- But if there is a specific admins table:
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT,
    office_address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
);

-- Enable PostGIS for distance calculations (Optional but recommended)
CREATE EXTENSION IF NOT EXISTS postgis;
