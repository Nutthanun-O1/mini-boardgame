'use client';

import { useState, useEffect, useCallback } from 'react';
import GameSelect from '@/components/GameSelect';
import Lobby from '@/components/Lobby';
import Playing from '@/components/Playing';
import Discussion from '@/components/Discussion';
import Result from '@/components/Result';
import SpyfallPlaying from '@/components/SpyfallPlaying';
import SpyfallVoting from '@/components/SpyfallVoting';
import SpyfallLastChance from '@/components/SpyfallLastChance';
import SpyfallResult from '@/components/SpyfallResult';

const INSIDER_ROLES = ['Master', 'Insider', 'Common'];
const SPYFALL_ROLES = ['Spy', 'Agent'];

const INSIDER_PHASES = ['gameSelect', 'lobby', 'playing', 'discussion', 'result'];
const SPYFALL_PHASES = ['gameSelect', 'lobby', 'playing', 'spyfall-voting', 'spyfall-last-chance', 'spyfall-result'];

const MOCK_PLAYERS = [
  { id: '1', name: 'DevUser', isDM: true },
  { id: '2', name: 'Alice', isDM: false },
  { id: '3', name: 'Bob', isDM: false },
  { id: '4', name: 'Charlie', isDM: false },
];

const MOCK_INSIDER_ROLES = { '1': 'Master', '2': 'Insider', '3': 'Common', '4': 'Common' };
const MOCK_SPYFALL_ROLES = { '1': 'Spy', '2': 'Agent', '3': 'Agent', '4': 'Agent' };

const MOCK_LOCATIONS = [
  { key: 'school', label: 'โรงเรียน' },
  { key: 'hospital', label: 'โรงพยาบาล' },
  { key: 'airport', label: 'สนามบิน' },
  { key: 'beach', label: 'ชายหาด' },
  { key: 'casino', label: 'คาสิโน' },
  { key: 'supermarket', label: 'ซูเปอร์มาร์เก็ต' },
  { key: 'restaurant', label: 'ร้านอาหาร' },
  { key: 'spaceship', label: 'ยานอวกาศ' },
  { key: 'submarine', label: 'เรือดำน้ำ' },
  { key: 'zoo', label: 'สวนสัตว์' },
  { key: 'temple', label: 'วัด' },
  { key: 'bank', label: 'ธนาคาร' },
  { key: 'circus', label: 'ละครสัตว์' },
  { key: 'pirate_ship', label: 'เรือโจรสลัด' },
  { key: 'police_station', label: 'สถานีตำรวจ' },
  { key: 'movie_studio', label: 'สตูดิโอถ่ายหนัง' },
  { key: 'train', label: 'รถไฟ' },
  { key: 'amusement_park', label: 'สวนสนุก' },
  { key: 'university', label: 'มหาวิทยาลัย' },
  { key: 'hotel', label: 'โรงแรม' },
];

export default function DevPage() {
  const [game, setGame] = useState('insider'); // 'insider' | 'spyfall'
  const [phase, setPhase] = useState('playing');
  const [role, setRole] = useState('Master');
  const [isDM, setIsDM] = useState(true);
  const [timer, setTimer] = useState(180);

  const isSpyfall = game === 'spyfall';
  const roles = isSpyfall ? SPYFALL_ROLES : INSIDER_ROLES;
  const phases = isSpyfall ? SPYFALL_PHASES : INSIDER_PHASES;

  const word = role === 'Common' ? null : 'แมว';
  const category = 'สัตว์';

  // auto-tick timer in playing phase
  useEffect(() => {
    if (phase !== 'playing') return;
    const id = setInterval(() => setTimer(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const resetTimer = useCallback(() => setTimer(180), []);

  const cycleRole = useCallback(() => {
    const currentRoles = isSpyfall ? SPYFALL_ROLES : INSIDER_ROLES;
    setRole(prev => {
      const idx = currentRoles.indexOf(prev);
      const next = currentRoles[(idx + 1) % currentRoles.length];
      setIsDM(isSpyfall ? true : next === 'Master');
      return next;
    });
  }, [isSpyfall]);

  function switchGame(g) {
    setGame(g);
    const firstRole = g === 'spyfall' ? 'Spy' : 'Master';
    setRole(firstRole);
    setIsDM(true);
    setPhase('playing');
    resetTimer();
  }

  const shared = {
    isDM,
    players: MOCK_PLAYERS,
    word: 'แมว',
    category,
    error: '',
    roomCode: 'TEST',
    playerName: 'DevUser',
  };

  const mockInsiderResult = {
    word: 'แมว',
    category,
    insider: 'Alice',
    insiderId: '2',
    gamePlayers: MOCK_PLAYERS,
    roles: MOCK_INSIDER_ROLES,
    timeUsed: 120,
  };

  const mockSpyfallResult = {
    winner: 'players',
    reason: 'spy-caught',
    spy: 'DevUser',
    spyId: '1',
    location: 'โรงเรียน',
    locationKey: 'school',
    players: MOCK_PLAYERS,
    roles: MOCK_SPYFALL_ROLES,
  };

  const mockVoteInfo = {
    callerId: '2',
    callerName: 'Alice',
    targetId: '1',
    targetName: 'DevUser',
    votes: { '2': true },
    totalPlayers: 4,
  };

  return (
    <div className="app">
      {/* ── Dev Toolbar ── */}
      <div className="dev-toolbar">
        <span className="dev-toolbar__badge">DEV</span>

        <div className="dev-toolbar__group">
          <label className="dev-toolbar__label">Game</label>
          <select
            className="dev-toolbar__select"
            value={game}
            onChange={e => switchGame(e.target.value)}
          >
            <option value="insider">Insider</option>
            <option value="spyfall">Spyfall</option>
          </select>
        </div>

        <div className="dev-toolbar__group">
          <label className="dev-toolbar__label">Phase</label>
          <select
            className="dev-toolbar__select"
            value={phase}
            onChange={e => {
              setPhase(e.target.value);
              if (e.target.value === 'playing') resetTimer();
            }}
          >
            {phases.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="dev-toolbar__group">
          <label className="dev-toolbar__label">Role</label>
          <button className="dev-toolbar__btn" onClick={cycleRole}>
            {role}
          </button>
        </div>

        <div className="dev-toolbar__group">
          <label className="dev-toolbar__label">DM</label>
          <button
            className={`dev-toolbar__toggle ${isDM ? 'dev-toolbar__toggle--on' : ''}`}
            onClick={() => setIsDM(v => !v)}
          >
            {isDM ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* ── Header ── */}
      <header className="header">
        <div className="header-left">
          <span className="header-title">Board Game</span>
        </div>
        <span className="header-room">TEST</span>
      </header>

      {/* ── Main Content ── */}
      <main className="main">
        {phase === 'gameSelect' && (
          <GameSelect onSelect={(id) => { switchGame(id); setPhase('lobby'); }} />
        )}

        {phase === 'lobby' && (
          <Lobby
            {...shared}
            timerSetting={300}
            onSetTimer={() => {}}
            onStartGame={() => { resetTimer(); setPhase('playing'); }}
          />
        )}

        {/* ── Insider Phases ── */}
        {phase === 'playing' && !isSpyfall && (
          <Playing
            {...shared}
            word={word}
            role={role}
            timerTotal={180}
            timeRemaining={timer}
            onGuessCorrect={() => setPhase('discussion')}
          />
        )}

        {phase === 'discussion' && (
          <Discussion
            {...shared}
            result={{ timeUsed: 120 }}
            onRevealInsider={() => setPhase('result')}
          />
        )}

        {phase === 'result' && !isSpyfall && (
          <Result
            {...shared}
            result={mockInsiderResult}
            myRole={role}
            onPlayAgain={() => { resetTimer(); setPhase('playing'); }}
          />
        )}

        {/* ── Spyfall Phases ── */}
        {phase === 'playing' && isSpyfall && (
          <SpyfallPlaying
            role={role}
            location={role === 'Spy' ? null : 'โรงเรียน'}
            locationKey={role === 'Spy' ? null : 'school'}
            locations={MOCK_LOCATIONS}
            timerTotal={180}
            timeRemaining={timer}
            players={MOCK_PLAYERS}
            myId="1"
            onCallVote={(targetId) => setPhase('spyfall-voting')}
            onSpyGuess={(key) => setPhase('spyfall-result')}
          />
        )}

        {phase === 'spyfall-voting' && (
          <SpyfallVoting
            voteInfo={mockVoteInfo}
            players={MOCK_PLAYERS}
            myId="1"
            onCastVote={(agree) => setPhase(agree ? 'spyfall-last-chance' : 'playing')}
          />
        )}

        {phase === 'spyfall-last-chance' && (
          <SpyfallLastChance
            spy="DevUser"
            locations={MOCK_LOCATIONS}
            isSpy={role === 'Spy'}
            onLastGuess={(key) => setPhase('spyfall-result')}
          />
        )}

        {phase === 'spyfall-result' && (
          <SpyfallResult
            result={mockSpyfallResult}
            isDM={isDM}
            myRole={role}
            onPlayAgain={() => { resetTimer(); setPhase('playing'); }}
          />
        )}
      </main>
    </div>
  );
}
