-- Fix: Create missing 'locations' table
-- This table is used by LocationManager to store both:
-- 1. Supported Service Areas (City, Area, Pincode)
-- 2. Real-time User/Technician Location History

CREATE TABLE IF NOT EXISTS public.locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Service Location Data (Nullable, used for service area definitions)
    city TEXT,
    area TEXT,
    pincode TEXT,
    active BOOLEAN DEFAULT TRUE,
    
    -- Realtime Tracking Data (Nullable, used for location history logs)
    user_id UUID REFERENCES auth.users(id),
    technician_id UUID REFERENCES public.technicians(id),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
);

-- Enable RLS (Row Level Security) if not already enabled, optionally allowing public access for now
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read/write for all (for development simplicity, tighten later)
CREATE POLICY "Enable all access for all users" ON public.locations
FOR ALL USING (true) WITH CHECK (true);
