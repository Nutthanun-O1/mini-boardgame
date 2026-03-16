-- Add word_pick and word_choices columns to rooms table
-- Run this in Supabase Dashboard → SQL Editor

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS word_pick BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS word_choices JSONB;
