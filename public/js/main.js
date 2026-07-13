// public/js/main.js
const socket = io();

const usernameInput = document.getElementById('username');
const createRoomBtn = document.getElementById('createRoomBtn');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const joinRoomModal = document.getElementById('joinRoomModal');
const roomCodeInput = document.getElementById('roomCodeInput');
const confirmJoinBtn = document.getElementById('confirmJoinBtn');
const cancelJoinBtn = document.getElementById('cancelJoinBtn');
const adminBtn = document.getElementById('adminBtn');

const adminModal = document.getElementById('adminModal');
const closeAdminModal = document.getElementById('closeAdminModal');
const adminPasswordInput = document.getElementById('adminPasswordInput');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminLoginError = document.getElementById('adminLoginError');

const adminDashboard = document.getElementById('adminDashboard');
const closeDashboardBtn = document.getElementById('closeDashboardBtn');
const roomsTable = document.getElementById('roomsTable');
const noRooms = document.getElementById('noRooms');

let username = '';
let isAuthenticated = false;
let roomsRefreshInterval = null;

// Oda Yarat - REKLAMSIZ
createRoomBtn.addEventListener('click', () => {
    username = usernameInput.value.trim();
    if (!username) {
        alert('Lütfen kullanıcı adınızı girin!');
        return;
    }

    socket.emit('create_room', username, (response) => {
        if (response.success) {
            localStorage.setItem('username', username);
            localStorage.setItem('roomCode', response.roomCode);
            window.location.href = `/chat.html?room=${response.roomCode}`;
        }
    });
});

// Oda Katıl - REKLAMSIZ
joinRoomBtn.addEventListener('click', () => {
    username = usernameInput.value.trim();
    if (!username) {
        alert('Lütfen kullanıcı adınızı girin!');
        return;
    }
    joinRoomModal.classList.remove('hidden');
});

cancelJoinBtn.addEventListener('click', () => {
    joinRoomModal.classList.add('hidden');
    roomCodeInput.value = '';
});

confirmJoinBtn.addEventListener('click', () => {
    const roomCode = roomCodeInput.value.trim().toUpperCase();
    
    if (roomCode.length !== 8) {
        alert('Oda kodu 8 haneli olmalı!');
        return;
    }

    socket.emit('join_room', { roomCode, username }, (response) => {
        if (response.success) {
            localStorage.setItem('username', username);
            localStorage.setItem('roomCode', roomCode);
            window.location.href = `/chat.html?room=${roomCode}`;
        } else {
            alert(response.message);
        }
    });
});

// Admin Modal
adminBtn.addEventListener('click', () => {
    adminModal.classList.remove('hidden');
    adminPasswordInput.value = '';
    adminLoginError.classList.add('hidden');
    adminPasswordInput.focus();
});

closeAdminModal.addEventListener('click', closeAdminModalFunc);
adminModal.addEventListener('click', (e) => {
    if (e.target === adminModal) closeAdminModalFunc();
});

function closeAdminModalFunc() {
    adminModal.classList.add('hidden');
    adminPasswordInput.value = '';
    adminLoginError.classList.add('hidden');
}

adminLoginBtn.addEventListener('click', async () => {
    const password = adminPasswordInput.value;
    if (!password) {
        showAdminError('Lütfen şifre girin!');
        return;
    }
    
    try {
        const response = await fetch('/api/admin/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        const data = await response.json();
        
        if (data.success) {
            isAuthenticated = true;
            closeAdminModalFunc();
            showDashboard();
        } else {
            showAdminError(data.message);
            const modalContent = document.querySelector('.admin-modal-content');
            modalContent.classList.add('shake');
            setTimeout(() => modalContent.classList.remove('shake'), 500);
        }
    } catch (error) {
        showAdminError('Bir hata oluştu.');
    }
});

adminPasswordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') adminLoginBtn.click();
});

function showAdminError(message) {
    adminLoginError.textContent = message;
    adminLoginError.classList.remove('hidden');
}

function showDashboard() {
    adminDashboard.classList.remove('hidden');
    loadRooms();
    roomsRefreshInterval = setInterval(loadRooms, 5000);
}

closeDashboardBtn.addEventListener('click', () => {
    adminDashboard.classList.add('hidden');
    isAuthenticated = false;
    if (roomsRefreshInterval) {
        clearInterval(roomsRefreshInterval);
        roomsRefreshInterval = null;
    }
});

async function loadRooms() {
    if (!isAuthenticated) return;
    try {
        const response = await fetch('/api/admin/rooms');
        const data = await response.json();
        if (data.success) {
            if (data.rooms.length === 0) {
                roomsTable.innerHTML = '';
                noRooms.classList.remove('hidden');
            } else {
                noRooms.classList.add('hidden');
                roomsTable.innerHTML = '';
                data.rooms.forEach(room => {
                    const tr = document.createElement('tr');
                    tr.className = 'border-b border-gray-700';
                    const createdAt = new Date(room.createdAt).toLocaleString('tr-TR');
                    tr.innerHTML = `
                        <td class="py-3 font-mono text-blue-400">${room.code}</td>
                        <td class="py-3">${room.userCount} kişi</td>
                        <td class="py-3 text-gray-400">${createdAt}</td>
                    `;
                    roomsTable.appendChild(tr);
                });
            }
        }
    } catch (error) {
        console.error('Oda verileri yüklenemedi:', error);
    }
}

