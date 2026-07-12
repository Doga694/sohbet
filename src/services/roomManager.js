// src/services/roomManager.js
const crypto = require('crypto');
const { ROOM_CODE_LENGTH } = require('../config/constants');

const activeRooms = new Map();
const permanentRooms = new Set();

function generateSecureRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const randomBytes = crypto.randomBytes(ROOM_CODE_LENGTH);
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
        result += chars[randomBytes[i] % chars.length];
    }
    return result;
}

function createRoom(isPermanent = false) {
    let roomCode;
    do {
        roomCode = generateSecureRoomCode();
    } while (activeRooms.has(roomCode));

    const roomData = {
        code: roomCode,
        createdAt: new Date().toISOString(),
        users: new Map(),
        isPermanent: isPermanent
    };
    
    activeRooms.set(roomCode, roomData);
    if (isPermanent) permanentRooms.add(roomCode);
    return roomData;
}

function getRoom(code) {
    return activeRooms.get(code);
}

function deleteRoom(code) {
    if (permanentRooms.has(code)) return;
    activeRooms.delete(code);
}

function addUserToRoom(roomCode, socketId, username) {
    const room = activeRooms.get(roomCode);
    if (!room) return false;
    room.users.set(socketId, { username, joinedAt: new Date().toISOString() });
    return true;
}

function removeUserFromRoom(roomCode, socketId) {
    const room = activeRooms.get(roomCode);
    if (!room) return;
    room.users.delete(socketId);
    if (!permanentRooms.has(roomCode) && room.users.size === 0) {
        deleteRoom(roomCode);
    }
}

function getAllActiveRooms() {
    const roomsList = [];
    activeRooms.forEach((room, code) => {
        if (room.users.size > 0) {
            roomsList.push({
                code: code,
                userCount: room.users.size,
                createdAt: room.createdAt
            });
        }
    });
    return roomsList;
}

module.exports = {
    createRoom,
    getRoom,
    addUserToRoom,
    removeUserFromRoom,
    getAllActiveRooms
};
