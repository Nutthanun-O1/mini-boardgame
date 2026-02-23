const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { wordBank } = require('./words');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// ============ In-Memory Storage ============
const rooms = new Map();

// ============ Helpers ============
function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(code) ? genCode() : code;
}

function pickWord() {
  const categories = Object.keys(wordBank);
  const category = categories[Math.floor(Math.random() * categories.length)];
  const words = wordBank[category];
  const word = words[Math.floor(Math.random() * words.length)];
  return { category, word };
}

// ============ Socket Handlers ============
io.on('connection', (socket) => {
  console.log(`✅ Connected: ${socket.id}`);

  // -------- สร้างห้อง --------
  socket.on('create-room', ({ name, timerDuration }) => {
    const code = genCode();
    const room = {
      code,
      dmId: socket.id,
      players: [{ id: socket.id, name, isDM: true }],
      phase: 'lobby',
      timerDuration: timerDuration || 300,
      timeRemaining: 0,
      timerInterval: null,
      word: null,
      category: null,
      roles: {},
      insiderId: null,
      insiderName: null,
      gamePlayers: [],
    };
    rooms.set(code, room);
    socket.join(code);
    socket.data = { code, name };

    socket.emit('room-joined', {
      code,
      isDM: true,
      players: room.players,
    });
    console.log(`🏠 Room ${code} created by ${name}`);
  });

  // -------- เข้าร่วมห้อง --------
  socket.on('join-room', ({ code, name }) => {
    code = code.toUpperCase().trim();
    const room = rooms.get(code);

    if (!room) return socket.emit('error-msg', 'ไม่พบห้องนี้');
    if (room.phase !== 'lobby') return socket.emit('error-msg', 'เกมเริ่มไปแล้ว');
    if (room.players.some(p => p.name === name))
      return socket.emit('error-msg', 'ชื่อนี้ถูกใช้แล้ว');

    room.players.push({ id: socket.id, name, isDM: false });
    socket.join(code);
    socket.data = { code, name };

    socket.emit('room-joined', {
      code,
      isDM: false,
      players: room.players,
    });
    io.to(code).emit('players-updated', room.players);
    console.log(`👤 ${name} joined room ${code}`);
  });

  // -------- เริ่มเกม (DM เท่านั้น) --------
  socket.on('start-game', () => {
    const { code } = socket.data || {};
    const room = rooms.get(code);
    if (!room || room.dmId !== socket.id) return;
    if (room.players.length < 4)
      return socket.emit('error-msg', 'ต้องมีผู้เล่นอย่างน้อย 4 คน');

    // เลือกคำ
    const { category, word } = pickWord();
    room.word = word;
    room.category = category;
    room.phase = 'playing';
    room.timeRemaining = room.timerDuration;
    room.gamePlayers = [...room.players]; // snapshot

    // สุ่มบทบาท: DM = Master, สุ่ม 1 Insider จากผู้เล่นที่เหลือ
    const nonDM = room.players.filter(p => p.id !== room.dmId);
    const insiderIdx = Math.floor(Math.random() * nonDM.length);
    room.insiderId = nonDM[insiderIdx].id;
    room.insiderName = nonDM[insiderIdx].name;

    room.roles = {};
    room.players.forEach(p => {
      if (p.id === room.dmId) {
        room.roles[p.id] = 'Master';
      } else if (p.id === room.insiderId) {
        room.roles[p.id] = 'Insider';
      } else {
        room.roles[p.id] = 'Common';
      }
    });

    // ส่งบทบาทให้แต่ละคน (ส่วนตัว)
    room.players.forEach(p => {
      const role = room.roles[p.id];
      const canSeeWord = role === 'Master' || role === 'Insider';
      io.to(p.id).emit('game-started', {
        role,
        category,
        word: canSeeWord ? word : null,
      });
    });

    // เริ่มจับเวลา
    room.timerInterval = setInterval(() => {
      room.timeRemaining--;
      io.to(code).emit('timer-tick', room.timeRemaining);

      if (room.timeRemaining <= 0) {
        clearInterval(room.timerInterval);
        room.timerInterval = null;
        room.phase = 'result';

        io.to(code).emit('time-up', {
          word: room.word,
          category: room.category,
          insider: room.insiderName,
          insiderId: room.insiderId,
          gamePlayers: room.gamePlayers,
          roles: room.roles,
        });
      }
    }, 1000);

    console.log(`🎲 Game started in ${code} | Word: ${word} | Insider: ${room.insiderName}`);
  });

  // -------- DM: มีคนทายถูก --------
  socket.on('guess-correct', () => {
    const { code } = socket.data || {};
    const room = rooms.get(code);
    if (!room || room.dmId !== socket.id || room.phase !== 'playing') return;

    if (room.timerInterval) {
      clearInterval(room.timerInterval);
      room.timerInterval = null;
    }

    room.phase = 'discussion';
    io.to(code).emit('word-revealed', {
      word: room.word,
      category: room.category,
      timeUsed: room.timerDuration - room.timeRemaining,
    });
  });

  // -------- DM: เฉลย Insider --------
  socket.on('reveal-insider', () => {
    const { code } = socket.data || {};
    const room = rooms.get(code);
    if (!room || room.dmId !== socket.id) return;

    room.phase = 'result';
    io.to(code).emit('insider-revealed', {
      insider: room.insiderName,
      insiderId: room.insiderId,
      word: room.word,
      category: room.category,
      gamePlayers: room.gamePlayers,
      roles: room.roles,
    });
  });

  // -------- DM: เล่นรอบใหม่ --------
  socket.on('play-again', () => {
    const { code } = socket.data || {};
    const room = rooms.get(code);
    if (!room || room.dmId !== socket.id) return;

    if (room.timerInterval) {
      clearInterval(room.timerInterval);
      room.timerInterval = null;
    }

    room.phase = 'lobby';
    room.word = null;
    room.category = null;
    room.roles = {};
    room.insiderId = null;
    room.insiderName = null;
    room.gamePlayers = [];
    room.timeRemaining = 0;

    io.to(code).emit('back-to-lobby', room.players);
  });

  // -------- DM: ตั้งเวลา --------
  socket.on('set-timer', (duration) => {
    const { code } = socket.data || {};
    const room = rooms.get(code);
    if (!room || room.dmId !== socket.id) return;
    room.timerDuration = duration;
    io.to(code).emit('timer-setting', duration);
  });

  // -------- ตัดการเชื่อมต่อ --------
  socket.on('disconnect', () => {
    const { code, name } = socket.data || {};
    if (!code) return;

    const room = rooms.get(code);
    if (!room) return;

    room.players = room.players.filter(p => p.id !== socket.id);

    if (room.players.length === 0) {
      if (room.timerInterval) clearInterval(room.timerInterval);
      rooms.delete(code);
    } else if (socket.id === room.dmId) {
      if (room.timerInterval) clearInterval(room.timerInterval);
      io.to(code).emit('room-closed');
      rooms.delete(code);
    } else {
      io.to(code).emit('players-updated', room.players);
      io.to(code).emit('player-left', name);
    }

    console.log(`❌ ${name} disconnected from ${code}`);
  });
});

// ============ Start Server ============
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🎲 Insider Server running on port ${PORT}`);
});
