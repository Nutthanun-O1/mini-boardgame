'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { getSupabase, getPlayerId, saveRoomSession, loadRoomSession, clearRoomSession, saveSessionName, getSessionName } from '@/lib/supabase';
import {
  generateRoomCode, pickWord, pickWordChoices, pickSpyfallLocation,
  ALL_SPYFALL_LOCATIONS, spyfallLocations as spyfallLocMap,
  initKittensGame, KITTENS_CARDS
} from '@/lib/gameData';
import GameSelect from '@/components/GameSelect';
import Home from '@/components/Home';
import Lobby from '@/components/Lobby';
import WordPick from '@/components/WordPick';
import Playing from '@/components/Playing';
import Discussion from '@/components/Discussion';
import Result from '@/components/Result';
import SpyfallPlaying from '@/components/SpyfallPlaying';
import SpyfallVoting from '@/components/SpyfallVoting';
import SpyfallLastChance from '@/components/SpyfallLastChance';
import SpyfallResult from '@/components/SpyfallResult';
import KittensPlaying from '@/components/KittensPlaying';
import KittensResult from '@/components/KittensResult';

export default function Page() {
  // ── State ──dcsd
  const [phase, setPhase] = useState('gameSelect');
  const [gameId, setGameId] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isDM, setIsDM] = useState(false);
  const [players, setPlayers] = useState([]);
  const [myRole, setMyRole] = useState(null);
  const [word, setWord] = useState(null);
  const [category, setCategory] = useState(null);
  const [timerTotal, setTimerTotal] = useState(300);
  const [timerStartedAt, setTimerStartedAt] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [timerSetting, setTimerSetting] = useState(300);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // ── Insider config state ──
  const [difficulty, setDifficulty] = useState('medium');
  const [dmMode, setDmMode] = useState('creator');
  const [wordPick, setWordPick] = useState(false);
  const [wordChoices, setWordChoices] = useState(null);
  const [bannedDMs, setBannedDMs] = useState([]);

  // ── Spyfall-specific state ──
  const [spyfallLocation, setSpyfallLocation] = useState(null);
  const [spyfallLocationKey, setSpyfallLocationKey] = useState(null);
  const [spyfallLocations, setSpyfallLocations] = useState([]);
  const [spyfallVoteInfo, setSpyfallVoteInfo] = useState(null);
  const [spyfallLastChance, setSpyfallLastChance] = useState(null);

  // ── Exploding Kittens state ──
  const [kittensState, setKittensState] = useState(null);

  // ── Auto-return-to-lobby countdown ──
  const [countdown, setCountdown] = useState(null);
  const countdownRef = useRef(null);

  // ── Refs (for latest values inside intervals / callbacks) ──
  const myId = useRef(null);
  const roomRef = useRef(null);
  const playersRef = useRef([]);
  const roomCodeRef = useRef('');
  const isDMRef = useRef(false);
  const channelRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const timeUpFiredRef = useRef(false);
  const handlePlayAgainRef = useRef(null);
  const playAgainFiredRef = useRef(false);

  // Keep refs in sync
  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { roomCodeRef.current = roomCode; }, [roomCode]);
  useEffect(() => { isDMRef.current = isDM; }, [isDM]);

  // ── Init player ID ──
  useEffect(() => { myId.current = getPlayerId(); }, []);

  // ══════════════════════════════════════════════
  //  Fetch helpers
  // ══════════════════════════════════════════════
  const fetchPlayers = useCallback(async (code) => {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('room_code', code)
      .order('created_at', { ascending: true });

    const mapped = (data || []).map(p => ({
      id: p.id, name: p.name, isDM: p.is_dm,
    }));
    setPlayers(mapped);
    playersRef.current = mapped;
  }, []);

  const fetchRoom = useCallback(async (code) => {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', code)
      .maybeSingle();
    if (data) {
      roomRef.current = data;
      processRoomData(data);
    }
  }, []);

  // ══════════════════════════════════════════════
  //  Process room data from Realtime / initial fetch
  // ══════════════════════════════════════════════
  const processRoomData = useCallback((room) => {
    if (!room) return;
    roomRef.current = room;
    const pid = myId.current;
    const role = room.roles?.[pid];

    // ── Always sync isDM from room's dm_id ──
    const amIDM = room.dm_id === pid;
    setIsDM(amIDM);
    isDMRef.current = amIDM;

    setGameId(room.game_id);
    setTimerSetting(room.timer_duration);
    if (room.difficulty !== undefined && room.difficulty !== null) setDifficulty(room.difficulty);
    if (room.dm_mode !== undefined && room.dm_mode !== null) setDmMode(room.dm_mode);
    if (room.word_pick !== undefined && room.word_pick !== null) setWordPick(room.word_pick);
    if (room.banned_dms !== undefined && room.banned_dms !== null) setBannedDMs(room.banned_dms);
    if (role) setMyRole(role);

    switch (room.phase) {
      case 'lobby':
        setPhase('lobby');
        setMyRole(null);
        setWord(null);
        setCategory(null);
        setResult(null);
        setTimerStartedAt(null);
        timeUpFiredRef.current = false;
        setSpyfallLocation(null);
        setSpyfallLocationKey(null);
        setSpyfallLocations([]);
        setSpyfallVoteInfo(null);
        setSpyfallLastChance(null);
        setWordChoices(null);
        setKittensState(null);
        break;

      case 'word-pick':
        setPhase('word-pick');
        setWordChoices(room.word_choices || []);
        break;

      case 'playing':
        setPhase('playing');
        setTimerTotal(room.timer_duration);
        setTimerStartedAt(room.timer_started_at);
        timeUpFiredRef.current = false;
        setSpyfallVoteInfo(null);

        if (room.game_id === 'exploding-kittens') {
          setKittensState(room.game_state);
        } else if (room.game_id === 'spyfall') {
          const isSpy = pid === room.spy_id;
          setSpyfallLocation(isSpy ? null : room.spyfall_location_label);
          setSpyfallLocationKey(isSpy ? null : room.spyfall_location);
          setSpyfallLocations(ALL_SPYFALL_LOCATIONS);
        } else {
          setCategory(room.category);
          const canSee = role === 'Master' || role === 'Insider';
          setWord(canSee ? room.word : null);
        }
        break;

      case 'discussion':
        setPhase('discussion');
        setWord(room.word);
        setCategory(room.category);
        setTimerStartedAt(null);
        setResult(room.result);
        break;

      case 'result':
        setPhase('result');
        setTimerStartedAt(null);
        setResult(room.result);
        if (room.game_id === 'exploding-kittens') {
          setKittensState(room.game_state);
        }
        break;

      case 'spyfall-voting':
        setPhase('spyfall-voting');
        setSpyfallVoteInfo({
          callerId: room.spyfall_vote_caller,
          targetId: room.spyfall_vote_target,
          votes: room.spyfall_votes || {},
          totalPlayers: playersRef.current.length,
        });
        break;

      case 'spyfall-last-chance':
        setPhase('spyfall-last-chance');
        setTimerStartedAt(null);
        setSpyfallLastChance({
          spy: room.spy_name,
          spyId: room.spy_id,
          locations: ALL_SPYFALL_LOCATIONS,
        });
        break;

      case 'spyfall-result':
        setPhase('spyfall-result');
        setTimerStartedAt(null);
        setResult(room.result);
        break;
    }
  }, []);

  // ══════════════════════════════════════════════
  //  Realtime subscription
  // ══════════════════════════════════════════════
  useEffect(() => {
    if (!roomCode) return;

    const channel = getSupabase()
      .channel(`room-${roomCode}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'rooms',
        filter: `code=eq.${roomCode}`,
      }, (payload) => {
        if (payload.eventType === 'DELETE') {
          alert('ห้องนี้ถูกปิดแล้ว');
          doResetAll();
          return;
        }
        processRoomData(payload.new);
      })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'players',
        filter: `room_code=eq.${roomCode}`,
      }, () => {
        fetchPlayers(roomCode);
      })
      .subscribe();

    channelRef.current = channel;

    // Initial data fetch
    fetchRoom(roomCode);
    fetchPlayers(roomCode);

    return () => {
      getSupabase().removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomCode, fetchPlayers, fetchRoom, processRoomData]);

  // ══════════════════════════════════════════════
  //  Client-side timer
  // ══════════════════════════════════════════════
  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (!timerStartedAt) return;

    // Paused: negative value encodes remaining milliseconds
    if (timerStartedAt < 0) {
      setTimeRemaining(Math.round(Math.abs(timerStartedAt) / 1000));
      return;
    }

    const tick = () => {
      if (timerTotal === 0) {
        setTimeRemaining(0);
        return;
      }
      const elapsed = Math.floor((Date.now() - timerStartedAt) / 1000);
      const remaining = Math.max(0, timerTotal - elapsed);
      setTimeRemaining(remaining);

      if (remaining <= 0 && !timeUpFiredRef.current) {
        timeUpFiredRef.current = true;
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
        // Only the DM triggers the time-up DB update
        if (isDMRef.current) {
          triggerTimeUp();
        }
      }
    };

    tick();
    timerIntervalRef.current = setInterval(tick, 250);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [timerStartedAt, timerTotal]);

  // ══════════════════════════════════════════════
  //  Auto-return-to-lobby countdown (result → lobby after 3s)
  // ══════════════════════════════════════════════
  useEffect(() => {
    // Clear any existing countdown
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    const isResultPhase = phase === 'result' || phase === 'spyfall-result';
    if (!isResultPhase) {
      setCountdown(null);
      playAgainFiredRef.current = false; // Reset guard when leaving result
      return;
    }

    // Prevent re-triggering if already fired for this result phase
    if (playAgainFiredRef.current) return;

    let remaining = 3;
    setCountdown(remaining);

    countdownRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
        playAgainFiredRef.current = true;
        if (handlePlayAgainRef.current) handlePlayAgainRef.current();
      }
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [phase]);

  // ══════════════════════════════════════════════
  //  Visibility change — re-fetch room state when user comes back
  // ══════════════════════════════════════════════
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && roomCodeRef.current) {
        // Re-fetch latest room and player data to recover from missed events
        fetchRoom(roomCodeRef.current);
        fetchPlayers(roomCodeRef.current);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchRoom, fetchPlayers]);

  // ══════════════════════════════════════════════
  //  Auto-rejoin room after page refresh / screen-lock
  // ══════════════════════════════════════════════
  useEffect(() => {
    const session = loadRoomSession();
    if (!session) return;

    const pid = myId.current;
    const tryRejoin = async () => {
      try {
        const supabase = getSupabase();
        // Check room still exists
        const { data: room } = await supabase
          .from('rooms').select('*').eq('code', session.roomCode).maybeSingle();
        if (!room) { clearRoomSession(); return; }

        // Check player still exists in room
        const { data: player } = await supabase
          .from('players').select('*')
          .eq('room_code', session.roomCode).eq('id', pid).maybeSingle();
        if (!player) { clearRoomSession(); return; }

        // Rejoin
        setPlayerName(session.playerName);
        setGameId(room.game_id);
        setTimerSetting(room.timer_duration);
        setRoomCode(session.roomCode); // triggers subscription
      } catch {
        clearRoomSession();
      }
    };
    tryRejoin();
  }, []);

  // ══════════════════════════════════════════════
  //  Game action handlers
  // ══════════════════════════════════════════════

  async function triggerTimeUp() {
    const room = roomRef.current;
    if (!room || room.phase !== 'playing') return;
    const pls = playersRef.current;
    const code = roomCodeRef.current;

    if (room.game_id === 'spyfall') {
      await getSupabase().from('rooms').update({
        phase: 'spyfall-result',
        timer_started_at: null,
        result: {
          winner: 'spy', reason: 'timeout',
          spy: room.spy_name, spyId: room.spy_id,
          location: room.spyfall_location_label,
          locationKey: room.spyfall_location,
          players: pls, roles: room.roles,
        },
      }).eq('code', code).eq('phase', 'playing');
    } else {
      await getSupabase().from('rooms').update({
        phase: 'result',
        timer_started_at: null,
        result: {
          word: room.word, category: room.category,
          insider: room.insider_name, insiderId: room.insider_id,
          timedOut: true, players: pls, roles: room.roles,
        },
      }).eq('code', code).eq('phase', 'playing');
    }
  }

  function doResetAll() {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setCountdown(null);
    setPhase('gameSelect');
    setGameId(null);
    setRoomCode('');
    // Keep playerName for session persistence
    setIsDM(false);
    setPlayers([]);
    setMyRole(null);
    setWord(null);
    setCategory(null);
    setTimerTotal(300);
    setTimerStartedAt(null);
    setTimeRemaining(300);
    setTimerSetting(300);
    setResult(null);
    setError('');
    setSpyfallLocation(null);
    setSpyfallLocationKey(null);
    setSpyfallLocations([]);
    setSpyfallVoteInfo(null);
    setSpyfallLastChance(null);
    setWordChoices(null);
    roomRef.current = null;
    roomCodeRef.current = '';
    timeUpFiredRef.current = false;
    clearRoomSession();
  }

  function handleSelectGame(id) {
    setGameId(id);
    setPhase('home');
  }

  async function handleCreateRoom(name, duration) {
    try {
      setError('');
      const pid = myId.current;
      const code = await generateRoomCode();

      const { error: roomErr } = await getSupabase().from('rooms').insert({
        code,
        game_id: gameId || 'insider',
        dm_id: pid,
        phase: 'lobby',
        timer_duration: duration || 300,
      });
      if (roomErr) throw roomErr;

      const { error: playerErr } = await getSupabase().from('players').insert({
        id: pid, room_code: code, name, is_dm: true,
      });
      if (playerErr) throw playerErr;

      setPlayerName(name);
      setIsDM(true);
      isDMRef.current = true;
      setTimerSetting(duration || 300);
      setRoomCode(code); // triggers realtime subscription
      setPhase('lobby');
      saveSessionName(name);
      saveRoomSession({ roomCode: code, playerName: name });
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    }
  }

  async function handleJoinRoom(code, name) {
    try {
      setError('');
      code = (code || '').toUpperCase().trim();
      const pid = myId.current;

      const { data: room, error: fetchErr } = await getSupabase()
        .from('rooms').select('*').eq('code', code).maybeSingle();
      if (fetchErr) throw fetchErr;
      if (!room) { setError('ไม่พบห้องนี้'); return; }
      if (room.phase !== 'lobby') { setError('เกมเริ่มไปแล้ว'); return; }

      // Check if this player already exists in the room (rejoin scenario)
      const { data: selfExisting } = await getSupabase()
        .from('players').select('*')
        .eq('room_code', code).eq('id', pid).maybeSingle();

      if (!selfExisting) {
        // Check for name collision with other players
        const { data: nameExists } = await getSupabase()
          .from('players').select('name').eq('room_code', code).eq('name', name);
        if (nameExists && nameExists.length > 0) { setError('ชื่อนี้ถูกใช้แล้ว'); return; }

        const { error: playerErr } = await getSupabase().from('players').insert({
          id: pid, room_code: code, name, is_dm: false,
        });
        if (playerErr) throw playerErr;
      }

      setPlayerName(name);
      setIsDM(false);
      isDMRef.current = false;
      setGameId(room.game_id);
      setTimerSetting(room.timer_duration);
      setRoomCode(code); // triggers realtime subscription
      setPhase('lobby');
      saveSessionName(name);
      saveRoomSession({ roomCode: code, playerName: name });
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    }
  }

  async function handleSetTimer(duration) {
    const code = roomCodeRef.current;
    setTimerSetting(duration);
    await getSupabase().from('rooms')
      .update({ timer_duration: duration })
      .eq('code', code);
  }

  async function handleChangeName(newName) {
    const pid = myId.current;
    const code = roomCodeRef.current;
    if (!code || !newName) return;

    // Check for name collision
    const { data: nameExists } = await getSupabase()
      .from('players').select('name').eq('room_code', code).eq('name', newName);
    if (nameExists && nameExists.length > 0) { setError('ชื่อนี้ถูกใช้แล้ว'); return; }

    await getSupabase().from('players')
      .update({ name: newName })
      .eq('room_code', code).eq('id', pid);

    setPlayerName(newName);
    saveSessionName(newName);
    saveRoomSession({ roomCode: code, playerName: newName });
    setError('');
    // Re-fetch players to update the list
    await fetchPlayers(code);
  }

  async function handleSetKittensSetting(key, value) {
    const code = roomCodeRef.current;
    const room = roomRef.current;
    if (!code || !room) return;
    
    const currentState = room.game_state || {};
    const settings = currentState.kittensSettings || { deckSize: 50, bombCount: 0 };
    const newState = {
      ...currentState,
      kittensSettings: {
        ...settings,
        [key]: value
      }
    };
    
    // We only update the DB, realtime sync will fetch and process it
    await getSupabase().from('rooms').update({ game_state: newState }).eq('code', code);
  }

  async function handlePauseTimer() {
    const room = roomRef.current;
    if (!room || !room.timer_started_at || room.timer_started_at < 0) return;
    const code = roomCodeRef.current;
    const elapsed = Date.now() - room.timer_started_at;
    const remainingMs = Math.max(0, room.timer_duration * 1000 - elapsed);
    await getSupabase().from('rooms').update({
      timer_started_at: -remainingMs,
    }).eq('code', code);
  }

  async function handleResumeTimer() {
    const room = roomRef.current;
    if (!room || !room.timer_started_at || room.timer_started_at > 0) return;
    const code = roomCodeRef.current;
    const remainingMs = Math.abs(room.timer_started_at);
    const newStart = Date.now() - (room.timer_duration * 1000 - remainingMs);
    await getSupabase().from('rooms').update({
      timer_started_at: newStart,
    }).eq('code', code);
  }

  async function handleSetDifficulty(val) {
    const code = roomCodeRef.current;
    setDifficulty(val);
    await getSupabase().from('rooms')
      .update({ difficulty: val })
      .eq('code', code);
  }

  async function handleSetDmMode(val) {
    const code = roomCodeRef.current;
    setDmMode(val);
    await getSupabase().from('rooms')
      .update({ dm_mode: val })
      .eq('code', code);
  }

  async function handleSetWordPick(val) {
    const code = roomCodeRef.current;
    setWordPick(val);
    await getSupabase().from('rooms')
      .update({ word_pick: val })
      .eq('code', code);
  }

  function handleToggleBanDM(playerId) {
    const code = roomCodeRef.current;
    setBannedDMs(prev => {
      const next = prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId];
      getSupabase().from('rooms').update({ banned_dms: next }).eq('code', code).then();
      return next;
    });
  }

  /**
   * Determine who the DM should be based on dm_mode setting.
   */
  function resolveDM(pls) {
    const mode = dmMode || 'creator';
    if (mode === 'creator') {
      return pls.find(p => p.isDM) || pls[0];
    }
    if (mode === 'random') {
      const eligible = pls.filter(p => !bannedDMs.includes(p.id));
      if (eligible.length > 0) {
        return eligible[Math.floor(Math.random() * eligible.length)];
      }
      return pls[Math.floor(Math.random() * pls.length)];
    }
    // mode is a specific player ID
    return pls.find(p => p.id === mode) || pls.find(p => p.isDM) || pls[0];
  }

  async function handleStartGame() {
    try {
      const code = roomCodeRef.current;
      const room = roomRef.current;
      if (!room) return;
      const pls = playersRef.current;

      if (room.game_id === 'exploding-kittens') {
        // ─── Exploding Kittens start ───
        if (pls.length < 2) { setError('ต้องมีผู้เล่นอย่างน้อย 2 คน'); return; }

        const kittensSettings = room.game_state?.kittensSettings || {};
        const initialKittensState = initKittensGame(
          pls, 
          kittensSettings.deckSize || 50, 
          kittensSettings.bombCount || null
        );

        const { error: err } = await getSupabase().from('rooms').update({
          phase: 'playing',
          timer_started_at: null,
          game_state: initialKittensState,
          roles: {},
          result: null,
        }).eq('code', code);
        if (err) console.error('startGame exploding kittens error:', err);

      } else if (room.game_id === 'spyfall') {
        // ─── Spyfall start ───
        if (pls.length < 3) { setError('ต้องมีผู้เล่นอย่างน้อย 3 คน'); return; }

        const { locationKey, locationLabel } = pickSpyfallLocation();
        const spyIdx = Math.floor(Math.random() * pls.length);
        const spyPlayer = pls[spyIdx];
        const roles = {};
        pls.forEach(p => { roles[p.id] = p.id === spyPlayer.id ? 'Spy' : 'Agent'; });

        const { error: err } = await getSupabase().from('rooms').update({
          phase: 'playing',
          timer_started_at: Date.now(),
          spy_id: spyPlayer.id,
          spy_name: spyPlayer.name,
          spyfall_location: locationKey,
          spyfall_location_label: locationLabel,
          spyfall_vote_active: false,
          spyfall_vote_caller: null,
          spyfall_vote_target: null,
          spyfall_votes: {},
          roles,
          result: null,
        }).eq('code', code);
        if (err) console.error('startGame spyfall error:', err);

      } else {
        // ─── Insider start ───
        if (pls.length < 4) { setError('ต้องมีผู้เล่นอย่างน้อย 4 คน'); return; }

        // Use local state for lobby settings (roomRef may be stale)
        const diff = difficulty || 'medium';
        const dmPlayer = resolveDM(pls);
        const nonDM = pls.filter(p => p.id !== dmPlayer.id);
        const insiderIdx = Math.floor(Math.random() * nonDM.length);
        const insiderPlayer = nonDM[insiderIdx];

        const roles = {};
        pls.forEach(p => {
          if (p.id === dmPlayer.id) roles[p.id] = 'Master';
          else if (p.id === insiderPlayer.id) roles[p.id] = 'Insider';
          else roles[p.id] = 'Common';
        });

        // Update DM flag in players table if DM changed
        if (!dmPlayer.isDM) {
          await getSupabase().from('players')
            .update({ is_dm: false })
            .eq('room_code', code).eq('is_dm', true);
          await getSupabase().from('players')
            .update({ is_dm: true })
            .eq('room_code', code).eq('id', dmPlayer.id);
        }

        // Use local state 'wordPick' — NOT room.word_pick (may be stale)
        if (wordPick) {
          // Word-pick mode: go to word-pick phase first
          const choices = await pickWordChoices(diff, 5);
          const { error: err } = await getSupabase().from('rooms').update({
            phase: 'word-pick',
            word_pick: true,
            word_choices: choices,
            dm_id: dmPlayer.id,
            insider_id: insiderPlayer.id,
            insider_name: insiderPlayer.name,
            roles,
            result: null,
          }).eq('code', code);
          if (err) {
            console.error('startGame word-pick error:', err);
            setError('เกิดข้อผิดพลาดในการเริ่มเกม');
          }
        } else {
          // Normal mode: pick word automatically
          const { word: w, category: cat } = await pickWord(diff);
          const { error: err } = await getSupabase().from('rooms').update({
            phase: 'playing',
            timer_started_at: Date.now(),
            word: w,
            category: cat,
            dm_id: dmPlayer.id,
            insider_id: insiderPlayer.id,
            insider_name: insiderPlayer.name,
            roles,
            result: null,
          }).eq('code', code);
          if (err) console.error('startGame playing error:', err);
        }
      }
    } catch (err) {
      console.error('handleStartGame error:', err);
      setError('เกิดข้อผิดพลาดในการเริ่มเกม');
    }
  }

  /**
   * DM picks a word during word-pick phase → advance to playing.
   */
  async function handlePickWord({ word: w, category: cat }) {
    const code = roomCodeRef.current;
    await getSupabase().from('rooms').update({
      phase: 'playing',
      timer_started_at: Date.now(),
      word: w,
      category: cat,
      word_choices: null,
    }).eq('code', code).eq('phase', 'word-pick');
  }

  async function handleGuessCorrect() {
    const room = roomRef.current;
    if (!room) return;
    const code = roomCodeRef.current;
    // Handle paused timer: negative value means remaining ms
    let elapsed;
    if (room.timer_started_at < 0) {
      elapsed = room.timer_duration - Math.round(Math.abs(room.timer_started_at) / 1000);
    } else {
      elapsed = Math.floor((Date.now() - room.timer_started_at) / 1000);
    }

    await getSupabase().from('rooms').update({
      phase: 'discussion',
      timer_started_at: null,
      result: {
        word: room.word, category: room.category,
        timeUsed: elapsed,
      },
    }).eq('code', code);
  }

  async function handleRevealInsider() {
    const room = roomRef.current;
    if (!room) return;
    const code = roomCodeRef.current;
    const pls = playersRef.current;

    await getSupabase().from('rooms').update({
      phase: 'result',
      result: {
        word: room.word, category: room.category,
        insider: room.insider_name, insiderId: room.insider_id,
        players: pls, roles: room.roles,
      },
    }).eq('code', code);
  }

  async function handleSpyGuessLocation(locKey) {
    const room = roomRef.current;
    if (!room) return;
    const code = roomCodeRef.current;
    const pls = playersRef.current;
    const correct = locKey === room.spyfall_location;

    await getSupabase().from('rooms').update({
      phase: 'spyfall-result',
      timer_started_at: null,
      result: {
        winner: correct ? 'spy' : 'players',
        reason: correct ? 'spy-guessed-correct' : 'spy-guessed-wrong',
        spy: room.spy_name, spyId: room.spy_id,
        location: room.spyfall_location_label,
        locationKey: room.spyfall_location,
        guessedLocation: spyfallLocMap[locKey] || locKey,
        guessedLocationKey: locKey,
        players: pls, roles: room.roles,
      },
    }).eq('code', code);
  }

  async function handleCallVote(targetId) {
    const pid = myId.current;
    const code = roomCodeRef.current;
    await getSupabase().from('rooms').update({
      phase: 'spyfall-voting',
      spyfall_vote_active: true,
      spyfall_vote_caller: pid,
      spyfall_vote_target: targetId,
      spyfall_votes: { [pid]: true },
    }).eq('code', code);
  }

  async function handleCastVote(agree) {
    const pid = myId.current;
    const code = roomCodeRef.current;
    const pls = playersRef.current;

    // Fetch latest votes to avoid stale data
    const { data: latest } = await getSupabase()
      .from('rooms')
      .select('spyfall_votes, spyfall_vote_target, spy_id, spy_name, spyfall_location, spyfall_location_label, roles')
      .eq('code', code).single();

    const updatedVotes = { ...(latest.spyfall_votes || {}), [pid]: agree };

    // Update votes
    await getSupabase().from('rooms').update({
      spyfall_votes: updatedVotes,
    }).eq('code', code);

    // Check if all players voted → resolve
    if (Object.keys(updatedVotes).length >= pls.length) {
      const yesCount = Object.values(updatedVotes).filter(Boolean).length;
      const majority = yesCount > pls.length / 2;

      if (majority) {
        const targetIsSpy = latest.spyfall_vote_target === latest.spy_id;
        if (targetIsSpy) {
          // Spy caught → last chance to guess
          await getSupabase().from('rooms').update({
            phase: 'spyfall-last-chance',
            timer_started_at: null,
            spyfall_vote_active: false,
          }).eq('code', code);
        } else {
          // Wrong accusation → spy wins
          const accusedName = pls.find(p => p.id === latest.spyfall_vote_target)?.name;
          await getSupabase().from('rooms').update({
            phase: 'spyfall-result',
            timer_started_at: null,
            spyfall_vote_active: false,
            result: {
              winner: 'spy', reason: 'wrong-accusation',
              accusedId: latest.spyfall_vote_target, accusedName,
              spy: latest.spy_name, spyId: latest.spy_id,
              location: latest.spyfall_location_label,
              locationKey: latest.spyfall_location,
              players: pls, roles: latest.roles,
            },
          }).eq('code', code);
        }
      } else {
        // Vote failed → continue playing
        await getSupabase().from('rooms').update({
          phase: 'playing',
          spyfall_vote_active: false,
          spyfall_votes: {},
        }).eq('code', code);
      }
    }
  }

  async function handleSpyLastGuess(locKey) {
    const room = roomRef.current;
    if (!room) return;
    const code = roomCodeRef.current;
    const pls = playersRef.current;
    const correct = locKey === room.spyfall_location;

    await getSupabase().from('rooms').update({
      phase: 'spyfall-result',
      result: {
        winner: correct ? 'spy' : 'players',
        reason: correct ? 'spy-last-guess-correct' : 'spy-caught',
        spy: room.spy_name, spyId: room.spy_id,
        location: room.spyfall_location_label,
        locationKey: room.spyfall_location,
        guessedLocation: spyfallLocMap[locKey] || locKey,
        guessedLocationKey: locKey,
        players: pls, roles: room.roles,
      },
    }).eq('code', code);
  }

  function advanceKittensTurn(state) {
    const aliveOrder = state.turnOrder.filter(id => !state.eliminated.includes(id));
    if (aliveOrder.length <= 1) return;
    
    const dir = state.turnDirection || 1;
    let nextIdx = state.currentTurnIdx;
    do {
      nextIdx = (nextIdx + dir + state.turnOrder.length) % state.turnOrder.length;
    } while (state.eliminated.includes(state.turnOrder[nextIdx]));
    
    state.currentTurnIdx = nextIdx;
    state.currentPlayerId = state.turnOrder[nextIdx];
  }

  async function handleKittensPlayCard(cardType, targetPlayerId) {
    const code = roomCodeRef.current;
    const pid = myId.current;
    const pls = playersRef.current;
    const myName = pls.find(p => p.id === pid)?.name || '???';

    try {
      const { data: room } = await getSupabase().from('rooms').select('game_state').eq('code', code).single();
      if (!room || !room.game_state) return;
      const state = { ...room.game_state };

      if (cardType === 'nope') {
        if (!state.pendingAction) return;
        const nopeIdx = state.hands[pid].indexOf('nope');
        if (nopeIdx !== -1) {
          state.hands[pid].splice(nopeIdx, 1);
          state.discard.push('nope');
        }
        state.pendingAction.nopeCount += 1;
        state.pendingAction.expiresAt = Date.now() + 3000;
        
        let newEligibleNopers = [];
        Object.entries(state.hands).forEach(([hpId, hand]) => {
          if (hand.includes('nope')) newEligibleNopers.push(hpId);
        });
        state.pendingAction.eligibleNopers = newEligibleNopers;
        state.pendingAction.declinedNopers = [];

        if (newEligibleNopers.length === 0) {
           if (state.pendingAction.nopeCount % 2 !== 0) {
             state.lastAction = `การเล่นการ์ด ${state.pendingAction.cardType} ถูกหยุดด้วย Nope! 🛑`;
             state.pendingAction = null;
           } else {
             const { cardType: origCard, initiatorId: origPid, targetId: origTarget } = state.pendingAction;
             state.pendingAction = null;
             executeCardAction(state, origCard, origPid, origTarget);
           }
        } else {
           state.lastAction = `${myName} โยนการ์ด Nope! ขัดจังหวะ 🛑`;
        }
        await getSupabase().from('rooms').update({ game_state: state }).eq('code', code);
        return;
      }

      if (cardType === 'decline-nope') {
        if (!state.pendingAction) return;
        if (!state.pendingAction.declinedNopers) state.pendingAction.declinedNopers = [];
        
        if (!state.pendingAction.declinedNopers.includes(pid)) {
           state.pendingAction.declinedNopers.push(pid);
        }

        const eligible = state.pendingAction.eligibleNopers || [];
        if (state.pendingAction.declinedNopers.length >= eligible.length) {
           if (state.pendingAction.nopeCount % 2 !== 0) {
             state.lastAction = `การเล่นการ์ด ${state.pendingAction.cardType} ถูกหยุดด้วย Nope! 🛑`;
             state.pendingAction = null;
           } else {
             const { cardType: origCard, initiatorId: origPid, targetId: origTarget } = state.pendingAction;
             state.pendingAction = null;
             executeCardAction(state, origCard, origPid, origTarget);
           }
        }
        await getSupabase().from('rooms').update({ game_state: state }).eq('code', code);
        return;
      }

      if (state.currentPlayerId !== pid && cardType !== 'resolve-pending') return;

      if (cardType === 'see-future-done') {
        state.futureCards = null;
        await getSupabase().from('rooms').update({ game_state: state }).eq('code', code);
        return;
      }
      if (cardType === 'share-future-done') {
        state.sharedFutureCards = null;
        await getSupabase().from('rooms').update({ game_state: state }).eq('code', code);
        return;
      }
      if (cardType === 'alter-future-done') {
        // targetPlayerId holds the new ordered array for top 3
        state.deck.splice(0, targetPlayerId.length, ...targetPlayerId);
        state.alterFutureCards = null;
        await getSupabase().from('rooms').update({ game_state: state }).eq('code', code);
        return;
      }
      if (cardType === 'pair') {
        const { targetId, cardIndexes } = targetPlayerId;
        const targetName = pls.find(p => p.id === targetId)?.name || '???';
        
        const sortedIndices = [...cardIndexes].sort((a, b) => b - a);
        const card1 = state.hands[pid][sortedIndices[0]];
        const card2 = state.hands[pid][sortedIndices[1]];
        state.hands[pid].splice(sortedIndices[0], 1);
        state.hands[pid].splice(sortedIndices[1], 1);
        
        state.discard.push(card1, card2);
        
        const targetHand = state.hands[targetId];
        if (targetHand && targetHand.length > 0) {
            const rIdx = Math.floor(Math.random() * targetHand.length);
            const stolenCard = targetHand.splice(rIdx, 1)[0];
            state.hands[pid].push(stolenCard);
        }
        
        state.lastAction = `${myName} ใช้คอมโบไพ่คู่ ขโมยการ์ดแบบสุ่ม 1 ใบจาก ${targetName} 🐾`;
        await getSupabase().from('rooms').update({ game_state: state }).eq('code', code);
        return;
      }
      
      const executeCardAction = (execState, cType, execPid, execTargetId) => {
        const execName = pls.find(p => p.id === execPid)?.name || '???';
        const execTargetName = pls.find(p => p.id === execTargetId)?.name || '???';
        
        if (cType === 'skip') {
          if (execState.attacksRemaining > 0) {
            execState.attacksRemaining -= 1;
            if (execState.attacksRemaining === 0) advanceKittensTurn(execState);
          } else {
            advanceKittensTurn(execState);
          }
          execState.lastAction = `${execName} เล่นการ์ด ข้าม 🏃`;
        } 
        else if (cType === 'super-skip') {
          execState.attacksRemaining = 0;
          advanceKittensTurn(execState);
          execState.lastAction = `${execName} เล่นการ์ด ซูเปอร์ข้าม 🚀`;
        }
        else if (cType === 'attack') {
          const dir = execState.turnDirection || 1;
          let nextIdx = execState.currentTurnIdx;
          do {
            nextIdx = (nextIdx + dir + execState.turnOrder.length) % execState.turnOrder.length;
          } while (execState.eliminated.includes(execState.turnOrder[nextIdx]));
          
          const targetId = execState.turnOrder[nextIdx];
          const targetName = pls.find(p => p.id === targetId)?.name || '???';
          
          execState.attacksRemaining = (execState.attacksRemaining || 0) + 2;
          advanceKittensTurn(execState);
          execState.lastAction = `${execName} เล่นการ์ด โจมตี 💥 ส่งเทิร์นให้ ${targetName}`;
        } 
        else if (cType === 'targeted-attack') {
          execState.attacksRemaining = (execState.attacksRemaining || 0) + 2;
          const targetIdx = execState.turnOrder.indexOf(execTargetId);
          if (targetIdx !== -1) {
            execState.currentTurnIdx = targetIdx;
            execState.currentPlayerId = execTargetId;
          }
          execState.lastAction = `${execName} เล่นการ์ด โจมตีระบุเป้าหมาย 💥 ใส่ ${execTargetName}`;
        }
        else if (cType === 'personal-attack') {
          execState.attacksRemaining = (execState.attacksRemaining || 0) + 3;
          execState.lastAction = `${execName} เล่นการ์ด โจมตีตัวเอง 🎯`;
        }
        else if (cType === 'reverse') {
          execState.turnDirection = (execState.turnDirection || 1) * -1;
          if (execState.attacksRemaining > 0) {
            execState.attacksRemaining -= 1;
            if (execState.attacksRemaining === 0) advanceKittensTurn(execState);
          } else {
            advanceKittensTurn(execState);
          }
          execState.lastAction = `${execName} เล่นการ์ด ย้อนกลับ 🔄`;
        }
        else if (cType === 'draw-from-bottom') {
          const drawnCard = execState.deck.pop();
          if (drawnCard === 'kitten' || drawnCard === 'imploding-kitten-face-up') {
            execState.pendingKitten = { player_id: execPid, card: drawnCard };
            execState.lastAction = `${execName} จั่วจากล่างสุด... ได้ระเบิด! 🙀`;
          } else if (drawnCard === 'imploding-kitten') {
            execState.pendingKitten = { player_id: execPid, card: drawnCard };
            execState.lastAction = `${execName} จั่วได้ระเบิดหงายหน้า! ต้องใส่กลับลงกอง 💣`;
          } else {
            execState.hands[execPid].push(drawnCard);
            if (execState.attacksRemaining > 0) {
              execState.attacksRemaining -= 1;
              if (execState.attacksRemaining === 0) advanceKittensTurn(execState);
            } else {
              advanceKittensTurn(execState);
            }
            execState.lastAction = `${execName} เล่นการ์ด จั่วจากล่างสุด ⬇️ ขึ้นมือ 1 ใบ`;
          }
        }
        else if (cType === 'swap-top-bottom') {
          if (execState.deck.length > 1) {
            const top = execState.deck.shift();
            const bottom = execState.deck.pop();
            execState.deck.unshift(bottom);
            execState.deck.push(top);
          }
          execState.lastAction = `${execName} เล่นการ์ด สลับบนล่าง ↕️`;
        }
        else if (cType === 'see-future') {
          execState.futureCards = execState.deck.slice(0, 3);
          execState.lastAction = `${execName} เล่นการ์ด มองเห็นอนาคต 🔮`;
        }
        else if (cType === 'alter-future') {
          execState.alterFutureCards = execState.deck.slice(0, 3);
          execState.lastAction = `${execName} เล่นการ์ด แก้ไขอนาคต ✨`;
        }
        else if (cType === 'share-future') {
          execState.sharedFutureCards = execState.deck.slice(0, 3);
          execState.lastAction = `${execName} เปิดอนาคตให้ทุกคนร่วมชะตากรรม 👁️`;
        }
        else if (cType === 'shuffle') {
          for (let i = execState.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [execState.deck[i], execState.deck[j]] = [execState.deck[j], execState.deck[i]];
          }
          execState.lastAction = `${execName} เล่นการ์ด สับไพ่ 🔀`;
        } 
        else if (cType === 'favor') {
          execState.favorRequest = {
            requesterId: execPid,
            targetId: execTargetId,
            resolved: false
          };
          execState.lastAction = `${execName} เล่นการ์ด ขอความช่วยเหลือ 🤝 จาก ${execTargetName}`;
        }
      };

      if (cardType === 'resolve-pending') {
        if (!state.pendingAction) return;
        
        if (state.pendingAction.nopeCount % 2 !== 0) {
          state.lastAction = `การเล่นการ์ด ${state.pendingAction.cardType} ถูกหยุดด้วย Nope! 🛑`;
          state.pendingAction = null;
        } else {
          const { cardType: origCard, initiatorId: origPid, targetId: origTarget } = state.pendingAction;
          state.pendingAction = null;
          executeCardAction(state, origCard, origPid, origTarget);
        }
        await getSupabase().from('rooms').update({ game_state: state }).eq('code', code);
        return;
      }

      const cardIdx = state.hands[pid].indexOf(cardType);
      if (cardIdx === -1) return;
      state.hands[pid].splice(cardIdx, 1);

      state.discard.push(cardType);

      // Buffer action if it's noped-able and someone has a nope
      const nonNopeable = ['defuse', 'zombie-kitten'];
      
      let eligibleNopers = [];
      Object.entries(state.hands).forEach(([hpId, hand]) => {
        if (hand.includes('nope')) eligibleNopers.push(hpId);
      });

      if (!nonNopeable.includes(cardType) && eligibleNopers.length > 0) {
        state.pendingAction = {
          initiatorId: pid,
          cardType,
          targetId: targetPlayerId,
          nopeCount: 0,
          expiresAt: Date.now() + 3000,
          eligibleNopers,
          declinedNopers: []
        };
        state.lastAction = `${myName} กำลังใช้การ์ด ${cardType} ⏱️...`;
      } else {
        // Execute instantly
        executeCardAction(state, cardType, pid, targetPlayerId);
      }

      await getSupabase().from('rooms').update({ game_state: state }).eq('code', code);
    } catch (err) {
      console.error('handleKittensPlayCard error:', err);
    }
  }

  async function handleKittensDrawCard() {
    const code = roomCodeRef.current;
    const pid = myId.current;
    const pls = playersRef.current;
    const myName = pls.find(p => p.id === pid)?.name || '???';

    try {
      const { data: room } = await getSupabase().from('rooms').select('game_state').eq('code', code).single();
      if (!room || !room.game_state) return;
      const state = { ...room.game_state };

      if (state.currentPlayerId !== pid) return;

      const drawnCard = state.deck.shift();
      if (!drawnCard) return;

      if (drawnCard === 'kitten' || drawnCard === 'imploding-kitten-face-up') {
        const hasStreaking = state.hands[pid].includes('streaking-kitten');
        if (drawnCard === 'kitten' && hasStreaking) {
            state.hands[pid].push('kitten');
            state.lastAction = `${myName} จั่วได้แมวระเบิด แต่รอดตายเพราะมี Streaking Kitten! 🙀🔥`;
            if (state.attacksRemaining > 0) {
              state.attacksRemaining -= 1;
              if (state.attacksRemaining === 0) advanceKittensTurn(state);
            } else {
              advanceKittensTurn(state);
            }
        } else {
            state.pendingKitten = {
              player_id: pid,
              card: drawnCard
            };
            state.lastAction = drawnCard === 'kitten' ? `${myName} จั่วได้การ์ดแมวระเบิด! 🙀` : `${myName} จั่วโดนแมวระเบิดหงายหน้า! (Imploding Kitten) ตายทันที! 💣`;
        }
      } else if (drawnCard === 'imploding-kitten') {
        state.pendingKitten = {
          player_id: pid,
          card: 'imploding-kitten'
        };
        state.lastAction = `${myName} จั่วได้แมวระเบิดหงายหน้า! ต้องใส่กลับลงกอง 💣`;
      } else {
        state.hands[pid].push(drawnCard);
        
        if (state.attacksRemaining > 0) {
          state.attacksRemaining -= 1;
          if (state.attacksRemaining === 0) {
            advanceKittensTurn(state);
          }
        } else {
          advanceKittensTurn(state);
        }
        
        state.lastAction = `${myName} จั่วการ์ดขึ้นมือ 1 ใบ`;
      }

      await getSupabase().from('rooms').update({ game_state: state }).eq('code', code);
    } catch (err) {
      console.error('handleKittensDrawCard error:', err);
    }
  }

  async function handleKittensDefuseKitten(insertIndex, defuseCardType = 'defuse', reviveTargetId = null) {
    const code = roomCodeRef.current;
    const pid = myId.current;
    const pls = playersRef.current;
    const myName = pls.find(p => p.id === pid)?.name || '???';

    try {
      const { data: room } = await getSupabase().from('rooms').select('game_state').eq('code', code).single();
      if (!room || !room.game_state) return;
      const state = { ...room.game_state };

      if (state.pendingKitten?.player_id !== pid) return;

      const pendingCard = state.pendingKitten.card;
      state.pendingKitten = null;

      if (insertIndex === -1) {
        state.discard.push(...(state.hands[pid] || []));
        state.hands[pid] = [];
        
        state.eliminated.push(pid);
        state.lastAction = `${myName} โดนระเบิดตูม! ตกรอบ 💀`;
        state.attacksRemaining = 0;

        const alive = state.turnOrder.filter(id => !state.eliminated.includes(id));
        if (alive.length === 1) {
          const winnerId = alive[0];
          const winnerName = pls.find(p => p.id === winnerId)?.name || '???';
          
          await getSupabase().from('rooms').update({
            phase: 'result',
            result: {
              winner: winnerId,
              winnerName,
              eliminationHistory: state.eliminated,
              players: pls
            },
            game_state: state
          }).eq('code', code);
          return;
        } else {
          advanceKittensTurn(state);
        }
      } else {
        if (pendingCard === 'imploding-kitten') {
          state.deck.splice(insertIndex, 0, 'imploding-kitten-face-up');
        } else if (pendingCard === 'kitten') {
          const defuseIdx = state.hands[pid].indexOf(defuseCardType);
          if (defuseIdx !== -1) {
            state.hands[pid].splice(defuseIdx, 1);
            state.discard.push(defuseCardType);
          }
          
          if (defuseCardType === 'zombie-kitten' && reviveTargetId) {
             state.eliminated = state.eliminated.filter(id => id !== reviveTargetId);
             const revivedName = pls.find(p => p.id === reviveTargetId)?.name || 'ใครบางคน';
             state.lastAction = `${myName} รอดตาย และใช้พลังชุบชีวิต ${revivedName} กลับมา! 🧟`;
          }

          state.deck.splice(insertIndex, 0, 'kitten');
        }

        if (state.attacksRemaining > 0) {
          state.attacksRemaining -= 1;
          if (state.attacksRemaining === 0) {
            advanceKittensTurn(state);
          }
        } else {
          advanceKittensTurn(state);
        }
      }

      await getSupabase().from('rooms').update({ game_state: state }).eq('code', code);
    } catch (err) {
      console.error('handleKittensDefuseKitten error:', err);
    }
  }

  async function handleKittensGiveFavor(cardType) {
    const code = roomCodeRef.current;
    const pid = myId.current;
    const pls = playersRef.current;

    try {
      const { data: room } = await getSupabase().from('rooms').select('game_state').eq('code', code).single();
      if (!room || !room.game_state) return;
      const state = { ...room.game_state };

      if (!state.favorRequest || state.favorRequest.targetId !== pid) return;

      const requesterId = state.favorRequest.requesterId;
      const giverName = pls.find(p => p.id === pid)?.name || '???';
      const receiverName = pls.find(p => p.id === requesterId)?.name || '???';

      const cardIdx = state.hands[pid].indexOf(cardType);
      if (cardIdx === -1) return;
      state.hands[pid].splice(cardIdx, 1);

      state.hands[requesterId].push(cardType);

      state.favorRequest = null;
      state.lastAction = `${giverName} มอบการ์ด ${KITTENS_CARDS[cardType]?.label || cardType} ให้แก่ ${receiverName} 🤝`;

      await getSupabase().from('rooms').update({ game_state: state }).eq('code', code);
    } catch (err) {
      console.error('handleKittensGiveFavor error:', err);
    }
  }

  async function handlePlayAgain() {
    const code = roomCodeRef.current;
    if (!code) return;

    try {
      // Find the original room creator (the one who joined first)
      const { data: remaining } = await getSupabase()
        .from('players').select('id')
        .eq('room_code', code)
        .order('created_at', { ascending: true })
        .limit(1);

      const creatorId = remaining?.[0]?.id;

      const roomUpdatePayload = {
        phase: 'lobby',
        word: null, category: null,
        roles: {},
        insider_id: null, insider_name: null,
        timer_started_at: null,
        spy_id: null, spy_name: null,
        spyfall_location: null, spyfall_location_label: null,
        spyfall_vote_active: false,
        spyfall_vote_caller: null, spyfall_vote_target: null,
        spyfall_votes: {},
        word_choices: null,
        result: null,
      };

      if (creatorId) {
        roomUpdatePayload.dm_id = creatorId;
      }

      // Idempotent: only update if room is still in a result phase.
      // Multiple players may call this simultaneously — first one wins,
      // the rest match 0 rows (harmless).
      const { data: updatedRoom, error: updateErr } = await getSupabase().from('rooms')
        .update(roomUpdatePayload)
        .eq('code', code)
        .in('phase', ['result', 'spyfall-result'])
        .select();

      if (updateErr) {
        console.error('handlePlayAgain update error:', updateErr);
      }

      // Only the caller who successfully transitions the phase updates players config
      if (updatedRoom && updatedRoom.length > 0 && creatorId) {
        await getSupabase().from('players')
          .update({ is_dm: false })
          .eq('room_code', code).eq('is_dm', true);

        await getSupabase().from('players')
          .update({ is_dm: true })
          .eq('room_code', code).eq('id', creatorId);
      }

      // Force local state transition immediately (don't rely solely on Realtime)
      setPhase('lobby');
      setMyRole(null);
      setWord(null);
      setCategory(null);
      setResult(null);
      setTimerStartedAt(null);
      setError('');
      setSpyfallLocation(null);
      setSpyfallLocationKey(null);
      setSpyfallLocations([]);
      setSpyfallVoteInfo(null);
      setSpyfallLastChance(null);
      setWordChoices(null);
      timeUpFiredRef.current = false;

      await fetchPlayers(code);

      // Keep room session valid for auto-rejoin on page refresh
      saveRoomSession({ roomCode: code, playerName: getSessionName() });
    } catch (err) {
      console.error('handlePlayAgain error:', err);
    }
  }

  // Keep ref in sync so countdown effect always calls the latest version
  handlePlayAgainRef.current = handlePlayAgain;

  async function handleLeaveRoom() {
    const pid = myId.current;
    const code = roomCodeRef.current;
    if (!code) return;

    const currentGameId = gameId; // preserve game type for room browser

    try {
      // Remove this player from the room
      await getSupabase().from('players').delete()
        .eq('id', pid).eq('room_code', code);

      // Check how many players remain
      const { data: remaining } = await getSupabase()
        .from('players').select('id, name, is_dm')
        .eq('room_code', code)
        .order('created_at', { ascending: true });

      if (!remaining || remaining.length === 0) {
        // Last player left → delete the room entirely
        await getSupabase().from('rooms').delete().eq('code', code);
      } else if (isDM) {
        // DM left but others remain → transfer DM to the first remaining player
        const newDM = remaining[0];
        await getSupabase().from('players')
          .update({ is_dm: true })
          .eq('room_code', code).eq('id', newDM.id);
        // Update room's dm_id and reset to lobby so others can continue
        await getSupabase().from('rooms').update({
          dm_id: newDM.id,
          phase: 'lobby',
          word: null, category: null,
          roles: {},
          insider_id: null, insider_name: null,
          timer_started_at: null,
          spy_id: null, spy_name: null,
          spyfall_location: null, spyfall_location_label: null,
          spyfall_vote_active: false,
          spyfall_votes: {},
          result: null,
        }).eq('code', code);
      }
    } catch (err) {
      console.error('handleLeaveRoom error:', err);
    }

    // Reset room state but go to Home (room browser), NOT gameSelect
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setCountdown(null);
    setRoomCode('');
    setIsDM(false);
    setPlayers([]);
    setMyRole(null);
    setWord(null);
    setCategory(null);
    setTimerTotal(300);
    setTimerStartedAt(null);
    setTimeRemaining(300);
    setTimerSetting(300);
    setResult(null);
    setError('');
    setSpyfallLocation(null);
    setSpyfallLocationKey(null);
    setSpyfallLocations([]);
    setSpyfallVoteInfo(null);
    setSpyfallLastChance(null);
    setWordChoices(null);
    roomRef.current = null;
    roomCodeRef.current = '';
    timeUpFiredRef.current = false;
    playAgainFiredRef.current = false;
    clearRoomSession();

    // Stay on the Home screen so the room browser is visible
    setGameId(currentGameId);
    setPhase('home');
  }

  // ══════════════════════════════════════════════
  //  Render
  // ══════════════════════════════════════════════
  const isSpyfall = gameId === 'spyfall';
  const isKittens = gameId === 'exploding-kittens';
  const timerPaused = timerStartedAt !== null && timerStartedAt < 0;
  const shared = { isDM, players, word, category, error, roomCode, playerName };

  // Compute vote info with player names
  const computedVoteInfo = spyfallVoteInfo ? {
    ...spyfallVoteInfo,
    callerName: players.find(p => p.id === spyfallVoteInfo.callerId)?.name || '???',
    targetName: players.find(p => p.id === spyfallVoteInfo.targetId)?.name || '???',
    totalPlayers: players.length,
  } : null;

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          {phase !== 'gameSelect' && (
            <button className="header-back" onClick={handleLeaveRoom}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          )}
          <span className="header-title">Board Game</span>
        </div>
        {roomCode && <span className="header-room">{roomCode}</span>}
      </header>

      <main className="main">
        <AnimatePresence mode="wait">
          {phase === 'gameSelect' && (
            <GameSelect key="gameSelect" onSelect={handleSelectGame} />
          )}
          {phase === 'home' && (
            <Home
              key="home"
              gameId={gameId}
              onCreateRoom={handleCreateRoom}
              onJoinRoom={handleJoinRoom}
              onBack={() => setPhase('gameSelect')}
              error={error}
            />
          )}
          {phase === 'lobby' && (
            <Lobby
              key="lobby"
              {...shared}
              gameId={gameId}
              timerSetting={timerSetting}
              difficulty={difficulty}
              dmMode={dmMode}
              wordPick={wordPick}
              gameState={roomRef.current?.game_state}
              onSetTimer={handleSetTimer}
              onSetDifficulty={handleSetDifficulty}
              onSetDmMode={handleSetDmMode}
              onSetWordPick={handleSetWordPick}
              bannedDMs={bannedDMs}
              onToggleBanDM={handleToggleBanDM}
              onSetKittensSetting={handleSetKittensSetting}
              onStartGame={handleStartGame}
              onChangeName={handleChangeName}
            />
          )}

          {/* ── Word-pick phase (Insider only) ── */}
          {phase === 'word-pick' && (
            <WordPick
              key="word-pick"
              isDM={isDM}
              choices={wordChoices}
              onPickWord={handlePickWord}
            />
          )}

          {/* ── Insider phases ── */}
          {phase === 'playing' && !isSpyfall && !isKittens && (
            <Playing
              key="playing"
              {...shared}
              role={myRole}
              timerTotal={timerTotal}
              timeRemaining={timeRemaining}
              timerPaused={timerPaused}
              onPauseTimer={handlePauseTimer}
              onResumeTimer={handleResumeTimer}
              onGuessCorrect={handleGuessCorrect}
            />
          )}
          {phase === 'playing' && isKittens && kittensState && (
            <KittensPlaying
              key="kittens-playing"
              gameState={kittensState}
              myId={myId.current}
              players={players}
              onPlayCard={handleKittensPlayCard}
              onDrawCard={handleKittensDrawCard}
              onDefuseKitten={handleKittensDefuseKitten}
              onGiveFavor={handleKittensGiveFavor}
            />
          )}
          {phase === 'discussion' && (
            <Discussion
              key="discussion"
              {...shared}
              result={result}
              onRevealInsider={handleRevealInsider}
            />
          )}
          {phase === 'result' && !isSpyfall && !isKittens && (
            <Result
              key="result"
              {...shared}
              result={result}
              myRole={myRole}
              countdown={countdown}
            />
          )}
          {phase === 'result' && !isSpyfall && isKittens && (
            <KittensResult
              key="kittens-result"
              result={result}
              countdown={countdown}
            />
          )}

          {/* ── Spyfall phases ── */}
          {phase === 'playing' && isSpyfall && (
            <SpyfallPlaying
              key="spyfall-playing"
              role={myRole}
              location={spyfallLocation}
              locationKey={spyfallLocationKey}
              locations={spyfallLocations}
              timerTotal={timerTotal}
              timeRemaining={timeRemaining}
              timerPaused={timerPaused}
              players={players}
              myId={myId.current}
              isDM={isDM}
              onPauseTimer={handlePauseTimer}
              onResumeTimer={handleResumeTimer}
              onCallVote={handleCallVote}
              onSpyGuess={handleSpyGuessLocation}
            />
          )}
          {phase === 'spyfall-voting' && (
            <SpyfallVoting
              key="spyfall-voting"
              voteInfo={computedVoteInfo}
              players={players}
              myId={myId.current}
              onCastVote={handleCastVote}
            />
          )}
          {phase === 'spyfall-last-chance' && (
            <SpyfallLastChance
              key="spyfall-last-chance"
              spy={spyfallLastChance?.spy}
              locations={spyfallLastChance?.locations || spyfallLocations}
              isSpy={myRole === 'Spy'}
              onLastGuess={handleSpyLastGuess}
            />
          )}
          {phase === 'spyfall-result' && (
            <SpyfallResult
              key="spyfall-result"
              result={result}
              isDM={isDM}
              myRole={myRole}
              countdown={countdown}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
