'use client';

import { useState } from 'react';
import Timer from './Timer';

const ROLE_STYLES = {
  Master: { label: 'Master (DM)', modifier: 'role--master' },
  Insider: { label: 'Insider', modifier: 'role--insider' },
  Common: { label: 'Common', modifier: 'role--common' },
};

export default function Playing({ role, word, category, timerTotal, timeRemaining, isDM, onGuessCorrect }) {
  const [showRole, setShowRole] = useState(false);
  const [confirmGuess, setConfirmGuess] = useState(false);

  const config = ROLE_STYLES[role] || ROLE_STYLES.Common;

  return (
    <div className="page fade-in">
      <Timer total={timerTotal} remaining={timeRemaining} />

      <div className="category-tag">
        หมวด: <strong>{category}</strong>
      </div>

      <div className={`role-card ${config.modifier}`}>
        {!showRole ? (
          <div className="role-card__cover" onClick={() => setShowRole(true)}>
            <span className="role-card__cover-text">แตะเพื่อดูบทบาท</span>
          </div>
        ) : (
          <div className="role-card__content">
            <div className="role-card__image">
              <span className="role-card__initial">{config.label[0]}</span>
            </div>
            <p className="role-card__label">{config.label}</p>

            {word ? (
              <div className="role-card__word">
                <p className="role-card__word-label">คำลับ</p>
                <p className="role-card__word-value">{word}</p>
              </div>
            ) : (
              <p className="role-card__hint">คุณไม่รู้คำลับ — ถามคำถาม Yes/No เพื่อหาคำตอบ</p>
            )}

            <button className="btn btn--ghost btn--sm" onClick={() => setShowRole(false)}>
              ซ่อน
            </button>
          </div>
        )}
      </div>

      {isDM && (
        <div className="bottom-actions">
          {!confirmGuess ? (
            <button className="btn btn--success btn--lg" onClick={() => setConfirmGuess(true)}>
              มีคนทายถูก
            </button>
          ) : (
            <div className="confirm-group">
              <p className="confirm-text">ยืนยันว่ามีผู้เล่นทายถูกแล้ว?</p>
              <div className="confirm-buttons">
                <button className="btn btn--success" onClick={() => { onGuessCorrect(); setConfirmGuess(false); }}>
                  ยืนยัน
                </button>
                <button className="btn btn--secondary" onClick={() => setConfirmGuess(false)}>
                  ยกเลิก
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
