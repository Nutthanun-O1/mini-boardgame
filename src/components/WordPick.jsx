'use client';

import { useState } from 'react';

/**
 * Word-pick phase: DM sees 6 random words and chooses one.
 * Other players wait.
 */
export default function WordPick({ isDM, choices, onPickWord }) {
  const [selected, setSelected] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  if (!isDM) {
    return (
      <div className="page page--center fade-in">
        <div className="waiting-state">
          <span className="waiting-dot" />
          <span className="waiting-dot" />
          <span className="waiting-dot" />
          <p>DM กำลังเลือกคำ…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page fade-in">
      <div className="page-header">
        <h1 className="page-title">เลือกคำลับ</h1>
        <p className="page-subtitle">เลือกคำ 1 คำที่จะใช้ในเกม</p>
      </div>

      <div className="word-pick-grid">
        {(choices || []).map((c, i) => (
          <button
            key={i}
            className={`word-pick-card ${selected === i ? 'word-pick-card--selected' : ''}`}
            onClick={() => { setSelected(i); setConfirmed(false); }}
          >
            <span className="word-pick-card__word">{c.word}</span>
          </button>
        ))}
      </div>

      <div className="bottom-actions">
        {selected !== null && !confirmed && (
          <button
            className="btn btn--primary btn--lg"
            onClick={() => setConfirmed(true)}
          >
            เลือก "{choices[selected].word}"
          </button>
        )}
        {confirmed && (
          <div className="confirm-group">
            <p className="confirm-text">ยืนยันเลือก "{choices[selected].word}" ?</p>
            <div className="confirm-buttons">
              <button
                className="btn btn--success"
                onClick={() => onPickWord(choices[selected])}
              >
                ยืนยัน
              </button>
              <button
                className="btn btn--secondary"
                onClick={() => setConfirmed(false)}
              >
                เปลี่ยน
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
