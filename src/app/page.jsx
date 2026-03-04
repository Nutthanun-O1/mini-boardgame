'use client';

import { useState, useEffect } from 'react';
import { socket } from '@/lib/socket';
import GameSelect from '@/components/GameSelect';
import Home from '@/components/Home';
import Lobby from '@/components/Lobby';
import Playing from '@/components/Playing';
import Discussion from '@/components/Discussion';
import Result from '@/components/Result';
import SpyfallPlaying from '@/components/SpyfallPlaying';
import SpyfallVoting from '@/components/SpyfallVoting';
import SpyfallLastChance from '@/components/SpyfallLastChance';
import SpyfallResult from '@/components/SpyfallResult';

export default function Page() {
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
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [timerSetting, setTimerSetting] = useState(300);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // ── Spyfall-specific state ──
  const [spyfallLocation, setSpyfallLocation] = useState(null);
  const [spyfallLocationKey, setSpyfallLocationKey] = useState(null);
  const [spyfallLocations, setSpyfallLocations] = useState([]);
  const [spyfallVoteInfo, setSpyfallVoteInfo] = useState(null);
  const [spyfallLastChance, setSpyfallLastChance] = useState(null);

  useEffect(() => {
    socket.on('room-joined', (data) => {
      setRoomCode(data.code);
      setGameId(data.gameId);
      setIsDM(data.isDM);
      setPlayers(data.players);
      setTimerSetting(data.timerDuration);
      setPhase('lobby');
      setError('');
    });

    socket.on('players-updated', setPlayers);
    socket.on('timer-setting', setTimerSetting);

    socket.on('game-started', (data) => {
      setMyRole(data.role);
      setTimerTotal(data.timerTotal);
      setTimeRemaining(data.timerTotal);
      setPhase('playing');

      if (data.gameId === 'spyfall') {
        setSpyfallLocation(data.location);
        setSpyfallLocationKey(data.locationKey);
        setSpyfallLocations(data.locations || []);
      } else {
        setCategory(data.category);
        setWord(data.word);
      }
    });

    socket.on('timer-tick', setTimeRemaining);

    // ── Insider events ──
    socket.on('word-revealed', (data) => {
      setWord(data.word);
      setCategory(data.category);
      setResult({ timeUsed: data.timeUsed });
      setPhase('discussion');
    });

    socket.on('time-up', (data) => {
      setResult({ ...data, timedOut: true });
      setPhase('result');
    });

    socket.on('insider-revealed', (data) => {
      setResult(data);
      setPhase('result');
    });

    // ── Spyfall events ──
    socket.on('vote-started', (data) => {
      setSpyfallVoteInfo(data);
      setPhase('spyfall-voting');
    });

    socket.on('vote-update', (data) => {
      setSpyfallVoteInfo(prev => prev ? { ...prev, votes: data.votes, totalPlayers: data.totalPlayers } : prev);
    });

    socket.on('vote-failed', (data) => {
      setSpyfallVoteInfo(null);
      setPhase('playing');
    });

    socket.on('spy-caught', (data) => {
      setSpyfallLastChance(data);
      setPhase('spyfall-last-chance');
    });

    socket.on('spyfall-result', (data) => {
      setResult(data);
      setPhase('spyfall-result');
    });

    // ── Common events ──
    socket.on('back-to-lobby', (p) => {
      setPlayers(p);
      setMyRole(null);
      setWord(null);
      setCategory(null);
      setResult(null);
      setSpyfallLocation(null);
      setSpyfallLocationKey(null);
      setSpyfallLocations([]);
      setSpyfallVoteInfo(null);
      setSpyfallLastChance(null);
      setPhase('lobby');
    });

    socket.on('room-closed', () => {
      alert('DM ออกจากห้องแล้ว');
      resetAll();
    });

    socket.on('error-msg', setError);

    return () => socket.removeAllListeners();
  }, []);

  function resetAll() {
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
    setTimeRemaining(300);
    setResult(null);
    setError('');
    setSpyfallLocation(null);
    setSpyfallLocationKey(null);
    setSpyfallLocations([]);
    setSpyfallVoteInfo(null);
    setSpyfallLastChance(null);
  }

  function handleSelectGame(id) {
    setGameId(id);
    setPhase('home');
  }

  function handleCreateRoom(name, duration) {
    setPlayerName(name);
    socket.emit('create-room', { name, gameId, timerDuration: duration });
  }

  function handleJoinRoom(code, name) {
    setPlayerName(name);
    socket.emit('join-room', { code, name });
  }

  function handleSetTimer(d) {
    setTimerSetting(d);
    socket.emit('set-timer', d);
  }

  const isSpyfall = gameId === 'spyfall';
  const shared = { isDM, players, word, category, error, roomCode, playerName };

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          {phase !== 'gameSelect' && (
            <button className="header-back" onClick={resetAll}>
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
            timerSetting={timerSetting}
            onSetTimer={handleSetTimer}
            onStartGame={() => socket.emit('start-game')}
          />
        )}

        {/* ── Insider phases ── */}
        {phase === 'playing' && !isSpyfall && (
          <Playing
            {...shared}
            role={myRole}
            timerTotal={timerTotal}
            timeRemaining={timeRemaining}
            onGuessCorrect={() => socket.emit('guess-correct')}
          />
        )}
        {phase === 'discussion' && (
          <Discussion
            {...shared}
            result={result}
            onRevealInsider={() => socket.emit('reveal-insider')}
          />
        )}
        {phase === 'result' && !isSpyfall && (
          <Result
            {...shared}
            result={result}
            myRole={myRole}
            onPlayAgain={() => socket.emit('play-again')}
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
            myId={socket.id}
            onCallVote={(targetId) => socket.emit('call-vote', { targetId })}
            onSpyGuess={(locationKey) => socket.emit('spy-guess-location', { locationKey })}
          />
        )}
        {phase === 'spyfall-voting' && (
          <SpyfallVoting
            voteInfo={spyfallVoteInfo}
            players={players}
            myId={socket.id}
            onCastVote={(agree) => socket.emit('cast-vote', { agree })}
          />
        )}
        {phase === 'spyfall-last-chance' && (
          <SpyfallLastChance
            spy={spyfallLastChance?.spy}
            locations={spyfallLastChance?.locations || spyfallLocations}
            isSpy={myRole === 'Spy'}
            onLastGuess={(locationKey) => socket.emit('spy-last-guess', { locationKey })}
          />
        )}
        {phase === 'spyfall-result' && (
          <SpyfallResult
            result={result}
            isDM={isDM}
            myRole={myRole}
            onPlayAgain={() => socket.emit('play-again')}
          />
        )}
      </main>
    </div>
  );
}
