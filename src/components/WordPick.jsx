'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedPage, { staggerContainer, fadeUpItem, tapScale, popIn } from './AnimatedPage';

const PICK_TIME_LIMIT = 10; // seconds

/**
 * Word-pick phase: DM sees 5 random words and has 10 seconds to choose one.
 * If time runs out, a random word is auto-selected.
 * Other players wait.
 */
export default function WordPick({ isDM, choices, onPickWord }) {
  const [selected, setSelected] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(PICK_TIME_LIMIT);
  const timerRef = useRef(null);
  const autoPickedRef = useRef(false);

  // Countdown timer for DM
  useEffect(() => {
    if (!isDM || !choices || choices.length === 0) return;

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, PICK_TIME_LIMIT - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;

        // Auto-pick a random word if DM hasn't confirmed yet
        if (!autoPickedRef.current) {
          autoPickedRef.current = true;
          const randomIdx = Math.floor(Math.random() * choices.length);
          onPickWord(choices[randomIdx]);
        }
      }
    }, 250);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isDM, choices, onPickWord]);

  // Stop timer when DM confirms a word
  function handleConfirm() {
    autoPickedRef.current = true;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    onPickWord(choices[selected]);
  }

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

  const isUrgent = timeLeft <= 3;

  return (
    <AnimatedPage>
      {/* ── Countdown Timer ── */}
      <motion.div
        className={`word-pick-timer ${isUrgent ? 'word-pick-timer--urgent' : ''}`}
        variants={popIn}
        initial="hidden"
        animate="visible"
      >
        <span className="word-pick-timer__label">เวลาเลือกคำ</span>
        <motion.span
          className="word-pick-timer__value"
          key={timeLeft}
          initial={{ scale: 1.3, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {timeLeft}
        </motion.span>
        <span className="word-pick-timer__unit">วินาที</span>
        {/* Progress bar */}
        <div className="word-pick-timer__bar">
          <motion.div
            className="word-pick-timer__bar-fill"
            initial={{ scaleX: 1 }}
            animate={{ scaleX: timeLeft / PICK_TIME_LIMIT }}
            transition={{ duration: 0.3, ease: 'linear' }}
          />
        </div>
      </motion.div>

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
                  onClick={handleConfirm}
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
