-- Create a table for periodic financial analytics
CREATE TABLE IF NOT EXISTS technician_finance_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
    tax_estimation NUMERIC DEFAULT 0,
    tax_message TEXT,
    savings_goal NUMERIC DEFAULT 0,
    savings_message TEXT,
    peak_insight TEXT,
    health_score INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a table for "Financial Pots" (e.g. Tax Pot, Savings Pot)
CREATE TABLE IF NOT EXISTS wallet_pots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount NUMERIC DEFAULT 0,
    current_amount NUMERIC DEFAULT 0,
    color TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint to analytics per technician
ALTER TABLE technician_finance_analytics ADD CONSTRAINT unique_tech_analytics UNIQUE (technician_id);
