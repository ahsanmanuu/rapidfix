CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'issued'
);

-- Add index for fast retrieval
CREATE INDEX IF NOT EXISTS idx_invoices_job_id ON invoices(job_id);

-- Add column to jobs for quick access (optional but helpful)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS invoice_url TEXT;
