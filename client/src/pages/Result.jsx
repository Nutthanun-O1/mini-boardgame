export default function Result({ result, word, category, isDM, myRole, onPlayAgain }) {
  const isTimedOut = result?.timedOut;
  const gamePlayers = result?.gamePlayers || [];
  const roles = result?.roles || {};

  return (
    <div className="page result">
      {/* Banner */}
      <div className={`result-banner ${isTimedOut ? 'timeout' : ''}`}>
        {isTimedOut ? (
          <>
            <h2>⏰ หมดเวลา!</h2>
            <div className="word-reveal">
              <p>📂 {result?.category || category}</p>
              <h1>「{result?.word || word}」</h1>
            </div>
          </>
        ) : (
          <h2>🔍 เฉลย!</h2>
        )}
      </div>

      {/* Insider Reveal */}
      <div className="insider-reveal">
        <p>Insider คือ...</p>
        <h1 className="insider-name">🕵️ {result?.insider}</h1>
      </div>

      {/* บทบาทของคุณ */}
      <div className="your-role-box">
        บทบาทของคุณ: <strong>{myRole}</strong>
      </div>

      {/* บทบาททั้งหมด */}
      <div className="all-roles">
        <h3>บทบาททั้งหมด</h3>
        {gamePlayers.map(p => {
          const role = roles[p.id];
          const isInsider = p.id === result?.insiderId;
          return (
            <div key={p.id} className={`role-item ${isInsider ? 'insider' : ''}`}>
              <span>{p.name}</span>
              <span className="role-tag">
                {role === 'Master' && '👑 Master'}
                {role === 'Insider' && '🕵️ Insider'}
                {role === 'Common' && '👤 Common'}
              </span>
            </div>
          );
        })}
      </div>

      {/* DM: เล่นรอบใหม่ */}
      {isDM ? (
        <div className="dm-controls">
          <button className="btn btn-primary btn-large" onClick={onPlayAgain}>
            🔄 เล่นรอบใหม่
          </button>
        </div>
      ) : (
        <div className="waiting">
          <p>⏳ รอ DM เริ่มรอบใหม่...</p>
        </div>
      )}
    </div>
  );
}
