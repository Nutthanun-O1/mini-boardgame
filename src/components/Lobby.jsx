'use client';

export default function Lobby({
  roomCode, players, isDM, timerSetting, gameId,
  difficulty, dmMode, wordPick,
  onSetTimer, onSetDifficulty, onSetDmMode, onSetWordPick,
  onStartGame, error
}) {
  const isInsider = gameId === 'insider';
  const minPlayers = isInsider ? 4 : 3;

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

          {isInsider && (
            <>
              <div className="field">
                <label className="field__label">ระดับความยาก</label>
                <div className="btn-group">
                  {[
                    { value: 'easy', label: 'ง่าย' },
                    { value: 'medium', label: 'ปานกลาง' },
                    { value: 'hard', label: 'ยาก' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      className={`btn btn--sm ${difficulty === opt.value ? 'btn--primary' : 'btn--secondary'}`}
                      onClick={() => onSetDifficulty(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label className="field__label">DM (ผู้ดำเนินเกม)</label>
                <select
                  className="field__input"
                  value={dmMode}
                  onChange={e => onSetDmMode(e.target.value)}
                >
                  <option value="creator">คนสร้างห้อง</option>
                  <option value="random">สุ่ม</option>
                  {players.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="field field--toggle">
                <label className="field__label">ให้เลือกคำก่อนเริ่ม</label>
                <button
                  className={`toggle-btn ${wordPick ? 'toggle-btn--on' : ''}`}
                  onClick={() => onSetWordPick(!wordPick)}
                >
                  {wordPick ? 'เปิด' : 'ปิด'}
                </button>
              </div>
            </>
          )}

          <button
            className="btn btn--primary btn--lg"
            disabled={players.length < minPlayers}
            onClick={onStartGame}
          >
            เริ่มเกม
          </button>
          {players.length < minPlayers && (
            <p className="hint-text">ต้องมีผู้เล่นอย่างน้อย {minPlayers} คน (ปัจจุบัน {players.length})</p>
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
