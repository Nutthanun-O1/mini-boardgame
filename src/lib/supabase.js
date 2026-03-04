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
 * Generate or retrieve a stable player ID for this browser session.
 * Stored in sessionStorage so it survives page refreshes but not new tabs.
 */
export function getPlayerId() {
  if (typeof window === 'undefined') return null;
  let id = sessionStorage.getItem('boardgame_player_id');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('boardgame_player_id', id);
  }
  return id;
}
