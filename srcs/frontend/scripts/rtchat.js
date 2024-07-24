
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname === '/chat') {
        initChat();
    }
});


async function initChat() {
    const chatroomName = 'public-chat';
    try {
        const response = await fetch(`/api/chat/${chatroomName}/`);

        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const data = await response.json();

        console.log(data);

        if (data.chat_messages) {
            const chatMessages = document.querySelector('#chat-messages');
            data.chat_messages.forEach(message => {
                addMessageToChat(message);
            });
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } else {
            console.error('No chat messages found in response');
        }

    } catch (error) {
        console.error("Messages error: ", error);
    }

    initWebSocket(chatroomName);
    scrollToBottom()
}

function initWebSocket(chatroomName) {
    const chatSocket = new WebSocket(`ws/chatroom/${chatroomName}/`);

    console.log("Opened Socket:", chatSocket)

    chatSocket.onmessage = function(e) {
        const data = JSON.parse(e.data);
        console.log('Received message:', data);

        if (data.error) {
            alert(data.error);
            chatSocket.close();
            console.error('Chat socket closed due to error:', data.error);
            return;
        }

        addMessageToChat(data);
        scrollToBottom()
    };

    chatSocket.onerror = function(e) {
        console.error('WebSocket error:', e.message);
    };

    chatSocket.onclose = function(e) {
        if (e.wasClean) {
            console.log('Chat socket closed cleanly:', e.code, e.reason);
        } else {
            console.error('Chat socket closed unexpectedly:', e.reason);
        }
    };

    document.querySelector('#chat-message-input').focus();
    document.querySelector('#chat-message-input').onkeyup = function(e) {
        if (e.key === 'Enter') {
            document.querySelector('#chat-message-submit').click();
        }
    };


    document.querySelector('#chat-message-submit').onclick = function(e) {
        const messageInputDom = document.querySelector('#chat-message-input');
        const message = messageInputDom.value;
        if (message.trim()) {
            chatSocket.send(JSON.stringify({
                'body': message
            }));
            messageInputDom.value = '';
        }
    };
}

function addMessageToChat(message) {
    const chatMessages = document.querySelector('#chat-messages');
    const messageElement = document.createElement('li');
    messageElement.className = 'bg-gray-700 p-2 rounded-lg';
    messageElement.innerHTML = `
        <strong>${message.author}:</strong> ${message.body} <br>
        <span class="text-gray-500 text-sm">${new Date(message.created).toLocaleTimeString()}</span>
    `;
    chatMessages.appendChild(messageElement);
}

function scrollToBottom() {
    const container = document.getElementById("chat-log");
    container.scrollTop = container.scrollHeight;
}
