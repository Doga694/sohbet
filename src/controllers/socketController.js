// src/controllers/socketController.js
const roomManager = require('../services/roomManager');

function initializeSocket(io) {
    io.on('connection', (socket) => {
        console.log(`[SOCKET] Yeni bağlantı: ${socket.id}`);
        
        let currentRoomCode = null;
        let isRoomOwner = false;

        socket.on('create_room', (username, callback) => {
            const newRoom = roomManager.createRoom(true); // KALICI ODA YARAT
            currentRoomCode = newRoom.code;
            isRoomOwner = true;
            
            socket.join(currentRoomCode);
            roomManager.addUserToRoom(currentRoomCode, socket.id, username);
            
            io.to(currentRoomCode).emit('user_list', Array.from(newRoom.users.values()));
            callback({ success: true, roomCode: currentRoomCode });
        });

        socket.on('join_room', (data, callback) => {
            const { roomCode, username } = data;
            const room = roomManager.getRoom(roomCode);

            if (!room) {
                return callback({ success: false, message: "Oda bulunamadı veya kapatılmış!" });
            }

            currentRoomCode = roomCode;
            socket.join(roomCode);
            roomManager.addUserToRoom(roomCode, socket.id, username);

            io.to(roomCode).emit('user_list', Array.from(room.users.values()));
            io.to(roomCode).emit('system_message', `${username} odaya katıldı.`);
            
            callback({ success: true, roomCode });
        });

        socket.on('send_message', (data) => {
            if (!currentRoomCode) return;
            const room = roomManager.getRoom(currentRoomCode);
            if (!room) return;

            const user = room.users.get(socket.id);
            const payload = {
                sender: user ? user.username : 'Anonim',
                message: data.message,
                timestamp: new Date().toISOString()
            };
            
            io.to(currentRoomCode).emit('receive_message', payload);
        });

        socket.on('disconnect', () => {
            console.log(`[SOCKET] Bağlantı koptu: ${socket.id}`);
            if (currentRoomCode) {
                roomManager.removeUserFromRoom(currentRoomCode, socket.id, isRoomOwner);
                
                const room = roomManager.getRoom(currentRoomCode);
                if (room) {
                    io.to(currentRoomCode).emit('user_list', Array.from(room.users.values()));
                }
            }
        });
    });
}

module.exports = { initializeSocket };
