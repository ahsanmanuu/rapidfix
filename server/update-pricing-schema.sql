-- Table to store fixed visiting charges (Global or per Service Type)
CREATE TABLE IF NOT EXISTS service_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_type VARCHAR(255) UNIQUE NOT NULL, -- 'default', 'plumbing', etc.
    base_visiting_charge DECIMAL(10, 2) DEFAULT 99.00,
    per_km_charge DECIMAL(10, 2) DEFAULT 10.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default pricing
INSERT INTO service_pricing (service_type, base_visiting_charge, per_km_charge)
VALUES ('default', 99.00, 10.00)
ON CONFLICT (service_type) DO NOTHING;

-- Add payment fields to jobs table if they don't exist
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'wallet_deducted'
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cash';   -- 'cash', 'wallet', 'online'
