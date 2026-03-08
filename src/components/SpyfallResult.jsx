'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import FallbackImage from './FallbackImage';
import { SPYFALL_ROLE_IMAGES, SPYFALL_LOCATION_IMAGES } from '@/lib/images';
import AnimatedPage, { staggerContainer, fadeUpItem, tapScale, popIn } from './AnimatedPage';

const REASON_TEXT = {
  'timeout':               'หมดเวลา — Spy ชนะ!',
  'spy-guessed-correct':   'Spy เดาสถานที่ถูก!',
  'spy-guessed-wrong':     'Spy เดาสถานที่ผิด!',
  'spy-caught':            'จับ Spy ได้สำเร็จ!',
  'spy-last-guess-correct':'Spy ถูกจับ แต่เดาสถานที่ถูก!',
  'wrong-accusation':      'โหวตผิดคน — Spy ชนะ!',
};

export default function SpyfallResult({ result, isDM, myRole, onPlayAgain }) {
  if (!result) return null;

  const {
    winner, reason, spy, spyId, location, locationKey,
    guessedLocation, guessedLocationKey, accusedName,
    players: gamePlayers, roles,
  } = result;

  const isSpyWin = winner === 'spy';
  const reasonLabel = REASON_TEXT[reason] || reason;

  const ROLE_BADGE = {
    Spy: 'badge--spy',
    Agent: 'badge--agent',
  };

  return (
    <AnimatedPage>
      {/* ── Result Banner ── */}
      <motion.div className={`reveal-banner ${isSpyWin ? 'reveal-banner--spy-win' : 'reveal-banner--players-win'}`} variants={popIn} initial="hidden" animate="visible">
        <p className="reveal-banner__label">
          {isSpyWin ? '🕵️ Spy ชนะ!' : '🎉 ผู้เล่นชนะ!'}
        </p>
        <p className="reveal-banner__word">{reasonLabel}</p>
      </motion.div>

      {/* ── Spy Reveal ── */}
      <motion.div className="insider-reveal" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 24 }}>
        <p className="insider-reveal__label">Spy คือ</p>
        <FallbackImage
          src={SPYFALL_ROLE_IMAGES.Spy}
          fallback={spy?.[0] || '?'}
          alt="Spy"
          className="insider-reveal__image"
          imageClassName="insider-reveal__initial"
        />
        <p className="insider-reveal__name">{spy}</p>
      </motion.div>

      {/* ── Location Reveal ── */}
      <motion.div className="spyfall-result-location" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.35 }}>
        <p className="spyfall-result-location__label">สถานที่คือ</p>
        <FallbackImage
          src={SPYFALL_LOCATION_IMAGES[locationKey]}
          fallback={location?.[0] || '?'}
          alt={location}
          className="spyfall-result-location__img"
          imageClassName="spyfall-result-location__initial"
        />
        <p className="spyfall-result-location__name">{location}</p>
      </motion.div>

      {guessedLocation && (
        <div className="spyfall-result-guess">
          <span>Spy เดา: </span>
          <strong>{guessedLocation}</strong>
          {reason === 'spy-guessed-correct' || reason === 'spy-last-guess-correct'
            ? ' ✅' : ' ❌'}
        </div>
      )}

      {accusedName && (
        <div className="spyfall-result-guess">
          <span>ถูกกล่าวหา: </span>
          <strong>{accusedName}</strong> ❌
        </div>
      )}

      {/* ── Player Roles ── */}
      <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.35 }}>
        <div className="card__header">
          <span className="card__title">บทบาทของทุกคน</span>
          <span className="badge badge--neutral">บทบาทคุณ: {myRole}</span>
        </div>
        <motion.ul className="role-list" variants={staggerContainer} initial="hidden" animate="visible">
          {(gamePlayers || []).map(p => {
            const role = roles?.[p.id];
            const isSpy = p.id === spyId;
            return (
              <motion.li key={p.id} className={`role-list__row${isSpy ? ' role-list__row--spy' : ''}`} variants={fadeUpItem}>
                <div className="role-list__left">
                  <FallbackImage
                    src={SPYFALL_ROLE_IMAGES[role]}
                    fallback={p.name?.[0] || '?'}
                    alt={role}
                    className="role-list__avatar"
                    imageClassName="role-list__avatar-initial"
                  />
                  <span className="role-list__name">{p.name}</span>
                </div>
                <span className={`badge ${ROLE_BADGE[role] || ''}`}>{role}</span>
              </motion.li>
            );
          })}
        </motion.ul>
      </motion.div>

      <motion.div className="bottom-actions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
        <motion.button className="btn btn--primary btn--lg" onClick={onPlayAgain} whileTap={tapScale}>
          เล่นรอบใหม่
        </motion.button>
      </motion.div>
    </AnimatedPage>
  );
}
