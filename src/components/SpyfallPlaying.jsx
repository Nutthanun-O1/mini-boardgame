'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Timer from './Timer';
import FallbackImage from './FallbackImage';
import AnimatedPage, { staggerContainer, fadeUpItem, tapScale, popIn } from './AnimatedPage';
import { SPYFALL_ROLE_IMAGES, SPYFALL_ROLE_INFO, SPYFALL_LOCATION_IMAGES } from '@/lib/images';

export default function SpyfallPlaying({
  role,
  location,
  locationKey,
  locations,
  timerTotal,
  timeRemaining,
  timerPaused,
  players,
  myId,
  isDM,
  onPauseTimer,
  onResumeTimer,
  onCallVote,
  onSpyGuess,
}) {
  const [showRole, setShowRole] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [guessMode, setGuessMode] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [voteTarget, setVoteTarget] = useState(null);
  const [showVoteConfirm, setShowVoteConfirm] = useState(false);

  const isSpy = role === 'Spy';
  const info = SPYFALL_ROLE_INFO[role] || SPYFALL_ROLE_INFO.Agent;
  const imgSrc = SPYFALL_ROLE_IMAGES[role];
  const hasImage = imgSrc && !imgError;
  const modifier = isSpy ? 'role--spy' : 'role--agent';

  return (
    <AnimatedPage>
      <Timer total={timerTotal} remaining={timeRemaining} paused={timerPaused} />

      {/* ── Role Card ── */}
      <motion.div className={`role-card ${modifier}`} variants={popIn} initial="hidden" animate="visible">
        {!showRole ? (
          <div className="role-card__cover" onClick={() => setShowRole(true)}>
            <span className="role-card__cover-text">แตะเพื่อดูบทบาท</span>
          </div>
        ) : (
          <div className="role-card__revealed" onClick={() => setShowRole(false)}>
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
              <p className="role-card__label">{info.label}</p>
              <p className="role-card__desc">{info.description}</p>
              {!isSpy && location && (
                <div className="role-card__word">
                  <p className="role-card__word-label">สถานที่</p>
                  <p className="role-card__word-value">{location}</p>
                </div>
              )}
              {isSpy && (
                <div className="role-card__word role-card__word--unknown">
                  <p className="role-card__word-label">สถานที่</p>
                  <p className="role-card__word-value">???</p>
                </div>
              )}
            </div>
            <span className="role-card__tap-hint">แตะเพื่อซ่อน</span>
          </div>
        )}
      </motion.div>

      {/* ── Location Grid ── */}
      <motion.div className="spyfall-locations" variants={fadeUpItem} initial="hidden" animate="visible">
        <h3 className="spyfall-locations__title">สถานที่ทั้งหมด</h3>
        <motion.div className="spyfall-locations__grid" variants={staggerContainer} initial="hidden" animate="visible">
          {(locations || []).map(loc => {
            const isMyLocation = !isSpy && loc.key === locationKey;
            const isSelected = selectedLocation === loc.key;
            return (
              <motion.div
                key={loc.key}
                variants={fadeUpItem}
                className={`spyfall-loc-card${isMyLocation ? ' spyfall-loc-card--mine' : ''}${isSelected ? ' spyfall-loc-card--selected' : ''}`}
                onClick={() => isSpy && guessMode && setSelectedLocation(loc.key)}
              >
                <FallbackImage
                  src={SPYFALL_LOCATION_IMAGES[loc.key]}
                  fallback={loc.label[0]}
                  alt={loc.label}
                  className="spyfall-loc-card__img"
                  imageClassName="spyfall-loc-card__initial"
                />
                <span className="spyfall-loc-card__label">{loc.label}</span>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>

      {/* ── Actions ── */}
      <motion.div className="bottom-actions spyfall-actions" variants={fadeUpItem} initial="hidden" animate="visible">
        {/* DM: pause/resume timer */}
        {isDM && (
          <motion.button
            className={`btn btn--lg ${timerPaused ? 'btn--accent' : 'btn--secondary'}`}
            whileTap={tapScale}
            onClick={timerPaused ? onResumeTimer : onPauseTimer}
          >
            {timerPaused ? '▶ เล่นต่อ' : '⏸ หยุดเวลา'}
          </motion.button>
        )}

        {/* Spy: guess location */}
        {isSpy && !guessMode && (
          <motion.button className="btn btn--danger btn--lg" whileTap={tapScale} onClick={() => setGuessMode(true)}>
            🎯 เดาสถานที่
          </motion.button>
        )}
        {isSpy && guessMode && (
          <div className="confirm-group">
            <p className="confirm-text">
              {selectedLocation
                ? `เดา: ${locations.find(l => l.key === selectedLocation)?.label}`
                : 'เลือกสถานที่จากตารางด้านบน'}
            </p>
            <div className="confirm-buttons">
              <motion.button
                className="btn btn--danger"
                whileTap={tapScale}
                disabled={!selectedLocation}
                onClick={() => { onSpyGuess(selectedLocation); setGuessMode(false); }}
              >
                ยืนยันเดา
              </motion.button>
              <motion.button className="btn btn--secondary" whileTap={tapScale} onClick={() => { setGuessMode(false); setSelectedLocation(null); }}>
                ยกเลิก
              </motion.button>
            </div>
          </div>
        )}

        {/* Everyone: call vote */}
        {!guessMode && (
          <>
            {!showVoteConfirm ? (
              <motion.button className="btn btn--warning btn--lg" whileTap={tapScale} onClick={() => setShowVoteConfirm(true)}>
                🗳️ โหวตหา Spy
              </motion.button>
            ) : (
              <div className="confirm-group">
                <p className="confirm-text">เลือกคนที่คิดว่าเป็น Spy</p>
                <motion.div className="spyfall-vote-targets" variants={staggerContainer} initial="hidden" animate="visible">
                  {players.filter(p => p.id !== myId).map(p => (
                    <motion.button
                      key={p.id}
                      variants={fadeUpItem}
                      whileTap={tapScale}
                      className={`btn btn--sm ${voteTarget === p.id ? 'btn--primary' : 'btn--secondary'}`}
                      onClick={() => setVoteTarget(p.id)}
                    >
                      {p.name}
                    </motion.button>
                  ))}
                </motion.div>
                <div className="confirm-buttons">
                  <motion.button
                    className="btn btn--warning"
                    whileTap={tapScale}
                    disabled={!voteTarget}
                    onClick={() => { onCallVote(voteTarget); setShowVoteConfirm(false); setVoteTarget(null); }}
                  >
                    เริ่มโหวต
                  </motion.button>
                  <motion.button className="btn btn--secondary" whileTap={tapScale} onClick={() => { setShowVoteConfirm(false); setVoteTarget(null); }}>
                    ยกเลิก
                  </motion.button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </AnimatedPage>
  );
}
