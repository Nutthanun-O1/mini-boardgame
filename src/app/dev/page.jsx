'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
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

/* ── Constants ── */
const INSIDER_ROLES = ['Master', 'Insider', 'Common'];
const SPYFALL_ROLES = ['Spy', 'Agent'];

const INSIDER_PHASES = ['gameSelect', 'home', 'lobby', 'word-pick', 'playing', 'discussion', 'result'];
const SPYFALL_PHASES = ['gameSelect', 'home', 'lobby', 'playing', 'spyfall-voting', 'spyfall-last-chance', 'spyfall-result'];

const SPYFALL_REASONS = [
  { value: 'spy-caught', label: 'จับ Spy ได้' },
  { value: 'spy-guessed-correct', label: 'Spy เดาถูก' },
  { value: 'spy-guessed-wrong', label: 'Spy เดาผิด' },
  { value: 'spy-last-guess-correct', label: 'Spy โดนจับ แต่เดาถูก' },
  { value: 'timeout', label: 'หมดเวลา' },
  { value: 'wrong-accusation', label: 'โหวตผิดคน' },
];

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

const MOCK_WORD_CHOICES = [
  { word: 'แมว', category: 'สัตว์' },
  { word: 'กีตาร์', category: 'ดนตรี' },
  { word: 'พิซซ่า', category: 'อาหาร' },
  { word: 'เอเวอเรสต์', category: 'ภูเขา' },
  { word: 'ฮอกวอตส์', category: 'แฟนตาซี' },
  { word: 'รถไฟฟ้า', category: 'ยานพาหนะ' },
];

export default function DevPage() {
  /* ── Game / Phase / Role ── */
  const [game, setGame] = useState('insider');
  const [phase, setPhase] = useState('playing');
  const [role, setRole] = useState('Master');
  const [isDM, setIsDM] = useState(true);

  /* ── Timer ── */
  const [timerSetting, setTimerSetting] = useState(300);
  const [timer, setTimer] = useState(180);

  /* ── Insider config ── */
  const [difficulty, setDifficulty] = useState('medium');
  const [dmMode, setDmMode] = useState('creator');
  const [wordPick, setWordPick] = useState(false);
  const [mockWord, setMockWord] = useState('แมว');

  /* ── Spyfall config ── */
  const [spyfallReason, setSpyfallReason] = useState('spy-caught');

  /* ── Toolbar collapsed ── */
  const [toolbarOpen, setToolbarOpen] = useState(true);

  const isSpyfall = game === 'spyfall';
  const phases = isSpyfall ? SPYFALL_PHASES : INSIDER_PHASES;

  // Word visibility logic (same as main page)
  const word = (() => {
    if (isSpyfall) return null;
    if (role === 'Common') return null;
    return mockWord;
  })();
  const category = 'สัตว์';

  /* ── Auto-tick timer ── */
  useEffect(() => {
    if (phase !== 'playing') return;
    const id = setInterval(() => setTimer(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const resetTimer = useCallback(() => setTimer(timerSetting), [timerSetting]);

  /* ── Cycle role ── */
  const cycleRole = useCallback(() => {
    const currentRoles = isSpyfall ? SPYFALL_ROLES : INSIDER_ROLES;
    setRole(prev => {
      const idx = currentRoles.indexOf(prev);
      const next = currentRoles[(idx + 1) % currentRoles.length];
      setIsDM(isSpyfall ? true : next === 'Master');
      return next;
    });
  }, [isSpyfall]);

  /* ── Switch game ── */
  function switchGame(g) {
    setGame(g);
    const firstRole = g === 'spyfall' ? 'Spy' : 'Master';
    setRole(firstRole);
    setIsDM(true);
    setPhase('playing');
    resetTimer();
  }

  /* ── Shared props (mirrors main page) ── */
  const shared = {
    isDM,
    players: MOCK_PLAYERS,
    word,
    category,
    error: '',
    roomCode: 'TEST',
    playerName: 'DevUser',
  };

  /* ── Mock results ── */
  const mockInsiderResult = {
    word: mockWord,
    category,
    insider: 'Alice',
    insiderId: '2',
    gamePlayers: MOCK_PLAYERS,
    players: MOCK_PLAYERS,
    roles: MOCK_INSIDER_ROLES,
    timeUsed: 120,
    timedOut: false,
  };

  const spyfallWinner = ['spy-caught', 'spy-guessed-wrong'].includes(spyfallReason)
    ? 'players'
    : 'spy';

  const mockSpyfallResult = {
    winner: spyfallWinner,
    reason: spyfallReason,
    spy: 'DevUser',
    spyId: '1',
    location: 'โรงเรียน',
    locationKey: 'school',
    guessedLocation: spyfallReason.includes('guess') ? 'โรงพยาบาล' : null,
    guessedLocationKey: spyfallReason.includes('guess') ? 'hospital' : null,
    accusedName: spyfallReason === 'wrong-accusation' ? 'Bob' : null,
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
      {/* ════════════════════════════════════════
          DEV TOOLBAR — Row 1
          ════════════════════════════════════════ */}
      <div className="dev-toolbar">
        <button
          className="dev-toolbar__badge"
          onClick={() => setToolbarOpen(v => !v)}
          style={{ cursor: 'pointer', border: 'none' }}
        >
          DEV {toolbarOpen ? '▼' : '▶'}
        </button>

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

      {/* ── Row 2: collapsible config ── */}
      {toolbarOpen && (
        <div className="dev-toolbar" style={{ borderTop: '1px solid rgba(124,58,237,0.3)' }}>
          <div className="dev-toolbar__group">
            <label className="dev-toolbar__label">Timer</label>
            <select
              className="dev-toolbar__select"
              value={timerSetting}
              onChange={e => { setTimerSetting(Number(e.target.value)); setTimer(Number(e.target.value)); }}
            >
              <option value={180}>3m</option>
              <option value={300}>5m</option>
              <option value={420}>7m</option>
              <option value={600}>10m</option>
            </select>
          </div>

          {!isSpyfall && (
            <>
              <div className="dev-toolbar__group">
                <label className="dev-toolbar__label">Diff</label>
                <select
                  className="dev-toolbar__select"
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value)}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Med</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="dev-toolbar__group">
                <label className="dev-toolbar__label">DM Mode</label>
                <select
                  className="dev-toolbar__select"
                  value={dmMode}
                  onChange={e => setDmMode(e.target.value)}
                >
                  <option value="creator">Creator</option>
                  <option value="random">Random</option>
                </select>
              </div>

              <div className="dev-toolbar__group">
                <label className="dev-toolbar__label">WordPick</label>
                <button
                  className={`dev-toolbar__toggle ${wordPick ? 'dev-toolbar__toggle--on' : ''}`}
                  onClick={() => setWordPick(v => !v)}
                >
                  {wordPick ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="dev-toolbar__group">
                <label className="dev-toolbar__label">Word</label>
                <input
                  className="dev-toolbar__select"
                  style={{ width: 72 }}
                  value={mockWord}
                  onChange={e => setMockWord(e.target.value)}
                />
              </div>
            </>
          )}

          {isSpyfall && (
            <div className="dev-toolbar__group">
              <label className="dev-toolbar__label">Result</label>
              <select
                className="dev-toolbar__select"
                value={spyfallReason}
                onChange={e => setSpyfallReason(e.target.value)}
              >
                {SPYFALL_REASONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════
          HEADER (same as main)
          ════════════════════════════════════════ */}
      <header className="header">
        <div className="header-left">
          {phase !== 'gameSelect' && (
            <button className="header-back" onClick={() => setPhase('gameSelect')}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
          <span className="header-title">Board Game</span>
        </div>
        {phase !== 'gameSelect' && phase !== 'home' && (
          <span className="header-room">TEST</span>
        )}
      </header>

      {/* ════════════════════════════════════════
          MAIN CONTENT
          ════════════════════════════════════════ */}
      <main className="main">
        <AnimatePresence mode="wait">
          {/* ── Game Select ── */}
          {phase === 'gameSelect' && (
            <GameSelect
              key="gameSelect"
              onSelect={(id) => { switchGame(id); setPhase('home'); }}
            />
          )}

          {/* ── Home (Create / Join) ── */}
          {phase === 'home' && (
            <Home
              key="home"
              gameId={game}
              onCreateRoom={() => setPhase('lobby')}
              onJoinRoom={() => setPhase('lobby')}
              onBack={() => setPhase('gameSelect')}
              error=""
            />
          )}

          {/* ── Lobby ── */}
          {phase === 'lobby' && (
            <Lobby
              key="lobby"
              {...shared}
              gameId={game}
              timerSetting={timerSetting}
              difficulty={difficulty}
              dmMode={dmMode}
              wordPick={wordPick}
              onSetTimer={(v) => { setTimerSetting(v); setTimer(v); }}
              onSetDifficulty={setDifficulty}
              onSetDmMode={setDmMode}
              onSetWordPick={setWordPick}
              onStartGame={() => {
                resetTimer();
                setPhase(wordPick && !isSpyfall ? 'word-pick' : 'playing');
              }}
            />
          )}

          {/* ── Word Pick (Insider only) ── */}
          {phase === 'word-pick' && (
            <WordPick
              key="word-pick"
              isDM={isDM}
              choices={MOCK_WORD_CHOICES}
              onPickWord={(choice) => {
                setMockWord(choice.word);
                resetTimer();
                setPhase('playing');
              }}
            />
          )}

          {/* ── Insider Playing ── */}
          {phase === 'playing' && !isSpyfall && (
            <Playing
              key="playing"
              {...shared}
              word={word}
              role={role}
              timerTotal={timerSetting}
              timeRemaining={timer}
              timerPaused={false}
              onPauseTimer={() => {}}
              onResumeTimer={() => {}}
              onGuessCorrect={() => setPhase('discussion')}
            />
          )}

          {/* ── Discussion ── */}
          {phase === 'discussion' && (
            <Discussion
              key="discussion"
              {...shared}
              result={{ timeUsed: timerSetting - timer }}
              onRevealInsider={() => setPhase('result')}
            />
          )}

          {/* ── Insider Result ── */}
          {phase === 'result' && !isSpyfall && (
            <Result
              key="result"
              {...shared}
              result={mockInsiderResult}
              myRole={role}
              onPlayAgain={() => { resetTimer(); setPhase('playing'); }}
            />
          )}

          {/* ── Spyfall Playing ── */}
          {phase === 'playing' && isSpyfall && (
            <SpyfallPlaying
              key="spyfall-playing"
              role={role}
              location={role === 'Spy' ? null : 'โรงเรียน'}
              locationKey={role === 'Spy' ? null : 'school'}
              locations={MOCK_LOCATIONS}
              timerTotal={timerSetting}
              timeRemaining={timer}
              timerPaused={false}
              players={MOCK_PLAYERS}
              myId="1"
              isDM={shared.isDM}
              onPauseTimer={() => {}}
              onResumeTimer={() => {}}
              onCallVote={() => setPhase('spyfall-voting')}
              onSpyGuess={() => setPhase('spyfall-result')}
            />
          )}

          {/* ── Spyfall Voting ── */}
          {phase === 'spyfall-voting' && (
            <SpyfallVoting
              key="spyfall-voting"
              voteInfo={mockVoteInfo}
              players={MOCK_PLAYERS}
              myId="1"
              onCastVote={(agree) => setPhase(agree ? 'spyfall-last-chance' : 'playing')}
            />
          )}

          {/* ── Spyfall Last Chance ── */}
          {phase === 'spyfall-last-chance' && (
            <SpyfallLastChance
              key="spyfall-last-chance"
              spy="DevUser"
              locations={MOCK_LOCATIONS}
              isSpy={role === 'Spy'}
              onLastGuess={() => setPhase('spyfall-result')}
            />
          )}

          {/* ── Spyfall Result ── */}
          {phase === 'spyfall-result' && (
            <SpyfallResult
              key="spyfall-result"
              result={mockSpyfallResult}
              isDM={isDM}
              myRole={role}
              onPlayAgain={() => { resetTimer(); setPhase('playing'); }}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
