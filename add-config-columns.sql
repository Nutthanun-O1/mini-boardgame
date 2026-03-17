-- Add difficulty, dm_mode, and banned_dms columns to rooms table
-- Run this in Supabase Dashboard → SQL Editor

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS difficulty TEXT NOT NULL DEFAULT 'medium';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS dm_mode TEXT NOT NULL DEFAULT 'creator';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS banned_dms JSONB NOT NULL DEFAULT '[]'::jsonb;
