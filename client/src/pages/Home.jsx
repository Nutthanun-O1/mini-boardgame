import { useState } from 'react'

const GAME_TITLES = { insider: 'Insider', werewolf: 'Werewolf', spyfall: 'Spyfall', codenames: 'Codenames' }

export default function Home({ gameId, onCreateRoom, onJoinRoom, onBack, error }) {
  const [mode, setMode] = useState(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [duration, setDuration] = useState(300)

  const title = GAME_TITLES[gameId] || gameId

  if (!mode) {
    return (
      <div className="page page--center fade-in">
        <div className="page-header">
          <p className="page-label">{title}</p>
          <h1 className="page-title">เริ่มเล่น</h1>
        </div>
        <div className="action-group">
          <button className="btn btn--primary btn--lg" onClick={() => setMode('create')}>
            สร้างห้อง
          </button>
          <button className="btn btn--secondary btn--lg" onClick={() => setMode('join')}>
            เข้าร่วมห้อง
          </button>
          <button className="btn btn--ghost" onClick={onBack}>
            เปลี่ยนเกม
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page fade-in">
      <div className="page-header">
        <p className="page-label">{title}</p>
        <h1 className="page-title">{mode === 'create' ? 'สร้างห้อง' : 'เข้าร่วมห้อง'}</h1>
      </div>

      <div className="form">
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

        {mode === 'join' && (
          <div className="field">
            <label className="field__label">รหัสห้อง</label>
            <input
              className="field__input field__input--code"
              type="text"
              placeholder="XXXX"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              maxLength={4}
            />
          </div>
        )}

        {mode === 'create' && (
          <div className="field">
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
          </div>
        )}

        <button
          className="btn btn--primary btn--lg"
          disabled={!name.trim() || (mode === 'join' && code.length < 4)}
          onClick={() => mode === 'create' ? onCreateRoom(name.trim(), duration) : onJoinRoom(code, name.trim())}
        >
          {mode === 'create' ? 'สร้างห้อง' : 'เข้าร่วม'}
        </button>

        <button className="btn btn--ghost" onClick={() => setMode(null)}>
          กลับ
        </button>

        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  )
}

