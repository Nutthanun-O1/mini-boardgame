'use client';

import { useState } from 'react';
import Timer from './Timer';
import { ROLE_IMAGES, ROLE_INFO } from '@/lib/images';

const ROLE_MODIFIERS = {
  Master: 'role--master',
  Insider: 'role--insider',
  Common: 'role--common',
};

export default function Playing({ role, word, category, timerTotal, timeRemaining, isDM, onGuessCorrect }) {
  const [showRole, setShowRole] = useState(false);
  const [confirmGuess, setConfirmGuess] = useState(false);
  const [imgError, setImgError] = useState(false);

  const modifier = ROLE_MODIFIERS[role] || ROLE_MODIFIERS.Common;
  const info = ROLE_INFO[role] || ROLE_INFO.Common;
  const imgSrc = ROLE_IMAGES[role];
  const hasImage = imgSrc && !imgError;

  return (
    <div className="page fade-in">
      <Timer total={timerTotal} remaining={timeRemaining} />

      <div className="category-tag">
        หมวด: <strong>{category}</strong>
      </div>

      <div className={`role-card ${modifier}`}>
        {!showRole ? (
          <div className="role-card__cover" onClick={() => setShowRole(true)}>
            <span className="role-card__cover-text">แตะเพื่อดูบทบาท</span>
          </div>
        ) : (
          <div className="role-card__revealed" onClick={() => setShowRole(false)}>
            {/* ── Image Area ── */}
            <div className="role-card__art">
              {hasImage ? (
                <img
                  src={imgSrc}
                  alt={info.label}
                  className="role-card__art-img"
                  onError={() => setImgError(true)}
                />
              ) : (
                <span className="role-card__art-initial">{info.label[0]}</span>
              )}
            </div>

            {/* ── Info Overlay ── */}
            <div className="role-card__info">
              <p className="role-card__label">{info.label}</p>
              <p className="role-card__desc">{info.description}</p>

              {word ? (
                <div className="role-card__word">
                  <p className="role-card__word-label">คำลับ</p>
                  <p className="role-card__word-value">{word}</p>
                </div>
              ) : null}
            </div>

            <span className="role-card__tap-hint">แตะเพื่อซ่อน</span>
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
