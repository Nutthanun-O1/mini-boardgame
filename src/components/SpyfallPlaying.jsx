'use client';

import { useState } from 'react';
import Timer from './Timer';
import FallbackImage from './FallbackImage';
import { SPYFALL_ROLE_IMAGES, SPYFALL_ROLE_INFO, SPYFALL_LOCATION_IMAGES } from '@/lib/images';

export default function SpyfallPlaying({
  role,
  location,
  locationKey,
  locations,
  timerTotal,
  timeRemaining,
  players,
  myId,
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
    <div className="page fade-in">
      <Timer total={timerTotal} remaining={timeRemaining} />

      {/* ── Role Card ── */}
      <div className={`role-card ${modifier}`}>
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
      </div>

      {/* ── Location Grid ── */}
      <div className="spyfall-locations">
        <h3 className="spyfall-locations__title">สถานที่ทั้งหมด</h3>
        <div className="spyfall-locations__grid">
          {(locations || []).map(loc => {
            const isMyLocation = !isSpy && loc.key === locationKey;
            const isSelected = selectedLocation === loc.key;
            return (
              <div
                key={loc.key}
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
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="bottom-actions spyfall-actions">
        {/* Spy: guess location */}
        {isSpy && !guessMode && (
          <button className="btn btn--danger btn--lg" onClick={() => setGuessMode(true)}>
            🎯 เดาสถานที่
          </button>
        )}
        {isSpy && guessMode && (
          <div className="confirm-group">
            <p className="confirm-text">
              {selectedLocation
                ? `เดา: ${locations.find(l => l.key === selectedLocation)?.label}`
                : 'เลือกสถานที่จากตารางด้านบน'}
            </p>
            <div className="confirm-buttons">
              <button
                className="btn btn--danger"
                disabled={!selectedLocation}
                onClick={() => { onSpyGuess(selectedLocation); setGuessMode(false); }}
              >
                ยืนยันเดา
              </button>
              <button className="btn btn--secondary" onClick={() => { setGuessMode(false); setSelectedLocation(null); }}>
                ยกเลิก
              </button>
            </div>
          </div>
        )}

        {/* Everyone: call vote */}
        {!guessMode && (
          <>
            {!showVoteConfirm ? (
              <button className="btn btn--warning btn--lg" onClick={() => setShowVoteConfirm(true)}>
                🗳️ โหวตหา Spy
              </button>
            ) : (
              <div className="confirm-group">
                <p className="confirm-text">เลือกคนที่คิดว่าเป็น Spy</p>
                <div className="spyfall-vote-targets">
                  {players.filter(p => p.id !== myId).map(p => (
                    <button
                      key={p.id}
                      className={`btn btn--sm ${voteTarget === p.id ? 'btn--primary' : 'btn--secondary'}`}
                      onClick={() => setVoteTarget(p.id)}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
                <div className="confirm-buttons">
                  <button
                    className="btn btn--warning"
                    disabled={!voteTarget}
                    onClick={() => { onCallVote(voteTarget); setShowVoteConfirm(false); setVoteTarget(null); }}
                  >
                    เริ่มโหวต
                  </button>
                  <button className="btn btn--secondary" onClick={() => { setShowVoteConfirm(false); setVoteTarget(null); }}>
                    ยกเลิก
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
