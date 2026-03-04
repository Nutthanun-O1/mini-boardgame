-- ══════════════════════════════════════════════
--  Migration: Add Insider config columns
--  Run this if you already have the rooms table
-- ══════════════════════════════════════════════

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS difficulty   TEXT    NOT NULL DEFAULT 'medium';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS dm_mode      TEXT    NOT NULL DEFAULT 'creator';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS word_pick    BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS word_choices  JSONB;
