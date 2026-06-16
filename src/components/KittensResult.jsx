'use client';

import { motion } from 'framer-motion';
import AnimatedPage, { popIn } from './AnimatedPage';

export default function KittensResult({ result, countdown }) {
  const { winner, winnerName, eliminationHistory, players } = result;

  return (
    <AnimatedPage className="page--center">
      <style jsx>{`
        .result-container {
          background: rgba(20, 20, 30, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 2.5rem 2rem;
          width: 100%;
          max-width: 500px;
          text-align: center;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(10px);
          color: #fff;
          font-family: 'Outfit', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }
        .crown-icon {
          font-size: 4rem;
          margin-bottom: -0.5rem;
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .winner-title {
          font-size: 1.8rem;
          font-weight: 800;
          background: linear-gradient(to right, #f59e0b, #10b981);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .winner-name {
          font-size: 1.3rem;
          font-weight: 600;
          color: #fff;
          background: rgba(255, 255, 255, 0.05);
          padding: 0.5rem 1.5rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .history-list {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 1rem;
        }
        .history-item {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          font-size: 0.95rem;
        }
        .history-item.alive {
          border-color: rgba(16, 185, 129, 0.3);
          background: rgba(16, 185, 129, 0.05);
        }
        .history-item.eliminated {
          opacity: 0.6;
        }
        .countdown-timer {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 1rem;
        }
      `}</style>

      <motion.div className="result-container" variants={popIn} initial="hidden" animate="visible">
        <span className="crown-icon">👑</span>
        <h1 className="winner-title">ผู้ชนะการแข่งขัน!</h1>
        <div className="winner-name">{winnerName}</div>

        <div style={{ width: '100%', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, opacity: 0.7, marginBottom: '0.75rem', textAlign: 'left' }}>
            อันดับการเล่น
          </h3>
          <div className="history-list">
            {/* Show winner first */}
            <div className="history-item alive">
              <span>🥇 {winnerName}</span>
              <span style={{ color: '#10b981', fontWeight: 'bold' }}>รอดชีวิต (ชนะ)</span>
            </div>

            {/* Then show eliminated players in reverse order (last exploded to first exploded) */}
            {[...(eliminationHistory || [])].reverse().map((pid, idx) => {
              const name = players.find(p => p.id === pid)?.name || '???';
              return (
                <div key={pid} className="history-item eliminated">
                  <span>💀 {name}</span>
                  <span style={{ color: '#ef4444' }}>ตกรอบ (อันดับที่ {players.length - idx})</span>
                </div>
              );
            })}
          </div>
        </div>

        {countdown !== null && (
          <p className="countdown-timer">
            กลับหน้าล็อบบี้โดยอัตโนมัติใน {countdown} วินาที...
          </p>
        )}
      </motion.div>
    </AnimatedPage>
  );
}
