'use client';

import { useState } from 'react';
import FallbackImage from './FallbackImage';
import { SPYFALL_LOCATION_IMAGES } from '@/lib/images';

export default function SpyfallLastChance({ spy, locations, onLastGuess }) {
  const [selectedLocation, setSelectedLocation] = useState(null);

  return (
    <div className="page fade-in">
      <div className="spyfall-last-chance">
        <div className="spyfall-last-chance__header">
          <h2>🚨 Spy ถูกจับได้!</h2>
          <p><strong>{spy}</strong> คือ Spy — แต่ยังมีโอกาสสุดท้าย!</p>
          <p className="spyfall-last-chance__sub">Spy สามารถเดาสถานที่เพื่อพลิกกลับมาชนะ</p>
        </div>

        <div className="spyfall-locations">
          <h3 className="spyfall-locations__title">เลือกสถานที่</h3>
          <div className="spyfall-locations__grid">
            {(locations || []).map(loc => (
              <div
                key={loc.key}
                className={`spyfall-loc-card${selectedLocation === loc.key ? ' spyfall-loc-card--selected' : ''}`}
                onClick={() => setSelectedLocation(loc.key)}
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
            ))}
          </div>
        </div>

        <div className="bottom-actions">
          <div className="confirm-group">
            <p className="confirm-text">
              {selectedLocation
                ? `เดา: ${locations.find(l => l.key === selectedLocation)?.label}`
                : 'เลือกสถานที่จากด้านบน'}
            </p>
            <button
              className="btn btn--danger btn--lg"
              disabled={!selectedLocation}
              onClick={() => onLastGuess(selectedLocation)}
            >
              🎯 ยืนยันเดาสถานที่
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
