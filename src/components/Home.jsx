'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedPage, { fadeUpItem, tapScale } from './AnimatedPage';

const GAME_TITLES = { insider: 'Insider', werewolf: 'Werewolf', spyfall: 'Spyfall', codenames: 'Codenames' };

export default function Home({ gameId, onCreateRoom, onJoinRoom, onBack, error }) {
  const [mode, setMode] = useState(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [duration, setDuration] = useState(300);

  const title = GAME_TITLES[gameId] || gameId;

  if (!mode) {
    return (
      <AnimatedPage className="page--center">
        <div className="page-header">
          <p className="page-label">{title}</p>
          <h1 className="page-title">เริ่มเล่น</h1>
        </div>
        <motion.div className="action-group" variants={fadeUpItem} initial="hidden" animate="visible">
          <motion.button className="btn btn--primary btn--lg" whileTap={tapScale} onClick={() => setMode('create')}>
            สร้างห้อง
          </motion.button>
          <motion.button className="btn btn--secondary btn--lg" whileTap={tapScale} onClick={() => setMode('join')}>
            เข้าร่วมห้อง
          </motion.button>
          <button className="btn btn--ghost" onClick={onBack}>
            เปลี่ยนเกม
          </button>
        </motion.div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="page-header">
        <p className="page-label">{title}</p>
        <h1 className="page-title">{mode === 'create' ? 'สร้างห้อง' : 'เข้าร่วมห้อง'}</h1>
      </div>

      <motion.div className="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
        <div className="field">
          <label className="field__label">ชื่อของคุณ</label>
          <input
            className="field__input"
            type="text"
            placeholder="ใส่ชื่อ"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={20}
            autoFocus
          />
        </div>

        <AnimatePresence>
          {mode === 'join' && (
            <motion.div className="field" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}>
              <label className="field__label">รหัสห้อง</label>
              <input
                className="field__input field__input--code"
                type="text"
                placeholder="XXXX"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                maxLength={4}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {mode === 'create' && (
            <motion.div className="field" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}>
              <label className="field__label">เวลาเล่น</label>
              <select
                className="field__input"
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
              >
                <option value={180}>3 นาที</option>
                <option value={300}>5 นาที</option>
                <option value={420}>7 นาที</option>
                <option value={600}>10 นาที</option>
              </select>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          className="btn btn--primary btn--lg"
          disabled={!name.trim() || (mode === 'join' && code.length < 4)}
          onClick={() => mode === 'create' ? onCreateRoom(name.trim(), duration) : onJoinRoom(code, name.trim())}
          whileTap={tapScale}
        >
          {mode === 'create' ? 'สร้างห้อง' : 'เข้าร่วม'}
        </motion.button>

        <button className="btn btn--ghost" onClick={() => setMode(null)}>
          กลับ
        </button>

        <AnimatePresence>
          {error && (
            <motion.p className="error-text" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatedPage>
  );
}
