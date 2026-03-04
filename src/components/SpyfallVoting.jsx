'use client';

import { motion } from 'framer-motion';
import { SPYFALL_LOCATION_IMAGES } from '@/lib/images';
import FallbackImage from './FallbackImage';
import AnimatedPage, { staggerContainer, fadeUpItem, tapScale, popIn } from './AnimatedPage';

export default function SpyfallVoting({
  voteInfo,
  players,
  myId,
  onCastVote,
}) {
  if (!voteInfo) return null;

  const { callerName, targetName, targetId, votes, totalPlayers } = voteInfo;
  const voteCount = Object.keys(votes || {}).length;
  const myVoted = votes && myId in votes;

  return (
    <AnimatedPage>
      <motion.div className="spyfall-vote-panel" variants={popIn} initial="hidden" animate="visible">
        <div className="spyfall-vote-panel__header">
          <h2 className="spyfall-vote-panel__title">🗳️ การโหวต</h2>
          <p className="spyfall-vote-panel__desc">
            <strong>{callerName}</strong> เสนอว่า <strong>{targetName}</strong> เป็น Spy
          </p>
        </div>

        <div className="spyfall-vote-panel__progress">
          <div className="spyfall-vote-panel__bar">
            <div
              className="spyfall-vote-panel__bar-fill"
              style={{ width: `${(voteCount / totalPlayers) * 100}%` }}
            />
          </div>
          <span className="spyfall-vote-panel__count">
            โหวตแล้ว {voteCount}/{totalPlayers}
          </span>
        </div>

        <motion.div className="spyfall-vote-panel__players" variants={staggerContainer} initial="hidden" animate="visible">
          {players.map(p => {
            const voted = votes && p.id in votes;
            return (
              <motion.div key={p.id} variants={fadeUpItem} className={`spyfall-vote-chip${voted ? ' spyfall-vote-chip--voted' : ''}${p.id === targetId ? ' spyfall-vote-chip--target' : ''}`}>
                <span>{p.name}</span>
                {p.id === targetId && <span className="spyfall-vote-chip__tag">ผู้ต้องสงสัย</span>}
                {voted && <span className="spyfall-vote-chip__check">✓</span>}
              </motion.div>
            );
          })}
        </motion.div>

        {!myVoted ? (
          <div className="spyfall-vote-panel__actions">
            <p className="confirm-text">คุณเห็นด้วยไหมว่า <strong>{targetName}</strong> เป็น Spy?</p>
            <div className="confirm-buttons">
              <motion.button className="btn btn--success btn--lg" whileTap={tapScale} onClick={() => onCastVote(true)}>
                👍 เห็นด้วย
              </motion.button>
              <motion.button className="btn btn--danger btn--lg" whileTap={tapScale} onClick={() => onCastVote(false)}>
                👎 ไม่เห็นด้วย
              </motion.button>
            </div>
          </div>
        ) : (
          <div className="waiting-state">
            <span className="waiting-dot" />
            <span className="waiting-dot" />
            <span className="waiting-dot" />
            <p>รอผู้เล่นอื่นโหวต</p>
          </div>
        )}
      </motion.div>
    </AnimatedPage>
  );
}
