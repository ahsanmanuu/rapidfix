-- The Admins table might assume IDs are TEXT (legacy/timestamps), 
-- but Technicians table expects created_by to be a proper UUID. 
-- Best fix: Change created_by to TEXT to accept legacy IDs.

ALTER TABLE public.technicians 
ALTER COLUMN created_by TYPE text;

-- Remove Foreign Key if it exists (since IDs might not match types)
ALTER TABLE public.technicians DROP CONSTRAINT IF EXISTS technicians_created_by_fkey;
