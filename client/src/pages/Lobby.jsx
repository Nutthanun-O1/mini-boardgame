export default function Lobby({
  roomCode, players, isDM, timerSetting,
  onSetTimer, onStartGame, error
}) {
  return (
    <div className="page lobby">
      {/* รหัสห้อง */}
      <div className="room-code-display">
        <p>รหัสห้อง</p>
        <h2>{roomCode}</h2>
        <p className="hint">ส่งรหัสนี้ให้เพื่อน</p>
      </div>

      {/* รายชื่อผู้เล่น */}
      <div className="player-list-box">
        <h3>👥 ผู้เล่น ({players.length} คน)</h3>
        {players.map(p => (
          <div key={p.id} className="player-item">
            <span>{p.isDM ? '👑' : '👤'} {p.name}</span>
            {p.isDM && <span className="dm-badge">DM</span>}
          </div>
        ))}
      </div>

      {/* DM Controls */}
      {isDM ? (
        <div className="dm-controls">
          <div className="timer-setting">
            <label>⏱️ เวลาเล่น</label>
            <select value={timerSetting} onChange={e => onSetTimer(Number(e.target.value))}>
              <option value={180}>3 นาที</option>
              <option value={300}>5 นาที</option>
              <option value={420}>7 นาที</option>
              <option value={600}>10 นาที</option>
            </select>
          </div>
          <button
            className="btn btn-primary btn-large"
            disabled={players.length < 4}
            onClick={onStartGame}
          >
            🎲 เริ่มเกม!
          </button>
          {players.length < 4 && (
            <p className="hint">ต้องมีอย่างน้อย 4 คน (ตอนนี้ {players.length})</p>
          )}
        </div>
      ) : (
        <div className="waiting">
          <div className="waiting-spinner">⏳</div>
          <p>รอ DM เริ่มเกม...</p>
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  );
}
