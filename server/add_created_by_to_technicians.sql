-- Add created_by column to technicians table if it doesn't exist
-- We make it TEXT to support both UUIDs and Legacy IDs (timestamps)

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'technicians' AND column_name = 'created_by') THEN 
        ALTER TABLE public.technicians ADD COLUMN created_by text; 
    END IF;
END $$;
