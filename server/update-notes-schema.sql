-- Add professional_note column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='professional_note') THEN
        ALTER TABLE jobs ADD COLUMN professional_note TEXT DEFAULT '';
    END IF;
END $$;

-- Ensure description column exists (Customer Note)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='description') THEN
        ALTER TABLE jobs ADD COLUMN description TEXT DEFAULT '';
    END IF;
END $$;
