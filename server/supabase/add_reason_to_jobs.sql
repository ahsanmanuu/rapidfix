-- Add reason column to jobs table to support rejection reasons and cancellations
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS reason TEXT;
