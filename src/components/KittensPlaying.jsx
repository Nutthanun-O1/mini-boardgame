'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KITTENS_CARDS } from '@/lib/gameData';
import AnimatedPage, { tapScale, popIn } from './AnimatedPage';

export default function KittensPlaying({
  gameState,
  myId,
  players,
  onPlayCard,
  onDrawCard,
  onDefuseKitten,
  onGiveFavor
}) {
  const [selectedCards, setSelectedCards] = useState([]); // Array of indexes for pair play
  const [selectedCardIdx, setSelectedCardIdx] = useState(null);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [actionTarget, setActionTarget] = useState(null);
  const [pendingActionType, setPendingActionType] = useState(null); // 'favor', 'targeted-attack', or 'pair'
  const [nopeCountdown, setNopeCountdown] = useState(0);
  
  // For Alter the Future
  const [alteredCards, setAlteredCards] = useState([]);
  
  // Nope System Timer
  useEffect(() => {
    let interval;
    if (gameState?.pendingAction) {
      interval = setInterval(() => {
         const remain = Math.max(0, Math.ceil((gameState.pendingAction.expiresAt - Date.now()) / 1000));
         setNopeCountdown(remain);
      }, 200);
    }
    return () => clearInterval(interval);
  }, [gameState?.pendingAction]);

  // Initiator automatically resolves action when time runs out
  useEffect(() => {
    if (gameState?.pendingAction && gameState.pendingAction.initiatorId === myId) {
       const timeRemaining = gameState.pendingAction.expiresAt - Date.now();
       if (timeRemaining > 0) {
           const timer = setTimeout(() => {
               onPlayCard('resolve-pending', null);
           }, timeRemaining);
           return () => clearTimeout(timer);
       } else {
           onPlayCard('resolve-pending', null);
       }
    }
  }, [gameState?.pendingAction?.expiresAt, gameState?.pendingAction?.nopeCount, myId]);

  useEffect(() => {
    if (gameState.alterFutureCards) {
      setAlteredCards([...gameState.alterFutureCards]);
    }
  }, [gameState.alterFutureCards]);
  const [defusePosition, setDefusePosition] = useState(0); // 0 = top of deck
  const [focusedCard, setFocusedCard] = useState(null);
  const [showDrawConfirm, setShowDrawConfirm] = useState(false);

  const {
    deck,
    discard,
    hands,
    turnOrder,
    currentPlayerId,
    attacksRemaining,
    eliminated,
    lastAction,
    pendingKitten,
    futureCards,
    favorRequest // { requesterId, targetId, resolved }
  } = gameState;

  const myHand = hands[myId] || [];
  const isMyTurn = currentPlayerId === myId && !pendingKitten && !favorRequest;
  const activePlayerName = players.find(p => p.id === currentPlayerId)?.name || '???';
  const isEliminated = eliminated.includes(myId);

  // See if I am target of a favor request
  const amFavorTarget = favorRequest && favorRequest.targetId === myId && !favorRequest.resolved;
  const favorRequesterName = favorRequest
    ? players.find(p => p.id === favorRequest.requesterId)?.name || '???'
    : '';

  // See if I drew the exploding kitten and need to defuse
  const amDefusing = pendingKitten && pendingKitten.player_id === myId;
  const hasDefuse = myHand.includes('defuse') || myHand.includes('zombie-kitten');

  const handlePlay = (type, idx) => {
    // Allow playing 'nope' out of turn if there's a pending action
    if (gameState?.pendingAction && type === 'nope') {
      onPlayCard('nope', null);
      return;
    }

    if (!isMyTurn || isEliminated) return;
    
    const cardDef = KITTENS_CARDS[type] || {};
    
    // Toggle selection for non-action cards (for combos)
    if (!cardDef.action) {
      if (selectedCards.includes(idx)) {
        setSelectedCards(selectedCards.filter(i => i !== idx));
      } else {
        setSelectedCards([...selectedCards, idx]);
      }
      return;
    }
    
    if (type === 'favor' || type === 'targeted-attack') {
      setSelectedCardIdx(idx);
      setPendingActionType(type);
      setShowTargetModal(true);
      return;
    }
    
    onPlayCard(type, null);
  };

  const handlePlayPair = () => {
    if (selectedCards.length !== 2) return;
    setPendingActionType('pair');
    setShowTargetModal(true);
  };

  function confirmTargetAction() {
    if (!actionTarget && pendingActionType !== 'zombie-revive') return;
    
    if (pendingActionType === 'pair') {
       onPlayCard('pair', { targetId: actionTarget, cardIndexes: selectedCards });
       setSelectedCards([]);
    } else if (pendingActionType === 'zombie-revive') {
       onDefuseKitten(defusePosition, 'zombie-kitten', actionTarget);
    } else {
       const type = hands[myId][selectedCardIdx];
       onPlayCard(type, actionTarget);
       setSelectedCardIdx(null);
    }
    
    setShowTargetModal(false);
    setActionTarget(null);
    setPendingActionType(null);
  }

  // Helper for Alter the Future reordering
  const moveAlteredCard = (direction, idx) => {
    const newCards = [...alteredCards];
    if (direction === 'left' && idx > 0) {
      [newCards[idx - 1], newCards[idx]] = [newCards[idx], newCards[idx - 1]];
      setAlteredCards(newCards);
    } else if (direction === 'right' && idx < newCards.length - 1) {
      [newCards[idx + 1], newCards[idx]] = [newCards[idx], newCards[idx + 1]];
      setAlteredCards(newCards);
    }
  };

  const topDiscard = discard.length > 0 ? discard[discard.length - 1] : null;

  return (
    <AnimatedPage>
      {/* Styles for premium game screen */}
      <style jsx>{`
        .kittens-game {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          color: #fff;
          font-family: 'Outfit', sans-serif;
        }
        .action-log {
          background: rgba(30, 30, 40, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 0.75rem 1rem;
          font-size: 0.9rem;
          color: #a78bfa;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(8px);
        }
        .game-layout {
          display: grid;
          grid-template-columns: 1fr 240px;
          gap: 1.5rem;
        }
        @media (max-width: 768px) {
          .game-layout {
            grid-template-columns: 1fr;
          }
          .board-center {
            gap: 1.5rem;
          }
          .card-back, .discard-placeholder, .card-face {
            width: 80px !important;
            height: 116px !important;
          }
          .future-card-box .card-face {
            width: 70px !important;
            height: 100px !important;
          }
          .hand-cards {
            justify-content: flex-start;
          }
        }
        .main-board {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          background: rgba(20, 20, 30, 0.4);
          border-radius: 20px;
          padding: 2rem 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .board-center {
          display: flex;
          gap: 3rem;
          align-items: center;
          justify-content: center;
        }
        .deck-pile, .discard-pile {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        .card-back {
          width: 100px;
          height: 145px;
          background: url(/images/explode-cat/backcard.png) center/cover no-repeat;
          border-radius: 12px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .card-back.disabled {
          cursor: not-allowed;
          opacity: 0.7;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
          filter: grayscale(0.8);
        }
        .card-count {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
        }
        .discard-placeholder {
          width: 100px;
          height: 145px;
          border: 2px dashed rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.3);
          font-size: 0.8rem;
        }
        .card-face {
          width: 100px;
          height: 145px;
          border-radius: 12px;
          border: 3px solid #fff;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
          padding: 8px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          color: #fff;
          font-weight: bold;
          position: relative;
        }
        .hand-container {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          align-items: center;
        }
        .hand-title {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .hand-cards {
          display: flex;
          gap: 0.75rem;
          overflow-x: auto;
          padding: 0.5rem;
          width: 100%;
          justify-content: center;
          scrollbar-width: thin;
        }
        .playable-card {
          flex-shrink: 0;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .playable-card:hover {
          transform: translateY(-12px) scale(1.05);
        }
        .playable-card.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        .sidebar {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          background: rgba(15, 15, 25, 0.5);
          border-radius: 20px;
          padding: 1.25rem;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .player-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid transparent;
        }
        .player-item.active {
          background: rgba(139, 92, 246, 0.15);
          border-color: rgba(139, 92, 246, 0.4);
          box-shadow: 0 0 12px rgba(139, 92, 246, 0.2);
        }
        .player-item.eliminated {
          opacity: 0.4;
          text-decoration: line-through;
          background: rgba(239, 68, 68, 0.05);
        }
        .player-name {
          font-weight: 600;
          font-size: 0.95rem;
        }
        .player-cards-count {
          font-size: 0.8rem;
          background: rgba(255, 255, 255, 0.1);
          padding: 2px 6px;
          border-radius: 6px;
        }
        .overlay-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          backdrop-filter: blur(10px);
          padding: 1.5rem;
        }
        .modal-content {
          background: #1e1e2d;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 2rem;
          width: 100%;
          max-width: 450px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          align-items: center;
          text-align: center;
        }
        .modal-title {
          font-size: 1.4rem;
          font-weight: 700;
        }
        .modal-desc {
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.6);
        }
        .future-cards-row {
          display: flex;
          gap: 0.75rem;
          margin: 1rem 0;
        }
        .future-card-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        .future-card-box span {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
        }
        .slider-container {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .slider-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
        }
        input[type="range"] {
          width: 100%;
          accent-color: #10b981;
        }

        /* 💥 Exploding Kitten Premium UI */
        .modal-content.exploding-theme {
          position: relative;
          background: linear-gradient(145deg, #2a0f14 0%, #170505 100%);
          border: 2px solid rgba(239, 68, 68, 0.5);
          overflow: visible; /* Make glowing ring visible */
        }
        
        /* Hardware accelerated pulse outer ring */
        .modal-content.exploding-theme::before {
          content: '';
          position: absolute;
          top: -2px; left: -2px; right: -2px; bottom: -2px;
          border: 2px solid #ef4444;
          border-radius: 20px;
          opacity: 0;
          pointer-events: none;
          animation: pulse-danger-accelerated 2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
        }
        
        @keyframes pulse-danger-accelerated {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.18);
            opacity: 0;
          }
        }
        
        .exploding-title {
          font-size: 1.8rem;
          font-weight: 900;
          color: #fca5a5;
          text-shadow: 0 0 20px rgba(239, 68, 68, 0.8);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 0;
        }
        .exploding-icon {
          font-size: 5rem;
          line-height: 1;
          filter: drop-shadow(0 0 15px rgba(239, 68, 68, 0.6));
        }
        .defuse-zone {
          background: rgba(0, 0, 0, 0.4);
          border: 1px dashed rgba(16, 185, 129, 0.4);
          border-radius: 16px;
          padding: 1.5rem;
          width: 100%;
          position: relative;
        }
        .defuse-zone::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 4px;
          border-radius: 16px 16px 0 0;
          background: repeating-linear-gradient(45deg, #10b981, #10b981 10px, transparent 10px, transparent 20px);
        }
        .death-zone {
          background: rgba(0, 0, 0, 0.4);
          border: 1px dashed rgba(239, 68, 68, 0.4);
          border-radius: 16px;
          padding: 1.5rem;
          width: 100%;
          position: relative;
        }
        .death-zone::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 4px;
          border-radius: 16px 16px 0 0;
          background: repeating-linear-gradient(45deg, #ef4444, #ef4444 10px, transparent 10px, transparent 20px);
        }
        
        /* 🎇 Floating sparks/embers */
        .sparks-container {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          pointer-events: none;
          overflow: hidden;
          border-radius: 20px;
          z-index: 1;
        }
        .spark {
          position: absolute;
          bottom: 0;
          border-radius: 50%;
          opacity: 0;
          background: #f59e0b;
          filter: drop-shadow(0 0 6px #ef4444);
        }
        .spark-0 { left: 12%; animation: float-spark 2.2s infinite 0.1s; width: 4px; height: 4px; }
        .spark-1 { left: 28%; animation: float-spark 2.8s infinite 0.7s; width: 5px; height: 5px; }
        .spark-2 { left: 45%; animation: float-spark 2.5s infinite 1.3s; width: 3px; height: 3px; }
        .spark-3 { left: 62%; animation: float-spark 3.1s infinite 0.4s; width: 4px; height: 4px; }
        .spark-4 { left: 78%; animation: float-spark 2.6s infinite 1.8s; width: 5px; height: 5px; }
        .spark-5 { left: 90%; animation: float-spark 3.0s infinite 1.0s; width: 3px; height: 3px; }
        .spark-6 { left: 22%; animation: float-spark 2.7s infinite 2.2s; width: 4px; height: 4px; }
        .spark-7 { left: 73%; animation: float-spark 3.3s infinite 0.2s; width: 5px; height: 5px; }
        
        @keyframes float-spark {
          0% { transform: translateY(10px) scale(0.5); opacity: 0; }
          40% { opacity: 0.9; }
          100% { transform: translateY(-160px) scale(1.6); opacity: 0; }
        }
        
        /* 🚨 Fullscreen Edge Danger Warning */
        .overlay-modal.exploding-vignette {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          box-shadow: inset 0 0 100px rgba(239, 68, 68, 0.7);
          pointer-events: none;
          z-index: 105;
          animation: vignette-pulse-h 1.2s ease-in-out infinite alternate;
        }
        @keyframes vignette-pulse-h {
          0% { opacity: 0.3; }
          100% { opacity: 0.95; }
        }
        
        /* 🎛️ Premium Ranges */
        .defuse-zone input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          outline: none;
          margin: 0.5rem 0;
        }
        .defuse-zone input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.8);
          transition: transform 0.1s, background-color 0.1s;
        }
        .defuse-zone input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.25);
        }
        .defuse-zone input[type="range"].slider-danger::-webkit-slider-thumb {
          background: #ef4444;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.8);
        }
      `}</style>

      <div className="kittens-game">
        {/* Action Logger */}
        {lastAction && (
          <div className="action-log">
            📢 {lastAction}
          </div>
        )}

        {/* Board Layout */}
        <div className="game-layout">
          {/* Main Area */}
          <div className="main-board">
            {/* Turn status indicator */}
            <div className="turn-indicator" style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {isMyTurn ? (
                  <span style={{ color: '#8b5cf6' }}>✨ ตาของคุณแล้ว!</span>
                ) : (
                  <span>ตาของ: <strong style={{ color: '#f59e0b' }}>{activePlayerName}</strong></span>
                )}
              </h2>
              {attacksRemaining > 0 && (
                <p style={{ fontSize: '0.85rem', color: '#ef4444', marginTop: '0.25rem' }}>
                  ⚠️ ต้องเล่น/จั่วเพิ่มอีก <strong>{attacksRemaining}</strong> ครั้ง
                </p>
              )}
            </div>

            {/* Deck & Discard Piles */}
            <div className="board-center">
              {/* Draw Deck */}
              <div className="deck-pile">
                {deck.length > 0 && (
                  <div
                    className={`card-back ${!isMyTurn || isEliminated ? 'disabled' : ''}`}
                    onClick={() => isMyTurn && !isEliminated && setShowDrawConfirm(true)}
                    title={isMyTurn && !isEliminated ? "คลิกเพื่อจั่วการ์ด" : ""}
                  />
                )}
                <span className="card-count" style={{ marginTop: '0.5rem' }}>กองจั่ว: {deck.length} ใบ</span>
              </div>

              {/* Discard Pile */}
              <div className="discard-pile">
                {topDiscard ? (
                  <div
                    className="card-face animate-pop"
                    style={{
                      background: KITTENS_CARDS[topDiscard]?.img 
                        ? `url(${KITTENS_CARDS[topDiscard].img}) center/cover no-repeat`
                        : `linear-gradient(135deg, ${KITTENS_CARDS[topDiscard]?.color || '#333'}, #1a1a24)`,
                      borderColor: KITTENS_CARDS[topDiscard]?.color || '#333'
                    }}
                  >
                    {!KITTENS_CARDS[topDiscard]?.img && (
                      <>
                        <span style={{ fontSize: '0.75rem' }}>{KITTENS_CARDS[topDiscard]?.label}</span>
                        <span style={{ fontSize: '2rem', textAlign: 'center' }}>
                          {topDiscard === 'defuse' && '🛡️'}
                          {topDiscard === 'attack' && '💥'}
                          {topDiscard === 'skip' && '🏃'}
                          {topDiscard === 'see-future' && '🔮'}
                          {topDiscard === 'shuffle' && '🔀'}
                          {topDiscard === 'favor' && '🤝'}
                        </span>
                        <span style={{ fontSize: '0.6rem', fontWeight: 'normal', opacity: 0.8 }}>
                          {KITTENS_CARDS[topDiscard]?.desc}
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="discard-placeholder">กองทิ้งว่าง</div>
                )}
                <span className="card-count">กองทิ้ง: {discard.length} ใบ</span>
              </div>
            </div>

            {/* My Hand Section */}
            <div className="hand-container">
              <span className="hand-title">ไพ่ในมือของคุณ ({myHand.length} ใบ)</span>
              
              {isEliminated ? (
                <p style={{ color: '#ef4444', fontSize: '0.9rem' }}>💀 คุณตกรอบแล้ว</p>
              ) : (
                <div className="hand-cards">
                  {myHand.map((cardType, idx) => {
                    const card = KITTENS_CARDS[cardType];
                    const isPlayable = isMyTurn && card.action;
                    return (
                      <div
                        key={idx}
                        className={`playable-card ${!isPlayable ? 'disabled' : ''}`}
                        onClick={() => setFocusedCard({ type: cardType, idx, isPlayable })}
                      >
                        <div
                          className="card-face"
                          style={{
                            background: card.img 
                              ? `url(${card.img}) center/cover no-repeat`
                              : `linear-gradient(135deg, ${card.color}, #1a1a24)`,
                            borderColor: card.color
                          }}
                        >
                          {!card.img && (
                            <>
                              <span style={{ fontSize: '0.7rem' }}>{card.label}</span>
                              <span style={{ fontSize: '1.8rem', textAlign: 'center' }}>
                                {cardType === 'defuse' && '🛡️'}
                                {cardType === 'attack' && '💥'}
                                {cardType === 'skip' && '🏃'}
                                {cardType === 'see-future' && '🔮'}
                                {cardType === 'shuffle' && '🔀'}
                                {cardType === 'favor' && '🤝'}
                              </span>
                              <span style={{ fontSize: '0.55rem', fontWeight: 'normal', opacity: 0.8, lineHeight: 1.1 }}>
                                {card.desc}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Players Info */}
          <div className="sidebar">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ผู้เล่น ({players.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {turnOrder.map(pid => {
                const p = players.find(player => player.id === pid);
                if (!p) return null;
                const isPlayerActive = currentPlayerId === pid;
                const playerEliminated = eliminated.includes(pid);
                const cardsCount = (hands[pid] || []).length;

                return (
                  <div
                    key={pid}
                    className={`player-item ${isPlayerActive ? 'active' : ''} ${playerEliminated ? 'eliminated' : ''}`}
                  >
                    <span className="player-name">
                      {p.name} {pid === myId ? '(คุณ)' : ''} {playerEliminated ? '💀' : ''}
                    </span>
                    {!playerEliminated && (
                      <span className="player-cards-count">{cardsCount} ใบ</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 🛑 Nope Decision Overlay (Only for eligible nopers) */}
      {gameState.pendingAction && 
       gameState.pendingAction.eligibleNopers?.includes(myId) && 
       !gameState.pendingAction.declinedNopers?.includes(myId) && (
        <div className="overlay-modal" style={{ zIndex: 100 }}>
          <div className="modal-content animate-pop">
            <h3 className="modal-title" style={{ color: '#ef4444' }}>
               🚨 โอกาสขัดขวาง!
            </h3>
            <p className="modal-desc" style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
              <strong>{players.find(p => p.id === gameState.pendingAction.initiatorId)?.name}</strong> กำลังใช้งาน 
              <span style={{ color: '#f59e0b', margin: '0 0.5rem' }}>{KITTENS_CARDS[gameState.pendingAction.cardType]?.label}</span>
            </p>
            <p style={{ marginBottom: '1rem' }}>คุณมีการ์ด Nope ในมือ จะใช้งานเพื่อขัดขวางหรือไม่?</p>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '1rem 0' }}>{nopeCountdown}s</div>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                className="btn btn--danger" 
                style={{ padding: '1rem 2rem', fontSize: '1.2rem' }}
                onClick={() => onPlayCard('nope', null)}
              >
                💥 ใช้ Nope!
              </button>
              <button 
                className="btn" 
                style={{ padding: '1rem 2rem', fontSize: '1.2rem', background: '#4b5563' }}
                onClick={() => onPlayCard('decline-nope', null)}
              >
                ไม่ใช้
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔮 See the Future Overlay (only for me) */}
      {gameState.futureCards && isMyTurn && (
        <div className="overlay-modal">
          <div className="modal-content animate-pop">
            <h3 className="modal-title" style={{ color: '#8b5cf6' }}>🔮 ผลการส่องอนาคต</h3>
            <p className="modal-desc">นี่คือการ์ด 3 ใบแรกจากบนสุดของกองจั่ว</p>
            <div className="future-cards-row">
              {futureCards.slice(0, 3).map((cardType, idx) => {
                const card = KITTENS_CARDS[cardType] || { label: 'การ์ดลึกลับ', color: '#555', desc: '' };
                return (
                  <div key={idx} className="future-card-box">
                    <span>ใบที่ {idx + 1}</span>
                    <div
                      className="card-face"
                      style={{
                        background: card.img
                          ? `url(${card.img}) center/cover no-repeat`
                          : `linear-gradient(135deg, ${card.color}, #1a1a24)`,
                        borderColor: card.color
                      }}
                    >
                      {!card.img && (
                        <>
                          <span style={{ fontSize: '0.65rem' }}>{card.label}</span>
                          <span style={{ fontSize: '1.5rem', textAlign: 'center' }}>
                            {cardType === 'kitten' && '🙀'}
                            {cardType === 'defuse' && '🛡️'}
                            {cardType === 'attack' && '💥'}
                            {cardType === 'skip' && '🏃'}
                            {cardType === 'see-future' && '🔮'}
                            {cardType === 'shuffle' && '🔀'}
                            {cardType === 'favor' && '🤝'}
                          </span>
                          <span style={{ fontSize: '0.5rem', fontWeight: 'normal', opacity: 0.7 }}>
                            {card.desc}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              className="btn btn--secondary"
              onClick={() => onPlayCard('see-future-done', null)}
            >
              ปิด
            </button>
          </div>
        </div>
      )}

      {/* 👁️ Share the Future Overlay (visible to all) */}
      {gameState.sharedFutureCards && (
        <div className="overlay-modal">
          <div className="modal-content animate-pop">
            <h3 className="modal-title" style={{ color: '#8b5cf6' }}>👁️ อนาคตที่ถูกแชร์</h3>
            <p className="modal-desc">ผู้เล่นทุกคนกำลังเห็นไพ่ 3 ใบแรก</p>
            <div className="future-cards-row">
              {gameState.sharedFutureCards.slice(0, 3).map((cardType, idx) => {
                const card = KITTENS_CARDS[cardType] || { label: 'การ์ดลึกลับ', color: '#555', desc: '' };
                return (
                  <div key={idx} className="future-card-box">
                    <span>ใบที่ {idx + 1}</span>
                    <div className="card-face" style={{ background: card.img ? `url(${card.img}) center/cover no-repeat` : `linear-gradient(135deg, ${card.color}, #1a1a24)` }}>
                       {!card.img && <span style={{ fontSize: '0.65rem' }}>{card.label}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            {isMyTurn && (
              <button className="btn btn--secondary" onClick={() => onPlayCard('share-future-done', null)}>ปิด</button>
            )}
          </div>
        </div>
      )}

      {/* ✨ Alter the Future Overlay */}
      {gameState.alterFutureCards && isMyTurn && (
        <div className="overlay-modal">
          <div className="modal-content animate-pop" style={{ maxWidth: '600px' }}>
            <h3 className="modal-title" style={{ color: '#8b5cf6' }}>✨ แก้ไขอนาคต</h3>
            <p className="modal-desc">สลับตำแหน่งของการ์ดทั้ง 3 ใบตามใจชอบ แล้วกดตกลง</p>
            <div className="future-cards-row" style={{ alignItems: 'flex-end' }}>
              {alteredCards.map((cardType, idx) => {
                const card = KITTENS_CARDS[cardType] || { label: 'การ์ดลึกลับ', color: '#555' };
                return (
                  <div key={idx} className="future-card-box" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                    <div className="card-face" style={{ background: card.img ? `url(${card.img}) center/cover no-repeat` : `linear-gradient(135deg, ${card.color}, #1a1a24)` }} />
                    <div style={{ display: 'flex', gap: '0.2rem' }}>
                      <button className="btn btn--secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }} onClick={() => moveAlteredCard('left', idx)} disabled={idx === 0}>◀</button>
                      <button className="btn btn--secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }} onClick={() => moveAlteredCard('right', idx)} disabled={idx === alteredCards.length - 1}>▶</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <button className="btn btn--success" onClick={() => onPlayCard('alter-future-done', alteredCards)}>
              บันทึกอนาคตใหม่
            </button>
          </div>
        </div>
      )}

      {/* 🎯 Target Selection Modal (Favor / Targeted Attack / Pair) */}
      {showTargetModal && isMyTurn && (
        <div className="overlay-modal">
          <div className="modal-content animate-pop">
            <h3 className="modal-title">
              {pendingActionType === 'favor' && '🤝 เลือกผู้เล่นที่จะขอความช่วยเหลือ'}
              {pendingActionType === 'targeted-attack' && '🎯 เลือกเป้าหมายการโจมตี'}
              {pendingActionType === 'pair' && '🐾 เลือกเป้าหมายสุ่มขโมยการ์ด'}
              {pendingActionType === 'zombie-revive' && '🧟 เลือกผู้เล่นที่จะชุบชีวิต'}
            </h3>
            <p className="modal-desc">
              {pendingActionType === 'favor' && 'ผู้เล่นที่ถูกเลือกจะเลือกส่งการ์ดของเขาให้คุณ 1 ใบ'}
              {pendingActionType === 'targeted-attack' && 'ผู้เล่นที่ถูกเลือกจะต้องรับ 2 เทิร์นแทนคุณ'}
              {pendingActionType === 'pair' && 'คุณจะสุ่มขโมยการ์ด 1 ใบจากมือเป้าหมาย'}
              {pendingActionType === 'zombie-revive' && 'ชุบชีวิตผู้เล่นที่ตายไปแล้วกลับเข้าสู่เกม'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', margin: '1rem 0' }}>
              {players
                .filter(p => pendingActionType === 'zombie-revive' ? eliminated.includes(p.id) : (p.id !== myId && !eliminated.includes(p.id)))
                .map(p => (
                  <button
                    key={p.id}
                    className={`btn ${actionTarget === p.id ? 'btn--accent' : 'btn--secondary'}`}
                    onClick={() => setActionTarget(p.id)}
                    style={{ width: '100%' }}
                  >
                    {p.name} {pendingActionType !== 'zombie-revive' && `(${hands[p.id]?.length || 0} ใบ)`}
                  </button>
                ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
              <button
                className="btn btn--success"
                onClick={confirmTargetAction}
                disabled={!actionTarget}
                style={{ flex: 1 }}
              >
                ตกลง
              </button>
              <button
                className="btn btn--secondary"
                onClick={() => { setShowTargetModal(false); setActionTarget(null); setPendingActionType(null); setSelectedCardIdx(null); setSelectedCards([]); }}
                style={{ flex: 1 }}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🤝 Favor Giver Modal (When target is ME) */}
      {amFavorTarget && (
        <div className="overlay-modal">
          <div className="modal-content animate-pop">
            <h3 className="modal-title" style={{ color: '#06b6d4' }}>🤝 ส่งมอบการ์ดช่วยเหลือ</h3>
            <p className="modal-desc">คุณต้องส่งมอบการ์ดในมือคุณ 1 ใบให้แก่ <strong>{favorRequesterName}</strong></p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', margin: '1rem 0' }}>
              {myHand.map((cardType, idx) => {
                const card = KITTENS_CARDS[cardType];
                return (
                  <button
                    key={idx}
                    className="btn btn--secondary"
                    onClick={() => onGiveFavor(cardType)}
                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                  >
                    {card.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 🙀 Exploding Kitten drawn Modal */}
      <AnimatePresence>
        {amDefusing && (
          <>
            <div className="overlay-modal exploding-vignette" />
            <motion.div
              className="overlay-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ zIndex: 110 }}
            >
              <motion.div
                className="modal-content exploding-theme"
                initial={{ scale: 0.8, y: 50, rotate: -5 }}
                animate={{ 
                  scale: 1, 
                  rotate: 0,
                  x: [0, -1, 1, -0.5, 0.5, -1, 1, 0],
                  y: [0, 0.5, -0.5, 1, -1, 0.5, -0.5, 0]
                }}
                transition={{
                  x: { repeat: Infinity, duration: 0.25, ease: "linear" },
                  y: { repeat: Infinity, duration: 0.25, ease: "linear" },
                  default: { type: 'spring', bounce: 0.5, duration: 0.6 }
                }}
              >
                {/* Floating sparks/embers */}
                <div className="sparks-container">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className={`spark spark-${i}`} />
                  ))}
                </div>

                <motion.div 
                  className="exploding-icon"
                  animate={{ 
                    scale: [1, 1.15, 1],
                    rotate: [0, -4, 4, -4, 4, 0]
                  }}
                  transition={{ 
                    scale: { repeat: Infinity, duration: 0.6, ease: "easeInOut" },
                    rotate: { repeat: Infinity, duration: 1.0, ease: "easeInOut" }
                  }}
                >
                  {pendingKitten.card === 'imploding-kitten' ? '💣' : '🧨'}
                </motion.div>
                <h3 className="exploding-title">
                  {pendingKitten.card === 'imploding-kitten' ? 'แมวระเบิดหงายหน้า!' : 'แมวระเบิดทำงาน!'}
                </h3>
                
                {pendingKitten.card === 'imploding-kitten' ? (
                  <>
                    <p className="modal-desc" style={{ color: '#fcd34d', fontSize: '1rem', zIndex: 2 }}>
                      ⚠️ คุณจั่วได้ <strong>Imploding Kitten</strong>! <br /> 
                      คุณต้องนำมันใส่กลับลงกองแบบ "หงายหน้า"
                    </p>
                    
                    <div className="defuse-zone" style={{ zIndex: 2 }}>
                      <div className="slider-labels" style={{ marginBottom: '1rem', fontWeight: 'bold' }}>
                        <span style={{ color: '#ef4444' }}>วางบนสุด</span>
                        <span style={{ color: '#10b981' }}>ซ่อนลึกสุด (ใบที่ {deck.length + 1})</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        className="slider-danger"
                        max={deck.length}
                        value={defusePosition}
                        onChange={(e) => setDefusePosition(parseInt(e.target.value))}
                      />
                      <motion.div 
                        key={defusePosition}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                      >
                        <p style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#10b981', margin: 0 }}>
                          📍 {defusePosition === 0 ? 'แกล้งคนต่อไป! (วางไว้บนสุด)' : `ซ่อนไว้ใบที่ ${defusePosition + 1}`}
                        </p>
                      </motion.div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn btn--danger btn--lg"
                      onClick={() => onDefuseKitten(defusePosition, 'imploding-kitten')}
                      style={{ width: '100%', fontSize: '1.1rem', fontWeight: 'bold', padding: '1rem', zIndex: 2 }}
                    >
                      💣 นำใส่กองแบบหงายหน้า!
                    </motion.button>
                  </>
                ) : (hasDefuse && pendingKitten.card !== 'imploding-kitten-face-up') ? (
                  <>
                    <p className="modal-desc" style={{ color: '#fcd34d', fontSize: '1rem', zIndex: 2 }}>
                      ⚠️ โชคดีที่คุณมีการ์ดกู้ระเบิด! <br /> 
                      ซ่อนแมวระเบิดกลับเข้าไปในกองจั่วเพื่อเอาชีวิตรอด
                    </p>
                    
                    <div className="defuse-zone" style={{ zIndex: 2 }}>
                      <div className="slider-labels" style={{ marginBottom: '1rem', fontWeight: 'bold' }}>
                        <span style={{ color: '#ef4444' }}>วางบนสุด</span>
                        <span style={{ color: '#10b981' }}>ซ่อนลึกสุด (ใบที่ {deck.length + 1})</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        className="slider-success"
                        max={deck.length}
                        value={defusePosition}
                        onChange={(e) => setDefusePosition(parseInt(e.target.value))}
                      />
                      <motion.div 
                        key={defusePosition}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                      >
                        <p style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#10b981', margin: 0 }}>
                          📍 {defusePosition === 0 ? 'แกล้งคนต่อไป! (วางไว้บนสุด)' : `ซ่อนไว้ใบที่ ${defusePosition + 1}`}
                        </p>
                      </motion.div>
                    </div>

                    {myHand.includes('defuse') && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn btn--success btn--lg"
                        onClick={() => onDefuseKitten(defusePosition, 'defuse')}
                        style={{ width: '100%', fontSize: '1.1rem', fontWeight: 'bold', padding: '1rem', marginBottom: '0.5rem', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)', zIndex: 2 }}
                      >
                        🛡️ ใช้การ์ดกู้ระเบิด (Defuse)!
                      </motion.button>
                    )}
                    {myHand.includes('zombie-kitten') && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn btn--accent btn--lg"
                        onClick={() => {
                          const deadPlayers = eliminated;
                          if (deadPlayers.length > 0) {
                            setPendingActionType('zombie-revive');
                            setShowTargetModal(true);
                          } else {
                            onDefuseKitten(defusePosition, 'zombie-kitten');
                          }
                        }}
                        style={{ width: '100%', fontSize: '1.1rem', fontWeight: 'bold', padding: '1rem', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)', zIndex: 2 }}
                      >
                        🧟 ใช้ Zombie Kitten (ชุบชีวิต)!
                      </motion.button>
                    )}
                  </>
                ) : (
                  <>
                    <div className="death-zone" style={{ zIndex: 2 }}>
                      <p className="modal-desc" style={{ color: '#fca5a5', fontSize: '1.1rem', margin: 0 }}>
                        คุณไม่มีการ์ดกู้ระเบิดเหลืออยู่...<br />
                        <strong style={{ fontSize: '1.4rem', display: 'block', marginTop: '0.5rem' }}>ตูมมมมมมมมมม! 💥</strong>
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn btn--lg"
                      onClick={() => onDefuseKitten(-1)} // -1 represents exploding/elimination
                      style={{ 
                        width: '100%', 
                        background: 'linear-gradient(135deg, #7f1d1d, #450a0a)',
                        color: '#fca5a5',
                        border: '1px solid #ef4444',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        padding: '1rem',
                        zIndex: 2
                      }}
                    >
                      💀 ยอมรับชะตากรรม
                    </motion.button>
                  </>
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* 🔍 Focus Card Modal */}
      <AnimatePresence>
        {focusedCard && (
          <div className="overlay-modal" onClick={() => setFocusedCard(null)}>
            <motion.div
              className="focused-card-container"
              initial={{ opacity: 0, scale: 0.5, y: 150 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 150 }}
              transition={{ type: 'spring', bounce: 0.4, duration: 0.6 }}
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the card itself
              style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}
            >
              <motion.div
                whileHover={{ scale: 1.02, rotate: -2 }}
                className="card-face"
                style={{
                  background: KITTENS_CARDS[focusedCard.type].img 
                    ? `url(${KITTENS_CARDS[focusedCard.type].img}) center/cover no-repeat`
                    : `linear-gradient(135deg, ${KITTENS_CARDS[focusedCard.type].color}, #1a1a24)`,
                  borderColor: KITTENS_CARDS[focusedCard.type].color,
                  width: '260px',
                  height: '375px', // Approx 2.7x original
                  boxShadow: `0 25px 60px ${KITTENS_CARDS[focusedCard.type].color}88`,
                  borderRadius: '20px',
                  borderWidth: '4px'
                }}
              >
                {!KITTENS_CARDS[focusedCard.type].img && (
                  <>
                    <span style={{ fontSize: '1.5rem', padding: '1rem' }}>{KITTENS_CARDS[focusedCard.type].label}</span>
                    <span style={{ fontSize: '4rem', textAlign: 'center' }}>
                      {focusedCard.type === 'defuse' && '🛡️'}
                      {focusedCard.type === 'attack' && '💥'}
                      {focusedCard.type === 'skip' && '🏃'}
                      {focusedCard.type === 'see-future' && '🔮'}
                      {focusedCard.type === 'shuffle' && '🔀'}
                      {focusedCard.type === 'favor' && '🤝'}
                    </span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'normal', opacity: 0.8, padding: '1rem', lineHeight: 1.3 }}>
                      {KITTENS_CARDS[focusedCard.type].desc}
                    </span>
                  </>
                )}
              </motion.div>
              
              <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
                {focusedCard.isPlayable && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn btn--success"
                    onClick={() => {
                      handlePlay(focusedCard.type, focusedCard.idx);
                      setFocusedCard(null);
                    }}
                    style={{ fontSize: '1.2rem', padding: '1rem 2.5rem', boxShadow: '0 8px 20px rgba(16, 185, 129, 0.5)', fontWeight: 'bold' }}
                  >
                    ✨ เล่นการ์ดใบนี้
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn btn--secondary"
                  onClick={() => setFocusedCard(null)}
                  style={{ fontSize: '1.2rem', padding: '1rem 2.5rem', background: 'rgba(255,255,255,0.1)' }}
                >
                  👇 เก็บลงมือ
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🃏 Draw Confirmation Overlay */}
      <AnimatePresence>
        {showDrawConfirm && (
          <div className="overlay-modal" onClick={() => setShowDrawConfirm(false)}>
            <motion.div
              className="modal-content animate-pop"
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              style={{ 
                background: 'linear-gradient(145deg, #1e1e2d 0%, #11111a 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '2rem',
                maxWidth: '380px'
              }}
            >
              <h3 className="modal-title" style={{ color: '#fca5a5', fontSize: '1.4rem' }}>
                🃏 ต้องการจั่วการ์ดหรือไม่?
              </h3>
              <p className="modal-desc" style={{ marginBottom: '1rem' }}>
                หากพร้อมแล้ว กดจั่วการ์ดเพื่อสิ้นสุดเทิร์นของคุณ
              </p>
              
              {/* Display of card back with float animation */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                style={{
                  width: '120px',
                  height: '174px',
                  background: 'url(/images/explode-cat/backcard.png) center/cover no-repeat',
                  borderRadius: '16px',
                  border: '3px solid #ff5a5f',
                  boxShadow: '0 12px 24px rgba(255, 90, 95, 0.3), 0 0 20px rgba(0,0,0,0.5)',
                  margin: '1rem 0'
                }}
              />

              <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '1rem' }}>
                <button 
                  className="btn btn--danger" 
                  style={{ 
                    flex: 1, 
                    padding: '0.8rem', 
                    fontSize: '1rem',
                    background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                  }}
                  onClick={() => {
                    onDrawCard();
                    setShowDrawConfirm(false);
                  }}
                >
                  🔥 จั่วการ์ด
                </button>
                <button 
                  className="btn btn--secondary" 
                  style={{ 
                    flex: 1, 
                    padding: '0.8rem', 
                    fontSize: '1rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff'
                  }}
                  onClick={() => setShowDrawConfirm(false)}
                >
                  ❌ ค่อยจั่ว (วางคืน)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AnimatedPage>
  );
}
