const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '../public')));
app.use(cors());

app.get('/api/admin/verify', (req, res) => {
  res.json({ success: true });
});

app.get('/api/admin/rooms', (req, res) => {
  res.json({ rooms: [] });
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log('User joined room:', room);
  });

  socket.on('chat_message', (data) => {
    io.to(data.room).emit('chat_message', data);
  });

  socket.on('typing', (data) => {
    socket.to(data.room).emit('typing', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log('Server running on port:', PORT);
});
