const http = require('http');
const { Server } = require('socket.io');

// ══════════════════════════════════════════════
//  Insider word bank
// ══════════════════════════════════════════════
const insiderWords = {
  animals: [
    'แมว','สุนัข','ช้าง','ม้า','กระต่าย','เสือ','สิงโต',
    'ลิง','งู','เพนกวิน','ปลาโลมา','นกแก้ว','จระเข้',
    'ยีราฟ','หมี','แมงมุม','ผีเสื้อ','ปลาหมึก','กบ','เต่า'
  ],
  food: [
    'ส้มตำ','ข้าวผัด','พิซซ่า','ซูชิ','แฮมเบอร์เกอร์',
    'ไอศกรีม','ต้มยำกุ้ง','ผัดไทย','สเต็ก','ราเมน',
    'ขนมปัง','เค้ก','ช็อกโกแลต','มะม่วง','แตงโม'
  ],
  places: [
    'โรงเรียน','โรงพยาบาล','สนามบิน','ชายหาด','ภูเขา',
    'ห้างสรรพสินค้า','สวนสนุก','พิพิธภัณฑ์','วัด','สถานีรถไฟ',
    'ตลาดนัด','สวนสัตว์','ห้องสมุด','สระว่ายน้ำ','โรงภาพยนตร์'
  ],
  objects: [
    'โทรศัพท์','นาฬิกา','กุญแจ','ร่ม','แว่นตา','กระเป๋า',
    'กรรไกร','กระจก','เทียน','ลูกโป่ง',
    'หมอน','พัดลม','ไฟฉาย','กล้องถ่ายรูป','ดินสอ'
  ],
  activities: [
    'ว่ายน้ำ','วิ่ง','ร้องเพลง','ทำอาหาร','วาดรูป',
    'เต้นรำ','ตกปลา','ปีนเขา','ถ่ายรูป','เล่นเกม',
    'อ่านหนังสือ','นอนหลับ','ดูหนัง','ช้อปปิ้ง','แคมป์ปิ้ง'
  ],
  occupations: [
    'หมอ','ครู','ตำรวจ','นักบิน','พ่อครัว',
    'นักดับเพลิง','ทนายความ','วิศวกร','นักบินอวกาศ','ชาวนา',
    'จิตรกร','นักดนตรี','นักเขียน','ช่างภาพ','สัตวแพทย์'
  ]
};

// ══════════════════════════════════════════════
//  Spyfall locations  (key → Thai label)
// ══════════════════════════════════════════════
const spyfallLocations = {
  school:         'โรงเรียน',
  hospital:       'โรงพยาบาล',
  airport:        'สนามบิน',
  beach:          'ชายหาด',
  casino:         'คาสิโน',
  supermarket:    'ซูเปอร์มาร์เก็ต',
  restaurant:     'ร้านอาหาร',
  spaceship:      'ยานอวกาศ',
  submarine:      'เรือดำน้ำ',
  zoo:            'สวนสัตว์',
  temple:         'วัด',
  bank:           'ธนาคาร',
  circus:         'ละครสัตว์',
  pirate_ship:    'เรือโจรสลัด',
  police_station: 'สถานีตำรวจ',
  movie_studio:   'สตูดิโอถ่ายหนัง',
  train:          'รถไฟ',
  amusement_park: 'สวนสนุก',
  university:     'มหาวิทยาลัย',
  hotel:          'โรงแรม',
};

const rooms = new Map();

const CATEGORY_LABELS = {
  animals: 'สัตว์',
  food: 'อาหาร',
  places: 'สถานที่',
  objects: 'สิ่งของ',
  activities: 'กิจกรรม',
  occupations: 'อาชีพ',
};

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return rooms.has(code) ? generateCode() : code;
}

function pickWord() {
  const keys = Object.keys(insiderWords);
  const key = keys[Math.floor(Math.random() * keys.length)];
  const list = insiderWords[key];
  return {
    word: list[Math.floor(Math.random() * list.length)],
    category: CATEGORY_LABELS[key] || key,
  };
}

function pickSpyfallLocation() {
  const keys = Object.keys(spyfallLocations);
  const key = keys[Math.floor(Math.random() * keys.length)];
  return { locationKey: key, locationLabel: spyfallLocations[key] };
}

// All location labels for the Spy's reference list
const ALL_SPYFALL_LOCATIONS = Object.entries(spyfallLocations).map(
  ([key, label]) => ({ key, label })
);

function emitRoomState(code) {
  const room = rooms.get(code);
  if (!room) return;
  io.to(code).emit('players-updated', room.players);
}

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Socket.io server is running');
});

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {

  // ── Create Room ──
  socket.on('create-room', ({ name, gameId, timerDuration }) => {
    const code = generateCode();
    const room = {
      code,
      gameId: gameId || 'insider',
      dmId: socket.id,
      players: [{ id: socket.id, name, isDM: true }],
      phase: 'lobby',
      timerDuration: timerDuration || 300,
      timerTotal: timerDuration || 300,
      timeRemaining: 0,
      timerInterval: null,
      word: null,
      category: null,
      roles: {},
      insiderId: null,
      insiderName: null,
    };
    rooms.set(code, room);
    socket.join(code);
    socket.data = { code, name };

    socket.emit('room-joined', {
      code,
      gameId: room.gameId,
      isDM: true,
      players: room.players,
      timerDuration: room.timerDuration,
    });
  });

  // ── Join Room ──
  socket.on('join-room', ({ code, name }) => {
    code = (code || '').toUpperCase().trim();
    const room = rooms.get(code);

    if (!room) return socket.emit('error-msg', 'ไม่พบห้องนี้');
    if (room.phase !== 'lobby') return socket.emit('error-msg', 'เกมเริ่มไปแล้ว');
    if (room.players.some(p => p.name === name)) return socket.emit('error-msg', 'ชื่อนี้ถูกใช้แล้ว');

    room.players.push({ id: socket.id, name, isDM: false });
    socket.join(code);
    socket.data = { code, name };

    socket.emit('room-joined', {
      code,
      gameId: room.gameId,
      isDM: false,
      players: room.players,
      timerDuration: room.timerDuration,
    });
    emitRoomState(code);
  });

  // ── Set Timer ──
  socket.on('set-timer', (duration) => {
    const room = rooms.get(socket.data?.code);
    if (!room || room.dmId !== socket.id) return;
    room.timerDuration = duration;
    room.timerTotal = duration;
    io.to(room.code).emit('timer-setting', duration);
  });

  // ── Start Game ──
  socket.on('start-game', () => {
    const room = rooms.get(socket.data?.code);
    if (!room || room.dmId !== socket.id) return;

    if (room.gameId === 'spyfall') {
      // ─── Spyfall start ───
      if (room.players.length < 3) return socket.emit('error-msg', 'ต้องมีผู้เล่นอย่างน้อย 3 คน');

      const { locationKey, locationLabel } = pickSpyfallLocation();
      room.spyfallLocation = locationKey;
      room.spyfallLocationLabel = locationLabel;
      room.phase = 'playing';
      room.timeRemaining = room.timerDuration;
      room.timerTotal = room.timerDuration;
      room.spyfallVotes = {};       // voterId → targetId
      room.spyfallVoteActive = false;
      room.spyfallVoteCaller = null;

      // Pick one random spy (everyone is equal, no DM role in Spyfall)
      const spyIdx = Math.floor(Math.random() * room.players.length);
      room.spyId = room.players[spyIdx].id;
      room.spyName = room.players[spyIdx].name;

      room.roles = {};
      room.players.forEach(p => {
        room.roles[p.id] = p.id === room.spyId ? 'Spy' : 'Agent';
      });

      room.players.forEach(p => {
        const isSpy = p.id === room.spyId;
        io.to(p.id).emit('game-started', {
          gameId: 'spyfall',
          role: room.roles[p.id],
          location: isSpy ? null : locationLabel,
          locationKey: isSpy ? null : locationKey,
          locations: ALL_SPYFALL_LOCATIONS,
          timerTotal: room.timerTotal,
        });
      });

      // Start timer
      room.timerInterval = setInterval(() => {
        room.timeRemaining--;
        io.to(room.code).emit('timer-tick', room.timeRemaining);
        if (room.timeRemaining <= 0) {
          clearInterval(room.timerInterval);
          room.timerInterval = null;
          room.phase = 'result';
          io.to(room.code).emit('spyfall-result', {
            winner: 'spy',
            reason: 'timeout',
            spy: room.spyName,
            spyId: room.spyId,
            location: room.spyfallLocationLabel,
            locationKey: room.spyfallLocation,
            players: room.players,
            roles: room.roles,
          });
        }
      }, 1000);

    } else {
      // ─── Insider start ───
      if (room.players.length < 4) return socket.emit('error-msg', 'ต้องมีผู้เล่นอย่างน้อย 4 คน');

      const { word, category } = pickWord();
      room.word = word;
      room.category = category;
      room.phase = 'playing';
      room.timeRemaining = room.timerDuration;
      room.timerTotal = room.timerDuration;

      const nonDM = room.players.filter(p => p.id !== room.dmId);
      const insiderIdx = Math.floor(Math.random() * nonDM.length);
      room.insiderId = nonDM[insiderIdx].id;
      room.insiderName = nonDM[insiderIdx].name;

      room.roles = {};
      room.players.forEach(p => {
        if (p.id === room.dmId) room.roles[p.id] = 'Master';
        else if (p.id === room.insiderId) room.roles[p.id] = 'Insider';
        else room.roles[p.id] = 'Common';
      });

      room.players.forEach(p => {
        const role = room.roles[p.id];
        const canSee = role === 'Master' || role === 'Insider';
        io.to(p.id).emit('game-started', {
          gameId: 'insider',
          role,
          category,
          word: canSee ? word : null,
          timerTotal: room.timerTotal,
        });
      });

      room.timerInterval = setInterval(() => {
        room.timeRemaining--;
        io.to(room.code).emit('timer-tick', room.timeRemaining);
        if (room.timeRemaining <= 0) {
          clearInterval(room.timerInterval);
          room.timerInterval = null;
          room.phase = 'result';
          io.to(room.code).emit('time-up', {
            word: room.word,
            category: room.category,
            insider: room.insiderName,
            insiderId: room.insiderId,
            players: room.players,
            roles: room.roles,
          });
        }
      }, 1000);
    }
  });

  // ── Guess Correct (DM) ──
  socket.on('guess-correct', () => {
    const room = rooms.get(socket.data?.code);
    if (!room || room.dmId !== socket.id || room.phase !== 'playing') return;

    if (room.timerInterval) { clearInterval(room.timerInterval); room.timerInterval = null; }

    room.phase = 'discussion';
    io.to(room.code).emit('word-revealed', {
      word: room.word,
      category: room.category,
      timeUsed: room.timerTotal - room.timeRemaining,
    });
  });

  // ── Reveal Insider (DM) ──
  socket.on('reveal-insider', () => {
    const room = rooms.get(socket.data?.code);
    if (!room || room.dmId !== socket.id) return;

    room.phase = 'result';
    io.to(room.code).emit('insider-revealed', {
      word: room.word,
      category: room.category,
      insider: room.insiderName,
      insiderId: room.insiderId,
      players: room.players,
      roles: room.roles,
    });
  });

  // ══════════════════════════════════════════════
  //  Spyfall-specific events
  // ══════════════════════════════════════════════

  // ── Spy guesses the location ──
  socket.on('spy-guess-location', ({ locationKey }) => {
    const room = rooms.get(socket.data?.code);
    if (!room || room.gameId !== 'spyfall' || room.phase !== 'playing') return;
    if (socket.id !== room.spyId) return;

    if (room.timerInterval) { clearInterval(room.timerInterval); room.timerInterval = null; }
    room.phase = 'result';

    const correct = locationKey === room.spyfallLocation;
    io.to(room.code).emit('spyfall-result', {
      winner: correct ? 'spy' : 'players',
      reason: correct ? 'spy-guessed-correct' : 'spy-guessed-wrong',
      spy: room.spyName,
      spyId: room.spyId,
      location: room.spyfallLocationLabel,
      locationKey: room.spyfallLocation,
      guessedLocation: spyfallLocations[locationKey] || locationKey,
      guessedLocationKey: locationKey,
      players: room.players,
      roles: room.roles,
    });
  });

  // ── Any player calls a vote to identify the spy ──
  socket.on('call-vote', ({ targetId }) => {
    const room = rooms.get(socket.data?.code);
    if (!room || room.gameId !== 'spyfall' || room.phase !== 'playing') return;
    if (room.spyfallVoteActive) return; // already voting

    const target = room.players.find(p => p.id === targetId);
    if (!target) return;

    room.spyfallVoteActive = true;
    room.spyfallVoteCaller = socket.id;
    room.spyfallVoteTarget = targetId;
    room.spyfallVotes = {};
    // caller auto-votes yes
    room.spyfallVotes[socket.id] = true;

    const callerName = room.players.find(p => p.id === socket.id)?.name || '???';

    io.to(room.code).emit('vote-started', {
      callerId: socket.id,
      callerName,
      targetId,
      targetName: target.name,
      votes: room.spyfallVotes,
      totalPlayers: room.players.length,
    });
  });

  // ── A player casts their vote ──
  socket.on('cast-vote', ({ agree }) => {
    const room = rooms.get(socket.data?.code);
    if (!room || room.gameId !== 'spyfall' || !room.spyfallVoteActive) return;

    room.spyfallVotes[socket.id] = agree;

    // Broadcast updated votes
    io.to(room.code).emit('vote-update', {
      votes: room.spyfallVotes,
      totalPlayers: room.players.length,
    });

    // Check if all players voted
    if (Object.keys(room.spyfallVotes).length >= room.players.length) {
      const yesCount = Object.values(room.spyfallVotes).filter(Boolean).length;
      const majority = yesCount > room.players.length / 2;

      if (majority) {
        // Vote passed — check if target is the spy
        const targetIsSpy = room.spyfallVoteTarget === room.spyId;
        if (targetIsSpy) {
          // Spy caught! But spy gets one last chance to guess
          if (room.timerInterval) { clearInterval(room.timerInterval); room.timerInterval = null; }
          room.phase = 'spy-last-chance';
          room.spyfallVoteActive = false;
          io.to(room.code).emit('spy-caught', {
            spyId: room.spyId,
            spy: room.spyName,
            locations: ALL_SPYFALL_LOCATIONS,
          });
        } else {
          // Wrong person accused — spy wins
          if (room.timerInterval) { clearInterval(room.timerInterval); room.timerInterval = null; }
          room.phase = 'result';
          room.spyfallVoteActive = false;
          io.to(room.code).emit('spyfall-result', {
            winner: 'spy',
            reason: 'wrong-accusation',
            accusedId: room.spyfallVoteTarget,
            accusedName: room.players.find(p => p.id === room.spyfallVoteTarget)?.name,
            spy: room.spyName,
            spyId: room.spyId,
            location: room.spyfallLocationLabel,
            locationKey: room.spyfallLocation,
            players: room.players,
            roles: room.roles,
          });
        }
      } else {
        // Vote failed — continue playing
        room.spyfallVoteActive = false;
        io.to(room.code).emit('vote-failed', {
          targetId: room.spyfallVoteTarget,
          targetName: room.players.find(p => p.id === room.spyfallVoteTarget)?.name,
        });
      }
    }
  });

  // ── Spy's last-chance guess (after being caught by vote) ──
  socket.on('spy-last-guess', ({ locationKey }) => {
    const room = rooms.get(socket.data?.code);
    if (!room || room.gameId !== 'spyfall' || room.phase !== 'spy-last-chance') return;
    if (socket.id !== room.spyId) return;

    room.phase = 'result';
    const correct = locationKey === room.spyfallLocation;
    io.to(room.code).emit('spyfall-result', {
      winner: correct ? 'spy' : 'players',
      reason: correct ? 'spy-last-guess-correct' : 'spy-caught',
      spy: room.spyName,
      spyId: room.spyId,
      location: room.spyfallLocationLabel,
      locationKey: room.spyfallLocation,
      guessedLocation: spyfallLocations[locationKey] || locationKey,
      guessedLocationKey: locationKey,
      players: room.players,
      roles: room.roles,
    });
  });

  // ── Play Again (DM) ──
  socket.on('play-again', () => {
    const room = rooms.get(socket.data?.code);
    if (!room || room.dmId !== socket.id) return;

    if (room.timerInterval) { clearInterval(room.timerInterval); room.timerInterval = null; }

    room.phase = 'lobby';
    room.word = null;
    room.category = null;
    room.roles = {};
    room.insiderId = null;
    room.insiderName = null;
    room.timeRemaining = 0;
    // Spyfall reset
    room.spyId = null;
    room.spyName = null;
    room.spyfallLocation = null;
    room.spyfallLocationLabel = null;
    room.spyfallVotes = {};
    room.spyfallVoteActive = false;

    io.to(room.code).emit('back-to-lobby', room.players);
  });

  // ── Disconnect ──
  socket.on('disconnect', () => {
    const { code } = socket.data || {};
    const room = rooms.get(code);
    if (!room) return;

    room.players = room.players.filter(p => p.id !== socket.id);

    if (room.players.length === 0 || socket.id === room.dmId) {
      if (room.timerInterval) clearInterval(room.timerInterval);
      io.to(code).emit('room-closed');
      rooms.delete(code);
    } else {
      emitRoomState(code);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Socket.io server running on port ${PORT}`));
