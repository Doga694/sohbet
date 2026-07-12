// src/config/constants.js
module.exports = {
    PORT: process.env.PORT || 3000,
    ADMIN_SECRET_CODE: "@rfgdgh1A9",
    ROOM_CODE_LENGTH: 8,
    MAX_ADMIN_ATTEMPTS: 5,
    ADMIN_LOCKOUT_TIME: 15 * 60 * 1000 // 15 dakika
};