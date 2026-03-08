'use client';

import { motion } from 'framer-motion';
import FallbackImage from './FallbackImage';
import { ROLE_IMAGES } from '@/lib/images';
import AnimatedPage, { staggerContainer, fadeUpItem, tapScale, popIn } from './AnimatedPage';

export default function Result({ result, word, category, isDM, myRole, onPlayAgain }) {
  const isTimedOut = result?.timedOut;
  const gamePlayers = result?.players || result?.gamePlayers || [];
  const roles = result?.roles || {};

  const ROLE_BADGE = {
    Master: 'badge--master',
    Insider: 'badge--insider',
    Common: 'badge--common',
  };

  return (
    <AnimatedPage>
      <motion.div
        className={`reveal-banner${isTimedOut ? ' reveal-banner--timeout' : ''}`}
        variants={popIn}
        initial="hidden"
        animate="visible"
      >
        <p className="reveal-banner__label">{isTimedOut ? 'หมดเวลา' : 'เฉลยผล'}</p>
        <p className="reveal-banner__word">{result?.word || word}</p>
        <p className="reveal-banner__category">{result?.category || category}</p>
      </motion.div>

      <motion.div className="insider-reveal" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 24 }}>
        <p className="insider-reveal__label">Insider คือ</p>
        <FallbackImage
          src={ROLE_IMAGES.Insider}
          fallback={result?.insider?.[0] || '?'}
          alt="Insider"
          className="insider-reveal__image"
          imageClassName="insider-reveal__initial"
        />
        <p className="insider-reveal__name">{result?.insider}</p>
      </motion.div>

      <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.35 }}>
        <div className="card__header">
          <span className="card__title">บทบาทของทุกคน</span>
          <span className="badge badge--neutral">บทบาทคุณ: {myRole}</span>
        </div>
        <motion.ul className="role-list" variants={staggerContainer} initial="hidden" animate="visible">
          {gamePlayers.map(p => {
            const role = roles[p.id];
            const isInsider = p.id === result?.insiderId;
            return (
              <motion.li key={p.id} className={`role-list__row${isInsider ? ' role-list__row--insider' : ''}`} variants={fadeUpItem}>
                <div className="role-list__left">
                  <FallbackImage
                    src={ROLE_IMAGES[role]}
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

      <motion.div className="bottom-actions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.35 }}>
        <motion.button className="btn btn--primary btn--lg" onClick={onPlayAgain} whileTap={tapScale}>
          เล่นรอบใหม่
        </motion.button>
      </motion.div>
    </AnimatedPage>
  );
}
