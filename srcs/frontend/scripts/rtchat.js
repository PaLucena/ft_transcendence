async function initChat(chatroomName) {
    try {
        if (chatroomName === undefined) {
            chatroomName = "public-chat"
        }
        const response = await fetch(`/api/chat/room/${chatroomName}`);

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
        <button class="block-user btn btn-danger btn-sm" data-username="${message.author}">Block</button>
        <button class="unblock-user btn btn-success btn-sm" data-username="${message.author}">Unblock</button>
    `;
    chatMessages.appendChild(messageElement);

    messageElement.querySelector('.block-user').addEventListener('click', function() {
        blockUser(message.author);
    });

    messageElement.querySelector('.unblock-user').addEventListener('click', function() {
        unblockUser(message.author);
    });
}

function scrollToBottom() {
    const container = document.getElementById("chat-log");
    container.scrollTop = container.scrollHeight;
}

function blockUser(username) {
    const chatroomName = 'public-chat';
    const csrfToken = getCookie('csrftoken');

    fetch(`/api/chat/block_user/${chatroomName}/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken
        },
        body: JSON.stringify({ blocked_username: username })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.detail);
    })
    .catch(error => {
        console.error("Block user error:", error);
        alert("Error on blocking user.");
    });
}

function unblockUser(username) {
    const chatroomName = 'public-chat';
    const csrfToken = getCookie('csrftoken');

    fetch(`/api/chat/unblock_user/${chatroomName}/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken
        },
        body: JSON.stringify({ blocked_username: username })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.detail);
    })
    .catch(error => {
        console.error("Unblock user error:", error);
        alert("Error on unblocking user.");
    });
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
