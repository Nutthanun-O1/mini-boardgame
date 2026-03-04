'use client';

const GAMES = [
  {
    id: 'insider',
    title: 'Insider',
    description: 'ร่วมกันหาคำลับ แล้วหาตัว Insider ที่แฝงตัวอยู่',
    players: '4 – 8 คน',
    duration: '5 – 10 นาที',
    available: true,
  },
  {
    id: 'werewolf',
    title: 'Werewolf',
    description: 'หมาป่าซ่อนตัวในหมู่ชาวบ้าน',
    players: '6 – 12 คน',
    duration: '15 – 30 นาที',
    available: false,
  },
  {
    id: 'spyfall',
    title: 'Spyfall',
    description: 'หาตัวสายลับที่ไม่รู้ว่าอยู่ที่ไหน',
    players: '4 – 8 คน',
    duration: '10 นาที',
    available: false,
  },
  {
    id: 'codenames',
    title: 'Codenames',
    description: 'ใบ้คำเพื่อให้ทีมทายคำลับ',
    players: '4 – 10 คน',
    duration: '15 – 20 นาที',
    available: false,
  },
];

export default function GameSelect({ onSelect }) {
  return (
    <div className="page page--center fade-in">
      <div className="page-header">
        <h1 className="page-title">เลือกเกม</h1>
        <p className="page-subtitle">เลือกเกมที่ต้องการเล่นกับเพื่อน</p>
      </div>

      <div className="game-grid">
        {GAMES.map(game => (
          <button
            key={game.id}
            className={`game-card ${!game.available ? 'game-card--disabled' : ''}`}
            onClick={() => game.available && onSelect(game.id)}
            disabled={!game.available}
          >
            <div className="game-card__image">
              <span className="game-card__initial">{game.title[0]}</span>
            </div>

            <div className="game-card__body">
              <h3 className="game-card__title">{game.title}</h3>
              <p className="game-card__desc">{game.description}</p>
              <div className="game-card__meta">
                <span>{game.players}</span>
                <span className="meta-dot" />
                <span>{game.duration}</span>
              </div>
            </div>

            {!game.available && (
              <div className="game-card__badge">เร็ว ๆ นี้</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
