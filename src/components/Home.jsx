'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSupabase, getSessionName, saveSessionName } from '@/lib/supabase';
import AnimatedPage, { staggerContainer, fadeUpItem, tapScale } from './AnimatedPage';

const GAME_TITLES = { insider: 'Insider', werewolf: 'Werewolf', spyfall: 'Spyfall', codenames: 'Codenames' };

export default function Home({ gameId, onCreateRoom, onJoinRoom, onBack, error }) {
  const [name, setName] = useState(() => getSessionName());
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const title = GAME_TITLES[gameId] || gameId;

  /* ── Fetch available rooms in lobby ── */
  const fetchRooms = useCallback(async () => {
    try {
      const supabase = getSupabase();
      const { data } = await supabase
        .from('rooms')
        .select('code, game_id, dm_id, timer_duration, created_at')
        .eq('game_id', gameId)
        .eq('phase', 'lobby')
        .order('created_at', { ascending: false });

      if (!data) { setRooms([]); setLoading(false); return; }

      // Fetch player counts for each room
      const enriched = await Promise.all(
        data.map(async (room) => {
          const { count } = await supabase
            .from('players')
            .select('*', { count: 'exact', head: true })
            .eq('room_code', room.code);

          const { data: dmPlayer } = await supabase
            .from('players')
            .select('name')
            .eq('room_code', room.code)
            .eq('is_dm', true)
            .maybeSingle();

          return {
            ...room,
            playerCount: count || 0,
            dmName: dmPlayer?.name || '???',
          };
        })
      );

      setRooms(enriched);
    } catch {
      setRooms([]);
    }
    setLoading(false);
  }, [gameId]);

  useEffect(() => {
    fetchRooms();
    // Poll every 3 seconds to keep list fresh
    const interval = setInterval(fetchRooms, 3000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  /* ── Also subscribe to realtime changes for instant updates ── */
  useEffect(() => {
    const channel = getSupabase()
      .channel('room-browse')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'rooms',
      }, () => fetchRooms())
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'players',
      }, () => fetchRooms())
      .subscribe();

    return () => getSupabase().removeChannel(channel);
  }, [fetchRooms]);

  const canJoin = name.trim().length > 0;

  return (
    <AnimatedPage>
      <div className="page-header">
        <p className="page-label">{title}</p>
        <h1 className="page-title">เริ่มเล่น</h1>
      </div>

      <motion.div
        className="form"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* ── Name Input ── */}
        <div className="field">
          <label className="field__label">ชื่อของคุณ</label>
          <input
            className="field__input"
            type="text"
            placeholder="ใส่ชื่อก่อนเข้าร่วมหรือสร้างห้อง"
            value={name}
            onChange={e => { setName(e.target.value); saveSessionName(e.target.value); }}
            maxLength={100}
            autoFocus
          />
        </div>

        {/* ── Create Room ── */}
        <motion.button
          className="btn btn--primary btn--lg"
          disabled={!canJoin}
          onClick={() => onCreateRoom(name.trim(), 300)}
          whileTap={tapScale}
        >
          + สร้างห้องใหม่
        </motion.button>

        {/* ── Available Rooms ── */}
        <div className="room-browse">
          <div className="room-browse__header">
            <span className="room-browse__title">ห้องที่เปิดอยู่</span>
            <div className="room-browse__header-actions">
              {rooms.length > 0 && (
                <motion.button
                  className="room-browse__clear"
                  onClick={async () => {
                    if (clearing) return;
                    setClearing(true);
                    try {
                      const supabase = getSupabase();
                      const codes = rooms.map(r => r.code);
                      // Delete players first, then rooms
                      await supabase.from('players').delete().in('room_code', codes);
                      await supabase.from('rooms').delete().in('code', codes);
                      await fetchRooms();
                    } catch { /* ignore */ }
                    setClearing(false);
                  }}
                  whileTap={{ scale: 0.9 }}
                  title="ลบห้องทั้งหมด"
                >
                  {clearing ? '...' : '🗑️'}
                </motion.button>
              )}
              <motion.button
                className="room-browse__refresh"
                onClick={fetchRooms}
                whileTap={{ scale: 0.9, rotate: 180 }}
                transition={{ duration: 0.3 }}
                title="รีเฟรช"
              >
                ↻
              </motion.button>
            </div>
          </div>

          {loading ? (
            <div className="waiting-state">
              <span className="waiting-dot" />
              <span className="waiting-dot" />
              <span className="waiting-dot" />
              <p>กำลังโหลด…</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="room-browse__empty">
              <p>ยังไม่มีห้องเปิดอยู่</p>
              <p className="room-browse__empty-hint">สร้างห้องใหม่เพื่อเริ่มเล่น!</p>
            </div>
          ) : (
            <motion.div
              className="room-browse__list"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {rooms.map(room => (
                <motion.button
                  key={room.code}
                  className="room-browse__item"
                  disabled={!canJoin}
                  onClick={() => canJoin && onJoinRoom(room.code, name.trim())}
                  variants={fadeUpItem}
                  whileTap={canJoin ? tapScale : undefined}
                >
                  <div className="room-browse__item-left">
                    <span className="room-browse__item-code">{room.code}</span>
                    <span className="room-browse__item-dm">สร้างโดย {room.dmName}</span>
                  </div>
                  <div className="room-browse__item-right">
                    <span className="room-browse__item-players">
                      👥 {room.playerCount}
                    </span>
                    <span className="room-browse__item-join">
                      {canJoin ? 'เข้าร่วม →' : 'ใส่ชื่อก่อน'}
                    </span>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </div>

        <button className="btn btn--ghost" onClick={onBack}>
          เปลี่ยนเกม
        </button>

        <AnimatePresence>
          {error && (
            <motion.p
              className="error-text"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatedPage>
  );
}
