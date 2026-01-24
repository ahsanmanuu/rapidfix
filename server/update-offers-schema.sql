-- Core Fields (might be missing in some setups)
ALTER TABLE offers ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE offers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS discount_type VARCHAR(50) DEFAULT 'percentage';
ALTER TABLE offers ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10,2) DEFAULT 0;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS badge_text VARCHAR(255);
ALTER TABLE offers ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Job Bid Fields
ALTER TABLE offers ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE offers ADD COLUMN IF NOT EXISTS job_type VARCHAR(255);
ALTER TABLE offers ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);

-- Fix Foreign Key: Drop old strict auth constraint and point to public.users or allow loose link
ALTER TABLE offers DROP CONSTRAINT IF EXISTS offers_user_id_fkey;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id); 
-- Note: If column exists, the above line won't add FK. We need explicit add constraint if missing.
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'offers_user_id_fkey') THEN 
    ALTER TABLE offers ADD CONSTRAINT offers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id); 
  END IF; 
END $$;

ALTER TABLE offers ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'open'; -- open, accepted, expired, rejected
ALTER TABLE offers ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'job_bid'; -- coupon, job_bid
