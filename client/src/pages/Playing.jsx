import { useState } from 'react';

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const ROLE_CONFIG = {
  Master: { emoji: '👑', color: '#f59e0b', label: 'Master (DM)' },
  Insider: { emoji: '🕵️', color: '#ef4444', label: 'Insider' },
  Common: { emoji: '👤', color: '#3b82f6', label: 'Common' },
};

export default function Playing({ role, word, category, timer, isDM, onGuessCorrect }) {
  const [showRole, setShowRole] = useState(false);
  const [confirmGuess, setConfirmGuess] = useState(false);

  const config = ROLE_CONFIG[role];
  const isLow = timer <= 30;

  return (
    <div className="page playing">
      {/* Timer */}
      <div className={`timer-box ${isLow ? 'timer-low' : ''}`}>
        <span className="timer-value">{formatTime(timer)}</span>
      </div>

      {/* Category */}
      <div className="category-badge">
        📂 หมวด: <strong>{category}</strong>
      </div>

      {/* Role Card */}
      <div className="role-card" style={{ borderColor: config.color }}>
        {!showRole ? (
          <button className="btn-reveal" onClick={() => setShowRole(true)}>
            👁️ กดเพื่อดูบทบาท
          </button>
        ) : (
          <div className="role-content">
            <span className="role-emoji">{config.emoji}</span>
            <h2 style={{ color: config.color }}>{config.label}</h2>

            {word ? (
              <div className="word-box">
                <p>คำลับ</p>
                <h3>「{word}」</h3>
              </div>
            ) : (
              <p className="no-word">คุณไม่รู้คำลับ<br />ถามคำถาม Yes/No เพื่อหาคำตอบ!</p>
            )}

            <button className="btn btn-small btn-hide" onClick={() => setShowRole(false)}>
              🙈 ซ่อน
            </button>
          </div>
        )}
      </div>

      {/* DM Controls */}
      {isDM && (
        <div className="dm-controls">
          {!confirmGuess ? (
            <button className="btn btn-success btn-large" onClick={() => setConfirmGuess(true)}>
              ✅ มีคนทายถูก!
            </button>
          ) : (
            <div className="confirm-box">
              <p>ยืนยันว่ามีคนทายถูก?</p>
              <div className="confirm-buttons">
                <button className="btn btn-success" onClick={() => { onGuessCorrect(); setConfirmGuess(false); }}>
                  ✅ ใช่!
                </button>
                <button className="btn btn-secondary" onClick={() => setConfirmGuess(false)}>
                  ❌ ยังไม่ถูก
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
