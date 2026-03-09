'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedPage, { staggerContainer, fadeUpItem, tapScale, popIn } from './AnimatedPage';

export default function Lobby({
  roomCode, players, isDM, timerSetting, gameId,
  difficulty, dmMode, wordPick, playerName,
  onSetTimer, onSetDifficulty, onSetDmMode, onSetWordPick,
  onStartGame, onChangeName, error
}) {
  const isInsider = gameId === 'insider';
  const minPlayers = isInsider ? 4 : 3;
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(playerName || '');

  return (
    <AnimatedPage>
      <motion.div className="room-code-box" variants={popIn} initial="hidden" animate="visible">
        <p className="room-code-label">รหัสห้อง</p>
        <p className="room-code-value">{roomCode}</p>
        <p className="room-code-hint">แชร์รหัสนี้ให้เพื่อน</p>
      </motion.div>

      {/* ── Editable name ── */}
      <motion.div className="lobby-name-edit" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.25 }}>
        <AnimatePresence mode="wait">
          {!editingName ? (
            <motion.div key="display" className="lobby-name-edit__row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <span className="lobby-name-edit__label">ชื่อของคุณ:</span>
              <span className="lobby-name-edit__value">{playerName}</span>
              <motion.button className="lobby-name-edit__btn" onClick={() => { setNewName(playerName); setEditingName(true); }} whileTap={tapScale}>
                ✏️
              </motion.button>
            </motion.div>
          ) : (
            <motion.div key="edit" className="lobby-name-edit__row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <input
                className="field__input lobby-name-edit__input"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                maxLength={100}
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter' && newName.trim()) {
                    onChangeName(newName.trim());
                    setEditingName(false);
                  }
                }}
              />
              <motion.button
                className="btn btn--sm btn--primary"
                disabled={!newName.trim() || newName.trim() === playerName}
                onClick={() => { if (newName.trim()) { onChangeName(newName.trim()); setEditingName(false); } }}
                whileTap={tapScale}
              >
                บันทึก
              </motion.button>
              <motion.button className="btn btn--sm btn--secondary" onClick={() => setEditingName(false)} whileTap={tapScale}>
                ยกเลิก
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
        <div className="card__header">
          <span className="card__title">ผู้เล่น</span>
          <span className="badge badge--accent">{players.length} คน</span>
        </div>
        <motion.ul className="player-list" variants={staggerContainer} initial="hidden" animate="visible">
          {players.map(p => (
            <motion.li key={p.id} className="player-row" variants={fadeUpItem} layout>
              <span className="player-name">{p.name}</span>
              {p.isDM && <span className="badge badge--accent">DM</span>}
            </motion.li>
          ))}
        </motion.ul>
      </motion.div>

      {isDM ? (
        <motion.div className="bottom-actions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
          <div className="field">
            <label className="field__label">เวลาเล่น</label>
            <select
              className="field__input"
              value={timerSetting}
              onChange={e => onSetTimer(Number(e.target.value))}
            >
              <option value={180}>3 นาที</option>
              <option value={300}>5 นาที</option>
              <option value={420}>7 นาที</option>
              <option value={600}>10 นาที</option>
            </select>
          </div>

          {isInsider && (
            <>
              <div className="field">
                <label className="field__label">ระดับความยาก</label>
                <div className="btn-group">
                  {[
                    { value: 'easy', label: 'ง่าย' },
                    { value: 'medium', label: 'ปานกลาง' },
                    { value: 'hard', label: 'ยาก' },
                  ].map(opt => (
                    <motion.button
                      key={opt.value}
                      className={`btn btn--sm ${difficulty === opt.value ? 'btn--primary' : 'btn--secondary'}`}
                      onClick={() => onSetDifficulty(opt.value)}
                      whileTap={tapScale}
                      layout
                    >
                      {opt.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label className="field__label">DM (ผู้ดำเนินเกม)</label>
                <select
                  className="field__input"
                  value={dmMode}
                  onChange={e => onSetDmMode(e.target.value)}
                >
                  <option value="creator">คนสร้างห้อง</option>
                  <option value="random">สุ่ม</option>
                  {players.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="field field--toggle">
                <label className="field__label">ให้เลือกคำก่อนเริ่ม</label>
                <motion.button
                  className={`toggle-btn ${wordPick ? 'toggle-btn--on' : ''}`}
                  onClick={() => onSetWordPick(!wordPick)}
                  whileTap={tapScale}
                  layout
                >
                  {wordPick ? 'เปิด' : 'ปิด'}
                </motion.button>
              </div>
            </>
          )}

          <motion.button
            className="btn btn--primary btn--lg"
            disabled={players.length < minPlayers}
            onClick={onStartGame}
            whileTap={tapScale}
          >
            เริ่มเกม
          </motion.button>
          {players.length < minPlayers && (
            <p className="hint-text">ต้องมีผู้เล่นอย่างน้อย {minPlayers} คน (ปัจจุบัน {players.length})</p>
          )}
        </motion.div>
      ) : (
        <div className="waiting-state">
          <span className="waiting-dot" />
          <span className="waiting-dot" />
          <span className="waiting-dot" />
          <p>รอ DM เริ่มเกม</p>
        </div>
      )}

      {error && <p className="error-text">{error}</p>}
    </AnimatedPage>
  );
}
