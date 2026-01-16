-- RUN THIS SCRIPT TO FIX "Column does not exist" ERRORS
-- This script explicitly adds missing columns to existing tables.

-- 1. Fix Users Table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'latitude') THEN 
        ALTER TABLE public.users ADD COLUMN latitude float; 
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'longitude') THEN 
        ALTER TABLE public.users ADD COLUMN longitude float; 
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'fixed_address') THEN 
        ALTER TABLE public.users ADD COLUMN fixed_address text; 
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'membership_expiry') THEN 
        ALTER TABLE public.users ADD COLUMN membership_expiry timestamptz; 
    END IF;
END $$;

-- 2. Fix Technicians Table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'technicians' AND column_name = 'latitude') THEN 
        ALTER TABLE public.technicians ADD COLUMN latitude float; 
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'technicians' AND column_name = 'longitude') THEN 
        ALTER TABLE public.technicians ADD COLUMN longitude float; 
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'technicians' AND column_name = 'experience') THEN 
        ALTER TABLE public.technicians ADD COLUMN experience int default 0; 
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'technicians' AND column_name = 'base_address') THEN 
        ALTER TABLE public.technicians ADD COLUMN base_address text; 
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'technicians' AND column_name = 'address_details') THEN 
        ALTER TABLE public.technicians ADD COLUMN address_details text; 
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'technicians' AND column_name = 'registered_latitude') THEN 
        ALTER TABLE public.technicians ADD COLUMN registered_latitude float; 
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'technicians' AND column_name = 'registered_longitude') THEN 
        ALTER TABLE public.technicians ADD COLUMN registered_longitude float; 
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'technicians' AND column_name = 'documents') THEN 
        ALTER TABLE public.technicians ADD COLUMN documents jsonb; 
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'technicians' AND column_name = 'membership') THEN 
        ALTER TABLE public.technicians ADD COLUMN membership text; 
    END IF;
     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'technicians' AND column_name = 'total_jobs') THEN 
        ALTER TABLE public.technicians ADD COLUMN total_jobs int default 0; 
    END IF;
END $$;

-- 3. Fix Admins Table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admins' AND column_name = 'latitude') THEN 
        ALTER TABLE public.admins ADD COLUMN latitude float; 
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admins' AND column_name = 'longitude') THEN 
        ALTER TABLE public.admins ADD COLUMN longitude float; 
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admins' AND column_name = 'fixed_latitude') THEN 
        ALTER TABLE public.admins ADD COLUMN fixed_latitude float; 
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admins' AND column_name = 'fixed_longitude') THEN 
        ALTER TABLE public.admins ADD COLUMN fixed_longitude float; 
    END IF;
END $$;
