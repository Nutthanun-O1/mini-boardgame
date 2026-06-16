-- Add game_state column to rooms table to support Exploding Kittens and future games
-- Run this in Supabase Dashboard → SQL Editor

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS game_state JSONB DEFAULT '{}'::jsonb;
