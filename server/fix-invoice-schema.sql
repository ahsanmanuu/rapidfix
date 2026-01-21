-- Ensure the invoices table has the updated_at column and it's handled correctly
-- 1. Add updated_at if missing
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Create the function (Outside DO block for simplicity and compatibility)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Add trigger to auto-update updated_at
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_invoices') THEN
        CREATE TRIGGER set_updated_at_invoices
        BEFORE UPDATE ON invoices
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
