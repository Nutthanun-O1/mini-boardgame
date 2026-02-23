export default function Result({ result, word, category, isDM, myRole, onPlayAgain }) {
  const isTimedOut = result?.timedOut
  const gamePlayers = result?.gamePlayers || []
  const roles = result?.roles || {}

  const ROLE_BADGE = {
    Master: 'badge--master',
    Insider: 'badge--insider',
    Common: 'badge--common',
  }

  return (
    <div className="page fade-in">
      <div className={`reveal-banner${isTimedOut ? ' reveal-banner--timeout' : ''}`}>
        <p className="reveal-banner__label">{isTimedOut ? 'หมดเวลา' : 'เฉลยผล'}</p>
        <p className="reveal-banner__word">{result?.word || word}</p>
        <p className="reveal-banner__category">{result?.category || category}</p>
      </div>

      <div className="insider-reveal">
        <p className="insider-reveal__label">Insider คือ</p>
        <div className="insider-reveal__image">
          <span className="insider-reveal__initial">{result?.insider?.[0] || '?'}</span>
        </div>
        <p className="insider-reveal__name">{result?.insider}</p>
      </div>

      <div className="card">
        <div className="card__header">
          <span className="card__title">บทบาทของทุกคน</span>
          <span className="badge badge--neutral">บทบาทคุณ: {myRole}</span>
        </div>
        <ul className="role-list">
          {gamePlayers.map(p => {
            const role = roles[p.id]
            const isInsider = p.id === result?.insiderId
            return (
              <li key={p.id} className={`role-list__row${isInsider ? ' role-list__row--insider' : ''}`}>
                <span className="role-list__name">{p.name}</span>
                <span className={`badge ${ROLE_BADGE[role] || ''}`}>{role}</span>
              </li>
            )
          })}
        </ul>
      </div>

      {isDM ? (
        <div className="bottom-actions">
          <button className="btn btn--primary btn--lg" onClick={onPlayAgain}>
            เล่นรอบใหม่
          </button>
        </div>
      ) : (
        <div className="waiting-state">
          <span className="waiting-dot" />
          <span className="waiting-dot" />
          <span className="waiting-dot" />
          <p>รอ DM เริ่มรอบใหม่</p>
        </div>
      )}
    </div>
  )
}
