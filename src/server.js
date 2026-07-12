// src/server.js
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const { PORT, ADMIN_SECRET_CODE, MAX_ADMIN_ATTEMPTS, ADMIN_LOCKOUT_TIME } = require('./config/constants');
const { initializeSocket } = require('./controllers/socketController');
const roomManager = require('./services/roomManager');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Admin brute-force korumasÄ±
const adminAttempts = new Map();

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: "UP", message: "Sistem aktif." });
});

// Admin ÅŸifre doÄŸrulama
app.post('/api/admin/verify', (req, res) => {
    const { password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    
    // IP bazlÄ± kontrol
    const attemptData = adminAttempts.get(ip) || { count: 0, lockedUntil: null };
    
    if (attemptData.lockedUntil && Date.now() < attemptData.lockedUntil) {
        const remainingTime = Math.ceil((attemptData.lockedUntil - Date.now()) / 1000);
        return res.status(429).json({ 
            success: false, 
            message: `Ã‡ok fazla baÅŸarÄ±sÄ±z deneme. ${remainingTime} saniye sonra tekrar deneyin.` 
        });
    }
    
    if (password === ADMIN_SECRET_CODE) {
        adminAttempts.delete(ip);
        return res.json({ success: true, message: "DoÄŸrulama baÅŸarÄ±lÄ±." });
    } else {
        attemptData.count++;
        
        if (attemptData.count >= MAX_ADMIN_ATTEMPTS) {
            attemptData.lockedUntil = Date.now() + ADMIN_LOCKOUT_TIME;
            adminAttempts.set(ip, attemptData);
            return res.status(429).json({ 
                success: false, 
                message: `Ã‡ok fazla baÅŸarÄ±sÄ±z deneme. 15 dakika boyunca kilitlendi.` 
            });
        }
        
        adminAttempts.set(ip, attemptData);
        return res.status(401).json({ 
            success: false, 
            message: `YanlÄ±ÅŸ ÅŸifre. ${MAX_ADMIN_ATTEMPTS - attemptData.count} deneme hakkÄ±nÄ±z kaldÄ±.` 
        });
    }
});

// Aktif odalarÄ± getir (Admin panel iÃ§in)
app.get('/api/admin/rooms', (req, res) => {
    const rooms = roomManager.getAllActiveRooms();
    res.json({ success: true, rooms });
});






// 1000 kalıcı demo oda oluştur
function createPermanentRooms() {
    const numRooms = 1000;
    console.log(`[DEMO] ${numRooms} kalıcı oda oluşturuluyor...`);
    
    for (let i = 0; i < numRooms; i++) {
        roomManager.createRoom(true);
    }
    
    console.log(`[DEMO] ${numRooms} kalıcı oda başarıyla oluşturuldu!`);
}

setTimeout(() => {
    createPermanentRooms();
}, 1000);
initializeSocket(io);

server.listen(PORT, () => {
    console.log(`================================================`);
    console.log(`[MÄ°MARÄ°] Sunucu baÅŸarÄ±yla baÅŸlatÄ±ldÄ±.`);
    console.log(`[MÄ°MARÄ°] Port: ${PORT}`);
    console.log(`[MÄ°MARÄ°] Socket.io gerÃ§ek zamanlÄ± motoru aktif.`);
    console.log(`[MÄ°MARÄ°] http://localhost:${PORT}`);
    console.log(`================================================`);
});


