-- Create Payment Methods Table
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- Link to users table
  type TEXT NOT NULL CHECK (type IN ('card', 'paypal')),
  provider TEXT CHECK (provider IN ('visa', 'mastercard', 'paypal', 'amex')),
  last4 TEXT,
  email TEXT,
  expiry TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Coupons Table
CREATE TABLE IF NOT EXISTS coupons (
  code TEXT PRIMARY KEY,
  discount_amount NUMERIC NOT NULL,
  discount_type TEXT CHECK (discount_type IN ('fixed', 'percent')),
  min_order_value NUMERIC DEFAULT 0,
  expiry_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed some coupons
INSERT INTO coupons (code, discount_amount, discount_type, min_order_value, expiry_date)
VALUES 
('WELCOME50', 50, 'fixed', 100, NOW() + INTERVAL '1 year'),
('SAVE10', 10, 'percent', 50, NOW() + INTERVAL '1 month')
ON CONFLICT (code) DO NOTHING;
