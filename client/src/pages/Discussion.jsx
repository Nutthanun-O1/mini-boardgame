import { useState } from 'react';

export default function Discussion({ word, category, isDM, players, result, onRevealInsider }) {
  const [confirmReveal, setConfirmReveal] = useState(false);

  return (
    <div className="page discussion">
      {/* ทายถูก */}
      <div className="success-banner">
        <h2>🎉 ทายถูก!</h2>
        <div className="word-reveal">
          <p>📂 {category}</p>
          <h1>「{word}」</h1>
        </div>
        {result?.timeUsed != null && (
          <p className="time-used">
            ⏱️ ใช้เวลา {Math.floor(result.timeUsed / 60)} นาที {result.timeUsed % 60} วินาที
          </p>
        )}
      </div>

      {/* หา Insider */}
      <div className="discussion-prompt">
        <h3>🤔 ใครคือ Insider?</h3>
        <p>พูดคุยกัน แล้วชี้ตัว Insider พร้อมกัน!</p>
        <div className="suspect-list">
          {players.filter(p => !p.isDM).map(p => (
            <div key={p.id} className="player-chip">{p.name}</div>
          ))}
        </div>
      </div>

      {/* DM Controls */}
      {isDM ? (
        <div className="dm-controls">
          {!confirmReveal ? (
            <button className="btn btn-danger btn-large" onClick={() => setConfirmReveal(true)}>
              🔍 เฉลย Insider!
            </button>
          ) : (
            <div className="confirm-box">
              <p>ทุกคนชี้ตัวแล้วใช่ไหม?</p>
              <div className="confirm-buttons">
                <button className="btn btn-danger" onClick={onRevealInsider}>
                  🔍 เฉลยเลย!
                </button>
                <button className="btn btn-secondary" onClick={() => setConfirmReveal(false)}>
                  ยังก่อน
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="waiting">
          <p>⏳ รอ DM เฉลย...</p>
        </div>
      )}
    </div>
  );
}
