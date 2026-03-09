'use client';

import { createClient } from '@supabase/supabase-js';

let _supabase = null;

/**
 * Lazy-initialise the Supabase client (avoids crashing during Next.js
 * static generation when environment variables are not yet available).
 */
export function getSupabase() {
  if (_supabase) return _supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copy .env.local.example → .env.local and fill in your Supabase credentials.'
    );
  }
  _supabase = createClient(url, key, {
    realtime: { params: { eventsPerSecond: 10 } },
  });
  return _supabase;
}

/** Convenience re-export — use in components that are guaranteed to run client-side. */
export const supabase = typeof window !== 'undefined' ? getSupabase() : null;

/**
 * Generate or retrieve a stable player ID for this browser tab.
 * Uses localStorage so it survives page refreshes AND screen-lock / tab-kill.
 */
export function getPlayerId() {
  if (typeof window === 'undefined') return null;
  let id = localStorage.getItem('boardgame_player_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('boardgame_player_id', id);
  }
  return id;
}

// ── Room session persistence (survive screen-lock / reload) ──

const ROOM_KEY = 'boardgame_room';

/** Save current room info so we can auto-rejoin after screen-lock / reload. */
export function saveRoomSession(info) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ROOM_KEY, JSON.stringify(info));
}

/** Load previously saved room session. */
export function loadRoomSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ROOM_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/** Clear saved room session (when explicitly leaving). */
export function clearRoomSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ROOM_KEY);
}

// ── Session name persistence ──

const NAME_KEY = 'boardgame_session_name';

/** Save display name for this session so the user doesn't re-type it. */
export function saveSessionName(name) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(NAME_KEY, name);
}

/** Load saved session name (returns '' if none). */
export function getSessionName() {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem(NAME_KEY) || '';
}
