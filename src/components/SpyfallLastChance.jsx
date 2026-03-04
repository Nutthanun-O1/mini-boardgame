'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import FallbackImage from './FallbackImage';
import AnimatedPage, { staggerContainer, fadeUpItem, tapScale, popIn } from './AnimatedPage';
import { SPYFALL_LOCATION_IMAGES } from '@/lib/images';

export default function SpyfallLastChance({ spy, locations, onLastGuess }) {
  const [selectedLocation, setSelectedLocation] = useState(null);

  return (
    <AnimatedPage>
      <div className="spyfall-last-chance">
        <motion.div className="spyfall-last-chance__header" variants={popIn} initial="hidden" animate="visible">
          <h2>🚨 Spy ถูกจับได้!</h2>
          <p><strong>{spy}</strong> คือ Spy — แต่ยังมีโอกาสสุดท้าย!</p>
          <p className="spyfall-last-chance__sub">Spy สามารถเดาสถานที่เพื่อพลิกกลับมาชนะ</p>
        </motion.div>

        <motion.div className="spyfall-locations" variants={fadeUpItem} initial="hidden" animate="visible">
          <h3 className="spyfall-locations__title">เลือกสถานที่</h3>
          <motion.div className="spyfall-locations__grid" variants={staggerContainer} initial="hidden" animate="visible">
            {(locations || []).map(loc => (
              <motion.div
                key={loc.key}
                variants={fadeUpItem}
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
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div className="bottom-actions" variants={fadeUpItem} initial="hidden" animate="visible">
          <div className="confirm-group">
            <p className="confirm-text">
              {selectedLocation
                ? `เดา: ${locations.find(l => l.key === selectedLocation)?.label}`
                : 'เลือกสถานที่จากด้านบน'}
            </p>
            <motion.button
              className="btn btn--danger btn--lg"
              whileTap={tapScale}
              disabled={!selectedLocation}
              onClick={() => onLastGuess(selectedLocation)}
            >
              🎯 ยืนยันเดาสถานที่
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatedPage>
  );
}
