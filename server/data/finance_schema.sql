-- -----------------------------------------------------------------------------
-- 4. FINANCE & WALLET TABLES
-- Run ONLY this snippet to fix the "Payments & Wallet" missing table issues.
-- -----------------------------------------------------------------------------

-- Finance / Transactions Table
CREATE TABLE IF NOT EXISTS finance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    technician_id UUID REFERENCES technicians(id),
    associated_id TEXT, -- e.g. Job ID or 'SYSTEM'
    type TEXT CHECK (type IN ('credit', 'debit')),
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    description TEXT,
    category TEXT, -- 'Job Fees', 'Tips', 'Bonuses', 'Supplies', 'Withdrawal', 'Refunds'
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_user ON finance(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_tech ON finance(technician_id);

-- Bank Accounts
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    ifsc_code TEXT NOT NULL,
    account_holder_name TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Withdrawals
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
    bank_account_id UUID REFERENCES bank_accounts(id),
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, processing, completed, rejected
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Wallet Pots (Savings/Tax)
CREATE TABLE IF NOT EXISTS wallet_pots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount DECIMAL(10, 2) DEFAULT 0,
    current_amount DECIMAL(10, 2) DEFAULT 0,
    color TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Technician Finance Analytics
CREATE TABLE IF NOT EXISTS technician_finance_analytics (
    technician_id UUID PRIMARY KEY REFERENCES technicians(id) ON DELETE CASCADE,
    tax_estimation DECIMAL(10, 2) DEFAULT 0,
    tax_message TEXT,
    savings_goal DECIMAL(10, 2) DEFAULT 0,
    savings_message TEXT,
    peak_insight TEXT,
    health_score INT DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);
