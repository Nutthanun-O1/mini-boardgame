'use client';

import { useState } from 'react';
import FallbackImage from './FallbackImage';
import { SPYFALL_ROLE_IMAGES, SPYFALL_LOCATION_IMAGES } from '@/lib/images';

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
    <div className="page fade-in">
      {/* ── Result Banner ── */}
      <div className={`reveal-banner ${isSpyWin ? 'reveal-banner--spy-win' : 'reveal-banner--players-win'}`}>
        <p className="reveal-banner__label">
          {isSpyWin ? '🕵️ Spy ชนะ!' : '🎉 ผู้เล่นชนะ!'}
        </p>
        <p className="reveal-banner__word">{reasonLabel}</p>
      </div>

      {/* ── Spy Reveal ── */}
      <div className="insider-reveal">
        <p className="insider-reveal__label">Spy คือ</p>
        <FallbackImage
          src={SPYFALL_ROLE_IMAGES.Spy}
          fallback={spy?.[0] || '?'}
          alt="Spy"
          className="insider-reveal__image"
          imageClassName="insider-reveal__initial"
        />
        <p className="insider-reveal__name">{spy}</p>
      </div>

      {/* ── Location Reveal ── */}
      <div className="spyfall-result-location">
        <p className="spyfall-result-location__label">สถานที่คือ</p>
        <FallbackImage
          src={SPYFALL_LOCATION_IMAGES[locationKey]}
          fallback={location?.[0] || '?'}
          alt={location}
          className="spyfall-result-location__img"
          imageClassName="spyfall-result-location__initial"
        />
        <p className="spyfall-result-location__name">{location}</p>
      </div>

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
      <div className="card">
        <div className="card__header">
          <span className="card__title">บทบาทของทุกคน</span>
          <span className="badge badge--neutral">บทบาทคุณ: {myRole}</span>
        </div>
        <ul className="role-list">
          {(gamePlayers || []).map(p => {
            const role = roles?.[p.id];
            const isSpy = p.id === spyId;
            return (
              <li key={p.id} className={`role-list__row${isSpy ? ' role-list__row--spy' : ''}`}>
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
              </li>
            );
          })}
        </ul>
      </div>

      {isDM ? (
        <div className="bottom-actions">
          <button className="btn btn--primary btn--lg" onClick={onPlayAgain}>
            เล่นรอบใหม่
          </button>
        </div>
      ) : (
        <div className="waiting-state">
          <span className="waiting-dot" />
          <span className="waiting-dot" />
          <span className="waiting-dot" />
          <p>รอ DM เริ่มรอบใหม่</p>
        </div>
      )}
    </div>
  );
}
