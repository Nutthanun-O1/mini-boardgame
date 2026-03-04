'use client';

export default function Timer({ total, remaining }) {
  const progress = total > 0 ? remaining / total : 0;
  const isLow = remaining <= 30;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className={`timer ${isLow ? 'timer--low' : ''}`}>
      <span className="timer__display">
        {minutes}:{String(seconds).padStart(2, '0')}
      </span>
      <div className="timer__track">
        <div
          className="timer__fill"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
