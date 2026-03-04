'use client';

import { useState, useEffect, useCallback } from 'react';
import GameSelect from '@/components/GameSelect';
import Lobby from '@/components/Lobby';
import Playing from '@/components/Playing';
import Discussion from '@/components/Discussion';
import Result from '@/components/Result';

const ROLES = ['Master', 'Insider', 'Common'];
const PHASES = ['gameSelect', 'lobby', 'playing', 'discussion', 'result'];

const MOCK_PLAYERS = [
  { id: '1', name: 'DevUser', isDM: true },
  { id: '2', name: 'Alice', isDM: false },
  { id: '3', name: 'Bob', isDM: false },
  { id: '4', name: 'Charlie', isDM: false },
];

const MOCK_ROLES = { '1': 'Master', '2': 'Insider', '3': 'Common', '4': 'Common' };

export default function DevPage() {
  const [phase, setPhase] = useState('playing');
  const [role, setRole] = useState('Master');
  const [isDM, setIsDM] = useState(true);
  const [timer, setTimer] = useState(180);

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
    setRole(prev => {
      const idx = ROLES.indexOf(prev);
      const next = ROLES[(idx + 1) % ROLES.length];
      setIsDM(next === 'Master');
      return next;
    });
  }, []);

  const shared = {
    isDM,
    players: MOCK_PLAYERS,
    word: 'แมว',
    category,
    error: '',
    roomCode: 'TEST',
    playerName: 'DevUser',
  };

  const mockResult = {
    word: 'แมว',
    category,
    insider: 'Alice',
    insiderId: '2',
    gamePlayers: MOCK_PLAYERS,
    roles: MOCK_ROLES,
    timeUsed: 120,
  };

  return (
    <div className="app">
      {/* ── Dev Toolbar ── */}
      <div className="dev-toolbar">
        <span className="dev-toolbar__badge">DEV</span>

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
            {PHASES.map(p => (
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
          <GameSelect onSelect={() => setPhase('lobby')} />
        )}

        {phase === 'lobby' && (
          <Lobby
            {...shared}
            timerSetting={300}
            onSetTimer={() => {}}
            onStartGame={() => { resetTimer(); setPhase('playing'); }}
          />
        )}

        {phase === 'playing' && (
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

        {phase === 'result' && (
          <Result
            {...shared}
            result={mockResult}
            myRole={role}
            onPlayAgain={() => { resetTimer(); setPhase('playing'); }}
          />
        )}
      </main>
    </div>
  );
}
