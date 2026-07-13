// public/js/chat.js
const socket = io('https://sohbet-app-ut1r.onrender.com');

const urlParams = new URLSearchParams(window.location.search);
const roomCode = urlParams.get('room');
const username = localStorage.getItem('username') || 'Anonim';

const roomCodeDisplay = document.getElementById('roomCode');
const onlineCount = document.getElementById('onlineCount');
const userList = document.getElementById('userList');
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const leaveRoomBtn = document.getElementById('leaveRoomBtn');

if (!roomCode) {
    window.location.href = '/';
}

roomCodeDisplay.textContent = roomCode;

socket.emit('join_room', { roomCode, username }, (response) => {
    if (!response.success) {
        alert(response.message);
        window.location.href = '/';
    }
});

socket.on('user_list', (users) => {
    onlineCount.textContent = users.length;
    userList.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement('li');
        li.className = 'flex items-center gap-2 p-2 bg-gray-700 rounded-lg';
        li.innerHTML = `
            <div class="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>${user.username}</span>
        `;
        userList.appendChild(li);
    });
});

socket.on('receive_message', (data) => {
    addMessage(data.sender, data.message, data.timestamp, data.sender === username);
});

// SİSTEM MESAJLARINI GÖRMEZDEN GEL (katıldı/ayrıldı mesajları gösterme)
// socket.on('system_message', ...) KALDIRILDI

function addMessage(sender, message, timestamp, isSent) {
    const div = document.createElement('div');
    div.className = `message-bubble ${isSent ? 'message-sent' : 'message-received'}`;
    
    const time = new Date(timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    
    // HER ZAMAN İSMİ GÖSTER (hem kendi hem başkalarının mesajlarında)
    div.innerHTML = `
        <div class="message-sender">${escapeHtml(sender)}</div>
        <div>${escapeHtml(message)}</div>
        <div class="message-time">${time}</div>
    `;
    
    messagesContainer.appendChild(div);
    scrollToBottom();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function scrollToBottom() {
    const container = document.getElementById('messagesContainer');
    container.scrollTop = container.scrollHeight;
}

sendMessageBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;
    
    socket.emit('send_message', { message });
    messageInput.value = '';
}

leaveRoomBtn.addEventListener('click', () => {
    if (confirm('Odadan ayrılmak istediğinize emin misiniz?')) {
        localStorage.removeItem('roomCode');
        window.location.href = '/';
    }
});

