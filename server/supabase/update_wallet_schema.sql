-- Migration for Technician Wallet System

-- 1. Create Bank Accounts Table
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    ifsc_code TEXT NOT NULL,
    account_holder_name TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT TRUE, -- Auto-verify for simplicity or integrate API later
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_tech ON bank_accounts(technician_id);

-- 2. Create Withdrawals Table
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
    bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
    reference_id TEXT, -- For bank transaction ID
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_tech ON withdrawals(technician_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);

-- 3. Update Finance Table
ALTER TABLE finance ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Job Fees'; -- Job Fees, Tips, Bonuses, Withdrawal, Tax
ALTER TABLE finance ADD COLUMN IF NOT EXISTS tax_pot DECIMAL(10,2) DEFAULT 0; -- Virtual pot for taxes

-- 4. Enable RLS
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- 5. Service Role Policy
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Service role has full access' AND polrelid = 'bank_accounts'::regclass) THEN
        CREATE POLICY "Service role has full access" ON bank_accounts FOR ALL USING (auth.role() = 'service_role');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Service role has full access' AND polrelid = 'withdrawals'::regclass) THEN
        CREATE POLICY "Service role has full access" ON withdrawals FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;
