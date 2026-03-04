'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedPage, { tapScale, popIn } from './AnimatedPage';

export default function Discussion({ word, category, isDM, players, result, onRevealInsider }) {
  const [confirmReveal, setConfirmReveal] = useState(false);

  return (
    <AnimatedPage>
      <motion.div className="reveal-banner" variants={popIn} initial="hidden" animate="visible">
        <p className="reveal-banner__label">ทายถูก!</p>
        <p className="reveal-banner__word">{word}</p>
        <p className="reveal-banner__category">{category}</p>
        {result?.timeUsed != null && (
          <p className="reveal-banner__time">
            ใช้เวลา {Math.floor(result.timeUsed / 60)} นาที {result.timeUsed % 60} วินาที
          </p>
        )}
      </motion.div>

      <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
        <div className="card__header">
          <span className="card__title">ใครคือ Insider?</span>
        </div>
        <p className="card__description">พูดคุยกัน แล้วชี้ตัว Insider พร้อมกัน</p>
        <div className="suspect-chips">
          {players.filter(p => !p.isDM).map(p => (
            <motion.span key={p.id} className="chip" whileTap={tapScale}>{p.name}</motion.span>
          ))}
        </div>
      </motion.div>

      {isDM ? (
        <motion.div className="bottom-actions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.35 }}>
          <AnimatePresence mode="wait">
            {!confirmReveal ? (
              <motion.button key="reveal-btn" className="btn btn--danger btn--lg" onClick={() => setConfirmReveal(true)} whileTap={tapScale} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                เฉลย Insider
              </motion.button>
            ) : (
              <motion.div key="reveal-confirm" className="confirm-group" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <p className="confirm-text">ทุกคนชี้ตัวแล้วหรือยัง?</p>
                <div className="confirm-buttons">
                  <motion.button className="btn btn--danger" onClick={onRevealInsider} whileTap={tapScale}>
                    เฉลยเลย
                  </motion.button>
                  <motion.button className="btn btn--secondary" onClick={() => setConfirmReveal(false)} whileTap={tapScale}>
                    ยังก่อน
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="waiting-state">
          <span className="waiting-dot" />
          <span className="waiting-dot" />
          <span className="waiting-dot" />
          <p>รอ DM เฉลย</p>
        </div>
      )}
    </AnimatedPage>
  );
}
