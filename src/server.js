const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Hafif socket.io ayarları (düşük RAM)
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

const PORT = process.env.PORT || 3000;

// Statik dosyalar
app.use(express.static(path.join(__dirname, '../public')));
app.use(cors());

// API endpoint'leri
app.get('/api/admin/verify', (req, res) => {
  res.json({ success: true });
});

app.get('/api/admin/rooms', (req, res) => {
  res.json({ rooms: Array.from(io.sockets.adapter.rooms.keys()) });
});

// Socket.io olayları (basitleştirilmiş)
io.on('connection', (socket) => {
  console.log('Kullanıcı bağlandı:', socket.id);

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(\Kullanıcı \ \ odasına katıldı\);
  });

  socket.on('chat_message', (data) => {
    io.to(data.room).emit('chat_message', data);
  });

  socket.on('typing', (data) => {
    socket.to(data.room).emit('typing', data);
  });

  socket.on('disconnect', () => {
    console.log('Kullanıcı ayrıldı:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(\Server çalışıyor: \\);
});
