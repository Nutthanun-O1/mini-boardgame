'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedPage, { staggerContainer, fadeUpItem, tapScale, popIn } from './AnimatedPage';

/**
 * Word-pick phase: DM sees 6 random words and chooses one.
 * Other players wait.
 */
export default function WordPick({ isDM, choices, onPickWord }) {
  const [selected, setSelected] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  if (!isDM) {
    return (
      <AnimatedPage className="page--center">
        <div className="waiting-state">
          <span className="waiting-dot" />
          <span className="waiting-dot" />
          <span className="waiting-dot" />
          <p>DM กำลังเลือกคำ…</p>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="page-header">
        <h1 className="page-title">เลือกคำลับ</h1>
        <p className="page-subtitle">เลือกคำ 1 คำที่จะใช้ในเกม</p>
      </div>

      <motion.div
        className="word-pick-grid"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {(choices || []).map((c, i) => (
          <motion.button
            key={i}
            className={`word-pick-card ${selected === i ? 'word-pick-card--selected' : ''}`}
            onClick={() => { setSelected(i); setConfirmed(false); }}
            variants={fadeUpItem}
            whileTap={tapScale}
            layout
          >
            <span className="word-pick-card__word">{c.word}</span>
          </motion.button>
        ))}
      </motion.div>

      <div className="bottom-actions">
        <AnimatePresence mode="wait">
          {selected !== null && !confirmed && (
            <motion.button
              key="select"
              className="btn btn--primary btn--lg"
              onClick={() => setConfirmed(true)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              whileTap={tapScale}
            >
              เลือก &ldquo;{choices[selected].word}&rdquo;
            </motion.button>
          )}
          {confirmed && (
            <motion.div
              key="confirm"
              className="confirm-group"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="confirm-text">ยืนยันเลือก &ldquo;{choices[selected].word}&rdquo; ?</p>
              <div className="confirm-buttons">
                <motion.button
                  className="btn btn--success"
                  onClick={() => onPickWord(choices[selected])}
                  whileTap={tapScale}
                >
                  ยืนยัน
                </motion.button>
                <motion.button
                  className="btn btn--secondary"
                  onClick={() => setConfirmed(false)}
                  whileTap={tapScale}
                >
                  เปลี่ยน
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatedPage>
  );
}
