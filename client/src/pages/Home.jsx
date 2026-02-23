import { useState } from 'react';

export default function Home({ onCreateRoom, onJoinRoom, error }) {
  const [mode, setMode] = useState(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [duration, setDuration] = useState(300);

  if (!mode) {
    return (
      <div className="page home">
        <div className="logo-section">
          <span className="logo-emoji">🕵️</span>
          <h2>Insider Board Game</h2>
          <p className="subtitle">บอร์ดเกมจำลองบนเว็บ</p>
        </div>
        <div className="home-buttons">
          <button className="btn btn-primary btn-large" onClick={() => setMode('create')}>
            👑 สร้างห้อง (DM)
          </button>
          <button className="btn btn-secondary btn-large" onClick={() => setMode('join')}>
            🚪 เข้าร่วมห้อง
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="form">
        <h2>{mode === 'create' ? '👑 สร้างห้อง' : '🚪 เข้าร่วมห้อง'}</h2>

        <input
          type="text"
          placeholder="ชื่อของคุณ"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={20}
          autoFocus
        />

        {mode === 'join' && (
          <input
            type="text"
            placeholder="รหัสห้อง"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            maxLength={4}
            className="room-code-input"
          />
        )}

        {mode === 'create' && (
          <div className="timer-setting">
            <label>⏱️ เวลาเล่น</label>
            <select value={duration} onChange={e => setDuration(Number(e.target.value))}>
              <option value={180}>3 นาที</option>
              <option value={300}>5 นาที</option>
              <option value={420}>7 นาที</option>
              <option value={600}>10 นาที</option>
            </select>
          </div>
        )}

        <button
          className="btn btn-primary"
          disabled={!name.trim() || (mode === 'join' && code.length !== 4)}
          onClick={() =>
            mode === 'create'
              ? onCreateRoom(name.trim(), duration)
              : onJoinRoom(code, name.trim())
          }
        >
          {mode === 'create' ? '🎮 สร้างห้อง' : '🚪 เข้าร่วม'}
        </button>

        <button className="btn btn-text" onClick={() => setMode(null)}>
          ← กลับ
        </button>

        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
