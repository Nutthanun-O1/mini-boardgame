'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Timer from './Timer';
import { ROLE_IMAGES, ROLE_INFO } from '@/lib/images';
import AnimatedPage, { tapScale, popIn } from './AnimatedPage';

export default function Playing({ role, word, category, timerTotal, timeRemaining, isDM, onGuessCorrect }) {
  const [showRole, setShowRole] = useState(false);
  const [confirmGuess, setConfirmGuess] = useState(false);
  const [imgError, setImgError] = useState(false);

  const info = ROLE_INFO[role] || ROLE_INFO.Common;
  const imgSrc = ROLE_IMAGES[role];
  const hasImage = imgSrc && !imgError;

  return (
    <AnimatedPage>
      <Timer total={timerTotal} remaining={timeRemaining} />

      <motion.div className="role-card" variants={popIn} initial="hidden" animate="visible">
        <AnimatePresence mode="wait">
          {!showRole ? (
            <motion.div
              key="cover"
              className="role-card__cover"
              onClick={() => setShowRole(true)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <span className="role-card__cover-text">แตะเพื่อดูบทบาท</span>
            </motion.div>
          ) : (
            <motion.div
              key="revealed"
              className="role-card__revealed"
              onClick={() => setShowRole(false)}
              initial={{ opacity: 0, rotateY: 90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: -90 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
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

              <div className="role-card__info">
                <motion.p
                  className="role-card__label"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.3 }}
                >
                  {info.label}
                </motion.p>
                <p className="role-card__desc">{info.description}</p>

                {word ? (
                  <motion.div
                    className="role-card__word"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25, type: 'spring', stiffness: 300, damping: 24 }}
                  >
                    <p className="role-card__word-label">คำลับ</p>
                    <p className="role-card__word-value">{word}</p>
                  </motion.div>
                ) : null}
              </div>

              <span className="role-card__tap-hint">แตะเพื่อซ่อน</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {isDM && (
        <motion.div
          className="bottom-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <AnimatePresence mode="wait">
            {!confirmGuess ? (
              <motion.button
                key="guess-btn"
                className="btn btn--success btn--lg"
                onClick={() => setConfirmGuess(true)}
                whileTap={tapScale}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -8 }}
              >
                มีคนทายถูก
              </motion.button>
            ) : (
              <motion.div
                key="guess-confirm"
                className="confirm-group"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="confirm-text">ยืนยันว่ามีผู้เล่นทายถูกแล้ว?</p>
                <div className="confirm-buttons">
                  <motion.button className="btn btn--success" whileTap={tapScale} onClick={() => { onGuessCorrect(); setConfirmGuess(false); }}>
                    ยืนยัน
                  </motion.button>
                  <motion.button className="btn btn--secondary" whileTap={tapScale} onClick={() => setConfirmGuess(false)}>
                    ยกเลิก
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatedPage>
  );
}
