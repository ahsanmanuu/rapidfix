-- Fix for Polymorphic Sessions Table
-- The 'sessions' table uses 'user_id' to store IDs from users, technicians, and admins.
-- The default foreign key constraint 'sessions_user_id_fkey' restricts this to only 'users' table.
-- We must drop this constraint to allow Admins and Technicians to log in.

ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_user_id_fkey;
