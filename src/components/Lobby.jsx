'use client';

export default function Lobby({
  roomCode, players, isDM, timerSetting,
  onSetTimer, onStartGame, error
}) {
  return (
    <div className="page fade-in">
      <div className="room-code-box">
        <p className="room-code-label">รหัสห้อง</p>
        <p className="room-code-value">{roomCode}</p>
        <p className="room-code-hint">แชร์รหัสนี้ให้เพื่อน</p>
      </div>

      <div className="card">
        <div className="card__header">
          <span className="card__title">ผู้เล่น</span>
          <span className="badge badge--accent">{players.length} คน</span>
        </div>
        <ul className="player-list">
          {players.map(p => (
            <li key={p.id} className="player-row">
              <span className="player-name">{p.name}</span>
              {p.isDM && <span className="badge badge--accent">DM</span>}
            </li>
          ))}
        </ul>
      </div>

      {isDM ? (
        <div className="bottom-actions">
          <div className="field">
            <label className="field__label">เวลาเล่น</label>
            <select
              className="field__input"
              value={timerSetting}
              onChange={e => onSetTimer(Number(e.target.value))}
            >
              <option value={180}>3 นาที</option>
              <option value={300}>5 นาที</option>
              <option value={420}>7 นาที</option>
              <option value={600}>10 นาที</option>
            </select>
          </div>
          <button
            className="btn btn--primary btn--lg"
            disabled={players.length < 4}
            onClick={onStartGame}
          >
            เริ่มเกม
          </button>
          {players.length < 4 && (
            <p className="hint-text">ต้องมีผู้เล่นอย่างน้อย 4 คน (ปัจจุบัน {players.length})</p>
          )}
        </div>
      ) : (
        <div className="waiting-state">
          <span className="waiting-dot" />
          <span className="waiting-dot" />
          <span className="waiting-dot" />
          <p>รอ DM เริ่มเกม</p>
        </div>
      )}

      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
