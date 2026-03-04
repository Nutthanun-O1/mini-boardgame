'use client';

import { useState } from 'react';

export default function Discussion({ word, category, isDM, players, result, onRevealInsider }) {
  const [confirmReveal, setConfirmReveal] = useState(false);

  return (
    <div className="page fade-in">
      <div className="reveal-banner">
        <p className="reveal-banner__label">ทายถูก!</p>
        <p className="reveal-banner__word">{word}</p>
        <p className="reveal-banner__category">{category}</p>
        {result?.timeUsed != null && (
          <p className="reveal-banner__time">
            ใช้เวลา {Math.floor(result.timeUsed / 60)} นาที {result.timeUsed % 60} วินาที
          </p>
        )}
      </div>

      <div className="card">
        <div className="card__header">
          <span className="card__title">ใครคือ Insider?</span>
        </div>
        <p className="card__description">พูดคุยกัน แล้วชี้ตัว Insider พร้อมกัน</p>
        <div className="suspect-chips">
          {players.filter(p => !p.isDM).map(p => (
            <span key={p.id} className="chip">{p.name}</span>
          ))}
        </div>
      </div>

      {isDM ? (
        <div className="bottom-actions">
          {!confirmReveal ? (
            <button className="btn btn--danger btn--lg" onClick={() => setConfirmReveal(true)}>
              เฉลย Insider
            </button>
          ) : (
            <div className="confirm-group">
              <p className="confirm-text">ทุกคนชี้ตัวแล้วหรือยัง?</p>
              <div className="confirm-buttons">
                <button className="btn btn--danger" onClick={onRevealInsider}>
                  เฉลยเลย
                </button>
                <button className="btn btn--secondary" onClick={() => setConfirmReveal(false)}>
                  ยังก่อน
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="waiting-state">
          <span className="waiting-dot" />
          <span className="waiting-dot" />
          <span className="waiting-dot" />
          <p>รอ DM เฉลย</p>
        </div>
      )}
    </div>
  );
}
