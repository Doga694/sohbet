const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use(cors());

// Basit ve hafif oda takibi (RAM dostu)
const rooms = new Map();

function generateRoomCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

// --- ADMIN API ---
app.post('/api/admin/verify', (req, res) => {
  const { password } = req.body;
  // ADMIN ŞİFRESİ BURADA: admin123
  if (password === 'admin123') {
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Hatalı şifre!' });
  }
});

app.get('/api/admin/rooms', (req, res) => {
  const roomList = Array.from(rooms.values()).map(r => ({
    code: r.code,
    userCount: r.users.size,
    createdAt: r.createdAt
  }));
  res.json({ success: true, rooms: roomList });
});

// --- SOCKET.IO OLAYLARI ---
io.on('connection', (socket) => {
  console.log('Kullanıcı bağlandı:', socket.id);

  // ODA YARAT
  socket.on('create_room', (username, callback) => {
    const roomCode = generateRoomCode();
    rooms.set(roomCode, { 
      code: roomCode, 
      users: new Set(), 
      createdAt: new Date() 
    });
    
    socket.join(roomCode);
    rooms.get(roomCode).users.add({ id: socket.id, username });
    
    // Odadaki kullanıcı listesini gönder
    const users = Array.from(rooms.get(roomCode).users).map(u => ({ username: u.username }));
    io.to(roomCode).emit('user_list', users);

    // Frontend'in beklediği cevap
    callback({ success: true, roomCode });
  });

  // ODA KATIL
  socket.on('join_room', ({ roomCode, username }, callback) => {
    if (!rooms.has(roomCode)) {
      return callback({ success: false, message: 'Oda bulunamadı veya silinmiş!' });
    }
    
    socket.join(roomCode);
    rooms.get(roomCode).users.add({ id: socket.id, username });
    
    const users = Array.from(rooms.get(roomCode).users).map(u => ({ username: u.username }));
    io.to(roomCode).emit('user_list', users);
    
    callback({ success: true });
  });

  // MESAJ GÖNDER
  socket.on('send_message', ({ message }) => {
    // Socket'in hangi odada olduğunu bul
    const currentRoom = Array.from(socket.rooms).find(r => r !== socket.id);
    
    if (currentRoom && rooms.has(currentRoom)) {
      const user = Array.from(rooms.get(currentRoom).users).find(u => u.id === socket.id);
      const senderName = user ? user.username : 'Anonim';
      
      io.to(currentRoom).emit('receive_message', {
        sender: senderName,
        message: message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // BAĞLANTI KOPMASI (RAM TEMİZLİĞİ)
  socket.on('disconnect', () => {
    console.log('Kullanıcı ayrıldı:', socket.id);
    
    rooms.forEach((roomData, roomCode) => {
      // Kullanıcıyı odadan çıkar
      roomData.users = new Set(Array.from(roomData.users).filter(u => u.id !== socket.id));
      
      // Kalan kullanıcıları bilgilendir
      const users = Array.from(roomData.users).map(u => ({ username: u.username }));
      io.to(roomCode).emit('user_list', users);
      
      // Oda boşaldıysa sil (RAM şişmesini engeller!)
      if (roomData.users.size === 0) {
        rooms.delete(roomCode);
        console.log('Boş oda silindi:', roomCode);
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server çalışıyor: ${PORT}`);
});