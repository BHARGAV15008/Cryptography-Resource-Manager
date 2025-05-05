-- Fix for missing description column in professors table
ALTER TABLE professors ADD COLUMN IF NOT EXISTS description TEXT AFTER specialization;
