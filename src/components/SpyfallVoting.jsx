'use client';

import { SPYFALL_LOCATION_IMAGES } from '@/lib/images';
import FallbackImage from './FallbackImage';

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
    <div className="page fade-in">
      <div className="spyfall-vote-panel">
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

        <div className="spyfall-vote-panel__players">
          {players.map(p => {
            const voted = votes && p.id in votes;
            return (
              <div key={p.id} className={`spyfall-vote-chip${voted ? ' spyfall-vote-chip--voted' : ''}${p.id === targetId ? ' spyfall-vote-chip--target' : ''}`}>
                <span>{p.name}</span>
                {p.id === targetId && <span className="spyfall-vote-chip__tag">ผู้ต้องสงสัย</span>}
                {voted && <span className="spyfall-vote-chip__check">✓</span>}
              </div>
            );
          })}
        </div>

        {!myVoted ? (
          <div className="spyfall-vote-panel__actions">
            <p className="confirm-text">คุณเห็นด้วยไหมว่า <strong>{targetName}</strong> เป็น Spy?</p>
            <div className="confirm-buttons">
              <button className="btn btn--success btn--lg" onClick={() => onCastVote(true)}>
                👍 เห็นด้วย
              </button>
              <button className="btn btn--danger btn--lg" onClick={() => onCastVote(false)}>
                👎 ไม่เห็นด้วย
              </button>
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
      </div>
    </div>
  );
}
