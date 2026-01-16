ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- Optional: Update existing sessions based on admins table logic if possible, 
-- but for now the default 'user' is safer than null.
