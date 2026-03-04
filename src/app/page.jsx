'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getSupabase, getPlayerId } from '@/lib/supabase';
import {
  generateRoomCode, pickWord, pickWordChoices, pickSpyfallLocation,
  ALL_SPYFALL_LOCATIONS, spyfallLocations as spyfallLocMap,
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

export default function Page() {
  // ── State ──
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

  // ── Spyfall-specific state ──
  const [spyfallLocation, setSpyfallLocation] = useState(null);
  const [spyfallLocationKey, setSpyfallLocationKey] = useState(null);
  const [spyfallLocations, setSpyfallLocations] = useState([]);
  const [spyfallVoteInfo, setSpyfallVoteInfo] = useState(null);
  const [spyfallLastChance, setSpyfallLastChance] = useState(null);

  // ── Refs (for latest values inside intervals / callbacks) ──
  const myId = useRef(null);
  const roomRef = useRef(null);
  const playersRef = useRef([]);
  const roomCodeRef = useRef('');
  const isDMRef = useRef(false);
  const channelRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const timeUpFiredRef = useRef(false);

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

    setGameId(room.game_id);
    setTimerSetting(room.timer_duration);
    setDifficulty(room.difficulty || 'medium');
    setDmMode(room.dm_mode || 'creator');
    setWordPick(room.word_pick || false);
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

        if (room.game_id === 'spyfall') {
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
          alert('DM ออกจากห้องแล้ว');
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

    const tick = () => {
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
  //  Cleanup on page unload (best effort)
  // ══════════════════════════════════════════════
  useEffect(() => {
    const cleanup = () => {
      const pid = myId.current;
      const code = roomCodeRef.current;
      if (!pid || !code) return;
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) return;

      // Use fetch with keepalive to survive page close
      if (isDMRef.current) {
        fetch(`${url}/rest/v1/rooms?code=eq.${code}`, {
          method: 'DELETE', keepalive: true,
          headers: { 'apikey': key, 'Authorization': `Bearer ${key}` },
        });
      } else {
        fetch(`${url}/rest/v1/players?id=eq.${pid}&room_code=eq.${code}`, {
          method: 'DELETE', keepalive: true,
          headers: { 'apikey': key, 'Authorization': `Bearer ${key}` },
        });
      }
    };
    window.addEventListener('beforeunload', cleanup);
    return () => window.removeEventListener('beforeunload', cleanup);
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
    setPhase('gameSelect');
    setGameId(null);
    setRoomCode('');
    setPlayerName('');
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
    timeUpFiredRef.current = false;
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
      setTimerSetting(duration || 300);
      setRoomCode(code); // triggers realtime subscription
      setPhase('lobby');
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

      const { data: existing } = await getSupabase()
        .from('players').select('name').eq('room_code', code).eq('name', name);
      if (existing && existing.length > 0) { setError('ชื่อนี้ถูกใช้แล้ว'); return; }

      const { error: playerErr } = await getSupabase().from('players').insert({
        id: pid, room_code: code, name, is_dm: false,
      });
      if (playerErr) throw playerErr;

      setPlayerName(name);
      setIsDM(false);
      setGameId(room.game_id);
      setTimerSetting(room.timer_duration);
      setRoomCode(code); // triggers realtime subscription
      setPhase('lobby');
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    }
  }

  async function handleSetTimer(duration) {
    setTimerSetting(duration);
    await getSupabase().from('rooms')
      .update({ timer_duration: duration })
      .eq('code', roomCode);
  }

  async function handleSetDifficulty(val) {
    setDifficulty(val);
    await getSupabase().from('rooms')
      .update({ difficulty: val })
      .eq('code', roomCode);
  }

  async function handleSetDmMode(val) {
    setDmMode(val);
    await getSupabase().from('rooms')
      .update({ dm_mode: val })
      .eq('code', roomCode);
  }

  async function handleSetWordPick(val) {
    setWordPick(val);
    await getSupabase().from('rooms')
      .update({ word_pick: val })
      .eq('code', roomCode);
  }

  /**
   * Determine who the DM should be based on dm_mode setting.
   */
  function resolveDM(pls, room) {
    const mode = room.dm_mode || 'creator';
    if (mode === 'creator') {
      return pls.find(p => p.isDM) || pls[0];
    }
    if (mode === 'random') {
      return pls[Math.floor(Math.random() * pls.length)];
    }
    // mode is a specific player ID
    return pls.find(p => p.id === mode) || pls.find(p => p.isDM) || pls[0];
  }

  async function handleStartGame() {
    const room = roomRef.current;
    if (!room) return;
    const pls = playersRef.current;

    if (room.game_id === 'spyfall') {
      // ─── Spyfall start ───
      if (pls.length < 3) { setError('ต้องมีผู้เล่นอย่างน้อย 3 คน'); return; }

      const { locationKey, locationLabel } = pickSpyfallLocation();
      const spyIdx = Math.floor(Math.random() * pls.length);
      const spyPlayer = pls[spyIdx];
      const roles = {};
      pls.forEach(p => { roles[p.id] = p.id === spyPlayer.id ? 'Spy' : 'Agent'; });

      await getSupabase().from('rooms').update({
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
      }).eq('code', roomCode);

    } else {
      // ─── Insider start ───
      if (pls.length < 4) { setError('ต้องมีผู้เล่นอย่างน้อย 4 คน'); return; }

      const diff = room.difficulty || 'medium';
      const dmPlayer = resolveDM(pls, room);
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
        // Remove old DM flag
        await getSupabase().from('players')
          .update({ is_dm: false })
          .eq('room_code', roomCode).eq('is_dm', true);
        // Set new DM
        await getSupabase().from('players')
          .update({ is_dm: true })
          .eq('room_code', roomCode).eq('id', dmPlayer.id);
      }

      if (room.word_pick) {
        // Word-pick mode: go to word-pick phase first
        const choices = pickWordChoices(diff, 6);
        await getSupabase().from('rooms').update({
          phase: 'word-pick',
          word_choices: choices,
          dm_id: dmPlayer.id,
          insider_id: insiderPlayer.id,
          insider_name: insiderPlayer.name,
          roles,
          result: null,
        }).eq('code', roomCode);
      } else {
        // Normal mode: pick word automatically
        const { word: w, category: cat } = pickWord(diff);
        await getSupabase().from('rooms').update({
          phase: 'playing',
          timer_started_at: Date.now(),
          word: w,
          category: cat,
          dm_id: dmPlayer.id,
          insider_id: insiderPlayer.id,
          insider_name: insiderPlayer.name,
          roles,
          result: null,
        }).eq('code', roomCode);
      }
    }
  }

  /**
   * DM picks a word during word-pick phase → advance to playing.
   */
  async function handlePickWord({ word: w, category: cat }) {
    await getSupabase().from('rooms').update({
      phase: 'playing',
      timer_started_at: Date.now(),
      word: w,
      category: cat,
      word_choices: null,
    }).eq('code', roomCode);
  }

  async function handleGuessCorrect() {
    const room = roomRef.current;
    if (!room) return;
    const elapsed = Math.floor((Date.now() - room.timer_started_at) / 1000);

    await getSupabase().from('rooms').update({
      phase: 'discussion',
      timer_started_at: null,
      result: {
        word: room.word, category: room.category,
        timeUsed: elapsed,
      },
    }).eq('code', roomCode);
  }

  async function handleRevealInsider() {
    const room = roomRef.current;
    if (!room) return;
    const pls = playersRef.current;

    await getSupabase().from('rooms').update({
      phase: 'result',
      result: {
        word: room.word, category: room.category,
        insider: room.insider_name, insiderId: room.insider_id,
        players: pls, roles: room.roles,
      },
    }).eq('code', roomCode);
  }

  async function handleSpyGuessLocation(locKey) {
    const room = roomRef.current;
    if (!room) return;
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
    }).eq('code', roomCode);
  }

  async function handleCallVote(targetId) {
    const pid = myId.current;
    await getSupabase().from('rooms').update({
      phase: 'spyfall-voting',
      spyfall_vote_active: true,
      spyfall_vote_caller: pid,
      spyfall_vote_target: targetId,
      spyfall_votes: { [pid]: true },
    }).eq('code', roomCode);
  }

  async function handleCastVote(agree) {
    const pid = myId.current;
    const pls = playersRef.current;

    // Fetch latest votes to avoid stale data
    const { data: latest } = await getSupabase()
      .from('rooms')
      .select('spyfall_votes, spyfall_vote_target, spy_id, spy_name, spyfall_location, spyfall_location_label, roles')
      .eq('code', roomCode).single();

    const updatedVotes = { ...(latest.spyfall_votes || {}), [pid]: agree };

    // Update votes
    await getSupabase().from('rooms').update({
      spyfall_votes: updatedVotes,
    }).eq('code', roomCode);

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
          }).eq('code', roomCode);
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
          }).eq('code', roomCode);
        }
      } else {
        // Vote failed → continue playing
        await getSupabase().from('rooms').update({
          phase: 'playing',
          spyfall_vote_active: false,
          spyfall_votes: {},
        }).eq('code', roomCode);
      }
    }
  }

  async function handleSpyLastGuess(locKey) {
    const room = roomRef.current;
    if (!room) return;
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
    }).eq('code', roomCode);
  }

  async function handlePlayAgain() {
    await getSupabase().from('rooms').update({
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
    }).eq('code', roomCode);
  }

  async function handleLeaveRoom() {
    const pid = myId.current;
    if (isDM) {
      await getSupabase().from('rooms').delete().eq('code', roomCode);
    } else {
      await getSupabase().from('players').delete()
        .eq('id', pid).eq('room_code', roomCode);
    }
    doResetAll();
  }

  // ══════════════════════════════════════════════
  //  Render
  // ══════════════════════════════════════════════
  const isSpyfall = gameId === 'spyfall';
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
                <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
          <span className="header-title">Board Game</span>
        </div>
        {roomCode && <span className="header-room">{roomCode}</span>}
      </header>

      <main className="main">
        {phase === 'gameSelect' && (
          <GameSelect onSelect={handleSelectGame} />
        )}
        {phase === 'home' && (
          <Home
            gameId={gameId}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onBack={() => setPhase('gameSelect')}
            error={error}
          />
        )}
        {phase === 'lobby' && (
          <Lobby
            {...shared}
            gameId={gameId}
            timerSetting={timerSetting}
            difficulty={difficulty}
            dmMode={dmMode}
            wordPick={wordPick}
            onSetTimer={handleSetTimer}
            onSetDifficulty={handleSetDifficulty}
            onSetDmMode={handleSetDmMode}
            onSetWordPick={handleSetWordPick}
            onStartGame={handleStartGame}
          />
        )}

        {/* ── Word-pick phase (Insider only) ── */}
        {phase === 'word-pick' && (
          <WordPick
            isDM={isDM}
            choices={wordChoices}
            onPickWord={handlePickWord}
          />
        )}

        {/* ── Insider phases ── */}
        {phase === 'playing' && !isSpyfall && (
          <Playing
            {...shared}
            role={myRole}
            timerTotal={timerTotal}
            timeRemaining={timeRemaining}
            onGuessCorrect={handleGuessCorrect}
          />
        )}
        {phase === 'discussion' && (
          <Discussion
            {...shared}
            result={result}
            onRevealInsider={handleRevealInsider}
          />
        )}
        {phase === 'result' && !isSpyfall && (
          <Result
            {...shared}
            result={result}
            myRole={myRole}
            onPlayAgain={handlePlayAgain}
          />
        )}

        {/* ── Spyfall phases ── */}
        {phase === 'playing' && isSpyfall && (
          <SpyfallPlaying
            role={myRole}
            location={spyfallLocation}
            locationKey={spyfallLocationKey}
            locations={spyfallLocations}
            timerTotal={timerTotal}
            timeRemaining={timeRemaining}
            players={players}
            myId={myId.current}
            onCallVote={handleCallVote}
            onSpyGuess={handleSpyGuessLocation}
          />
        )}
        {phase === 'spyfall-voting' && (
          <SpyfallVoting
            voteInfo={computedVoteInfo}
            players={players}
            myId={myId.current}
            onCastVote={handleCastVote}
          />
        )}
        {phase === 'spyfall-last-chance' && (
          <SpyfallLastChance
            spy={spyfallLastChance?.spy}
            locations={spyfallLastChance?.locations || spyfallLocations}
            isSpy={myRole === 'Spy'}
            onLastGuess={handleSpyLastGuess}
          />
        )}
        {phase === 'spyfall-result' && (
          <SpyfallResult
            result={result}
            isDM={isDM}
            myRole={myRole}
            onPlayAgain={handlePlayAgain}
          />
        )}
      </main>
    </div>
  );
}
