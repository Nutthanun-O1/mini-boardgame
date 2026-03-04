-- ══════════════════════════════════════════════
--  Mini Board Game — Supabase Schema
-- ══════════════════════════════════════════════
--  Run this SQL in your Supabase SQL Editor
--  (Dashboard → SQL Editor → New Query)
-- ══════════════════════════════════════════════

-- ── Rooms table ──
CREATE TABLE IF NOT EXISTS rooms (
  code           TEXT PRIMARY KEY,
  game_id        TEXT    NOT NULL DEFAULT 'insider',
  dm_id          TEXT    NOT NULL,
  phase          TEXT    NOT NULL DEFAULT 'lobby',
  timer_duration INTEGER NOT NULL DEFAULT 300,
  timer_started_at BIGINT,          -- Date.now() ms timestamp

  -- Insider fields
  word           TEXT,
  category       TEXT,
  insider_id     TEXT,
  insider_name   TEXT,

  -- Spyfall fields
  spy_id                  TEXT,
  spy_name                TEXT,
  spyfall_location        TEXT,
  spyfall_location_label  TEXT,
  spyfall_vote_active     BOOLEAN DEFAULT FALSE,
  spyfall_vote_caller     TEXT,
  spyfall_vote_target     TEXT,
  spyfall_votes           JSONB   DEFAULT '{}',

  -- Shared
  roles          JSONB   DEFAULT '{}',
  result         JSONB,

  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Players table ──
CREATE TABLE IF NOT EXISTS players (
  id          TEXT NOT NULL,
  room_code   TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  is_dm       BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_code, id)
);

-- ── Row Level Security (open for anon key) ──
ALTER TABLE rooms   ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on rooms"   ON rooms   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on players" ON players FOR ALL USING (true) WITH CHECK (true);

-- ── Enable Realtime ──
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
