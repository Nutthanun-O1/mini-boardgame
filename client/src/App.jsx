import { useState, useEffect } from 'react';
import { socket } from './socket';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import Playing from './pages/Playing';
import Discussion from './pages/Discussion';
import Result from './pages/Result';
import './App.css';

function App() {
  const [phase, setPhase] = useState('home');
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isDM, setIsDM] = useState(false);
  const [players, setPlayers] = useState([]);
  const [myRole, setMyRole] = useState(null);
  const [word, setWord] = useState(null);
  const [category, setCategory] = useState(null);
  const [timer, setTimer] = useState(300);
  const [timerSetting, setTimerSetting] = useState(300);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    socket.on('room-joined', ({ code, isDM, players }) => {
      setRoomCode(code);
      setIsDM(isDM);
      setPlayers(players);
      setPhase('lobby');
      setError('');
    });

    socket.on('players-updated', setPlayers);
    socket.on('timer-setting', setTimerSetting);

    socket.on('game-started', ({ role, category, word }) => {
      setMyRole(role);
      setCategory(category);
      setWord(word);
      setPhase('playing');
    });

    socket.on('timer-tick', setTimer);

    socket.on('word-revealed', ({ word, category, timeUsed }) => {
      setWord(word);
      setCategory(category);
      setResult({ timeUsed });
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

    socket.on('back-to-lobby', (players) => {
      setPlayers(players);
      setMyRole(null);
      setWord(null);
      setCategory(null);
      setResult(null);
      setPhase('lobby');
    });

    socket.on('room-closed', () => {
      alert('DM ออกจากห้องแล้ว');
      resetAll();
    });

    socket.on('player-left', (name) => {
      console.log(`${name} ออกจากห้อง`);
    });

    socket.on('error-msg', setError);

    return () => {
      socket.removeAllListeners();
    };
  }, []);

  function resetAll() {
    setPhase('home');
    setRoomCode('');
    setPlayerName('');
    setIsDM(false);
    setPlayers([]);
    setMyRole(null);
    setWord(null);
    setCategory(null);
    setTimer(300);
    setResult(null);
    setError('');
  }

  const actions = {
    createRoom: (name, duration) => {
      setPlayerName(name);
      setTimerSetting(duration);
      socket.emit('create-room', { name, timerDuration: duration });
    },
    joinRoom: (code, name) => {
      setPlayerName(name);
      socket.emit('join-room', { code, name });
    },
    startGame: () => socket.emit('start-game'),
    guessCorrect: () => socket.emit('guess-correct'),
    revealInsider: () => socket.emit('reveal-insider'),
    playAgain: () => socket.emit('play-again'),
    setTimer: (d) => {
      setTimerSetting(d);
      socket.emit('set-timer', d);
    },
  };

  const shared = { isDM, players, word, category, error };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🔍 INSIDER</h1>
        {roomCode && <span className="room-badge">ห้อง {roomCode}</span>}
      </header>
      <main className="app-main">
        {phase === 'home' && (
          <Home onCreateRoom={actions.createRoom} onJoinRoom={actions.joinRoom} error={error} />
        )}
        {phase === 'lobby' && (
          <Lobby {...shared} roomCode={roomCode} timerSetting={timerSetting}
            onSetTimer={actions.setTimer} onStartGame={actions.startGame} />
        )}
        {phase === 'playing' && (
          <Playing {...shared} role={myRole} timer={timer}
            onGuessCorrect={actions.guessCorrect} />
        )}
        {phase === 'discussion' && (
          <Discussion {...shared} result={result}
            onRevealInsider={actions.revealInsider} />
        )}
        {phase === 'result' && (
          <Result {...shared} result={result} myRole={myRole}
            onPlayAgain={actions.playAgain} />
        )}
      </main>
    </div>
  );
}

export default App;
